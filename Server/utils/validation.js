const { body, validationResult } = require('express-validator');
const { 
    USERNAME, 
    EMAIL, 
    PASSWORD, 
    CONTENT,
    NAME,
    DESCRIPTION,
    TYPE,
    FIRST_NAME,
    LAST_NAME,
    BIO,
    PHONE_NUMBER,
    TYPE_TEXT,
    TYPE_IMAGE,
    TYPE_FILE,
    TYPE_VIDEO,
    TYPE_AUDIO,
    TYPE_VOICE,
    TYPE_SYSTEM,
    TYPE_PRIVATE,
    TYPE_GROUP,
    ROLE_USER,
    ROLE_ADMIN,
    ROLE_MODERATOR,
    ROLE_MEMBER
} = require('../constants/modelFields');

/**
 * Common validation utilities to reduce duplication across controllers
 */

// Common validation chains
const validations = {
    // User validations
    username: body(USERNAME)
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    
    email: body(EMAIL)
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    
    password: body(PASSWORD)
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    
    firstName: body(FIRST_NAME)
        .trim()
        .optional()
        .isLength({ max: 50 })
        .withMessage('First name cannot exceed 50 characters'),
    
    lastName: body(LAST_NAME)
        .trim()
        .optional()
        .isLength({ max: 50 })
        .withMessage('Last name cannot exceed 50 characters'),
    
    bio: body(BIO)
        .trim()
        .optional()
        .isLength({ max: 500 })
        .withMessage('Bio cannot exceed 500 characters'),
    
    phoneNumber: body(PHONE_NUMBER)
        .trim()
        .optional()
        .matches(/^[+]?[\d\s\-\(\)]+$/)
        .withMessage('Please provide a valid phone number'),
    
    // Message validations
    messageContent: body(CONTENT)
        .trim()
        .isLength({ min: 1, max: 5000 })
        .withMessage('Message content must be between 1 and 5000 characters'),
    
    messageType: body(TYPE)
        .isIn([TYPE_TEXT, TYPE_IMAGE, TYPE_FILE, TYPE_VIDEO, TYPE_AUDIO, TYPE_VOICE, TYPE_SYSTEM])
        .withMessage('Invalid message type'),
    
    // Chat validations
    chatName: body(NAME)
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Chat name must be between 1 and 100 characters'),
    
    chatDescription: body(DESCRIPTION)
        .trim()
        .optional()
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters'),
    
    chatType: body(TYPE)
        .isIn([TYPE_PRIVATE, TYPE_GROUP])
        .withMessage('Chat type must be either private or group'),
    
    // Role validations
    userRole: body('role')
        .optional()
        .isIn([ROLE_USER, ROLE_ADMIN, ROLE_MODERATOR, ROLE_MEMBER])
        .withMessage('Invalid user role')
};

/**
 * Validation result handler
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(error => ({
                field: error.param,
                message: error.msg,
                value: error.value
            }))
        });
    }
    next();
}

/**
 * Creates validation middleware with common validations
 * @param {Array} validationChains - Array of validation chains
 * @returns {Function} Express middleware function
 */
function validate(validationChains) {
    return [
        ...validationChains,
        handleValidationErrors
    ];
}

/**
 * Common validation sets for different use cases
 */
const validationSets = {
    // User registration
    userRegistration: [
        validations.username,
        validations.email,
        validations.password,
        validations.firstName,
        validations.lastName,
        validations.bio,
        validations.phoneNumber
    ],
    
    // User login
    userLogin: [
        validations.email,
        validations.password
    ],
    
    // User profile update
    userUpdate: [
        validations.firstName,
        validations.lastName,
        validations.bio,
        validations.phoneNumber
    ],
    
    // Message creation
    messageCreate: [
        validations.messageContent,
        validations.messageType
    ],
    
    // Chat creation
    chatCreate: [
        validations.chatName,
        validations.chatDescription,
        validations.chatType
    ],
    
    // Group creation (extends chat creation)
    groupCreate: [
        validations.chatName,
        validations.chatDescription,
        validations.userRole
    ]
};

/**
 * Custom validators for specific business logic
 */
const customValidators = {
    /**
     * Validates that at least one field is present
     * @param {string[]} fields - Array of field names
     * @returns {Function} Validator function
     */
    atLeastOneRequired: (fields) => {
        return (req, res, next) => {
            const hasAtLeastOne = fields.some(field => {
                const value = req.body[field];
                return value !== undefined && value !== null && value !== '';
            });
            
            if (!hasAtLeastOne) {
                return res.status(400).json({
                    success: false,
                    message: `At least one of the following fields is required: ${fields.join(', ')}`
                });
            }
            
            next();
        };
    },
    
    /**
     * Validates file upload constraints
     * @param {Object} options - File validation options
     * @returns {Function} Validator function
     */
    fileUpload: (options = {}) => {
        const {
            maxSize = 10 * 1024 * 1024, // 10MB default
            allowedTypes = [],
            required = false
        } = options;
        
        return (req, res, next) => {
            if (!req.file && !required) {
                return next();
            }
            
            if (!req.file && required) {
                return res.status(400).json({
                    success: false,
                    message: 'File is required'
                });
            }
            
            if (req.file) {
                // Check file size
                if (req.file.size > maxSize) {
                    return res.status(400).json({
                        success: false,
                        message: `File size cannot exceed ${Math.round(maxSize / 1024 / 1024)}MB`
                    });
                }
                
                // Check file type
                if (allowedTypes.length > 0 && !allowedTypes.includes(req.file.mimetype)) {
                    return res.status(400).json({
                        success: false,
                        message: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
                    });
                }
            }
            
            next();
        };
    }
};

module.exports = {
    validations,
    validationSets,
    customValidators,
    validate,
    handleValidationErrors
};
