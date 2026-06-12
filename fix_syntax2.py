import re

with open('src/pages/IDE.jsx', 'r') as f:
    lines = f.readlines()

start_idx = -1
for i, line in enumerate(lines):
    if "const fetchAIResponse = async (chatHistory) => {" in line:
        start_idx = i
        break

handle_idx = -1
for i in range(start_idx, len(lines)):
    if "const handleChatSubmit = async (e) => {" in line:
        handle_idx = i
        # find the one that occurs after the broken block
        if handle_idx > 490: 
            break

print(f"Replacing lines {start_idx} to {handle_idx}")

new_fetchAIResponse = """  const fetchAIResponse = async (chatHistory) => {
    setTerminalLogs(prev => [...prev, { type: 'sys', text: '➜  AI Engine started processing...' }]);
    setIsLoading(true);
    setLoadingProgress(10);

    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) return prev;
        return prev + 5;
      });
    }, 500);

    try {
      const apiMessages = chatHistory.map(m => ({
        role: m.role === 'ai' ? 'assistant' : m.role,
        content: m.text
      })).filter(m => m.content); 

      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': session ? `Bearer ${session.access_token}` : ''
        },
        body: JSON.stringify({
          messages: apiMessages,
          temperature: selectedModel.includes('kimi') ? 0.3 : 0.7,
          max_tokens: 2048,
          model: selectedModel,
          image: selectedImage
        })
      });

      clearInterval(progressInterval);
      setLoadingProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setLoadingProgress(0);
      }, 500);

      if (response.status === 429) {
        const errData = await response.json();
        throw new Error(errData.error || 'Daily limit reached.');
      }
      if (!response.ok) throw new Error('Failed to connect to AI backend.');

      setSelectedModelImage(null);

      const data = await response.json();
      
      if (data.terminal && data.terminal.length > 0) {
          data.terminal.forEach(t => setTerminalLogs(prev => [...prev, { type: 'log', text: t }]));
      }

      if (data.content) {
          const fullContent = data.content;
          
          let chatSummary = '';
          const parts = fullContent.split('```');
          parts.forEach((part, i) => {
            if (i % 2 === 0) {
              chatSummary += part.replace(/###\s*FILE:\s*[^\s\\n]+/gi, '').replace(/###\s*UPDATE:\s*[^\s\\n]+/gi, '').replace(/<<<<[\\s\\S]*?====[\\s\\S]*?>>>>/g, '').trim() + ' ';
            }
          });

          setMessages(prev => [...prev, { role: 'ai', text: chatSummary.trim() || 'Processed workspace.' }]);

          // Process ### UPDATE: blocks (Surgical Edits)
          const updateRegex = /### UPDATE:\s*(.+?)\s*\\n<<<<\\n([\\s\\S]*?)====\\n([\\s\\S]*?)>>>>/g;
          let updateMatch;
          let updatesApplied = 0;
          
          setFiles(prevFiles => {
              let updatedFiles = [...prevFiles];
              while ((updateMatch = updateRegex.exec(fullContent)) !== null) {
                  const fileName = updateMatch[1].trim();
                  const oldCode = updateMatch[2].trim();
                  const newCode = updateMatch[3].trim();
                  
                  const fileIndex = updatedFiles.findIndex(f => f.name === fileName);
                  if (fileIndex >= 0) {
                      if (updatedFiles[fileIndex].content.includes(oldCode)) {
                          updatedFiles[fileIndex].content = updatedFiles[fileIndex].content.replace(oldCode, newCode);
                          updatesApplied++;
                          setActiveFileId(updatedFiles[fileIndex].id);
                      } else {
                          console.warn(`Could not find old code in ${fileName} to replace.`);
                      }
                  }
              }
              return updatedFiles;
          });

          // Process ### FILE: blocks (Whole file overwrite/create)
          const fileRegex = /### FILE:\s*(.+?)\s*\\n\s*```[a-zA-Z]*\\n([\\s\\S]*?)```/g;
          let match;
          let newFilesFound = [];
          while ((match = fileRegex.exec(fullContent)) !== null) {
              newFilesFound.push({
                  id: Date.now().toString() + Math.random().toString(36).substring(7),
                  name: match[1].trim(),
                  language: match[1].trim().split('.').pop() === 'js' ? 'javascript' : match[1].trim().split('.').pop() === 'jsx' ? 'javascript' : match[1].trim().split('.').pop(),
                  content: match[2].trim()
              });
          }

          if (newFilesFound.length > 0 || updatesApplied > 0) {
              if (newFilesFound.length > 0) {
                  setFiles(prevFiles => {
                      let updatedFiles = [...prevFiles];
                      newFilesFound.forEach(newFile => {
                          const existingIndex = updatedFiles.findIndex(f => f.name === newFile.name);
                          if (existingIndex >= 0) {
                              updatedFiles[existingIndex].content = newFile.content;
                          } else {
                              const pathParts = newFile.name.split('/');
                              if (pathParts.length > 1) {
                                  let pathAccumulator = '';
                                  const newFolders = [];
                                  for (let i = 0; i < pathParts.length - 1; i++) {
                                      pathAccumulator += (pathAccumulator ? '/' : '') + pathParts[i];
                                      newFolders.push(pathAccumulator);
                                  }
                                  setExpandedFolders(prev => Array.from(new Set([...prev, ...newFolders])));
                              }
                              updatedFiles.push(newFile);
                          }
                      });
                      return updatedFiles;
                  });
                  setActiveFileId(newFilesFound[newFilesFound.length - 1].id);
              }
              
              let logMsg = '';
              if (newFilesFound.length > 0) logMsg += `✓ Created/Overwrote ${newFilesFound.length} files. `;
              if (updatesApplied > 0) logMsg += `✓ Applied ${updatesApplied} updates.`;
              
              setTerminalLogs(prev => [...prev.filter(l => l.type !== 'stream'), { type: 'success', text: logMsg.trim() }]);
          } else {
              const regex = /```(\w+)?\\n([\\s\\S]*?)```/g;
              let extractedBlocks = [];
              let fallbackMatch;
              while ((fallbackMatch = regex.exec(fullContent)) !== null) {
                extractedBlocks.push({ lang: fallbackMatch[1] || 'text', code: fallbackMatch[2].trim() });
              }

              if (extractedBlocks.length > 0) {
                updateFilesInWorkspace(extractedBlocks);
                setTerminalLogs(prev => [...prev.filter(l => l.type !== 'stream'), { type: 'success', text: `✓ Extracted ${extractedBlocks.length} code blocks.` }]);
              } else {
                setTerminalLogs(prev => [...prev.filter(l => l.type !== 'stream'), { type: 'info', text: `ℹ Processing completed.` }]);
              }
          }
      } else {
          setTerminalLogs(prev => prev.filter(l => l.type !== 'stream'));
      }
    } catch (error) {
      clearInterval(progressInterval);
      setLoadingProgress(0);
      setIsLoading(false);
      setTerminalLogs(prev => prev.filter(l => l.type !== 'stream'));
      setTerminalLogs(prev => [...prev, { type: 'error', text: `[SYSTEM ERROR] ${error.message}` }]);
    }
  };

  useEffect(() => {
    if (initialPrompt && !hasFetchedInitial.current) {
      hasFetchedInitial.current = true;
      fetchAIResponse(messages);
    }
  }, [initialPrompt]);

"""

new_lines = lines[:start_idx] + [new_fetchAIResponse] + lines[handle_idx:]

with open('src/pages/IDE.jsx', 'w') as f:
    f.writelines(new_lines)
