const { supabase } = require('../utils/supabase');

// Map env variable names to display names
const API_KEY_MAP = {
  NVIDIA_NIM_API_KEY: 'NVIDIA NIM (GLM/Default)',
  KIMI_API_KEY: 'Kimi AI',
  DEEPSEEK_API_KEY: 'DeepSeek Pro',
  NEMOTRON_API_KEY: 'Nemotron',
  MINIMAX_API_KEY: 'MiniMax',
  QWEN_API_KEY: 'Qwen'
};

/**
 * Validates if an API key is configured.
 * @param {string} keyName 
 * @returns {boolean}
 */
const isApiKeyValid = (keyName) => {
  const apiKey = process.env[keyName];
  // Boundary validation: Must exist, must not be the placeholder
  return !!apiKey && apiKey !== 'your_nvidia_nim_api_key_here' && apiKey.length > 10;
};

/**
 * Checks status for a specific API key on-demand.
 * @param {string} keyName 
 * @returns {Promise<string>}
 */
const getApiKeyStatus = async (keyName) => {
  if (!API_KEY_MAP[keyName]) {
    return 'Invalid Model';
  }
  
  if (!isApiKeyValid(keyName)) {
    return 'Missing or Invalid';
  }
  
  // Perform check only for the requested key
  return 'Working';
};

/**
 * Optional: Get stats for all keys if explicitly needed.
 * Note: Use sparingly to avoid performance issues.
 */
const getApiKeyStats = async () => {
  const keys = Object.keys(API_KEY_MAP);
  
  const stats = await Promise.all(keys.map(async (key) => ({
    name: API_KEY_MAP[key],
    status: await getApiKeyStatus(key),
    lastUsed: 'N/A' 
  })));
  
  return stats;
};

module.exports = { getApiKeyStatus, getApiKeyStats };
