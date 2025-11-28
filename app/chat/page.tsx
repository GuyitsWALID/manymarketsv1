'use client';

import { useChat, type UIMessage } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, Send, Loader2, Bot, User, Plus } from 'lucide-react';
import Link from 'next/link';

export default function ChatPage() {
  const [input, setInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // New dynamic chat session id so Plus creates a new session
  const [chatSessionId, setChatSessionId] = useState(() => `uvz-chat-${Date.now()}`);
  const transport = useMemo(() => new DefaultChatTransport({ api: '/api/chat' }), []);
  const { messages, sendMessage, status } = useChat({
    id: chatSessionId,
    transport,
  });

  useEffect(() => {
    // Close mobile drawers when escape is pressed
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsSidebarOpen(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const createNewChat = () => {
    // Reset chat session by generating a new session id
    setIsSidebarOpen(false);
    setChatSessionId(`uvz-chat-${Date.now()}`);
    setInput('');
  };

  // Logout modal state
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // sign out client-side
      await supabase.auth.signOut();
      // clear server-side session as well
      await fetch('/api/auth/session', { method: 'DELETE' });
      setIsLogoutOpen(false);
      router.push('/login');
    } catch (err) {
      // fallback: just go to login
      setIsLogoutOpen(false);
      router.push('/login');
    }
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      {/* Left Sidebar - hidden on small screens, toggled via menu */}
      <aside className={`hidden md:block w-64 bg-gray-50 border-r-4 border-black p-4`}> 
        <div className="mb-6">
          <Link href="/" className="text-2xl font-black">manymarket research tool</Link>
        </div>
        <button onClick={createNewChat} className="w-full bg-uvz-orange text-white py-3 px-4 border-4 border-black shadow-brutal hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000000] transition-all font-bold flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" />
          New Session
        </button>
        
        <div className="mt-8">
          <h3 className="text-xs font-bold uppercase text-gray-600 mb-3">Phase Progress</h3>
          <div className="space-y-4">
            <div className="bg-white border-2 border-black p-3">
              <p className="text-xs font-bold text-gray-600 mb-1">Current Phase</p>
              <p className="font-black">Discovery</p>
              <div className="mt-2 h-2 bg-gray-200 border border-black">
                <div className="h-full bg-uvz-orange" style={{ width: '40%' }} />
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Left Sidebar Drawer (overlay) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="w-64 bg-white border-r-4 border-black p-4 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Link href="/" className="text-xl font-black">manymarket research tool</Link>
              <button onClick={() => setIsSidebarOpen(false)} className="p-2 border-2 border-black rounded">Close</button>
            </div>
            <button onClick={createNewChat} className="w-full bg-uvz-orange text-white py-3 px-4 border-4 border-black shadow-brutal hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000000] transition-all font-bold flex items-center justify-center gap-2">
              <Plus className="w-5 h-5" />
              New Session
            </button>
            <div className="mt-8">
              <h3 className="text-xs font-bold uppercase text-gray-600 mb-3">Phase Progress</h3>
              <div className="space-y-4">
                <div className="bg-white border-2 border-black p-3">
                  <p className="text-xs font-bold text-gray-600 mb-1">Current Phase</p>
                  <p className="font-black">Discovery</p>
                  <div className="mt-2 h-2 bg-gray-200 border border-black">
                    <div className="h-full bg-uvz-orange" style={{ width: '40%' }} />
                  </div>
                </div>
              </div>
            </div>
            {/* Insights content moved into left sidebar */}
            <div className="mt-6">
              <h3 className="font-black text-lg mb-4 uppercase">📊 Insights</h3>
              <div className="space-y-4">
                <div className="bg-white border-2 border-black p-4">
                  <p className="text-sm font-bold text-gray-600 mb-2">Discovery Tips</p>
                  <ul className="text-sm font-medium space-y-2">
                    <li>✓ Be specific about your interests</li>
                    <li>✓ Share your experience level</li>
                    <li>✓ Consider audience size</li>
                    <li>✓ Think about monetization</li>
                  </ul>
                </div>
                <div className="bg-yellow-100 border-2 border-black p-4">
                  <p className="text-xs font-bold uppercase mb-2">Quick Actions</p>
                  <div className="space-y-2">
                    <Link href="/marketplace" className="block text-sm font-bold text-center py-2 bg-white border-2 border-black hover:shadow-brutal transition-all">Browse Marketplace</Link>
                    <Link href="/builder" className="block text-sm font-bold text-center py-2 bg-white border-2 border-black hover:shadow-brutal transition-all">Product Builder</Link>
                  </div>
                </div>
                <div className="mt-6">
                  <button
                    onClick={() => setIsLogoutOpen(true)}
                    className="w-full bg-white text-black py-3 px-4 border-4 border-black font-bold hover:-translate-y-1 transition-all"
                  >
                    Log out
                  </button>
                </div>
              </div>
            </div>
            {/* Logout confirmation modal */}
            {isLogoutOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div onClick={() => setIsLogoutOpen(false)} className="absolute inset-0 bg-black/30" />
                <div className="relative bg-white border-4 border-black p-6 w-full max-w-md mx-4">
                  <h2 className="text-xl font-black mb-4">Are you sure you want to leave?</h2>
                  <p className="text-sm text-gray-600 mb-6">If you log out, your session will be cleared and you'll be redirected to the login page.</p>
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setIsLogoutOpen(false)} className="px-4 py-2 border-2 border-black">Cancel</button>
                    <button onClick={handleLogout} className="px-4 py-2 bg-uvz-orange text-white border-4 border-black font-bold">Log out</button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div onClick={() => setIsSidebarOpen(false)} className="flex-1 bg-black/30" />
        </div>
      )}

      {/* Main Chat */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b-4 border-black p-4 bg-white flex items-center justify-between">
          <div className="flex items-center justify-between">
            <div className="flex  gap-3 justify-between">
              {/* Mobile menu button */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                aria-label="Toggle menu"
                className="md:hidden p-2  bg-uvz-orange shadow-brutal border-2 border-black rounded mr-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <div className="w-12 h-12 bg-uvz-white border-4 rounded-full border-black flex items-center justify-center">
                <Bot className="w-6 h-6 text-black" />
              </div>
              <div>
                <h1 className="font-black text-xl">Discovery Assistant</h1>
                <p className="text-sm font-medium text-gray-600">Finding your Unique Value Zone</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Create New Chat (Plus) */}
              <button onClick={() => createNewChat()} aria-label="New chat" className="p-2 bg-uvz-orange text-white border-2 border-black rounded">
                <Plus className="w-5 h-5" />
              </button>
              
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto text-center mt-20"
            >
              <div className="w-20 h-20 bg-yellow-300 border-4 border-black mx-auto mb-6 flex items-center justify-center">
                <Sparkles className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black mb-4">Welcome to UVZ Discovery!</h2>
              <p className="text-lg font-medium text-gray-700 mb-8">
                I'll guide you through finding your Unique Value Zone—a profitable niche that matches your skills and market demand.
              </p>
              <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
                {['Find niches in health tech', 'Discover AI tool opportunities', 'Explore digital product ideas'].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      sendMessage({ text: prompt });
                    }}
                    className="bg-white border-4 border-black p-4 font-bold text-left hover:-translate-y-1 hover:shadow-brutal transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

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
                <div className={`flex gap-3 max-w-[80%] sm:max-w-full ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                <div className={`w-10 h-10 shrink-0 border-4 border-black flex items-center justify-center ${
                  message.role === 'user' ? 'bg-blue-300' : 'bg-yellow-300'
                }`}>
                  {message.role === 'user' ? (
                    <User className="w-5 h-5" />
                  ) : (
                    <Bot className="w-5 h-5" />
                  )}
                </div>

                {/* Message Content */}
                <div className={`border-4 border-black p-4 shadow-brutal ${
                  message.role === 'user' ? 'bg-blue-50' : 'bg-white'
                }`}>
                  {textContent && <p className="font-medium whitespace-pre-wrap wrap-break-word">{textContent}</p>}
                  
                  {/* Display tool results if any */}
                  {toolParts.map((part: any, idx: number) => (
                    <div key={idx} className="mt-4 p-3 bg-yellow-100 border-2 border-black">
                      <p className="text-sm font-bold mb-2 uppercase">🔧 {part.toolName?.replace(/_/g, ' ') || 'Tool'}</p>
                      {part.type === 'tool-result' && part.result && (
                        <pre className="text-xs overflow-x-auto font-mono bg-white p-2 border-2 border-black">
                          {JSON.stringify(part.result, null, 2)}
                        </pre>
                      )}
                      {part.type === 'tool-call' && (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm font-medium">Processing...</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )})}

          {status === 'streaming' && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[80%]">
                <div className="w-10 h-10 shrink-0 bg-yellow-300 border-4 border-black flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="border-4 border-black p-4 shadow-brutal bg-white">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="font-medium">Thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t-4 border-black p-4 bg-white sticky bottom-0 z-20">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (input.trim()) {
                sendMessage({ text: input });
                setInput('');
              }
            }}
            className="max-w-4xl mx-auto"
          >
            <div className="flex gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your answer..."
                className="flex-1 px-4 py-3 border-4 border-black focus:outline-none focus:ring-4 focus:ring-uvz-orange/20 font-medium"
                disabled={status === 'streaming'}
              />
              <button
                type="submit"
                disabled={status === 'streaming' || !input.trim()}
                className="px-6 py-3 bg-uvz-orange text-white border-4 border-black font-bold hover:-translate-y-1 hover:shadow-brutal transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
                Send
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Insights are integrated into the left sidebar */}

      {/* Insights are integrated into the sidebar; no separate mobile drawer needed */}

      {/* End of layout */}
    </div>
  );
}
