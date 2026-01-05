'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Loader2, Lock, ArrowRight, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface GuestSession {
  id: string;
  messages: Message[];
  createdAt: number;
}

const GUEST_STORAGE_KEY = 'manymarkets_guest_sessions';
const MAX_GUEST_SESSIONS = 2;
const BLUR_AFTER_MESSAGES = 4; // After 4 messages (2 exchanges), blur and prompt signup

export default function GuestDemoChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [guestSessions, setGuestSessions] = useState<GuestSession[]>([]);
  const [showBlur, setShowBlur] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Load guest sessions from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(GUEST_STORAGE_KEY);
    if (stored) {
      try {
        const sessions: GuestSession[] = JSON.parse(stored);
        setGuestSessions(sessions);
        
        // If there are existing sessions, load the most recent one
        if (sessions.length > 0) {
          const latestSession = sessions[sessions.length - 1];
          setSessionId(latestSession.id);
          setMessages(latestSession.messages);
          
          // Check if we should show blur
          if (latestSession.messages.length >= BLUR_AFTER_MESSAGES) {
            setShowBlur(true);
          }
        }
      } catch {
        // Invalid stored data, start fresh
        createNewSession();
      }
    } else {
      createNewSession();
    }
  }, []);

  // Save to localStorage whenever messages change
  useEffect(() => {
    if (!sessionId || messages.length === 0) return;
    
    const updatedSessions = guestSessions.map(s => 
      s.id === sessionId ? { ...s, messages } : s
    );
    
    // If current session doesn't exist yet, add it
    if (!guestSessions.find(s => s.id === sessionId)) {
      updatedSessions.push({ id: sessionId, messages, createdAt: Date.now() });
    }
    
    setGuestSessions(updatedSessions);
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(updatedSessions));
    
    // Check if we should trigger the blur
    if (messages.length >= BLUR_AFTER_MESSAGES && !showBlur) {
      setShowBlur(true);
      setTimeout(() => setShowSignupModal(true), 500);
    }
  }, [messages, sessionId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createNewSession = () => {
    // Check if max sessions reached
    if (guestSessions.length >= MAX_GUEST_SESSIONS) {
      setShowSignupModal(true);
      return;
    }
    
    const newId = `guest-${Date.now()}`;
    setSessionId(newId);
    setMessages([]);
    setShowBlur(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    // Check session limit
    if (guestSessions.length >= MAX_GUEST_SESSIONS && messages.length === 0) {
      setShowSignupModal(true);
      return;
    }
    
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call the actual chat API (same as real chat)
      // Format messages in UIMessage format expected by AI SDK
      const formattedMessages = [...messages, userMessage].map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        parts: [{ type: 'text', text: m.content }],
      }));
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: formattedMessages,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      const assistantMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('0:')) {
            // Parse the AI SDK streaming format
            try {
              const content = JSON.parse(line.slice(2));
              if (typeof content === 'string') {
                assistantContent += content;
                setMessages(prev => 
                  prev.map(m => 
                    m.id === assistantMessage.id 
                      ? { ...m, content: assistantContent }
                      : m
                  )
                );
              }
            } catch {
              // Skip unparseable lines
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      setMessages(prev => [...prev, {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again!',
        timestamp: Date.now(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = () => {
    // Store a flag indicating user has guest data to recover
    localStorage.setItem('manymarkets_has_guest_data', 'true');
    router.push('/login?returnTo=/chat&restoreGuest=true');
  };

  return (
    <div className="bg-white border-4 border-black rounded-2xl shadow-brutal overflow-hidden max-w-4xl mx-auto">
      {/* Demo Header */}
      <div className="bg-gradient-to-r from-uvz-orange to-pink-500 p-4 border-b-4 border-black">
        <div className="flex items-center gap-2 text-white">
          <Sparkles className="w-6 h-6" />
          <span className="font-black text-lg">AI Market Research</span>
          <span className="ml-auto text-sm bg-white/20 px-3 py-1 rounded-full">
            Try it Free • {MAX_GUEST_SESSIONS - guestSessions.length} sessions left
          </span>
        </div>
      </div>

      {/* Chat Area */}
      <div className="relative">
        <div className={`h-[400px] overflow-y-auto p-4 md:p-6 ${showBlur ? 'overflow-hidden' : ''}`}>
          {/* Welcome Message */}
          {messages.length === 0 && (
            <div className="flex gap-3 mb-4">
              <div className="w-10 h-10 bg-uvz-orange rounded-full flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-tl-none p-4 max-w-xl">
                <p className="font-medium">
                  👋 Hi! I&apos;m your AI market research assistant. Tell me about your skills, interests, 
                  or a business idea you&apos;re curious about—I&apos;ll help you find profitable niches and validate your concepts!
                </p>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="space-y-4">
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-10 h-10 bg-uvz-orange rounded-full flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className={`rounded-2xl p-4 max-w-xl ${
                  message.role === 'user' 
                    ? 'bg-uvz-orange/10 border-2 border-uvz-orange rounded-tr-none' 
                    : 'bg-gray-100 rounded-tl-none'
                }`}>
                  <p className="font-medium whitespace-pre-wrap">{message.content}</p>
                </div>
              </motion.div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-uvz-orange rounded-full flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-tl-none p-4">
                  <Loader2 className="w-5 h-5 animate-spin text-uvz-orange" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Blur Overlay */}
          <AnimatePresence>
            {showBlur && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-gradient-to-t from-white via-white/95 to-transparent flex flex-col items-center justify-end pb-8"
              >
                <div className="text-center px-4">
                  <div className="w-16 h-16 bg-uvz-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-uvz-orange" />
                  </div>
                  <h3 className="text-2xl font-black mb-2">Your Research Awaits!</h3>
                  <p className="text-gray-600 mb-4 max-w-md">
                    Sign up for free to continue this research session and unlock deep market insights.
                  </p>
                  <button
                    onClick={handleSignup}
                    className="inline-flex items-center gap-2 bg-uvz-orange text-white font-bold px-8 py-4 border-4 border-black shadow-brutal hover:-translate-y-1 transition-all"
                  >
                    Continue Research <ArrowRight className="w-5 h-5" />
                  </button>
                  <p className="text-sm text-gray-500 mt-3">
                    ✓ Your progress will be saved • ✓ No credit card required
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="border-t-4 border-black p-4 bg-gray-50">
          <form 
            onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
            className="flex gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={showBlur ? "Sign up to continue..." : "Tell me about your skills or idea..."}
              disabled={isLoading || showBlur}
              className="flex-1 px-4 py-3 border-3 border-black rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-uvz-orange disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading || showBlur}
              className="px-6 py-3 bg-uvz-orange text-white font-bold border-3 border-black rounded-xl shadow-brutal hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
        </div>
      </div>

      {/* Signup Modal */}
      <AnimatePresence>
        {showSignupModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowSignupModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border-4 border-black rounded-2xl shadow-brutal p-6 md:p-8 max-w-md w-full"
            >
              <button
                onClick={() => setShowSignupModal(false)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-uvz-orange to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-black mb-2">Loving It So Far?</h3>
                <p className="text-gray-600 mb-6">
                  Sign up for free to continue your research and access unlimited AI-powered market insights.
                </p>
                
                <div className="space-y-3 text-left mb-6">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-500">✓</span>
                    <span>Continue exactly where you left off</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-500">✓</span>
                    <span>Get 2 full research sessions free</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-500">✓</span>
                    <span>Build digital products with AI</span>
                  </div>
                </div>
                
                <button
                  onClick={handleSignup}
                  className="w-full inline-flex items-center justify-center gap-2 bg-uvz-orange text-white font-bold px-8 py-4 border-4 border-black shadow-brutal hover:-translate-y-1 transition-all"
                >
                  Sign Up Free <ArrowRight className="w-5 h-5" />
                </button>
                <p className="text-xs text-gray-500 mt-3">
                  No credit card required • Cancel anytime
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
