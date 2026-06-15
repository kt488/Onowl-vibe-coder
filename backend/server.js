require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const chatRoutes = require('./routes/chat');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payments');
const { supabase } = require('./utils/supabase');

const app = express();
const PORT = process.env.PORT || 5000;

// Serve static files from the React frontend 'dist' directory
app.use(express.static(path.join(__dirname, '../dist')));

// ==========================================
// Middleware Configuration
// ==========================================

// Enable CORS securely - restricts access to the specified frontend origin
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*', 
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse incoming JSON requests safely
app.use(express.json({ limit: '5mb' }));

// Logging middleware for tracking requests (HTTP status, response time, etc.)
app.use(morgan('dev'));

// ==========================================
// Routes Configuration
// ==========================================

// Chat endpoint (Nemotron integration via NVIDIA NIM)
app.use('/api/chat', chatRoutes);

// Admin stats endpoint
app.use('/api/admin', adminRoutes);

// Payment endpoints
app.use('/api/payments', paymentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        success: true, 
        message: 'Onowl Backend API is running.',
        timestamp: new Date().toISOString()
    });
});

// ==========================================
// Global Error Handling
// ==========================================

// Catch unhandled API routes
app.use('/api/*', (req, res, next) => {
    res.status(404).json({ success: false, error: 'API Route not found' });
});

// For all other routes, serve the React app (SPA fallback)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(`[Global Error]: ${err.stack}`);
    res.status(500).json({ 
        success: false, 
        error: 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { details: err.message })
    });
});

// ==========================================
// Server Initialization
// ==========================================

if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`\n🚀 [Server] Onowl Backend is running on http://127.0.0.1:${PORT}`);
        console.log(`🌍 [Environment] ${process.env.NODE_ENV}`);
        
        if (!process.env.NVIDIA_NIM_API_KEY || process.env.NVIDIA_NIM_API_KEY === 'your_nvidia_nim_api_key_here') {
            console.warn(`⚠️  [Warning] NVIDIA_NIM_API_KEY is missing or invalid in .env file!`);
        } else {
            console.log(`✅ [NVIDIA NIM] API Key loaded successfully.`);
        }
    });
}

module.exports = app;