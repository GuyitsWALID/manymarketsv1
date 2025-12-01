'use client';

import Link from 'next/link';
import { Plus, User, Menu, X } from 'lucide-react';

interface ChatHeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  createNewChat: () => void;
  currentUser: Record<string, unknown> | null;
  profileMenuOpen: boolean;
  setProfileMenuOpen: (open: boolean) => void;
  setIsLogoutOpen: (open: boolean) => void;
}

export default function ChatHeader({
  isSidebarOpen,
  setIsSidebarOpen,
  createNewChat,
  currentUser,
  profileMenuOpen,
  setProfileMenuOpen,
  setIsLogoutOpen,
}: ChatHeaderProps) {
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
          <img src="/2-photoroom.png" alt="manymarkets" className="h-9 w-auto" />
        </Link>
      </div>

      {/* Right: New Chat + Profile */}
      <div className="flex items-center gap-3">
        <button
          onClick={createNewChat}
          className="hidden sm:flex items-center gap-2 bg-uvz-orange text-white px-4 py-2 border-2 border-black font-bold rounded shadow-brutal hover:-translate-y-0.5 transition-transform"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>
        <button
          onClick={createNewChat}
          className="sm:hidden p-2 bg-uvz-orange text-white border-2 border-black rounded shadow-brutal"
          aria-label="New chat"
        >
          <Plus className="w-5 h-5" />
        </button>

        {currentUser ? (
          <div className="relative">
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex items-center gap-2 p-2 border-2 border-black rounded bg-white"
              aria-label="Profile menu"
            >
              <User className="w-5 h-5" />
              <span className="hidden md:inline font-bold text-sm truncate max-w-[120px]">
                {(currentUser as any)?.email ?? 'Profile'}
              </span>
            </button>
            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border-2 border-black shadow-brutal z-50">
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    setIsLogoutOpen(true);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 font-medium"
                >
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
