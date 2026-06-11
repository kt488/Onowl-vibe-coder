import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Download, FolderArchive, Play, TerminalSquare, Github, MessageSquare, Plus, FileCode2, Loader2, ArrowLeft, Zap, Image, X, Save, Folder, ChevronRight, ChevronDown, Trash2, ExternalLink as ExternalLinkIcon } from 'lucide-react';
import { exportProjectAsZip, downloadSingleFile } from '../utils/download';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import ProfileBar from '../components/ProfileBar';

const DEFAULT_FILES = [
  { id: '1', name: 'index.html', language: 'html', content: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Onowl App</title>\n</head>\n<body>\n  <h1>Hello from Onowl AI</h1>\n</body>\n</html>' },
  { id: '2', name: 'style.css', language: 'css', content: 'body {\n  font-family: system-ui, sans-serif;\n  background: #09090b;\n  color: white;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  height: 100vh;\n  margin: 0;\n}' },
  { id: '3', name: 'script.js', language: 'javascript', content: 'console.log("Vibe coding sandbox initialized...");' }
];

const IDE = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialPrompt = location.state?.initialPrompt || '';
  const isCreateNew = location.state?.createNew || false;
  const loadWorkspaceId = location.state?.workspaceId || null;

  const hasFetchedInitial = useRef(false);
  const terminalEndRef = useRef(null);

  const [workspaceId, setWorkspaceId] = useState(null);
  console.log('IDE Component rendered, workspaceId:', workspaceId);
  const [isSaving, setIsSaving] = useState(false);
  const [userPlan, setUserPlan] = useState('free');


  const [files, setFiles] = useState(DEFAULT_FILES);
  const [activeFileId, setActiveFileId] = useState('1');
  const [isExporting, setIsExporting] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('moonshotai/kimi-k2.6');
  const [selectedImage, setSelectedModelImage] = useState(null); // Base64 image
  const [activeTab, setActiveTab] = useState('chat'); // For mobile tabs: chat, files, editor, preview
  const [expandedFolders, setExpandedFolders] = useState(['src']); // Track open folders
  
  // Split state into Chat and Terminal
  const [messages, setMessages] = useState(() => {
    const base = [{ role: 'ai', text: 'I am Onowl AI. How can I help you code today?' }];
    if (initialPrompt) base.push({ role: 'user', text: initialPrompt });
    return base;
  });
  
  const [terminalLogs, setTerminalLogs] = useState([
    { type: 'sys', text: '➜  onowl-project git:(main)' },
    { type: 'sys', text: 'npm run dev' },
    { type: 'info', text: 'VITE v5.1.6  ready in 124 ms' },
    { type: 'sys', text: '➜  Local:   Sandbox Engine Active' }
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const activeFile = files.find(f => f.id === activeFileId);

  // Helper to build a hierarchical tree from flat file list
  const buildFileTree = (fileList) => {
    const root = { name: 'root', type: 'folder', children: {} };

    fileList.forEach(file => {
      const parts = file.name.split('/');
      let current = root;
      let pathSoFar = '';

      parts.forEach((part, index) => {
        const isFile = index === parts.length - 1;
        pathSoFar += (pathSoFar ? '/' : '') + part;
        
        if (!current.children[part]) {
          current.children[part] = isFile 
            ? { ...file, type: 'file', displayName: part } 
            : { name: part, type: 'folder', path: pathSoFar, children: {} };
        }
        current = current.children[part];
      });
    });

    const convertToArray = (node) => {
      if (node.type === 'file') return node;
      return {
        ...node,
        children: Object.values(node.children)
          .sort((a, b) => {
            if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
            return a.name.localeCompare(b.name);
          })
          .map(convertToArray)
      };
    };

    return Object.values(root.children).map(convertToArray);
  };

  const toggleFolder = (folderPath) => {
    setExpandedFolders(prev => 
      prev.includes(folderPath) 
        ? prev.filter(p => p !== folderPath) 
        : [...prev, folderPath]
    );
  };

  // Load from DB on mount
  useEffect(() => {
    const loadWorkspace = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single();
      if (profile) setUserPlan(profile.plan);

      if (isCreateNew) {
        // Force create new workspace
        const { data: newWs } = await supabase
          .from('workspaces')
          .insert({ user_id: user.id, files: DEFAULT_FILES, chat_history: messages, terminal_logs: terminalLogs })
          .select()
          .single();
        if (newWs) setWorkspaceId(newWs.id);
        return;
      }

      let query = supabase.from('workspaces').select('*').eq('user_id', user.id);
      
      if (loadWorkspaceId) {
        query = query.eq('id', loadWorkspaceId);
      } else {
        query = query.order('updated_at', { ascending: false }).limit(1);
      }

      const { data, error } = await query.single();

      if (data) {
        setWorkspaceId(data.id);
        if (data.files?.length > 0) setFiles(data.files);
        if (data.chat_history?.length > 0) setMessages(data.chat_history);
        if (data.terminal_logs?.length > 0) setTerminalLogs(data.terminal_logs);
      } else if (!error || error.code === 'PGRST116') {
        // Create new workspace if none exists
        const { data: newWs } = await supabase
          .from('workspaces')
          .insert({ user_id: user.id, files: DEFAULT_FILES, chat_history: messages, terminal_logs: terminalLogs })
          .select()
          .single();
        if (newWs) setWorkspaceId(newWs.id);
      }
    };
    loadWorkspace();
  }, []);

  // Save to DB
  const saveWorkspace = async () => {
    console.log('saveWorkspace triggered, workspaceId:', workspaceId);
    if (!workspaceId) return;
    setIsSaving(true);
    const { data, error } = await supabase
      .from('workspaces')
      .update({ files, chat_history: messages, terminal_logs: terminalLogs, updated_at: new Date() })
      .eq('id', workspaceId);
    
    if (error) {
      console.error('Error saving workspace:', error);
    } else {
      console.log('Workspace saved successfully:', data);
    }
    
    setTimeout(() => setIsSaving(false), 500);
  };

  // Auto-save debounced
  useEffect(() => {
    const timer = setTimeout(() => {
      if (workspaceId) saveWorkspace();
    }, 2000);
    
    return () => {
      clearTimeout(timer);
    };
  }, [files, messages, terminalLogs, workspaceId]);

  // Save on unmount to ensure no data is lost
  useEffect(() => {
    return () => {
      if (workspaceId) {
        supabase.from('workspaces').update({ 
          files, 
          chat_history: messages, 
          terminal_logs: terminalLogs, 
          updated_at: new Date() 
        }).eq('id', workspaceId).then();
      }
    };
  }, [workspaceId, files, messages, terminalLogs]);

  const handleBackNavigation = async () => {
    setIsSaving(true);
    if (workspaceId) {
      await supabase.from('workspaces').update({ 
        files, 
        chat_history: messages, 
        terminal_logs: terminalLogs, 
        updated_at: new Date() 
      }).eq('id', workspaceId);
    }
    navigate('/dashboard');
  };

  const deleteFile = (fileId) => {
    if (window.confirm('Delete this file?')) {
      setFiles(prev => prev.filter(f => f.id !== fileId));
    }
  };

  const deleteFolder = (folderPath) => {
    if (window.confirm(`Delete folder "${folderPath}" and all its contents?`)) {
      setFiles(prev => prev.filter(f => !f.name.startsWith(folderPath + '/') && f.name !== folderPath));
    }
  };

  const renderFileTree = (nodes, level = 0) => {
    return nodes.map(node => {
      if (node.type === 'folder') {
        const isExpanded = expandedFolders.includes(node.path);
        return (
          <div key={node.path} className="flex flex-col">
            <div 
              className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-400 hover:text-gray-200 hover:bg-white/5 rounded cursor-pointer transition group"
              style={{ paddingLeft: `${level * 12 + 8}px` }}
            >
              <div onClick={() => toggleFolder(node.path)} className="flex items-center gap-1.5 flex-1 min-w-0">
                {isExpanded ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
                <Folder className={`w-3.5 h-3.5 shrink-0 ${isExpanded ? 'text-primary/70' : 'text-gray-500'}`} />
                <span className="truncate font-medium">{node.name}</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); deleteFolder(node.path); }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            {isExpanded && renderFileTree(node.children, level + 1)}
          </div>
        );
      } else {
        return (
          <div 
            key={node.id} 
            className={`flex items-center gap-2 px-2 py-1 text-xs rounded cursor-pointer transition group ${node.id === activeFileId ? 'bg-primary/10 text-primary font-bold' : 'text-gray-500 hover:bg-surface hover:text-gray-300'}`}
            style={{ paddingLeft: `${level * 12 + 24}px` }}
          >
            <div onClick={() => setActiveFileId(node.id)} className="flex items-center gap-2 flex-1 min-w-0">
              <FileCode2 className={`w-3.5 h-3.5 shrink-0 ${node.id === activeFileId ? 'text-primary' : 'text-gray-500'}`} />
              <span className="truncate">{node.displayName}</span>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); deleteFile(node.id); }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        );
      }
    });
  };

  const handleEditorChange = (value) => {
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content: value } : f));
  };

  const handleZipExport = async () => {
    if (userPlan === 'free') {
      alert('Exporting ZIPs requires a Pro plan or higher.');
      navigate('/subscription');
      return;
    }
    setIsExporting(true);
    try {
      await exportProjectAsZip(files, 'onowl-export');
    } catch (e) {
      console.error(e);
    }
    setIsExporting(false);
  };

  const handleDownloadFile = (fileName, content) => {
    if (userPlan === 'free') {
      alert('Downloading files requires a Pro plan or higher.');
      navigate('/subscription');
      return;
    }
    downloadSingleFile(fileName, content);
  };

  // Scroll terminal to bottom automatically
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs]);

  // Listen for Sandbox console logs
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'sandbox-log') {
        setTerminalLogs(prev => [...prev, { type: 'log', text: `[Sandbox Log]: ${event.data.args.join(' ')}` }]);
      } else if (event.data?.type === 'sandbox-err') {
        setTerminalLogs(prev => [...prev, { type: 'error', text: `[Sandbox Error]: ${event.data.msg} (Line ${event.data.line})` }]);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const updateFilesInWorkspace = (extractedBlocks) => {
    setFiles(prevFiles => {
      let newFiles = [...prevFiles];
      extractedBlocks.forEach(block => {
        const lang = block.lang.toLowerCase();
        if (lang === 'html') {
          newFiles = newFiles.map(f => f.name === 'index.html' ? { ...f, content: block.code } : f);
        } else if (lang === 'css') {
          newFiles = newFiles.map(f => f.name === 'style.css' ? { ...f, content: block.code } : f);
        } else if (lang === 'javascript' || lang === 'js') {
          newFiles = newFiles.map(f => f.name === 'script.js' ? { ...f, content: block.code } : f);
        }
      });
      return newFiles;
    });
  };

  const streamAIResponse = async (chatHistory) => {
    setTerminalLogs(prev => [...prev, { type: 'sys', text: '➜  AI Engine started compiling code...' }]);
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

      // Clear image after sending
      setSelectedModelImage(null);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let fullContent = '';
      let buffer = ''; // Buffer for fragmented lines
      let hasStartedMessage = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          buffer += decoder.decode(value, { stream: true });

          let lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep the last incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.replace('data: ', '').trim();
              if (dataStr === '[DONE]') {
                done = true;
                break;
              }
              try {
                const parsed = JSON.parse(dataStr);
                
                // Handle Terminal Logs specifically
                if (parsed.terminal) {
                  setTerminalLogs(prev => [...prev, { type: 'log', text: parsed.terminal }]);
                  continue; // Correctly continue to next line instead of exiting function
                }

                if (parsed.content) {
                  if (!hasStartedMessage) {
                    setMessages(prev => [...prev, { role: 'ai', text: '' }]);
                    hasStartedMessage = true;
                  }
                  fullContent += parsed.content;

                  // Live Extraction for UI - Enhanced AI Agent Mode
                  const parts = fullContent.split('```');
                  let chatSummary = '';
                  let currentCodeStream = '';
                  let activeActionFile = '';

                  parts.forEach((part, i) => {
                    if (i % 2 === 0) {
                      // Look for file markers anywhere in the text segments
                      const fileMatch = [...part.matchAll(/###\s*FILE:\s*([^\s\n]+)/gi)].pop();
                      if (fileMatch) activeActionFile = fileMatch[1].trim();

                      chatSummary += part.replace(/###\s*FILE:\s*[^\s\n]+/gi, '').trim();
                    } else {
                      currentCodeStream = part;
                    }
                  });

                  // 1. Update Chat (Logic only)
                  setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1].text = chatSummary || 'Processing workspace...';
                    return updated;
                  });


                  // 2. Update Editor & Terminal
                  if (currentCodeStream) {
                    const targetFile = activeActionFile || 'autonomous_build.js';
                    
                    setTerminalLogs(prev => {
                       const cleanPrev = prev.filter(l => l.type !== 'stream');
                       return [...cleanPrev, { type: 'stream', text: `➜  [BUILD] Writing to ${targetFile}...` }];
                    });

                    setFiles(prevFiles => {
                      const existingIndex = prevFiles.findIndex(f => f.name === targetFile);
                      if (existingIndex >= 0) {
                        const updated = [...prevFiles];
                        updated[existingIndex].content = currentCodeStream;
                        return updated;
                      } else {
                        // Auto-expand folders for the new file
                        const pathParts = targetFile.split('/');
                        if (pathParts.length > 1) {
                            let pathAccumulator = '';
                            const newFolders = [];
                            for (let i = 0; i < pathParts.length - 1; i++) {
                                pathAccumulator += (pathAccumulator ? '/' : '') + pathParts[i];
                                newFolders.push(pathAccumulator);
                            }
                            setExpandedFolders(prev => Array.from(new Set([...prev, ...newFolders])));
                        }

                        const newId = Date.now().toString();
                        const newFile = {
                          id: newId,
                          name: targetFile,
                          language: targetFile.split('.').pop() === 'js' ? 'javascript' : targetFile.split('.').pop() === 'jsx' ? 'javascript' : targetFile.split('.').pop(),
                          content: currentCodeStream
                        };
                        return [...prevFiles, newFile];
                      }
                    });
                    
                    // Auto-switch to the file being built if needed
                    const targetId = files.find(f => f.name === targetFile)?.id;
                    if (targetId && targetId !== activeFileId) {
                       setActiveFileId(targetId);
                    }
                  }
                }
              } catch (err) {
                console.error("Parse error:", err);
              }
            }
          }
        }
      }

      // Stream completed. Extract the final code blocks and update the workspace files!
      
      // 1. Process ### UPDATE: blocks (Surgical Edits)
      const updateRegex = /### UPDATE:\s*(.+?)\s*\n<<<<\n([\s\S]*?)====\n([\s\S]*?)>>>>/g;
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
                  // Basic string replacement
                  if (updatedFiles[fileIndex].content.includes(oldCode)) {
                      updatedFiles[fileIndex].content = updatedFiles[fileIndex].content.replace(oldCode, newCode);
                      updatesApplied++;
                      setActiveFileId(updatedFiles[fileIndex].id); // Switch to updated file
                  } else {
                      console.warn(`Could not find old code in ${fileName} to replace.`);
                  }
              }
          }
          return updatedFiles;
      });

      // 2. Process ### FILE: blocks (Whole file overwrite/create)
      const fileRegex = /### FILE:\s*(.+?)\s*\n\s*```[a-zA-Z]*\n([\s\S]*?)```/g;
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
                          // Auto-expand folders for the new file
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
              setActiveFileId(newFilesFound[newFilesFound.length - 1].id); // Switch to last created file
          }
          
          let logMsg = '';
          if (newFilesFound.length > 0) logMsg += `✓ Created/Overwrote ${newFilesFound.length} files. `;
          if (updatesApplied > 0) logMsg += `✓ Applied ${updatesApplied} surgical updates.`;
          
          setTerminalLogs(prev => [...prev.filter(l => l.type !== 'stream'), { type: 'success', text: logMsg.trim() }]);
      } else {
          // Fallback to old regex if AI didn't use ### FILE format
          const regex = /```(\w+)?\n([\s\S]*?)```/g;
          let extractedBlocks = [];
          let fallbackMatch;
          while ((fallbackMatch = regex.exec(fullContent)) !== null) {
            extractedBlocks.push({ lang: fallbackMatch[1] || 'text', code: fallbackMatch[2].trim() });
          }

          if (extractedBlocks.length > 0) {
            updateFilesInWorkspace(extractedBlocks);
            setTerminalLogs(prev => [...prev.filter(l => l.type !== 'stream'), { type: 'success', text: `✓ Extracted ${extractedBlocks.length} code blocks and updated workspace.` }]);
          } else {
            setTerminalLogs(prev => [...prev.filter(l => l.type !== 'stream'), { type: 'info', text: `ℹ Stream completed. No code blocks detected.` }]);
          }
      }

    } catch (err) {
      setMessages(prev => {
         const updated = [...prev];
         updated[updated.length - 1].text = `Error: ${err.message}`;
         return updated;
      });
    }
  };

  useEffect(() => {
    if (initialPrompt && !hasFetchedInitial.current) {
      hasFetchedInitial.current = true;
      streamAIResponse(messages);
    }
  }, [initialPrompt]);

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const newMessages = [...messages, { role: 'user', text: chatInput }];
    setMessages(newMessages);
    setChatInput('');

    await streamAIResponse(newMessages);
  };

  // Construct iframe srcDoc based on files with Sandbox Interceptors
  const getPreviewHtml = () => {
    const html = files.find(f => f.name.endsWith('.html'))?.content || '';
    const css = files.find(f => f.name.endsWith('.css'))?.content || '';
    const js = files.find(f => f.name.endsWith('.js'))?.content || '';

    const sandboxScript = `
      <script src="https://cdn.tailwindcss.com"></script>
      <script>
        tailwind.config = {
          theme: {
            extend: {
              colors: {
                primary: '#6366f1',
                surface: '#18181b',
                border: '#27272a',
              }
            }
          }
        }
      </script>
      <script>
        window.onerror = function(msg, url, line) {
          window.parent.postMessage({ type: 'sandbox-err', msg: msg, line: line }, '*');
          return false;
        };
        const originalLog = console.log;
        console.log = function(...args) {
          window.parent.postMessage({ type: 'sandbox-log', args: args.map(a => String(a)) }, '*');
          originalLog.apply(console, args);
        };
      </script>
    `;

    let finalHtml = html;

    // Inject Sandbox Scripts and CSS
    if (finalHtml.includes('<head>')) {
      finalHtml = finalHtml.replace('<head>', `<head>${sandboxScript}<style type="text/tailwindcss">${css}</style>`);
    } else {
      finalHtml = `${sandboxScript}<style type="text/tailwindcss">${css}</style>${finalHtml}`;
    }
    // Inject JS
    if (finalHtml.includes('</body>')) {
      finalHtml = finalHtml.replace('</body>', `<script>${js}</script></body>`);
    } else {
      finalHtml += `<script>${js}</script>`;
    }

    return finalHtml;
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-background overflow-hidden">
      {/* Top Navbar */}
      <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-surface shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={handleBackNavigation} className="text-gray-400 hover:text-white transition p-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
            <span className="font-semibold tracking-wide text-sm">Onowl Workspace</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 mr-2 px-3 py-1 bg-background rounded-full border border-border">
            <div className={`w-2 h-2 rounded-full ${workspaceId ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
              {isSaving ? 'Syncing...' : 'Cloud Saved'}
            </span>
          </div>
          
          <button 
            onClick={saveWorkspace}
            disabled={isSaving || !workspaceId}
            className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition px-3 py-1.5 rounded-md hover:bg-white/5 disabled:opacity-50"
          >
            <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
            Save Project
          </button>
          
          <div className="h-6 w-px bg-border mx-1 hidden sm:block" />
          <button onClick={() => handleDownloadFile(activeFile.name, activeFile.content)} className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition px-3 py-1.5 rounded-md hover:bg-white/5">
            <Download className="w-4 h-4" /> File
          </button>
          <button 
            onClick={handleZipExport}
            disabled={isExporting}
            className="flex items-center gap-2 text-sm bg-primary hover:bg-primary/90 text-white px-4 py-1.5 rounded-md transition shadow-[0_0_10px_rgba(99,102,241,0.2)] disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderArchive className="w-4 h-4" />}
            Export ZIP
          </button>
          <div className="h-6 w-px bg-border mx-1 hidden sm:block" />
          <ProfileBar />
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        
        {/* Left: AI Chat Panel */}
        <aside className={`${activeTab === 'chat' ? 'flex' : 'hidden'} md:flex w-full md:w-80 border-b md:border-b-0 md:border-r border-border bg-surface/50 flex-col shrink-0 h-full`}>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isLoading && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-primary font-black uppercase tracking-widest animate-pulse">
                    Onowl Engine Processing
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {loadingProgress}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-border/50">
                  <div
                    className="h-full bg-gradient-to-r from-primary via-indigo-500 to-primary shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-500 ease-out"
                    style={{ width: `${loadingProgress}%` }}
                  />
                </div>
              </div>
            )}
            {messages.map((m, i) => {

              let avatar = '🤖';
              if (selectedModel.includes('kimi')) avatar = '👷';
              else if (selectedModel.includes('deepseek')) avatar = '💻';
              else if (selectedModel.includes('glm')) avatar = '🧠';
              else if (selectedModel.includes('nemotron')) avatar = '🤖';
              else if (selectedModel.includes('minimax')) avatar = '🔮';
              else if (selectedModel.includes('qwen')) avatar = '🐉';
              else if (selectedModel.includes('llama')) avatar = '🦙';
              if (m.role === 'user') avatar = '👤';

              return (
                <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`text-xs mb-1 text-gray-500 px-1 flex items-center gap-1`}>
                    {m.role === 'user' ? 'You' : 'Onowl AI'} {avatar}
                  </div>
                  <div className={`p-3 rounded-lg text-sm leading-relaxed max-w-[90%] ${m.role === 'user' ? 'bg-primary/20 border border-primary/30 text-white' : 'bg-background border border-border text-gray-300'}`}>
                    {m.text}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="p-4 border-t border-border bg-surface">
            {/* Segmented Model Tab Bar */}
            <div className="bg-background/50 p-1 rounded-lg border border-border flex shrink-0 gap-1 mb-3">
              {[
                { id: 'moonshotai/kimi-k2.6', label: 'Kimi', icon: '👷' },
                { id: 'deepseek-ai/deepseek-v4-pro', label: 'Coder', icon: '💻' },
                { id: 'z-ai/glm-5.1', label: 'GLM', icon: '🧠' },
                { id: 'nvidia/nemotron-3-ultra-550b-a55b', label: 'Nemotron', icon: '🤖' },
                { id: 'minimaxai/minimax-m2.7', label: 'MiniMax', icon: '🔮' },
                { id: 'qwen/qwen3.5-122b-a10b', label: 'Qwen', icon: '🐉' },
                { id: 'meta/llama3-70b-instruct', label: 'Llama', icon: '🦙' }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedModel(m.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-[9px] font-black uppercase tracking-tighter transition-all ${
                    selectedModel === m.id
                    ? 'bg-surface text-primary shadow-sm border border-border/50'
                    : 'text-gray-500 hover:bg-white/5 hover:text-gray-400'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <form onSubmit={handleChatSubmit}>
            {selectedImage && (
              <div className="mb-2 relative inline-block">
                <img src={selectedImage} alt="preview" className="h-16 w-16 object-cover rounded-md border border-primary/30" />
                <button 
                  type="button" 
                  onClick={() => setSelectedModelImage(null)}
                  className="absolute -top-2 -right-2 bg-red-500 rounded-full p-0.5 shadow-md hover:bg-red-600"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            )}
            <div className="relative flex items-center gap-2">
              <label className="cursor-pointer p-2 hover:bg-white/5 rounded-md transition text-gray-400 hover:text-primary">
                <Image className="w-5 h-5" />
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setSelectedModelImage(reader.result);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
              <div className="relative flex-1">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask AI to build..." 
                  className="w-full bg-background border border-border rounded-lg pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-white"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80 p-1">
                  <Zap className="w-4 h-4" />
                </button>
              </div>
            </div>
            </form>
            </div>
        </aside>

        {/* Center-Left: File Tree */}
        <div className={`${activeTab === 'files' ? 'flex' : 'hidden'} md:flex w-full md:w-48 border-b md:border-b-0 md:border-r border-border bg-background flex-col shrink-0 h-full`}>
            <div className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider flex justify-between items-center">
            Explorer
            <Plus
              onClick={() => {
                const path = window.prompt('Enter path for new file or folder (folders end with /):');
                if (path) {
                  if (path.endsWith('/')) {
                    // Create folder placeholder
                    const folderPath = path.slice(0, -1);
                    setExpandedFolders(prev => [...new Set([...prev, folderPath])]);
                  } else {
                    const name = path;
                    const newId = Date.now().toString();
                    setFiles(prev => [...prev, {
                      id: newId,
                      name: name,
                      language: name.split('.').pop() === 'js' ? 'javascript' : name.split('.').pop() === 'jsx' ? 'javascript' : name.split('.').pop(),
                      content: ''
                    }]);
                    setActiveFileId(newId);
                  }
                }
              }}
              className="w-3 h-3 cursor-pointer hover:text-white"
            />
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-2 select-none">
            {renderFileTree(buildFileTree(files))}
            </div>
            </div>

            {/* Center: Editor */}
            <main className={`${activeTab === 'editor' ? 'flex' : 'hidden'} md:flex flex-1 flex-col min-w-0 bg-[#09090b] h-full shrink-0`}>
          <div className="flex items-center justify-between px-4 h-10 bg-surface border-b border-border text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <FileCode2 className="w-4 h-4" /> {activeFile?.name}
            </div>
            <button 
              onClick={() => handleDownloadFile(activeFile.name, activeFile.content)}
              className="flex items-center gap-1.5 px-2 py-1 hover:bg-white/5 rounded transition text-gray-500 hover:text-primary border border-transparent hover:border-primary/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-tight">Download</span>
            </button>
          </div>
          <div className="flex-1 relative">
            <Editor
              height="100%"
              language={activeFile?.language || 'javascript'}
              theme="vs-dark"
              value={activeFile?.content || ''}
              onChange={handleEditorChange}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: 'JetBrains Mono',
                padding: { top: 16 },
                lineHeight: 1.5,
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on'
              }}
            />
          </div>
        </main>

        {/* Right: Live Preview & Terminal */}
        <aside className={`${activeTab === 'preview' ? 'flex' : 'hidden'} md:flex w-full md:w-[400px] border-t md:border-t-0 md:border-l border-border bg-surface flex-col shrink-0 h-full`}>
          <div className="flex items-center justify-between px-4 h-10 border-b border-border bg-background">
            <div className="flex items-center gap-2 text-sm text-gray-400 font-medium">
              <Play className="w-4 h-4 text-green-400" /> Live Sandbox
            </div>
            <div className="text-xs text-gray-600 font-mono bg-surface px-2 py-1 rounded">onowl-vibe-coder-production.up.railway.app</div>
          </div>
          <div className="flex-1 bg-white relative">
            <iframe 
              title="preview"
              srcDoc={getPreviewHtml()}
              className="w-full h-full border-none"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
          
          {/* Enhanced Terminal Pane */}
          <div className="flex-1 md:h-64 border-t border-border bg-background flex flex-col min-h-0">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border gap-2 text-xs font-medium text-gray-500 uppercase">
              <div className="flex items-center gap-2">
                <TerminalSquare className="w-3 h-3" /> Terminal Output
              </div>
              <button 
                onClick={() => {
                  const newWindow = window.open('', '_blank');
                  if (newWindow) {
                    newWindow.document.write(getPreviewHtml());
                    newWindow.document.close();
                  }
                }}
                className="text-gray-400 hover:text-white flex items-center gap-1 bg-surface hover:bg-border px-2 py-1 rounded transition-colors normal-case"
                title="Open preview in a new browser tab"
              >
                <ExternalLinkIcon className="w-3 h-3" /> View in Browser
              </button>
            </div>
            <div className="flex-1 p-3 font-mono text-[10px] md:text-xs overflow-y-auto whitespace-pre-wrap">
              {terminalLogs.map((log, index) => {
                let colorClass = 'text-gray-400';
                if (log.type === 'log') colorClass = 'text-blue-300';
                if (log.type === 'error') colorClass = 'text-red-400';
                if (log.type === 'success') colorClass = 'text-green-400';
                if (log.type === 'stream') colorClass = 'text-purple-300';
                if (log.type === 'info') colorClass = 'text-blue-400';

                return (
                  <div key={index} className={`${colorClass} mb-1`}>
                    {log.text}
                  </div>
                );
              })}
              <div ref={terminalEndRef} />
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile Tab Bar */}
      <div className="md:hidden h-16 border-t border-border bg-surface flex items-center justify-around px-2 shrink-0">
        <button 
          onClick={() => setActiveTab("chat")}
          className={`flex flex-col items-center gap-1 p-2 rounded-md ${activeTab === "chat" ? "text-primary bg-primary/10" : "text-gray-500"}`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px] font-medium">Chat</span>
        </button>
        <button 
          onClick={() => setActiveTab("files")}
          className={`flex flex-col items-center gap-1 p-2 rounded-md ${activeTab === "files" ? "text-primary bg-primary/10" : "text-gray-500"}`}
        >
          <Plus className="w-5 h-5" />
          <span className="text-[10px] font-medium">Files</span>
        </button>
        <button 
          onClick={() => setActiveTab("editor")}
          className={`flex flex-col items-center gap-1 p-2 rounded-md ${activeTab === "editor" ? "text-primary bg-primary/10" : "text-gray-500"}`}
        >
          <FileCode2 className="w-5 h-5" />
          <span className="text-[10px] font-medium">Editor</span>
        </button>
        <button 
          onClick={() => setActiveTab("preview")}
          className={`flex flex-col items-center gap-1 p-2 rounded-md ${activeTab === "preview" ? "text-primary bg-primary/10" : "text-gray-500"}`}
        >
          <Play className="w-5 h-5" />
          <span className="text-[10px] font-medium">Terminal</span>
        </button>
      </div>
    </div>
  );
};

export default IDE;