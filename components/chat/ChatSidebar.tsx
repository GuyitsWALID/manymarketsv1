'use client';

import Link from 'next/link';
import { Plus, X, MessageSquare, Trash2, Target, Search, Crosshair, CheckCircle, Lightbulb } from 'lucide-react';

interface Session {
  id: string;
  title: string;
  phase: string;
  created_at: string;
  last_message_at: string;
}

// Phase configuration with progress tracking (IDs match database enum values)
const PHASES = [
  { id: 'discovery', name: 'Discovery', icon: Search, color: 'text-blue-600', description: 'Explore industries' },
  { id: 'niche_drilling', name: 'Niche', icon: Target, color: 'text-purple-600', description: 'Find your niche' },
  { id: 'uvz_identification', name: 'UVZ', icon: Crosshair, color: 'text-uvz-orange', description: 'Drill your UVZ' },
  { id: 'validation', name: 'Validation', icon: CheckCircle, color: 'text-green-600', description: 'Validate demand' },
  { id: 'product_ideation', name: 'Product', icon: Lightbulb, color: 'text-yellow-600', description: 'Create products' },
  { id: 'completed', name: 'Completed', icon: CheckCircle, color: 'text-green-700', description: 'Research complete' },
] as const;

type PhaseId = typeof PHASES[number]['id'];

const getPhaseProgress = (phase: string): { index: number; percentage: number } => {
  const normalizedPhase = phase?.toLowerCase() || 'discovery';
  const phaseIndex = PHASES.findIndex(p => p.id === normalizedPhase);
  if (phaseIndex === -1) return { index: 0, percentage: 10 };
  // Calculate percentage based on number of phases (excluding completed)
  const percentage = ((phaseIndex + 1) / (PHASES.length - 1)) * 100;
  return { index: phaseIndex, percentage: Math.min(percentage, 100) };
};

interface ChatSidebarProps {
  isOpen: boolean;
  isMobile: boolean;
  onClose: () => void;
  createNewChat: () => void;
  isLogoutOpen: boolean;
  setIsLogoutOpen: (open: boolean) => void;
  handleLogout: () => void;
  sessions?: Session[];
  currentSessionId?: string | null;
  onSelectSession?: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string) => void;
}

