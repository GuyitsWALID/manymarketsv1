'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Loader2, Lock, ArrowRight, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface GuestMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface GuestSession {
  id: string;
  messages: GuestMessage[];
  createdAt: number;
}

const GUEST_STORAGE_KEY = 'manymarkets_guest_sessions';
const MAX_GUEST_SESSIONS = 2;
const BLUR_AFTER_MESSAGES = 4; // After 4 messages (2 exchanges), blur and prompt signup

export default function GuestDemoChat() {
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string>(() => `guest-${Date.now()}`);
  const [guestSessions, setGuestSessions] = useState<GuestSession[]>([]);
  const [showBlur, setShowBlur] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Create transport for useChat
  const transport = useMemo(() => new DefaultChatTransport({ api: '/api/chat' }), [sessionId]);
  
  // Use the AI SDK useChat hook - same as the real chat page
  const { messages, sendMessage, status } = useChat({
    id: sessionId,
    transport,
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  // Load guest sessions from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(GUEST_STORAGE_KEY);
    if (stored) {
      try {
        const sessions: GuestSession[] = JSON.parse(stored);
        setGuestSessions(sessions);
        
        // Check if we should show blur from previous session
        if (sessions.length > 0) {
          const latestSession = sessions[sessions.length - 1];
          if (latestSession.messages.length >= BLUR_AFTER_MESSAGES) {
            setShowBlur(true);
          }
        }
      } catch {
        // Invalid stored data, start fresh
      }
    }
    setIsInitialized(true);
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (!isInitialized || messages.length === 0) return;
    
    // Convert AI SDK messages to our format for storage
    const guestMessages: GuestMessage[] = messages.map(m => {
      // AI SDK v5 uses parts array instead of content
      const textContent = m.parts
        ?.filter((part: any) => part.type === 'text')
        .map((part: any) => part.text)
        .join('') || '';
      return {
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: textContent,
        timestamp: Date.now(),
      };
    });
    
    // Update or create session
    const existingSessionIndex = guestSessions.findIndex(s => s.id === sessionId);
    let updatedSessions: GuestSession[];
    
    if (existingSessionIndex >= 0) {
      updatedSessions = guestSessions.map((s, i) => 
        i === existingSessionIndex ? { ...s, messages: guestMessages } : s
      );
    } else {
      updatedSessions = [...guestSessions, { id: sessionId, messages: guestMessages, createdAt: Date.now() }];
    }
    
    setGuestSessions(updatedSessions);
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(updatedSessions));
    
    // Check if we should trigger the blur
    if (messages.length >= BLUR_AFTER_MESSAGES && !showBlur) {
      setShowBlur(true);
      setTimeout(() => setShowSignupModal(true), 500);
    }
  }, [messages, sessionId, isInitialized]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!input.trim() || isLoading || showBlur) return;
    
    // Check session limit
    if (guestSessions.length >= MAX_GUEST_SESSIONS && messages.length === 0) {
      setShowSignupModal(true);
      return;
    }
    
    sendMessage({ text: input.trim() });
    setInput('');
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
            Try it Free • {Math.max(0, MAX_GUEST_SESSIONS - guestSessions.length)} sessions left
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
            {messages.map((message) => (
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
                  <p className="font-medium whitespace-pre-wrap">
                    {message.parts
                      ?.filter((part: any) => part.type === 'text')
                      .map((part: any) => part.text)
                      .join('') || ''}
                  </p>
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
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
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
              className="bg-white border-4 border-black rounded-2xl shadow-brutal p-6 md:p-8 max-w-md w-full relative"
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
