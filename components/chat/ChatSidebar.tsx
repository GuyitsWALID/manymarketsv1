'use client';

import Link from 'next/link';
import { Plus, MessageSquare, Trash2, Target, Search, Crosshair, CheckCircle, Lightbulb, Zap } from 'lucide-react';

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
        <div className="flex-1 overflow-y-auto p-4 pt-20 md:pt-4">
          {/* Sessions List */}
          {sessions.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase text-gray-500 mb-2">
                Recent Sessions
              </h3>
              <div className="space-y-2">
                {sessions.slice(0, 10).map((session) => {
                  const { index: phaseIndex } = getPhaseProgress(session.phase);
                  const PhaseIcon = PHASES[phaseIndex]?.icon || Search;
                  const phaseColor = PHASES[phaseIndex]?.color || 'text-gray-500';
                  const isActive = currentSessionId === session.id;
                  
                  return (
                  <div
                    key={session.id}
                    role="button"
                    tabIndex={0}
                    className={`group relative w-full text-left bg-white border-2 border-black rounded p-3 cursor-pointer transition-all active:scale-[0.98] hover:shadow-brutal ${
                      isActive ? 'ring-2 ring-uvz-orange shadow-brutal' : ''
                    }`}
                    onClick={() => {
                      if (!isActive) {
                        onSelectSession?.(session.id);
                      }
                      if (isMobile) onClose();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (!isActive) {
                          onSelectSession?.(session.id);
                        }
                        if (isMobile) onClose();
                      }
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
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onDeleteSession?.(session.id);
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-red-100 border border-red-300 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200 active:bg-red-300"
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
                  href="/idea-score"
                  onClick={() => isMobile && onClose()}
                  className="flex items-center justify-center gap-2 text-sm font-bold text-center py-2 bg-uvz-orange text-white border-2 border-black rounded hover:shadow-brutal transition-shadow"
                >
                  <Zap className="w-4 h-4" />
                  Idea Score
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
          <div className="relative bg-white border-4 border-black p-6 w-full max-w-sm mx-4 shadow-brutal rounded-lg">
            <h2 className="text-xl font-black mb-2 text-center">Are you sure you want to leave?</h2>
            <p className="text-sm text-gray-600 mb-6 text-center">
              You'll need to log in again to continue your research.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsLogoutOpen(false)}
                className="flex-1 px-4 py-3 bg-gray-100 border-2 border-black rounded-lg font-bold hover:bg-gray-200 transition-colors"
              >
                No, stay
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-3 bg-red-500 text-white border-2 border-black rounded-lg font-bold hover:bg-red-600 hover:-translate-y-0.5 transition-all"
              >
                Yes, log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