export default function ChatSidebar({
  isOpen,
  isMobile,
  onClose,
  createNewChat,
  isLogoutOpen,
  setIsLogoutOpen,
  handleLogout,
  sessions = [],
  currentSessionId,
  onSelectSession,
  onDeleteSession,
}: ChatSidebarProps) {
  if (!isOpen) return null;

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isMobile && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 bg-gray-50 border-r-2 border-black transition-all duration-300 w-72 flex flex-col ${
          isMobile ? 'shadow-2xl' : 'top-16'
        }`}
      >
        {/* Mobile header with close button */}
        {isMobile && (
          <div className="flex items-center justify-between p-4 border-b-2 border-black bg-white">
            <Link href="/chat" className="flex items-center">
              <img src="/2-photoroom.png" alt="manymarkets" className="h-8 w-auto" />
            </Link>
            <button
              onClick={onClose}
              className="p-2 bg-gray-100 border-2 border-black rounded hover:bg-gray-200 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {/* New Session Button */}
          <button
            onClick={() => {
              createNewChat();
              if (isMobile) onClose();
            }}
            className="w-full bg-uvz-orange text-white py-3 px-4 border-2 border-black shadow-brutal hover:-translate-y-0.5 transition-transform font-bold flex items-center justify-center gap-2 rounded"
          >
            <Plus className="w-5 h-5 shrink-0" />
            <span>New Session</span>
          </button>

          {/* Sessions List */}
          {sessions.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs font-bold uppercase text-gray-500 mb-2">
                Recent Sessions
              </h3>
              <div className="space-y-2">
                {sessions.slice(0, 10).map((session) => {
                  const { index: phaseIndex } = getPhaseProgress(session.phase);
                  const PhaseIcon = PHASES[phaseIndex]?.icon || Search;
                  const phaseColor = PHASES[phaseIndex]?.color || 'text-gray-500';
                  
                  return (
                  <div
                    key={session.id}
                    className={`group relative bg-white border-2 border-black rounded p-3 cursor-pointer transition-all hover:shadow-brutal ${
                      currentSessionId === session.id ? 'ring-2 ring-uvz-orange' : ''
                    }`}
                    onClick={() => {
                      onSelectSession?.(session.id);
                      if (isMobile) onClose();
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <PhaseIcon className={`w-4 h-4 shrink-0 mt-0.5 ${phaseColor}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{session.title}</p>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium ${phaseColor}`}>
                            {PHASES[phaseIndex]?.name || 'Discovery'}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">{formatDate(session.last_message_at)}</span>
                        </div>
                      </div>
                    </div>
                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession?.(session.id);
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-100 border border-red-300 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
                      aria-label="Delete session"
                    >
                      <Trash2 className="w-3 h-3 text-red-600" />
                    </button>
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Phase Progress - UVZ Journey Tracker */}
          <div className="mt-6">
              <h3 className="text-xs font-bold uppercase text-gray-500 mb-2">
                🎯 UVZ Journey
              </h3>
              {(() => {
                const currentSession = sessions.find(s => s.id === currentSessionId);
                const currentPhase = currentSession?.phase || 'discovery';
                const { index: currentIndex, percentage } = getPhaseProgress(currentPhase);
                const CurrentPhaseIcon = PHASES[currentIndex]?.icon || Search;
                
                return (
                  <div className="bg-white border-2 border-black p-3 rounded">
                    {/* Current Phase Display */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`p-1.5 rounded border-2 border-black ${PHASES[currentIndex]?.color || 'text-gray-600'} bg-gray-50`}>
                        <CurrentPhaseIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-black text-sm">{PHASES[currentIndex]?.name || 'Discovery'}</p>
                        <p className="text-xs text-gray-500">{PHASES[currentIndex]?.description || 'Explore industries'}</p>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="relative mb-3">
                      <div className="h-2.5 bg-gray-200 border border-black rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-uvz-orange transition-all duration-500" 
                          style={{ width: `${percentage}%` }} 
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1 text-right">{Math.round(percentage)}% to UVZ</p>
                    </div>
                    
                    {/* Phase Steps - hide 'completed' unless we're there */}
                    <div className="space-y-1.5">
                      {PHASES.filter(phase => phase.id !== 'completed' || currentIndex === PHASES.length - 1).map((phase, idx) => {
                        const PhaseIcon = phase.icon;
                        const isCompleted = idx < currentIndex;
                        const isCurrent = idx === currentIndex;
                        
                        return (
                          <div 
                            key={phase.id}
                            className={`flex items-center gap-2 text-xs py-1 px-2 rounded transition-colors ${
                              isCurrent 
                                ? 'bg-uvz-orange/10 border border-uvz-orange' 
                                : isCompleted 
                                  ? 'bg-green-50' 
                                  : 'bg-gray-50'
                            }`}
                          >
                            <PhaseIcon className={`w-3 h-3 ${
                              isCurrent 
                                ? phase.color 
                                : isCompleted 
                                  ? 'text-green-600' 
                                  : 'text-gray-400'
                            }`} />
                            <span className={`font-medium ${
                              isCurrent 
                                ? 'text-black' 
                                : isCompleted 
                                  ? 'text-green-700' 
                                  : 'text-gray-400'
                            }`}>
                              {phase.name}
                            </span>
                            {isCompleted && <CheckCircle className="w-3 h-3 text-green-600 ml-auto" />}
                            {isCurrent && <span className="ml-auto text-uvz-orange font-bold">●</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

          {/* Insights */}
          <div className="mt-6">
              <h3 className="text-xs font-bold uppercase text-gray-500 mb-2">
                💡 Tips
              </h3>
              <div className="bg-white border-2 border-black p-3 rounded">
                <ul className="text-xs font-medium space-y-1 text-gray-700">
                  <li>✓ Be specific about your interests</li>
                  <li>✓ Share your experience level</li>
                  <li>✓ Consider audience size</li>
                  <li>✓ Think about monetization</li>
                </ul>
              </div>
            </div>

          {/* Quick Actions */}
          <div className="mt-6">
              <h3 className="text-xs font-bold uppercase text-gray-500 mb-2">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Link
                  href="/marketplace"
                  onClick={() => isMobile && onClose()}
                  className="block text-sm font-bold text-center py-2 bg-white border-2 border-black rounded hover:shadow-brutal transition-shadow"
                >
                  Browse Marketplace
                </Link>
                <Link
                  href="/builder"
                  onClick={() => isMobile && onClose()}
                  className="block text-sm font-bold text-center py-2 bg-white border-2 border-black rounded hover:shadow-brutal transition-shadow"
                >
                  Product Builder
                </Link>
              </div>
            </div>
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t-2 border-black">
          <button
            onClick={() => setIsLogoutOpen(true)}
            className="w-full bg-white text-black py-3 px-4 border-2 border-black font-bold rounded hover:bg-gray-100 transition-colors"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {isLogoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            onClick={() => setIsLogoutOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="relative bg-white border-4 border-black p-6 w-full max-w-md mx-4 shadow-brutal">
            <h2 className="text-xl font-black mb-4">Are you sure you want to leave?</h2>
            <p className="text-sm text-gray-600 mb-6">
              If you log out, your session will be cleared and you'll be redirected to the login page.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsLogoutOpen(false)}
                className="px-4 py-2 border-2 border-black rounded font-medium hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-uvz-orange text-white border-2 border-black rounded font-bold hover:-translate-y-0.5 transition-transform"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
