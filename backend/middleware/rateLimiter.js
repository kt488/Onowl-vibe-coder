const rateLimit = require('express-rate-limit');

/**
 * Rate limiting middleware to protect the API from abuse.
 * Limits each IP to 50 requests per 15 minutes for standard chat requests.
 */
const chatRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 requests per `window` (here, per 15 minutes)
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again after 15 minutes.'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

module.exports = {
    chatRateLimiter
};