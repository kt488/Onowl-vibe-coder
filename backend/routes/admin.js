const express = require('express');
const jwt = require('jsonwebtoken');
const { getStats } = require('../utils/statsStore');
const { supabase } = require('../utils/supabase');
const router = express.Router();

const JWT_SECRET = process.env.ADMIN_PASSWORD || 'fallback_secret';

/**
 * Basic authentication middleware for the admin panel.
 * Accepts either the raw ADMIN_PASSWORD or a valid JWT token.
 */
const adminAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Unauthorized: Missing credentials' });
    }

    const tokenOrPassword = authHeader.split(' ')[1];

    // Check if it's the raw password
    if (tokenOrPassword === process.env.ADMIN_PASSWORD) {
        return next();
    }

    // Check if it's a valid JWT
    try {
        jwt.verify(tokenOrPassword, JWT_SECRET);
        next();
    } catch (err) {
        return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired token' });
    }
};

/**
 * POST /api/admin/login
 * Verifies admin password and issues a JWT token for persistent sessions.
 */
router.post('/login', (req, res) => {
    const { password } = req.body;
    
    if (password === process.env.ADMIN_PASSWORD) {
        // Issue a token valid for 24 hours
        const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
        res.status(200).json({ success: true, token });
    } else {
        res.status(401).json({ success: false, error: 'Invalid admin password' });
    }
});

/**
 * GET /api/admin/stats
 * Returns real-time API usage, responsiveness metrics, and database stats.
 */
router.get('/stats', adminAuth, async (req, res) => {
    try {
        const aiStats = getStats();
        
        // Fetch Database Stats from Supabase
        let totalUsers = 0;
        let activeWorkspaces = 0;
        let usersList = [];

        try {
            // Get user count (Requires Service Role Key)
            const { data: usersData, error: userError } = await supabase.auth.admin.listUsers();
            if (!userError && usersData && usersData.users) {
                totalUsers = usersData.users.length;
                usersList = usersData.users.map(u => ({
                    id: u.id,
                    email: u.email,
                    created_at: u.created_at,
                    last_sign_in_at: u.last_sign_in_at
                }));
            }

            // Get workspace count
            const { count: workspaceCount, error: wsError } = await supabase
                .from('workspaces')
                .select('*', { count: 'exact', head: true });
            if (!wsError) activeWorkspaces = workspaceCount || 0;
        } catch (dbErr) {
            console.error('[Admin DB Error]:', dbErr.message);
        }

        res.status(200).json({
            success: true,
            data: {
                ...aiStats,
                db_users: totalUsers,
                db_workspaces: activeWorkspaces,
                users_list: usersList
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * DELETE /api/admin/users/:id
 * Deletes a user from the Supabase authentication database.
 */
router.delete('/users/:id', adminAuth, async (req, res) => {
    try {
        const userId = req.params.id;
        if (!userId) {
            return res.status(400).json({ success: false, error: 'User ID is required' });
        }

        // Delete user via Supabase Admin API (requires Service Role Key)
        const { data, error } = await supabase.auth.admin.deleteUser(userId);

        if (error) {
            console.error('[Admin Delete User Error]:', error.message);
            return res.status(500).json({ success: false, error: error.message });
        }

        res.status(200).json({ success: true, message: 'User successfully deleted' });
    } catch (err) {
        console.error('[Admin Delete User Exception]:', err.message);
        res.status(500).json({ success: false, error: 'Internal server error during user deletion' });
    }
});

module.exports = router;