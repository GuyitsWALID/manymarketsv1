'use client';

import { useChat, type UIMessage } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, Send, Loader2, Bot, User, Rocket, Download, FileText, ChevronDown, TrendingUp, Lightbulb, Target, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatSidebar from '@/components/chat/ChatSidebar';
import NewSessionModal from '@/components/chat/NewSessionModal';
import SkillsAssessmentModal, { type SkillsData } from '@/components/chat/SkillsAssessmentModal';
import ProductSuggestionPanel, { type ProductSuggestion } from '@/components/chat/ProductSuggestionPanel';
import { FREE_SESSION_LIMIT } from '@/lib/config';

interface Session {
  id: string;
  title: string;
  phase: string;
  created_at: string;
  last_message_at: string;
}

// Minimum number of exchanges (user + assistant pairs) required before "Build Product" can appear
// This ensures proper UVZ drilling happens before suggesting to build
const MIN_EXCHANGES_FOR_COMPLETION = 3; // 3 exchanges = 6 messages minimum

// Helper: strip common markdown formatting (bold/italic/code/blocks) to show clean plain text
function cleanMarkdown(input: string) {
  if (!input) return input;
  let s = input;
  // Remove fenced code blocks
  s = s.replace(/```[\s\S]*?```/g, '');
  // Remove inline code
  s = s.replace(/`([^`]*)`/g, '$1');
  // Unwrap bold/italic markers **text**, __text__, *text*, _text_
  s = s.replace(/\*\*([^*]+)\*\*/g, '$1');
  s = s.replace(/__([^_]+)__/g, '$1');
  s = s.replace(/\*([^*]+)\*/g, '$1');
  s = s.replace(/_([^_]+)_/g, '$1');
  // Collapse excessive newlines
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

export default function ChatPage() {
  const [input, setInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [isDesktop, setIsDesktop] = useState<boolean>(true); // Default to desktop, update after mount
  const [hasMounted, setHasMounted] = useState(false); // Track hydration complete
  
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

  // Download summary state
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const [isDownloadingSummary, setIsDownloadingSummary] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  // Source idea context when the session was started from a Daily Idea deep-link
  const [sourceIdeaId, setSourceIdeaId] = useState<string | null>(null);
  const [sourceProductIndex, setSourceProductIndex] = useState<number | null>(null);
  const [sourceIdeaResearch, setSourceIdeaResearch] = useState<string | null>(null);

  // Pre-loaded research context card (from Daily Ideas deep-link)
  const [researchContext, setResearchContext] = useState<{
    ideaName: string;
    oneLiner: string;
    industry: string;
    demandLevel: string;
    competitionLevel: string;
    trendingScore: string;
    marketSize: string | null;
    growthRate: string | null;
    painPoints: string[];
    validationSignals: string[];
    productIdeas: string[];
    selectedProduct: { name: string; type: string; description: string } | null;
    contextText: string; // full text to prepend when user sends first message
  } | null>(null);

  // Query params for deep-linking from Daily Ideas (read on client to avoid SSR prerender issues)
  const [searchParamsState, setSearchParamsState] = useState<URLSearchParams | null>(null);
  useEffect(() => {
    setSearchParamsState(new URLSearchParams(window.location.search));
  }, []);
  const ideaParam = searchParamsState?.get('idea') || null;
  const productIndexParam = searchParamsState?.get('productIndex') || null;
  const productParam = searchParamsState?.get('product') || null;
  const processedRef = useRef<{ idea?: string }>({});
  
  // Pro/Free tier state
  const [isPro, setIsPro] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Daily quick prompts
  const [dailyPrompts, setDailyPrompts] = useState<string[]>([]);
  const [dailyPromptsSource, setDailyPromptsSource] = useState<'ai' | 'fallback' | 'local'>('local');
  
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
  
  // Computed: check if user has reached session limit
  const sessionCount = sessions.length;
  const hasReachedLimit = !isPro && sessionCount >= FREE_SESSION_LIMIT;

  // Handle responsive - only run after hydration to prevent mismatch
  useEffect(() => {
    function handleResize() {
      setIsDesktop(window.innerWidth >= 768);
    }
    // Set initial value after mount (hydration complete)
    handleResize();
    setHasMounted(true);
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
          
          // Check if user is Pro
          try {
            const billingRes = await fetch('/api/billing');
            if (billingRes.ok) {
              const billingData = await billingRes.json();
              setIsPro(billingData.currentPlan === 'pro' || billingData.currentPlan === 'enterprise');
            }
          } catch {
            setIsPro(false);
          }
          
          // Check for guest session data to restore
          const hasGuestData = localStorage.getItem('manymarkets_has_guest_data');
          const guestSessions = localStorage.getItem('manymarkets_guest_sessions');
          
          if (hasGuestData === 'true' && guestSessions) {
            try {
              const sessions = JSON.parse(guestSessions);
              if (sessions.length > 0) {
                // Get the most recent guest session with messages
                const latestSession = sessions[sessions.length - 1];
                if (latestSession.messages && latestSession.messages.length > 0) {
                  // Create a new session in the database with the guest messages
                  const firstMessage = latestSession.messages.find((m: any) => m.role === 'user')?.content || 'Restored session';
                  const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '');
                  
                  const createRes = await fetch('/api/sessions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title }),
                  });
                  
                  if (createRes.ok) {
                    const { session: newSession } = await createRes.json();
                    
                    // Save all guest messages to the new session
                    for (const msg of latestSession.messages) {
                      await fetch(`/api/sessions/${newSession.id}/messages`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ role: msg.role, content: msg.content }),
                      });
                    }
                    
                    // Set the restored session as active
                    setDbSessionId(newSession.id);
                    localStorage.setItem('uvz_active_session', newSession.id);
                    
                    // Reload messages into the chat
                    const restoredMessages = latestSession.messages.map((msg: any, idx: number) => ({
                      id: `restored-${idx}`,
                      role: msg.role,
                      content: msg.content,
                    }));
                    setMessages(restoredMessages);
                    
                    // Update sessions list
                    setSessions(prev => [newSession, ...prev]);
                    
                    console.log('Guest session restored successfully!');
                  }
                }
              }
            } catch (e) {
              console.error('Error restoring guest session:', e);
            }
            
            // Clear guest data after restore attempt
            localStorage.removeItem('manymarkets_has_guest_data');
            localStorage.removeItem('manymarkets_guest_sessions');
          }
        }
      } catch {
        setCurrentUser(null);
      }
    }
    loadUserAndSessions();

    // Load today's quick prompts (best-effort)
    (async () => {
      try {
        const res = await fetch('/api/chat/daily-prompts');
        if (res.ok) {
          const data = await res.json();
          setDailyPrompts(data.prompts || []);
          setDailyPromptsSource(data.source === 'ai' ? 'ai' : 'fallback');
        } else {
          // Fallback to local deterministic generator
          const mod = await import('@/lib/chat/dailyPrompts');
          setDailyPrompts(mod.getDailyPrompts(5));
          setDailyPromptsSource('local');
        }
      } catch (err) {
        try {
          const mod = await import('@/lib/chat/dailyPrompts');
          setDailyPrompts(mod.getDailyPrompts(5));
          setDailyPromptsSource('local');
        } catch {
          setDailyPrompts(['Find niches in health tech', 'Discover AI tool opportunities', 'Explore digital product ideas']);
          setDailyPromptsSource('local');
        }
      }
    })();
  }, [supabase.auth]);

  // Auto-scroll - use instant scroll when loading, smooth when chatting
  const isLoadingRef = useRef(false);
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      // Use instant scroll when loading a session, smooth for new messages
      const behavior = isLoadingRef.current ? 'instant' : 'smooth';
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
      isLoadingRef.current = false;
    }
  }, [messages]);

  // Create a new database session when user sends first message
  const createDbSession = useCallback(async (firstMessage: string) => {
    if (!currentUser || dbSessionId || isCreatingSession) return null;
    
    // Check session limit for free users
    if (!isPro && sessions.length >= FREE_SESSION_LIMIT) {
      setIsUpgradeModalOpen(true);
      return null;
    }
    
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
        if (typeof window !== 'undefined') localStorage.setItem('uvz_active_session', session.id);
        setSessions(prev => [session, ...prev]);
        return session.id;
      }
    } catch (error) {
      console.error('Error creating session:', error);
    } finally {
      setIsCreatingSession(false);
    }
    return null;
  }, [currentUser, dbSessionId, isCreatingSession, isPro, sessions.length, FREE_SESSION_LIMIT]);

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

    // If there's pre-loaded research context, prepend it to the first message so the AI has full context
    let messageForAI = text;
    if (researchContext && messages.length === 0) {
      messageForAI = researchContext.contextText + text;
      setResearchContext(null); // Clear context card after sending
    }

    // Send message via AI SDK (with hidden context prepended)
    sendMessage({ text: messageForAI });

    // Save user message to database (save the visible text only, not the hidden context)
    if (sessionId) {
      await saveMessageToDb(sessionId, 'user', text);
    }
  }, [dbSessionId, currentUser, createDbSession, sendMessage, saveMessageToDb, researchContext, messages.length]);

  // Save assistant response when streaming completes
  useEffect(() => {
    if (status === 'ready' && messages.length > 0 && dbSessionId) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.parts) {
        const textContent = (lastMessage.parts || [])
          .filter((part: any) => part.type === 'text')
          .map((part: any) => part.text)
          .join('');
        
        const toolCalls = (lastMessage.parts || []).filter((part: any) => part.type === 'tool-call');
        const toolResults = (lastMessage.parts || []).filter((part: any) => part.type === 'tool-result');

        if (textContent) {
          saveMessageToDb(
            dbSessionId,
            'assistant',
            textContent,
            toolCalls.length > 0 ? toolCalls : undefined,
            toolResults.length > 0 ? toolResults : undefined
          );
          
          // Count user messages to determine if we've had enough conversation depth
          const userMessageCount = messages.filter(m => m.role === 'user').length;
          const hasMinimumExchanges = userMessageCount >= MIN_EXCHANGES_FOR_COMPLETION;
          
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
            'click the build product button',
          ];
          
          const lowerContent = textContent.toLowerCase();
          const hasCompletionSignal = completionSignals.some(signal => lowerContent.includes(signal));
          
          // Only mark as complete if we have BOTH minimum exchanges AND a completion signal
          if (hasMinimumExchanges && hasCompletionSignal && !isResearchComplete) {
            setIsResearchComplete(true);
          }
        }

        // Detect and update phase based on tool usage
        if (toolCalls.length > 0) {
          detectAndUpdatePhase(dbSessionId, toolCalls);
          
          // Count user messages to ensure minimum depth
          const userMsgCount = messages.filter(m => m.role === 'user').length;
          const hasEnoughDepth = userMsgCount >= MIN_EXCHANGES_FOR_COMPLETION;
          
          // Check if we've reached product_ideation or completed phase
          // Only allow completion if we have enough conversation depth
          const productTools = ['generate_product_ideas', 'generate_ebook_outline'];
          const hasProductTool = toolCalls.some((tc: any) => 
            productTools.includes(tc.toolName || tc.name)
          );
          if (hasProductTool && hasEnoughDepth && !isResearchComplete) {
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
      
      // Build initial greeting with context
      const initialMessage = data.goal 
        ? `I'm interested in the ${data.industry} industry and my goal is to ${data.goal.toLowerCase()}. Can you help me discover my Unique Value Zone?`
        : `I want to explore opportunities in the ${data.industry} industry. Help me find my Unique Value Zone.`;
      
      // Reset chat state and prepare for new session
      const newChatId = `uvz-chat-${Date.now()}`;
      
      // Close modal first for better UX
      setIsNewSessionModalOpen(false);
      
      // Update state synchronously
      setMessages([]);
      setInput('');
      setDbSessionId(session.id);
      if (typeof window !== 'undefined') localStorage.setItem('uvz_active_session', session.id);
      setChatSessionId(newChatId);
      setSessions(prev => [session, ...prev]);
      
      // Send message immediately - use requestAnimationFrame to ensure state is updated
      requestAnimationFrame(() => {
        sendMessage({ text: initialMessage });
        // Save user message to database (fire and forget)
        saveMessageToDb(session.id, 'user', initialMessage).catch(err => 
          console.error('Error saving message to db:', err)
        );
      });
      
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
    isLoadingRef.current = true; // Flag for instant scroll
    
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

        // Set new chat ID - this creates a fresh transport and chat state
        const newChatId = `session-${sessionId}-${Date.now()}`;
        
        // Update all state at once
        setDbSessionId(sessionId);
        if (typeof window !== 'undefined') localStorage.setItem('uvz_active_session', sessionId);
        setChatSessionId(newChatId);
        
        // Use requestAnimationFrame to ensure state updates are processed
        requestAnimationFrame(() => {
          setMessages(uiMessages);
          setIsLoadingSession(false);
        });
      } else {
        setIsLoadingSession(false);
      }
    } catch (error) {
      console.error('Error loading session:', error);
      setIsLoadingSession(false);
    }
  }, [setMessages, dbSessionId]);

  // Restore last active session on refresh
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const last = localStorage.getItem('uvz_active_session');
    if (last) {
      (async () => {
        try {
          await loadSession(last);
        } catch (e) {
          console.error('Failed to restore session:', e);
          localStorage.removeItem('uvz_active_session');
        }
      })();
    }
  }, [loadSession]);

  // Build research context card data + hidden context text for the AI
  const buildResearchContext = useCallback((idea: any, gated: string[], product: any | null) => {
    // Build the full context text that will be prepended to the user's first message
    const lines: string[] = [];
    const sections: string[] = [];
    const addLine = (label: string, value: any) => {
      if (value === undefined || value === null || value === '') return;
      lines.push(`${label}: ${value}`);
    };

    addLine('Idea', idea.name);
    addLine('One-liner', idea.one_liner);
    addLine('Industry', idea.industry);
    addLine('Demand level', idea.demand_level);
    addLine('Competition level', idea.competition_level);
    addLine('Trending score', idea.trending_score);
    if (!gated.includes('market_size')) addLine('Market size', idea.market_size);
    if (!gated.includes('growth_rate')) addLine('Growth rate', idea.growth_rate);

    if (idea.pain_points && idea.pain_points.length > 0) {
      const points = idea.pain_points.map((p: any) => {
        const title = p.title || p.point || p;
        const desc = p.description ? ` — ${p.description}` : '';
        return `- ${title}${desc}`;
      }).join('\n');
      const truncated = gated.includes('full_pain_points') ? ' (showing first few)' : '';
      sections.push(`Pain points${truncated}:\n${points}`);
    }

    if (idea.validation_signals && idea.validation_signals.length > 0) {
      const signals = idea.validation_signals.map((s: any) => {
        const label = s.type || s.signal || s;
        const detail = s.description || s.evidence || '';
        return detail ? `- ${label}: ${detail}` : `- ${label}`;
      }).join('\n');
      sections.push(`Validation signals:\n${signals}`);
    }

    if (idea.product_ideas && idea.product_ideas.length > 0 && !product) {
      const names = idea.product_ideas.slice(0, 5).map((p: any) => `- ${p.name || p}`).join('\n');
      sections.push(`Product ideas (sample):\n${names}`);
    }

    if (!gated.includes('full_research_report') && idea.full_research_report) {
      const report = typeof idea.full_research_report === 'string'
        ? idea.full_research_report
        : JSON.stringify(idea.full_research_report, null, 2);
      sections.push(`Full research report:\n${report}`);
    }

    if (product) {
      const productLines: string[] = [];
      const addProduct = (label: string, value: any) => {
        if (value === undefined || value === null || value === '') return;
        productLines.push(`${label}: ${value}`);
      };
      addProduct('Selected product', product.name);
      addProduct('Tagline', product.tagline);
      addProduct('Type', product.type);
      addProduct('Description', product.description);
      if (product.core_features && product.core_features.length > 0) {
        const features = product.core_features.slice(0, 6).map((f: string) => `- ${f}`).join('\n');
        productLines.push(`Core features:\n${features}`);
      }
      addProduct('Price point', product.price_point);
      addProduct('Build time', product.build_time);
      sections.push(`Selected product context:\n${productLines.join('\n')}`);
    }

    const contextBlock = [lines.join('\n'), sections.join('\n\n')].filter(Boolean).join('\n\n');

    const contextText = `IMPORTANT: This chat starts with pre-loaded research from a Daily AI Idea. Skip discovery/niche phases — the idea and data are already provided below. Jump straight to analysis.\n\n--- RESEARCH CONTEXT ---\n${contextBlock}\n--- END CONTEXT ---\n\n`;

    // Build card data for display
    const painPointLabels = (idea.pain_points || []).map((p: any) => String(p.title || p.point || p));
    const signalLabels = (idea.validation_signals || []).map((s: any) => String(s.type || s.signal || s));
    const productNames = (idea.product_ideas || []).slice(0, 5).map((p: any) => String(p.name || p));

    return {
      ideaName: idea.name || '',
      oneLiner: idea.one_liner || '',
      industry: idea.industry || '',
      demandLevel: idea.demand_level || '',
      competitionLevel: idea.competition_level || '',
      trendingScore: idea.trending_score || '',
      marketSize: !gated.includes('market_size') ? (idea.market_size || null) : null,
      growthRate: !gated.includes('growth_rate') ? (idea.growth_rate || null) : null,
      painPoints: painPointLabels,
      validationSignals: signalLabels,
      productIdeas: product ? [] : productNames,
      selectedProduct: product ? { name: product.name, type: product.type || '', description: product.description || '' } : null,
      contextText,
    };
  }, []);

  // Deep-linking: start a research chat from Daily Ideas (idea + optional productIndex or product JSON)
  useEffect(() => {
    // Only run once per idea param
    if (!ideaParam) return;
    if (processedRef.current.idea === ideaParam) return;
    processedRef.current.idea = ideaParam;

    (async () => {
      try {
        // Fetch idea detail
        const res = await fetch(`/api/daily-ideas/${ideaParam}`);
        if (!res.ok) {
          console.error('Failed to fetch idea for deep-linking');
          return;
        }
        const { idea, gatedSections: gated = [] } = await res.json();

        // Determine selected product
        let product = null;
        let idxUsed: number | null = null;
        if (productIndexParam !== null) {
          const idx = parseInt(productIndexParam, 10);
          if (!isNaN(idx) && idea.product_ideas && idea.product_ideas[idx]) {
            product = idea.product_ideas[idx];
            idxUsed = idx;
          }
        } else if (productParam) {
          try {
            const decoded = atob(productParam);
            product = JSON.parse(decoded);
            // productParam may be a full product JSON — don't have index in this case
            idxUsed = null;
          } catch (e) {
            console.warn('Failed to parse product param', e);
          }
        }

        // Build research context for display card + AI context
        const ctx = buildResearchContext(idea, gated, product);
        const research = !gated.includes('full_research_report') && idea.full_research_report
          ? (typeof idea.full_research_report === 'string'
            ? idea.full_research_report
            : JSON.stringify(idea.full_research_report, null, 2))
          : null;

        // Save source idea context to allow converting research -> builder later
        setSourceIdeaId(idea.id || null);
        setSourceProductIndex(idxUsed);
        setSourceIdeaResearch(research || null);

        // Create a new session in the DB
        const title = `Research: ${idea.name}`;
        const createRes = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, industry: idea.industry }),
        });

        if (!createRes.ok) {
          console.error('Failed to create research session');
          return;
        }

        const { session } = await createRes.json();

        // Reset UI state and start a fresh chat transport
        const newChatId = `uvz-chat-${Date.now()}`;
        setMessages([]);
        setDbSessionId(session.id);
        if (typeof window !== 'undefined') localStorage.setItem('uvz_active_session', session.id);
        setChatSessionId(newChatId);
        setSessions(prev => [session, ...prev]);

        // Set the research context card + prefill the input with a starter prompt
        setResearchContext(ctx);
        const starterPrompt = product
          ? `Analyze the "${product.name}" product opportunity for the "${idea.name}" niche — cover market fit, competitors, pricing, and a 30/60/90-day launch plan.`
          : `Analyze the "${idea.name}" opportunity — cover market potential, competitors, monetization strategies, and give me a 30/60/90-day action plan.`;
        setInput(starterPrompt);

        // Clean up URL (remove query params)
        router.replace('/chat');
      } catch (err) {
        console.error('Error starting research chat from link:', err);
      }
    })();
  }, [ideaParam, productIndexParam, productParam, router, saveMessageToDb, sendMessage, setMessages, buildResearchContext]);

  // Delete session
  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
      if (response.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        if (dbSessionId === sessionId) {
          createNewChat();
          if (typeof window !== 'undefined') localStorage.removeItem('uvz_active_session');
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
      if (typeof window !== 'undefined') localStorage.removeItem('uvz_active_session');
      router.push('/login');
    } catch {
      setIsLogoutOpen(false);
      if (typeof window !== 'undefined') localStorage.removeItem('uvz_active_session');
      router.push('/login');
    }
  };

  // Download session summary
  const handleDownloadSummary = async (format: 'html' | 'md') => {
    if (!dbSessionId) return;
    
    setIsDownloadingSummary(true);
    setIsDownloadMenuOpen(false);
    
    try {
      const response = await fetch(`/api/sessions/${dbSessionId}/summary?format=${format}`);
      
      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }
      
      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `research-summary.${format}`;
      
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="([^"]+)"/);
        if (match) filename = match[1];
      }
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading summary:', error);
      alert('Failed to download summary. Please try again.');
    } finally {
      setIsDownloadingSummary(false);
    }
  };

  // Close download menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setIsDownloadMenuOpen(false);
      }
    }

    if (isDownloadMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDownloadMenuOpen]);

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
        sessionCount={sessionCount}
        isPro={isPro}
        onUpgradeClick={() => setIsUpgradeModalOpen(true)}
      />

      {/* Upgrade Modal */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border-4 border-black rounded-2xl shadow-brutal max-w-md w-full p-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-uvz-orange to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-black mb-2">Upgrade to Pro</h2>
              <p className="text-gray-600 mb-4">
                You've used all {FREE_SESSION_LIMIT} free research sessions. Upgrade to Pro for unlimited sessions and full access to the product builder!
              </p>
              
              <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-xl text-red-500 line-through">$10</span>
                  <span className="text-3xl font-black">$8</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <ul className="text-sm text-left space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Unlimited AI Research Sessions
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Full Builder Studio Access
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Advanced Market Analytics
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Unlimited Products
                  </li>
                </ul>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setIsUpgradeModalOpen(false)}
                  className="flex-1 px-4 py-3 border-2 border-black rounded-xl font-bold hover:bg-gray-100 transition-colors"
                >
                  Maybe Later
                </button>
                <Link
                  href="/upgrade"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-uvz-orange to-pink-500 text-white border-2 border-black rounded-xl font-bold shadow-brutal hover:-translate-y-0.5 transition-all text-center"
                >
                  Upgrade Now
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Sidebar - only render mobile overlay after hydration to prevent mismatch */}
      <ChatSidebar
        isOpen={isSidebarOpen}
        isMobile={hasMounted ? !isDesktop : false}
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
            {/* Session Actions - Download Summary */}
            {dbSessionId && messages.length > 0 && (
              <div className="flex justify-end mb-4">
                <div className="relative" ref={downloadMenuRef}>
                  <button
                    onClick={() => setIsDownloadMenuOpen(!isDownloadMenuOpen)}
                    disabled={isDownloadingSummary}
                    className="flex items-center gap-2 px-3 py-2 bg-white border-2 border-black rounded-lg text-sm font-bold hover:shadow-brutal hover:-translate-y-0.5 transition-all disabled:opacity-50"
                  >
                    {isDownloadingSummary ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">Download Summary</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isDownloadMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isDownloadMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border-2 border-black rounded-lg shadow-brutal z-10 overflow-hidden">
                      <button
                        onClick={() => handleDownloadSummary('html')}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-colors text-left"
                      >
                        <FileText className="w-4 h-4 text-uvz-orange" />
                        <div>
                          <span className="font-bold text-sm">HTML Document</span>
                          <span className="text-xs text-gray-500 block">Opens in browser</span>
                        </div>
                      </button>
                      <div className="border-t border-gray-200" />
                      <button
                        onClick={() => handleDownloadSummary('md')}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-colors text-left"
                      >
                        <FileText className="w-4 h-4 text-purple-600" />
                        <div>
                          <span className="font-bold text-sm">Markdown</span>
                          <span className="text-xs text-gray-500 block">For Notion, Obsidian</span>
                        </div>
                      </button>
                      {!isPro && (
                        <>
                          <div className="border-t border-gray-200" />
                          <div className="px-4 py-2 bg-gradient-to-r from-uvz-orange/10 to-pink-500/10">
                            <p className="text-xs text-gray-600">
                              <span className="font-bold">Free:</span> 1-page summary
                            </p>
                            <Link
                              href="/upgrade"
                              className="text-xs text-uvz-orange font-bold hover:underline"
                            >
                              Upgrade for full report →
                            </Link>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Research Context Card (from Daily Ideas deep-link) */}
            {researchContext && messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl mx-auto mb-6"
              >
                <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-black rounded-2xl shadow-brutal overflow-hidden">
                  {/* Header */}
                  <div className="bg-uvz-orange px-5 py-3 flex items-center gap-3">
                    <Lightbulb className="w-6 h-6 text-white" />
                    <div>
                      <p className="text-white font-black text-lg">{researchContext.ideaName}</p>
                      <p className="text-white/80 text-sm">{researchContext.oneLiner}</p>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Key Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-500 font-bold mb-1">Industry</p>
                        <p className="font-black text-sm">{researchContext.industry}</p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-500 font-bold mb-1">Demand</p>
                        <p className="font-black text-sm">{researchContext.demandLevel || 'N/A'}</p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-500 font-bold mb-1">Competition</p>
                        <p className="font-black text-sm">{researchContext.competitionLevel || 'N/A'}</p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-500 font-bold mb-1">Trending</p>
                        <p className="font-black text-sm">{researchContext.trendingScore || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Market Size & Growth */}
                    {(researchContext.marketSize || researchContext.growthRate) && (
                      <div className="flex gap-3">
                        {researchContext.marketSize && (
                          <div className="flex-1 bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-green-600 shrink-0" />
                            <div>
                              <p className="text-xs text-gray-500 font-bold">Market Size</p>
                              <p className="font-black text-sm text-green-700">{researchContext.marketSize}</p>
                            </div>
                          </div>
                        )}
                        {researchContext.growthRate && (
                          <div className="flex-1 bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-blue-600 shrink-0" />
                            <div>
                              <p className="text-xs text-gray-500 font-bold">Growth Rate</p>
                              <p className="font-black text-sm text-blue-700">{researchContext.growthRate}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Pain Points */}
                    {researchContext.painPoints.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1">
                          <Target className="w-3 h-3" /> Pain Points
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {researchContext.painPoints.slice(0, 4).map((p, i) => (
                            <span key={i} className="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded-full font-bold">
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Validation Signals */}
                    {researchContext.validationSignals.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Validation Signals
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {researchContext.validationSignals.slice(0, 4).map((s, i) => (
                            <span key={i} className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-full font-bold">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Selected Product */}
                    {researchContext.selectedProduct && (
                      <div className="bg-white border border-blue-200 rounded-xl p-3">
                        <p className="text-xs font-bold text-gray-500 mb-1">Selected Product</p>
                        <p className="font-black">{researchContext.selectedProduct.name}</p>
                        {researchContext.selectedProduct.type && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">
                            {researchContext.selectedProduct.type}
                          </span>
                        )}
                        {researchContext.selectedProduct.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{researchContext.selectedProduct.description}</p>
                        )}
                      </div>
                    )}

                    {/* Hint */}
                    <p className="text-xs text-gray-400 text-center">
                      Research context loaded \u2022 Edit the prompt below and press Send to start
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Empty state */}
            {messages.length === 0 && !researchContext && (
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
                
                <p className="text-sm text-gray-500 mb-4">Or try a quick prompt (new every day) {dailyPromptsSource === 'ai' ? <span className="text-xs text-green-600">· AI-generated</span> : dailyPromptsSource === 'fallback' ? <span className="text-xs text-yellow-700">· Fallback</span> : <span className="text-xs text-gray-500">· Local</span>}:</p>
                <div className="flex flex-wrap justify-center gap-3">
                  {dailyPrompts.map((prompt, i) => (
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
                const textContent = (message.parts || [])
                  .filter((part: any) => part.type === 'text')
                  .map((part: any) => part.text)
                  .join('');
                const cleanText = cleanMarkdown(textContent);
                const toolParts = (message.parts || []).filter((part: any) => part.type === 'tool-call' || part.type === 'tool-result');

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
                        {cleanText && (
                          <p className="font-medium whitespace-pre-wrap break-words leading-relaxed">
                            {cleanText}
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
                  onClick={() => {
                    // If this session originated from a Daily Idea, route to builder with that idea + productIndex
                    if (sourceIdeaId) {
                      const q = `/builder/create?idea=${sourceIdeaId}${sourceProductIndex !== null ? `&productIndex=${sourceProductIndex}` : ''}`;
                      router.push(q);
                      return;
                    }
                    // Fallback: open skills modal as before
                    setIsSkillsModalOpen(true);
                  }}
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
