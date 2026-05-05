/**
 * Utility functions for URL handling on the server side
 * Mirrors client-side UrlUtils for consistency
 */

/**
 * Constructs full URL from relative path for avatars and other resources
 * @param {string} relativePath - Relative path (can be null or empty)
 * @param {string} baseUrl - Base URL of the server (optional, defaults to environment)
 * @returns {string|null} Full URL or null if input is invalid
 */
function getFullUrl(relativePath, baseUrl = null) {
    if (!relativePath || relativePath.trim() === '') {
        return null;
    }
    
    // Return as-is if already a full URL
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
        return relativePath;
    }
    
    // Use provided base URL or construct from environment
    const serverUrl = baseUrl || `${process.env.SERVER_PROTOCOL || 'http'}://${process.env.SERVER_HOST || 'localhost'}:${process.env.PORT || 3000}`;
    
    // Ensure path starts with /
    const path = relativePath.startsWith('/') ? relativePath : '/' + relativePath;
    
    return serverUrl + path;
}

/**
 * Constructs full avatar URL specifically for avatar images
 * @param {string} avatarPath - Avatar relative path
 * @param {string} baseUrl - Base URL of the server (optional)
 * @returns {string|null} Full avatar URL or null if input is invalid
 */
function getFullAvatarUrl(avatarPath, baseUrl = null) {
    return getFullUrl(avatarPath, baseUrl);
}

/**
 * Checks if a string is a valid URL
 * @param {string} url - String to check
 * @returns {boolean} true if valid URL, false otherwise
 */
function isValidUrl(url) {
    return url && url.trim() !== '' && 
           (url.startsWith('http://') || url.startsWith('https://'));
}

/**
 * Checks if a path is relative (needs server URL construction)
 * @param {string} path - Path to check
 * @returns {boolean} true if relative, false if already absolute or invalid
 */
function isRelativePath(path) {
    return path && path.trim() !== '' && 
           !path.startsWith('http://') && !path.startsWith('https://');
}

/**
 * Constructs upload URL for file uploads
 * @param {string} filename - Filename
 * @param {string} uploadDir - Upload directory (optional)
 * @returns {string} Upload URL
 */
function getUploadUrl(filename, uploadDir = '/uploads') {
    if (!filename) return null;
    
    const path = uploadDir.startsWith('/') ? uploadDir : '/' + uploadDir;
    const filenamePath = filename.startsWith('/') ? filename : '/' + filename;
    
    return path + filenamePath;
}

module.exports = {
    getFullUrl,
    getFullAvatarUrl,
    isValidUrl,
    isRelativePath,
    getUploadUrl
};
