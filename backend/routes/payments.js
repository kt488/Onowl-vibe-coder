const express = require('express');
const { supabase } = require('../utils/supabase');
const router = express.Router();

// Middleware to check for admin role (assuming plan = 'admin' in profiles)
const adminOnly = async (req, res, next) => {
    // In a real app, use auth middleware to get UID
    // For now, assume req.user is set by auth middleware
    const userId = req.user?.id; 
    const { data: profile } = await supabase.from('profiles').select('plan').eq('id', userId).single();
    if (profile?.plan !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    next();
};

// POST /api/payments - Submit new payment
router.post('/', async (req, res) => {
    const { plan_name, amount, utr, screenshot_url } = req.body;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const { data, error } = await supabase.from('payments').insert({
            user_id: userId,
            plan_name,
            amount,
            utr,
            screenshot_url
        });
        if (error) throw error;
        res.status(201).json({ success: true, data });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

// GET /api/admin/payments - View all (Admin Only)
router.get('/admin', adminOnly, async (req, res) => {
    try {
        const { data, error } = await supabase.from('payments').select('*');
        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/admin/payments/:id/verify - Approve/Reject (Admin Only)
router.post('/admin/:id/verify', adminOnly, async (req, res) => {
    const { status, rejection_reason } = req.body; // status: 'approved' | 'rejected'
    const paymentId = req.params.id;

    try {
        const { data: payment, error: fetchError } = await supabase.from('payments').select('*').eq('id', paymentId).single();
        if (fetchError) throw fetchError;

        if (status === 'approved') {
            // Activate subscription (logic placeholder)
            await supabase.from('profiles').update({ plan: payment.plan_name }).eq('id', payment.user_id);
        }

        const { error: updateError } = await supabase.from('payments').update({
            status,
            rejection_reason
        }).eq('id', paymentId);
        
        if (updateError) throw updateError;
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
