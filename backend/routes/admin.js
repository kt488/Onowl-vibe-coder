const express = require('express');
const jwt = require('jsonwebtoken');
const { getStats } = require('../utils/statsStore');
const { getApiKeyStats } = require('../utils/apiKeyManager');
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
 * Optimized for speed using server-side counts and filtering.
 */
router.get('/stats', adminAuth, async (req, res) => {
    try {
        const aiStats = getStats();
        
        let metrics = {
            totalUsers: 0,
            activeUsersToday: 0,
            newUsersThisWeek: 0,
            totalProjects: 0,
            activeProjects: 0,
            freeUsers: 0,
            paidUsers: 0,
            usersList: []
        };

        try {
            const now = new Date();
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

            // Parallelize independent count queries for performance
            const [
                totalUsersResult,
                activeTodayResult,
                newWeekResult,
                freePlanResult,
                totalProjectsResult,
                activeProjectsResult,
                usersListResult
            ] = await Promise.all([
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('updated_at', todayStart),
                supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', oneWeekAgo),
                supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'free'),
                supabase.from('workspaces').select('*', { count: 'exact', head: true }),
                supabase.from('workspaces').select('*', { count: 'exact', head: true }).gte('updated_at', oneWeekAgo),
                supabase.auth.admin.listUsers() // Still needed for the Users tab
            ]);

            metrics.totalUsers = totalUsersResult.count || 0;
            metrics.activeUsersToday = activeTodayResult.count || 0;
            metrics.newUsersThisWeek = newWeekResult.count || 0;
            metrics.freeUsers = freePlanResult.count || 0;
            metrics.paidUsers = Math.max(0, metrics.totalUsers - metrics.freeUsers);
            
            metrics.totalProjects = totalProjectsResult.count || 0;
            metrics.activeProjects = activeProjectsResult.count || 0;
            
            // Limit users list to avoid huge payloads
            const authUsers = usersListResult.data?.users?.slice(0, 100) || [];
            
            // Fetch plans for these users from profiles table
            const userIds = authUsers.map(u => u.id);
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, plan')
                .in('id', userIds);

            // Merge plan info into authUsers
            metrics.usersList = authUsers.map(user => {
                const profile = profiles?.find(p => p.id === user.id);
                return {
                    ...user,
                    plan: profile?.plan || 'free'
                };
            });

        } catch (dbErr) {
            console.error('[Admin DB Stats Error]:', dbErr.message);
        }

        res.status(200).json({
            success: true,
            data: {
                ...aiStats,
                metrics,
                users_list: metrics.usersList,
                api_keys: await getApiKeyStats()
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * PATCH /api/admin/users/:id/plan
 * Updates a user's subscription plan in the profiles table.
 */
router.patch('/users/:id/plan', adminAuth, async (req, res) => {
    try {
        const userId = req.params.id;
        const { plan } = req.body;

        if (!userId || !plan) {
            return res.status(400).json({ success: false, error: 'User ID and Plan are required' });
        }

        const validPlans = ['free', 'pro', 'premium', 'business'];
        if (!validPlans.includes(plan.toLowerCase())) {
            return res.status(400).json({ success: false, error: 'Invalid plan type' });
        }

        const { error } = await supabase
            .from('profiles')
            .update({ plan: plan.toLowerCase() })
            .eq('id', userId);

        if (error) {
            console.error('[Admin Update Plan Error]:', error.message);
            return res.status(500).json({ success: false, error: error.message });
        }

        res.status(200).json({ success: true, message: `User plan updated to ${plan}` });
    } catch (err) {
        console.error('[Admin Update Plan Exception]:', err.message);
        res.status(500).json({ success: false, error: 'Internal server error during plan update' });
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