const express = require('express');
const { supabase } = require('../utils/supabase');
const router = express.Router();

// Middleware to check for admin or staff role
const staffOrAdminOnly = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized: Missing authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    // Check user profile for admin or staff
    const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single();
    if (profile?.plan !== 'admin' && profile?.plan !== 'staff') {
        return res.status(403).json({ error: 'Forbidden: Requires staff or admin role' });
    }
    
    req.user = user;
    next();
};

// POST /api/payments - Submit new payment
router.post('/', async (req, res) => {
    const { plan_name, amount, utr, screenshot_url } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized: Missing authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    const userId = user.id;

    try {
        const { data, error } = await supabase.from('payments').insert({
            user_id: userId,
            plan_name,
            amount,
            utr,
            screenshot_url,
            payment_method: 'UPI'
        });
        if (error) throw error;
        res.status(201).json({ success: true, data });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

// GET /api/payments/copanel - View all payments with user details (Staff & Admin)
router.get('/copanel', staffOrAdminOnly, async (req, res) => {
    try {
        // Fetch payments with linked profile data
        const { data: payments, error: payError } = await supabase
            .from('payments')
            .select(`
                *,
                profiles:user_id (
                    name,
                    plan
                )
            `)
            .order('created_at', { ascending: false });
            
        if (payError) throw payError;

        // Fetch auth users to get emails
        const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
        if (usersError) console.error("Error fetching users for emails:", usersError);

        const emailMap = {};
        if (users) {
            users.forEach(u => emailMap[u.id] = u.email);
        }

        // Map the results
        const enrichedPayments = payments.map(p => ({
            ...p,
            username: p.profiles?.name || 'Unknown',
            current_plan: p.profiles?.plan || 'Unknown',
            email: emailMap[p.user_id] || 'N/A'
        }));

        res.json({ success: true, data: enrichedPayments });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/payments/copanel/stats - Get Revenue and Sub stats (Staff & Admin)
router.get('/copanel/stats', staffOrAdminOnly, async (req, res) => {
    try {
        const { data: payments, error: payError } = await supabase
            .from('payments')
            .select('amount, status, created_at');
        if (payError) throw payError;

        const { data: profiles, error: profError } = await supabase
            .from('profiles')
            .select('plan');
        if (profError) throw profError;

        let totalRevenue = 0;
        let pendingRequests = 0;
        let todayRevenue = 0;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        payments.forEach(p => {
            if (p.status === 'approved') {
                totalRevenue += Number(p.amount) || 0;
                const payDate = new Date(p.created_at);
                if (payDate >= today) {
                    todayRevenue += Number(p.amount) || 0;
                }
            } else if (p.status === 'pending') {
                pendingRequests++;
            }
        });

        const activeSubscribers = profiles.filter(p => p.plan && p.plan !== 'free' && p.plan !== 'admin' && p.plan !== 'staff').length;

        res.json({ 
            success: true, 
            stats: {
                totalRevenue,
                todayRevenue,
                activeSubscribers,
                pendingRequests
            } 
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/payments/copanel/:id/verify - Approve/Reject with notes (Staff & Admin)
router.post('/copanel/:id/verify', staffOrAdminOnly, async (req, res) => {
    const { status, rejection_reason, notes } = req.body; // status: 'approved' | 'rejected'
    const paymentId = req.params.id;

    try {
        const { data: payment, error: fetchError } = await supabase.from('payments').select('*').eq('id', paymentId).single();
        if (fetchError) throw fetchError;

        if (status === 'approved') {
            // Automatically activate subscription
            await supabase.from('profiles').update({ plan: payment.plan_name }).eq('id', payment.user_id);
        }

        const { error: updateError } = await supabase.from('payments').update({
            status,
            rejection_reason,
            notes
        }).eq('id', paymentId);
        
        if (updateError) throw updateError;
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
