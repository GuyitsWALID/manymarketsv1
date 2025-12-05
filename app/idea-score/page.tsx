'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Loader2, TrendingUp, AlertCircle, Sparkles, Target, DollarSign, Users, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatSidebar from '@/components/chat/ChatSidebar';

interface Session {
  id: string;
  title: string;
  phase: string;
  created_at: string;
  last_message_at: string;
}

export default function IdeaScorePage() {
  const router = useRouter();
  const supabase = createClient();
  
  // Idea scoring state
  const [ideaInput, setIdeaInput] = useState('');
  const [isScoring, setIsScoring] = useState(false);
  const [scoreResult, setScoreResult] = useState<{ score: number; reason: string } | null>(null);
  const [scoringPhase, setScoringPhase] = useState<string>('');
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDesktop, setIsDesktop] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  // Handle responsive
  useEffect(() => {
    function handleResize() {
      setIsDesktop(window.innerWidth >= 768);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load user and sessions
  useEffect(() => {
    async function loadUserAndSessions() {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user ?? null;
        setCurrentUser(user);

        if (user) {
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

  const createNewChat = useCallback(() => {
    router.push('/chat');
  }, [router]);

  const loadSession = useCallback((sessionId: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('uvz_active_session', sessionId);
    }
    router.push('/chat');
  }, [router]);

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
      if (response.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  }, []);

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

  // Calculate main content margin based on sidebar
  const getMainMargin = () => {
    if (!isDesktop) return 0;
    if (!isSidebarOpen) return 0;
    return 288;
  };

  const phases = [
    { text: 'Analyzing market potential...', icon: BarChart3 },
    { text: 'Researching competition...', icon: Target },
    { text: 'Evaluating demand signals...', icon: Users },
    { text: 'Calculating viability score...', icon: DollarSign },
  ];

  const scoreIdea = async () => {
    if (!ideaInput.trim()) return;
    
    setIsScoring(true);
    setScoreResult(null);
    setCurrentPhaseIndex(0);
    
    // Animated phases
    for (let i = 0; i < phases.length; i++) {
      setCurrentPhaseIndex(i);
      setScoringPhase(phases[i].text);
      await new Promise(r => setTimeout(r, 1000));
    }
    
    try {
      const response = await fetch('/api/research/score-idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: ideaInput }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setScoreResult({ score: data.score, reason: data.reason });
      } else {
        setScoreResult({ score: 0, reason: 'Failed to score idea. Please try again.' });
      }
    } catch (error) {
      console.error('Error scoring idea:', error);
      setScoreResult({ score: 0, reason: 'Network error. Please check your connection.' });
    } finally {
      setIsScoring(false);
      setScoringPhase('');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 70) return 'Great';
    if (score >= 60) return 'Good';
    if (score >= 50) return 'Promising';
    if (score >= 40) return 'Needs Work';
    if (score >= 30) return 'Risky';
    return 'Not Recommended';
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
        currentSessionId={null}
        onSelectSession={loadSession}
        onDeleteSession={deleteSession}
      />

      {/* Main Content */}
      <main
        style={{ marginLeft: getMainMargin() }}
        className="h-screen pt-16 overflow-y-auto transition-all duration-300 ease-in-out bg-gradient-to-br from-uvz-cream via-white to-orange-50"
      >
        <div className="py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Hero Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="w-20 h-20 bg-uvz-orange rounded-2xl border-4 border-black mx-auto mb-6 flex items-center justify-center shadow-brutal">
              <Zap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-black mb-3">Score Your Idea</h1>
            <p className="text-lg text-gray-600 max-w-md mx-auto">
              Get an instant AI-powered analysis of your business idea's potential
            </p>
          </motion.div>

          {/* Input Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border-4 border-black rounded-2xl p-6 shadow-brutal mb-8"
          >
            <label className="block text-sm font-bold uppercase text-gray-500 mb-2">
              Your Business Idea
            </label>
            <textarea
              value={ideaInput}
              onChange={(e) => setIdeaInput(e.target.value)}
              placeholder="Describe your business idea in detail... (e.g., 'A mobile app that helps busy professionals meal prep by providing personalized weekly meal plans and automated grocery lists')"
              className="w-full p-4 text-lg border-2 border-black rounded-xl resize-none focus:outline-none focus:ring-4 focus:ring-uvz-orange/30 transition-all"
              rows={4}
              disabled={isScoring}
            />
            
            <button
              onClick={scoreIdea}
              disabled={isScoring || !ideaInput.trim()}
              className="w-full mt-4 py-4 bg-uvz-orange text-white font-black text-lg border-4 border-black rounded-xl hover:shadow-brutal-lg hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-3"
            >
              {isScoring ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  Score My Idea
                </>
              )}
            </button>
          </motion.div>

          {/* Scoring Animation */}
          <AnimatePresence>
            {isScoring && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border-4 border-black rounded-2xl p-8 shadow-brutal mb-8"
              >
                <div className="text-center mb-6">
                  <Loader2 className="w-12 h-12 animate-spin text-uvz-orange mx-auto mb-4" />
                  <h3 className="text-xl font-black">Analyzing Your Idea</h3>
                </div>
                
                <div className="space-y-4">
                  {phases.map((phase, idx) => {
                    const PhaseIcon = phase.icon;
                    const isActive = idx === currentPhaseIndex;
                    const isComplete = idx < currentPhaseIndex;
                    
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0.5 }}
                        animate={{ 
                          opacity: isActive || isComplete ? 1 : 0.5,
                          scale: isActive ? 1.02 : 1
                        }}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                          isActive 
                            ? 'border-uvz-orange bg-orange-50' 
                            : isComplete 
                              ? 'border-green-400 bg-green-50' 
                              : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isActive 
                            ? 'bg-uvz-orange text-white' 
                            : isComplete 
                              ? 'bg-green-500 text-white' 
                              : 'bg-gray-200 text-gray-400'
                        }`}>
                          {isComplete ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                            >
                              ✓
                            </motion.div>
                          ) : isActive ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <PhaseIcon className="w-5 h-5" />
                          )}
                        </div>
                        <span className={`font-bold ${
                          isActive 
                            ? 'text-black' 
                            : isComplete 
                              ? 'text-green-700' 
                              : 'text-gray-400'
                        }`}>
                          {phase.text}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result Card */}
          <AnimatePresence>
            {scoreResult && !isScoring && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white border-4 border-black rounded-2xl overflow-hidden shadow-brutal"
              >
                {/* Score Header */}
                <div className={`p-8 text-center ${
                  scoreResult.score >= 70 
                    ? 'bg-gradient-to-br from-green-400 to-green-500' 
                    : scoreResult.score >= 40 
                      ? 'bg-gradient-to-br from-yellow-400 to-yellow-500' 
                      : 'bg-gradient-to-br from-red-400 to-red-500'
                } text-white`}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
                    className="text-8xl font-black mb-2"
                  >
                    {scoreResult.score}
                  </motion.div>
                  <div className="text-2xl font-bold opacity-90">out of 100</div>
                  <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-full">
                    {scoreResult.score >= 70 ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <AlertCircle className="w-5 h-5" />
                    )}
                    <span className="font-bold">{getScoreLabel(scoreResult.score)}</span>
                  </div>
                </div>

                {/* Score Bar */}
                <div className="px-8 py-4 bg-gray-50 border-b-2 border-black">
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${scoreResult.score}%` }}
                      transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                      className={`h-full ${getScoreBgColor(scoreResult.score)}`}
                    />
                  </div>
                </div>

                {/* Analysis */}
                <div className="p-8">
                  <h3 className="text-lg font-black mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-uvz-orange" />
                    AI Analysis
                  </h3>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    {scoreResult.reason}
                  </p>
                </div>

                {/* Actions */}
                <div className="p-6 bg-gray-50 border-t-2 border-black flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setScoreResult(null);
                      setIdeaInput('');
                    }}
                    className="flex-1 py-3 px-6 bg-white border-2 border-black rounded-xl font-bold hover:shadow-brutal transition-all"
                  >
                    Score Another Idea
                  </button>
                  <Link
                    href="/chat"
                    className="flex-1 py-3 px-6 bg-uvz-orange text-white border-2 border-black rounded-xl font-bold text-center hover:shadow-brutal hover:-translate-y-0.5 transition-all"
                  >
                    Research This Idea
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tips Section */}
          {!isScoring && !scoreResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <div className="bg-white border-2 border-black rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-purple-500" />
                  <span className="font-bold">Be Specific</span>
                </div>
                <p className="text-sm text-gray-600">
                  Include details about your target audience, problem solved, and solution.
                </p>
              </div>
              <div className="bg-white border-2 border-black rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  <span className="font-bold">Define Your Audience</span>
                </div>
                <p className="text-sm text-gray-600">
                  Mention who will buy or use your product or service.
                </p>
              </div>
              <div className="bg-white border-2 border-black rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  <span className="font-bold">Monetization</span>
                </div>
                <p className="text-sm text-gray-600">
                  Explain how you plan to make money from this idea.
                </p>
              </div>
              <div className="bg-white border-2 border-black rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-uvz-orange" />
                  <span className="font-bold">Unique Value</span>
                </div>
                <p className="text-sm text-gray-600">
                  What makes your idea different from existing solutions?
                </p>
              </div>
            </motion.div>
          )}
        </div>
        </div>
      </main>
    </div>
  );
}
