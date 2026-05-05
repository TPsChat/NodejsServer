const mongoose = require('mongoose');

/**
 * Base schema utilities to reduce duplication across Mongoose schemas
 * Provides common fields, indexes, and methods
 */

// Common schema fields that can be mixed into other schemas
const commonFields = {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
};

// Common index patterns
const commonIndexes = [
    { createdAt: -1 },
    { updatedAt: -1 },
    { isActive: 1 }
];

// Base participant schema used in Chat and other models
const participantSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'moderator', 'member'],
        default: 'member'
    },
    joinedAt: {
        type: Date,
        default: Date.now
    },
    leftAt: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { _id: false });

// Base attachment schema for messages and posts
const attachmentSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    mimeType: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    thumbnail: {
        type: String // For images and videos
    }
}, { _id: false });

// Reaction schema for messages and posts
const reactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    emoji: {
        type: String,
        required: true,
        maxlength: 10
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

// Read receipt schema for messages
const readReceiptSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    readAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

// Edit history schema for messages
const editHistorySchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    editedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

/**
 * Adds common fields and methods to a schema
 * @param {mongoose.Schema} schema - The schema to enhance
 * @param {Object} options - Configuration options
 */
function enhanceSchema(schema, options = {}) {
    // Add common fields if not already present
    if (!schema.paths.isActive) {
        schema.add({
            isActive: {
                type: Boolean,
                default: true,
                index: true
            }
        });
    }

    // Add common indexes
    commonIndexes.forEach(index => {
        schema.index(index);
    });

    // Add common methods
    schema.methods.softDelete = function(deletedBy) {
        this.isDeleted = true;
        this.deletedAt = new Date();
        if (deletedBy) {
            this.deletedBy = deletedBy;
        }
        return this.save();
    };

    schema.methods.activate = function() {
        this.isActive = true;
        return this.save();
    };

    schema.methods.deactivate = function() {
        this.isActive = false;
        return this.save();
    };

    // Add static methods
    schema.statics.findActive = function(filter = {}) {
        return this.find({ ...filter, isActive: true });
    };

    schema.statics.findByIdActive = function(id) {
        return this.findOne({ _id: id, isActive: true });
    };

    // Add pre-save middleware for common validation
    schema.pre('save', function(next) {
        // Ensure arrays are not undefined
        Object.keys(this.schema.paths).forEach(path => {
            const schemaType = this.schema.paths[path];
            if (schemaType.schema && schemaType.schema.paths) {
                // Check if it's an array schema
                if (schemaType.instance === 'Array') {
                    if (this[path] === undefined) {
                        this[path] = [];
                    }
                }
            }
        });
        next();
    });

    return schema;
}

module.exports = {
    commonFields,
    commonIndexes,
    participantSchema,
    attachmentSchema,
    reactionSchema,
    readReceiptSchema,
    editHistorySchema,
    enhanceSchema
};
