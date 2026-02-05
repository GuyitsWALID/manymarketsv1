'use client';

import Link from 'next/link';
import { Plus, User, Menu, X, Settings, LogOut, Zap, Crown } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FREE_SESSION_LIMIT } from '@/lib/config';

interface ChatHeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  createNewChat: () => void;
  currentUser: Record<string, unknown> | null;
  profileMenuOpen: boolean;
  setProfileMenuOpen: (open: boolean) => void;
  setIsLogoutOpen: (open: boolean) => void;
  sessionCount?: number;
  isPro?: boolean;
  onUpgradeClick?: () => void;
}

export default function ChatHeader({
  isSidebarOpen,
  setIsSidebarOpen,
  createNewChat,
  currentUser,
  profileMenuOpen,
  setProfileMenuOpen,
  setIsLogoutOpen,
  sessionCount = 0,
  isPro = false,
  onUpgradeClick,
}: ChatHeaderProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  const sessionsRemaining = Math.max(0, FREE_SESSION_LIMIT - sessionCount);
  const hasReachedLimit = !isPro && sessionCount >= FREE_SESSION_LIMIT;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }

    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileMenuOpen, setProfileMenuOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b-2 border-black flex items-center justify-between px-4 md:px-6">
      {/* Left: Toggle + Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-uvz-orange text-white border-2 border-black rounded shadow-brutal hover:-translate-y-0.5 transition-transform"
          aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          aria-expanded={isSidebarOpen}
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <Link href="/chat" className="flex items-center">
          <img src="/2-Photoroom.png" alt="manymarkets" className="h-9 w-auto" />
        </Link>
      </div>

      {/* Right: Session Counter + New Chat + Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Session Usage Counter (for free users) */}
        {currentUser && !isPro && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 border-2 border-gray-300 rounded-lg">
            <Zap className={`w-4 h-4 ${hasReachedLimit ? 'text-red-500' : 'text-uvz-orange'}`} />
            <span className={`text-sm font-bold ${hasReachedLimit ? 'text-red-500' : 'text-gray-700'}`}>
              {sessionCount}/{FREE_SESSION_LIMIT}
            </span>
            <span className="text-xs text-gray-500 hidden md:inline">sessions</span>
          </div>
        )}
        
        {/* Pro Badge */}
        {currentUser && isPro && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-uvz-orange to-pink-500 text-white border-2 border-black rounded-lg">
            <Crown className="w-4 h-4" />
            <span className="text-sm font-bold">PRO</span>
          </div>
        )}
        
        {/* Upgrade Button (for free users who hit limit) */}
        {currentUser && !isPro && hasReachedLimit && (
          <button
            onClick={onUpgradeClick}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-uvz-orange to-pink-500 text-white border-2 border-black font-bold text-sm rounded shadow-brutal hover:-translate-y-0.5 transition-transform animate-pulse"
          >
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">Upgrade</span>
          </button>
        )}
        
        {/* New Chat Button - disabled if limit reached for free users */}
        {hasReachedLimit ? (
          <button
            onClick={onUpgradeClick}
            className="hidden sm:flex items-center gap-2 bg-gray-300 text-gray-500 px-4 py-2 border-2 border-gray-400 font-bold rounded cursor-not-allowed"
            title="Upgrade to Pro for unlimited sessions"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        ) : (
          <Link
            href="/chat"
            onClick={() => {
              // Clear active session so chat page starts fresh
              if (typeof window !== 'undefined') {
                localStorage.removeItem('uvz_active_session');
              }
            }}
            className="hidden sm:flex items-center gap-2 bg-uvz-orange text-white px-4 py-2 border-2 border-black font-bold rounded shadow-brutal hover:-translate-y-0.5 transition-transform"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </Link>
        )}
        
        {/* Mobile New Chat Button */}
        {hasReachedLimit ? (
          <button
            onClick={onUpgradeClick}
            className="sm:hidden p-2 bg-gray-300 text-gray-500 border-2 border-gray-400 rounded cursor-not-allowed"
            aria-label="Upgrade to create new chat"
          >
            <Plus className="w-5 h-5" />
          </button>
        ) : (
          <Link
            href="/chat"
            onClick={() => {
              if (typeof window !== 'undefined') {
                localStorage.removeItem('uvz_active_session');
              }
            }}
            className="sm:hidden p-2 bg-uvz-orange text-white border-2 border-black rounded shadow-brutal"
            aria-label="New chat"
          >
            <Plus className="w-5 h-5" />
          </Link>
        )}

        {currentUser ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex items-center gap-2 p-2 border-2 border-black rounded bg-white hover:bg-gray-50 transition-colors"
              aria-label="Profile menu"
              aria-expanded={profileMenuOpen}
            >
              <User className="w-5 h-5" />
              <span className="hidden md:inline font-bold text-sm truncate max-w-[120px]">
                {(currentUser as any)?.email ?? 'Profile'}
              </span>
            </button>
            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border-2 border-black rounded shadow-brutal z-50 overflow-hidden">
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    router.push('/settings');
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-100 font-medium flex items-center gap-3 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <div className="border-t border-gray-200" />
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    setIsLogoutOpen(true);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 font-medium flex items-center gap-3 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Log out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="px-4 py-2 border-2 border-black bg-white font-bold rounded hover:bg-gray-50"
          >
            Login
          </Link>
        )}
      </div>
    </header>
  );
}
