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
        console.warn('[PAYMENT FLOW API] Missing authorization header on payment submission');
        return res.status(401).json({ error: 'Unauthorized: Missing authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
        console.warn('[PAYMENT FLOW API] Invalid token on payment submission', { authError: authError?.message });
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    const userId = user.id;
    console.log('[PAYMENT FLOW API] Payment submission received', {
        userId,
        plan_name,
        amount,
        utrPreview: utr ? utr.slice(0, 4) + '********' : 'N/A',
        timestamp: new Date().toISOString()
    });

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
        console.log('[PAYMENT FLOW API] Payment inserted successfully', { userId, plan_name, amount, timestamp: new Date().toISOString() });
        res.status(201).json({ success: true, data });
    } catch (err) {
        console.error('[PAYMENT FLOW API] Payment insert error', { userId, error: err.message, timestamp: new Date().toISOString() });
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

        // Fetch auth users to get emails safely
        const usersListResult = await supabase.auth.admin.listUsers();
        if (usersListResult.error) console.error("Error fetching users for emails:", usersListResult.error);
        const users = usersListResult.data?.users || [];

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

    console.log('[PAYMENT FLOW API] Payment verification request', {
        paymentId,
        requestedStatus: status,
        rejection_reason: rejection_reason || 'N/A',
        verifiedBy: req.user?.id,
        timestamp: new Date().toISOString()
    });

    try {
        const { data: payment, error: fetchError } = await supabase.from('payments').select('*').eq('id', paymentId).single();
        if (fetchError) throw fetchError;

        console.log('[PAYMENT FLOW API] Payment record fetched', {
            paymentId,
            userId: payment.user_id,
            plan_name: payment.plan_name,
            amount: payment.amount,
            currentStatus: payment.status,
            timestamp: new Date().toISOString()
        });

        if (status === 'approved') {
            console.log('[PAYMENT FLOW API] Approving payment - activating subscription', {
                userId: payment.user_id,
                newPlan: payment.plan_name,
                timestamp: new Date().toISOString()
            });
            // Automatically activate subscription
            await supabase.from('profiles').update({ plan: payment.plan_name }).eq('id', payment.user_id);
        } else if (status === 'rejected') {
            console.log('[PAYMENT FLOW API] Rejecting payment', {
                paymentId,
                userId: payment.user_id,
                reason: rejection_reason,
                timestamp: new Date().toISOString()
            });
        }

        const { error: updateError } = await supabase.from('payments').update({
            status,
            rejection_reason,
            notes
        }).eq('id', paymentId);

        if (updateError) throw updateError;

        console.log('[PAYMENT FLOW API] Payment status updated successfully', {
            paymentId,
            newStatus: status,
            timestamp: new Date().toISOString()
        });
        res.json({ success: true });
    } catch (err) {
        console.error('[PAYMENT FLOW API] Payment verification error', { paymentId, error: err.message, timestamp: new Date().toISOString() });
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
