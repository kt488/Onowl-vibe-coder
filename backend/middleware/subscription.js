const { supabase } = require('../utils/supabase');

const PLAN_LIMITS = {
  free: 10,
  pro: 500,
  premium: 2000,
  business: 100000 // practically unlimited
};

const checkSubscription = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Missing authorization header.' });
  }

  const token = authHeader.replace('Bearer ', '');
  
  try {
    // Verify token using Supabase admin client (since we use service_role for backend)
    // Wait, supabase.auth.getUser(token) works with service_role client too.
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired token.' });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plan, tokens_used_today, last_token_reset')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError);
      return res.status(500).json({ success: false, error: 'Failed to fetch user profile.' });
    }

    // Check if we need to reset daily tokens
    const lastReset = new Date(profile.last_token_reset);
    const now = new Date();
    const isNewDay = lastReset.getUTCFullYear() !== now.getUTCFullYear() || 
                     lastReset.getUTCMonth() !== now.getUTCMonth() || 
                     lastReset.getUTCDate() !== now.getUTCDate();

    let currentTokens = isNewDay ? 0 : profile.tokens_used_today;
    const limit = PLAN_LIMITS[profile.plan] || PLAN_LIMITS.free;

    if (currentTokens >= limit) {
      // Return normal JSON if headers not sent, otherwise we have to return stream format if it was a stream?
      // Since this is middleware before the route, normal JSON is fine.
      return res.status(429).json({ success: false, error: `Daily limit reached for your ${profile.plan} plan.` });
    }

    // Attach to request
    req.user = user;
    req.profile = { ...profile, tokens_used_today: currentTokens, isNewDay };
    next();
  } catch (err) {
    console.error('Subscription check error:', err);
    res.status(500).json({ success: false, error: 'Server error checking subscription.' });
  }
};

module.exports = { checkSubscription };
