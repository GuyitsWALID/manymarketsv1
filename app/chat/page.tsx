'use client';

import { useChat, type UIMessage } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, Send, Loader2, Bot, User, Rocket } from 'lucide-react';
import Link from 'next/link';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatSidebar from '@/components/chat/ChatSidebar';
import NewSessionModal from '@/components/chat/NewSessionModal';
import SkillsAssessmentModal, { type SkillsData } from '@/components/chat/SkillsAssessmentModal';
import ProductSuggestionPanel, { type ProductSuggestion } from '@/components/chat/ProductSuggestionPanel';

interface Session {
  id: string;
  title: string;
  phase: string;
  created_at: string;
  last_message_at: string;
}

export default function ChatPage() {
  const [input, setInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [isDesktop, setIsDesktop] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
  
  // Database session state
  const [dbSessionId, setDbSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false); // Prevent duplicate responses when loading history
  
  // Research completion state
  const [isResearchComplete, setIsResearchComplete] = useState(false);
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
  const [isProductPanelOpen, setIsProductPanelOpen] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [productSuggestions, setProductSuggestions] = useState<ProductSuggestion[]>([]);
  const [researchSummary, setResearchSummary] = useState({ niche: '', uvz: '', targetAudience: '' });
  
  // Chat session
  const [chatSessionId, setChatSessionId] = useState(() => `uvz-chat-${Date.now()}`);
  // Create new transport when chatSessionId changes to fully reset chat state
  const transport = useMemo(() => new DefaultChatTransport({ api: '/api/chat' }), [chatSessionId]);
  const { messages, sendMessage, status, setMessages } = useChat({
    id: chatSessionId,
    transport,
  });

  // User & auth state
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  // Handle responsive
  useEffect(() => {
    function handleResize() {
      setIsDesktop(window.innerWidth >= 768);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Load user and sessions
  useEffect(() => {
    async function loadUserAndSessions() {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user ?? null;
        setCurrentUser(user);

        if (user) {
          // Load user's sessions
          const response = await fetch('/api/sessions');
          if (response.ok) {
            const { sessions: userSessions } = await response.json();
            setSessions(userSessions || []);
          }
        }
      } catch {
        setCurrentUser(null);
      }
    }
    loadUserAndSessions();
  }, [supabase.auth]);

  // Auto-scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  // Create a new database session when user sends first message
  const createDbSession = useCallback(async (firstMessage: string) => {
    if (!currentUser || dbSessionId || isCreatingSession) return null;
    
    setIsCreatingSession(true);
    try {
      const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '');
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });

      if (response.ok) {
        const { session } = await response.json();
        setDbSessionId(session.id);
        setSessions(prev => [session, ...prev]);
        return session.id;
      }
    } catch (error) {
      console.error('Error creating session:', error);
    } finally {
      setIsCreatingSession(false);
    }
    return null;
  }, [currentUser, dbSessionId, isCreatingSession]);

  // Save message to database
  const saveMessageToDb = useCallback(async (sessionId: string, role: string, content: string, toolCalls?: any, toolResults?: any) => {
    if (!sessionId || !currentUser) return;
    
    try {
      await fetch(`/api/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, content, tool_calls: toolCalls, tool_results: toolResults }),
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  }, [currentUser]);

  // Detect phase from tool calls and update session
  const detectAndUpdatePhase = useCallback(async (sessionId: string, toolCalls: any[]) => {
    if (!sessionId || !toolCalls?.length) return;

    // Map tools to phases
    // Map tools to database phases (matching DB constraints)
    const toolPhaseMap: Record<string, string> = {
      'identify_industry_niches': 'niche_drilling',
      'drill_uvz': 'uvz_identification',
      'research_uvz_topic': 'uvz_identification',
      'validate_uvz_demand': 'validation',
      'competitive_analysis': 'validation',
      'generate_product_ideas': 'product_ideation',
      'generate_ebook_outline': 'product_ideation',
      'generate_marketing_copy': 'product_ideation',
    };

    // Find the highest phase from the tool calls (order matches DB enum)
    const phaseOrder = ['discovery', 'niche_drilling', 'uvz_identification', 'validation', 'product_ideation', 'completed'];
    let highestPhase = 'discovery';

    for (const toolCall of toolCalls) {
      const toolName = toolCall.toolName || toolCall.name;
      const detectedPhase = toolPhaseMap[toolName];
      if (detectedPhase) {
        const currentIdx = phaseOrder.indexOf(highestPhase);
        const newIdx = phaseOrder.indexOf(detectedPhase);
        if (newIdx > currentIdx) {
          highestPhase = detectedPhase;
        }
      }
    }

    // Update session phase in database
    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: highestPhase }),
      });

      // Update local sessions state
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, phase: highestPhase } : s
      ));
    } catch (error) {
      console.error('Error updating phase:', error);
    }
  }, []);

  // Handle sending message with database integration
  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    let sessionId = dbSessionId;

    // Create session on first message
    if (!sessionId && currentUser) {
      sessionId = await createDbSession(text);
    }

    // Send message via AI SDK
    sendMessage({ text });

    // Save user message to database
    if (sessionId) {
      await saveMessageToDb(sessionId, 'user', text);
    }
  }, [dbSessionId, currentUser, createDbSession, sendMessage, saveMessageToDb]);

  // Save assistant response when streaming completes
  useEffect(() => {
    if (status === 'ready' && messages.length > 0 && dbSessionId) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        const textContent = lastMessage.parts
          .filter((part: any) => part.type === 'text')
          .map((part: any) => part.text)
          .join('');
        
        const toolCalls = lastMessage.parts.filter((part: any) => part.type === 'tool-call');
        const toolResults = lastMessage.parts.filter((part: any) => part.type === 'tool-result');

        if (textContent) {
          saveMessageToDb(
            dbSessionId,
            'assistant',
            textContent,
            toolCalls.length > 0 ? toolCalls : undefined,
            toolResults.length > 0 ? toolResults : undefined
          );
          
          // Check for research completion signals in the response
          const completionSignals = [
            'research is complete',
            'research phase is complete',
            'completed the research',
            'finished our research',
            'research is done',
            'ready to build',
            'ready to create your product',
            'move on to building',
            'start building your product',
            'validated and ready',
            'validation complete',
            'research journey is complete',
          ];
          
          const lowerContent = textContent.toLowerCase();
          const isComplete = completionSignals.some(signal => lowerContent.includes(signal));
          
          if (isComplete && !isResearchComplete) {
            setIsResearchComplete(true);
          }
        }

        // Detect and update phase based on tool usage
        if (toolCalls.length > 0) {
          detectAndUpdatePhase(dbSessionId, toolCalls);
          
          // Check if we've reached product_ideation or completed phase
          const productTools = ['generate_product_ideas', 'generate_ebook_outline'];
          const hasProductTool = toolCalls.some((tc: any) => 
            productTools.includes(tc.toolName || tc.name)
          );
          if (hasProductTool && !isResearchComplete) {
            setIsResearchComplete(true);
          }
        }
      }
    }
  }, [status, messages, dbSessionId, saveMessageToDb, detectAndUpdatePhase, isResearchComplete]);

  // Handle skills assessment submission
  const handleSkillsSubmit = useCallback(async (skillsData: SkillsData) => {
    if (!dbSessionId) {
      console.error('No session ID available');
      alert('No active session. Please start a new research session.');
      return;
    }
    
    setIsLoadingSuggestions(true);
    setIsSkillsModalOpen(false);
    setIsProductPanelOpen(true);
    
    try {
      const response = await fetch('/api/research/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: dbSessionId,
          skills: skillsData,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setProductSuggestions(data.suggestions || []);
        setResearchSummary(data.researchSummary || { niche: '', uvz: '', targetAudience: '' });
      } else {
        console.error('Failed to get suggestions:', data.error || 'Unknown error');
        alert(`Failed to get product suggestions: ${data.error || 'Please try again.'}`);
        setIsProductPanelOpen(false);
      }
    } catch (error) {
      console.error('Error getting suggestions:', error);
      alert('Network error while getting suggestions. Please check your connection and try again.');
      setIsProductPanelOpen(false);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [dbSessionId]);

  // Open new session modal
  const createNewChat = useCallback(() => {
    setIsNewSessionModalOpen(true);
  }, []);

  // Handle creating a new session from modal
  const handleCreateNewSession = useCallback(async (data: { title: string; industry: string; goal: string }) => {
    if (!currentUser) {
      console.error('No user logged in');
      alert('Please log in to create a session');
      return;
    }
    
    setIsCreatingSession(true);
    try {
      console.log('Creating session with data:', data);
      console.log('Current user:', currentUser.id);
      
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title || `${data.industry} Research`,
          industry: data.industry,
        }),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('Failed to create session:', responseData);
        console.error('Status:', response.status);
        alert(`Failed to create session: ${responseData.details || responseData.error || 'Unknown error'}`);
        return;
      }

      const { session } = responseData;
      console.log('Session created:', session);
      
      // Reset chat state
      const newChatId = `uvz-chat-${Date.now()}`;
      setChatSessionId(newChatId);
      setDbSessionId(session.id);
      setMessages([]);
      setInput('');
      setSessions(prev => [session, ...prev]);
      setIsNewSessionModalOpen(false);
      
      // Build initial greeting with context
      const initialMessage = data.goal 
        ? `I'm interested in the ${data.industry} industry and my goal is to ${data.goal.toLowerCase()}. Can you help me discover my Unique Value Zone?`
        : `I want to explore opportunities in the ${data.industry} industry. Help me find my Unique Value Zone.`;
      
      // Small delay to ensure chat is ready, then send message
      setTimeout(async () => {
        console.log('Sending initial message:', initialMessage);
        sendMessage({ text: initialMessage });
        
        // Save user message to database
        try {
          await saveMessageToDb(session.id, 'user', initialMessage);
          console.log('Message saved to database');
        } catch (err) {
          console.error('Error saving message to db:', err);
        }
      }, 200);
      
    } catch (error) {
      console.error('Error creating session:', error);
    } finally {
      setIsCreatingSession(false);
    }
  }, [currentUser, setMessages, sendMessage, saveMessageToDb]);

  // Load existing session
  const loadSession = useCallback(async (sessionId: string) => {
    // Don't reload if already on this session
    if (dbSessionId === sessionId) return;
    
    setIsLoadingSession(true);
    try {
      // Fetch messages for session
      const response = await fetch(`/api/sessions/${sessionId}/messages`);
      if (response.ok) {
        const { messages: dbMessages } = await response.json();
        
        // Convert DB messages to UI format
        const uiMessages: UIMessage[] = dbMessages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          parts: [{ type: 'text', text: msg.content }],
          createdAt: new Date(msg.created_at),
        }));

        // Clear messages first
        setMessages([]);
        
        // Set DB session ID
        setDbSessionId(sessionId);
        
        // Set new chat ID - this creates a fresh transport and chat state
        const newChatId = `session-${sessionId}-${Date.now()}`;
        setChatSessionId(newChatId);
        
        // Set the loaded messages after a brief delay to let the new chat state initialize
        setTimeout(() => {
          setMessages(uiMessages);
          setIsLoadingSession(false);
        }, 150);
      } else {
        setIsLoadingSession(false);
      }
    } catch (error) {
      console.error('Error loading session:', error);
      setIsLoadingSession(false);
    }
  }, [setMessages, dbSessionId]);

  // Delete session
  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
      if (response.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        if (dbSessionId === sessionId) {
          createNewChat();
        }
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  }, [dbSessionId, createNewChat]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      await fetch('/api/auth/session', { method: 'DELETE' });
      setIsLogoutOpen(false);
      router.push('/login');
    } catch {
      setIsLogoutOpen(false);
      router.push('/login');
    }
  };

  // Calculate main content margin based on sidebar (only on desktop)
  const getMainMargin = () => {
    if (!isDesktop) return 0; // Mobile: no margin, sidebar is overlay
    if (!isSidebarOpen) return 0;
    return 288; // w-72 = 18rem = 288px
  };

  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      {/* Header */}
      <ChatHeader
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        createNewChat={createNewChat}
        currentUser={currentUser}
        profileMenuOpen={profileMenuOpen}
        setProfileMenuOpen={setProfileMenuOpen}
        setIsLogoutOpen={setIsLogoutOpen}
      />

      {/* Sidebar */}
      <ChatSidebar
        isOpen={isSidebarOpen}
        isMobile={!isDesktop}
        onClose={() => setIsSidebarOpen(false)}
        createNewChat={createNewChat}
        isLogoutOpen={isLogoutOpen}
        setIsLogoutOpen={setIsLogoutOpen}
        handleLogout={handleLogout}
        sessions={sessions}
        currentSessionId={dbSessionId}
        onSelectSession={loadSession}
        onDeleteSession={deleteSession}
      />

      {/* Main Chat Area - stretches full width and adjusts based on sidebar */}
      <main
        style={{ marginLeft: getMainMargin() }}
        className="h-screen pt-16 flex flex-col transition-all duration-300 ease-in-out"
      >
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6">
            {/* Empty state */}
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <div className="w-20 h-20 bg-yellow-300 border-4 border-black mx-auto mb-6 flex items-center justify-center shadow-brutal">
                  <Sparkles className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black mb-4">Find Your Unique Value Zone</h2>
                <p className="text-lg font-medium text-gray-600 mb-8 max-w-xl mx-auto">
                  I'll guide you through finding a profitable niche that matches your skills and market demand.
                </p>
                
                {/* Start New Session Button */}
                <button
                  onClick={() => setIsNewSessionModalOpen(true)}
                  className="bg-uvz-orange text-white border-2 border-black px-8 py-4 font-black text-lg shadow-brutal hover:-translate-y-1 hover:shadow-brutal-lg transition-all rounded mb-8"
                >
                  🚀 Start New Research Session
                </button>
                
                <p className="text-sm text-gray-500 mb-4">Or try a quick prompt:</p>
                <div className="flex flex-wrap justify-center gap-3">
                  {['Find niches in health tech', 'Discover AI tool opportunities', 'Explore digital product ideas'].map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(prompt)}
                      className="bg-white border-2 border-black px-4 py-3 font-bold text-left hover:-translate-y-1 hover:shadow-brutal transition-all rounded"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Messages */}
            <div className="space-y-6">
              {messages.map((message: UIMessage) => {
                const textContent = message.parts
                  .filter((part: any) => part.type === 'text')
                  .map((part: any) => part.text)
                  .join('');
                const toolParts = message.parts.filter((part: any) => part.type === 'tool-call' || part.type === 'tool-result');

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      {/* Avatar */}
                      <div className={`w-10 h-10 shrink-0 rounded-lg border-2 border-black hidden sm:flex items-center justify-center ${
                        message.role === 'user' ? 'bg-blue-400' : 'bg-yellow-300'
                      }`}>
                        {message.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                      </div>

                      {/* Message Bubble */}
                      <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-md'
                          : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md'
                      }`}>
                        {textContent && (
                          <p className="font-medium whitespace-pre-wrap break-words leading-relaxed">
                            {textContent}
                          </p>
                        )}

                        {/* Tool Results */}
                        {toolParts.map((part: any, idx: number) => (
                          <div key={idx} className="mt-3 p-3 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                            <p className="text-sm font-bold mb-2 text-yellow-800">
                              🔧 {part.toolName?.replace(/_/g, ' ') || 'Tool'}
                            </p>
                            {part.type === 'tool-result' && part.result && (
                              <pre className="text-xs overflow-x-auto font-mono bg-white p-2 border border-yellow-200 rounded">
                                {JSON.stringify(part.result, null, 2)}
                              </pre>
                            )}
                            {part.type === 'tool-call' && (
                              <div className="flex items-center gap-2 text-yellow-700">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm font-medium">Processing...</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Streaming indicator */}
              {status === 'streaming' && (
                <div className="flex justify-start">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 shrink-0 bg-yellow-300 rounded-lg border-2 border-black flex items-center justify-center">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="font-medium">Thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white">
          {/* Research Complete Banner */}
          {isResearchComplete && messages.length > 0 && (
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-3">
              <div className="max-w-4xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3 text-white">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold">Research Complete!</p>
                    <p className="text-sm text-white/80">Ready to build your product based on this research</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSkillsModalOpen(true)}
                  className="px-6 py-2 bg-white text-green-600 font-bold border-2 border-black rounded-xl shadow-brutal hover:-translate-y-0.5 transition-all flex items-center gap-2"
                >
                  <Rocket className="w-5 h-5" />
                  Build Product
                </button>
              </div>
            </div>
          )}
          
          <div className="max-w-4xl mx-auto px-4 py-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (input.trim()) {
                  handleSendMessage(input);
                  setInput('');
                }
              }}
              className="flex gap-3"
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (input.trim()) {
                      handleSendMessage(input);
                      setInput('');
                    }
                  }
                }}
                rows={1}
                placeholder={isResearchComplete ? "Ask follow-up questions or click 'Build Product' to continue..." : "Type your message... (Enter to send, Shift+Enter for newline)"}
                className="flex-1 px-4 py-3 border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-uvz-orange focus:border-uvz-orange font-medium resize-none"
                disabled={status === 'streaming'}
              />
              <button
                type="submit"
                disabled={status === 'streaming' || !input.trim()}
                className="px-6 py-3 bg-uvz-orange text-white border-2 border-black font-bold rounded-xl hover:-translate-y-0.5 hover:shadow-brutal transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* New Session Modal */}
      <NewSessionModal
        isOpen={isNewSessionModalOpen}
        onClose={() => setIsNewSessionModalOpen(false)}
        onCreateSession={handleCreateNewSession}
        isCreating={isCreatingSession}
      />
      
      {/* Skills Assessment Modal */}
      <SkillsAssessmentModal
        isOpen={isSkillsModalOpen}
        onClose={() => setIsSkillsModalOpen(false)}
        onSubmit={handleSkillsSubmit}
        isLoading={isLoadingSuggestions}
      />
      
      {/* Product Suggestion Panel */}
      <ProductSuggestionPanel
        isOpen={isProductPanelOpen}
        onClose={() => setIsProductPanelOpen(false)}
        suggestions={productSuggestions}
        researchSummary={researchSummary}
        sessionId={dbSessionId || ''}
        isLoading={isLoadingSuggestions}
      />
    </div>
  );
}
