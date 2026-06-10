/**
 * Enhanced in-memory store for professional dashboard metrics.
 */
const stats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalLatency: 0,
    totalTokens: 0,
    lastRequestTime: null,
    modelUsage: {},
    errors: [],
    systemLogs: []
};

// Capture console logs for admin panel
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

function addLog(type, args) {
    const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
    stats.systemLogs.unshift({
        time: new Date().toISOString(),
        type: type,
        message: msg
    });
    if (stats.systemLogs.length > 50) stats.systemLogs.pop();
}

console.log = function(...args) {
    addLog('info', args);
    originalLog.apply(console, args);
};

console.error = function(...args) {
    addLog('error', args);
    originalError.apply(console, args);
};

console.warn = function(...args) {
    addLog('warn', args);
    originalWarn.apply(console, args);
};


const incrementTotal = () => {
    stats.totalRequests++;
    stats.lastRequestTime = new Date().toISOString();
};

const incrementSuccess = (model, latency = 0, tokens = 0) => {
    stats.successfulRequests++;
    stats.modelUsage[model] = (stats.modelUsage[model] || 0) + 1;
    stats.totalLatency += latency;
    stats.totalTokens += tokens;
};

const incrementFailure = (errorMsg) => {
    stats.failedRequests++;
    stats.errors.unshift({
        time: new Date().toISOString(),
        message: errorMsg || 'Unknown API Error'
    });
    if (stats.errors.length > 50) stats.errors.pop();
};

// Helper to generate trend data for charts
const getHistoricalTrends = () => {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return labels.map(day => ({
        day,
        users: Math.floor(Math.random() * 100) + 50,
        requests: Math.floor(Math.random() * 500) + 200,
        revenue: Math.floor(Math.random() * 1000) + 100
    }));
};

const getStats = () => {
    const avgLatency = stats.successfulRequests > 0 
        ? (stats.totalLatency / stats.successfulRequests).toFixed(0) 
        : 0;

    return {
        ...stats,
        avgLatency: `${avgLatency}ms`,
        successRate: stats.totalRequests > 0 
            ? ((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1) + '%' 
            : '0%',
        uptime: process.uptime().toFixed(0) + 's',
        trends: getHistoricalTrends(), // Added trend data
        // Mocking business metrics for the dashboard
        revenue: {
            monthly: 4250,
            total: 125000,
            growth: 12.5
        },
        subscriptions: {
            active: 1240,
            free: 800,
            paid: 440,
            growth: 4.2
        }
    };
};

module.exports = {
    incrementTotal,
    incrementSuccess,
    incrementFailure,
    getStats
};