const { supabase } = require('./supabase');

/**
 * Persists workspace state (files, chat history) to Supabase.
 */
async function saveWorkspace(userId, workspaceId, data) {
  const { files, chatHistory } = data;
  
  // Try update, if fails, insert
  const { data: existing, error: fetchError } = await supabase
    .from('workspaces')
    .select('id')
    .eq('id', workspaceId)
    .single();

  if (fetchError || !existing) {
    const { data: inserted, error: insertError } = await supabase
      .from('workspaces')
      .insert({
        id: workspaceId,
        user_id: userId,
        files: files || [],
        chat_history: chatHistory || []
      });
      
    if (insertError) throw insertError;
    return inserted;
  } else {
    const { data: updated, error: updateError } = await supabase
      .from('workspaces')
      .update({
        files: files || [],
        chat_history: chatHistory || []
      })
      .eq('id', workspaceId);
      
    if (updateError) throw updateError;
    return updated;
  }
}

module.exports = { saveWorkspace };
