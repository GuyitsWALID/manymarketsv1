"use client";

import { useEffect, useState } from "react";
import { usePathname } from 'next/navigation';
import Link from "next/link";
import { ENABLE_PRICING } from '@/lib/config';

const STORAGE_KEY = 'free_banner_dismissed';

export default function FreeBanner() {
  // Only show the announcement when pricing is disabled
  if (ENABLE_PRICING) return null;

  // Only render the banner on the homepage to avoid site-wide repetition
  const pathname = usePathname();
  if (typeof pathname !== 'string' || pathname !== '/') return null;
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const dismissed = typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY);
      if (!dismissed) setShow(true);
    } catch (e) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  const onClose = () => {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
    setShow(false);
  };

const now = new Date();
const newYear = new Date(now.getFullYear() + 1, 0, 1);
const effectiveDate = newYear.toLocaleDateString();

  return (
    <div className="w-full max-w-xl mx-4 sm:mx-0 bg-white/70 backdrop-blur-sm border-2 border-uvz-orange text-black py-2 px-3 sm:px-4 rounded-full text-sm font-semibold shadow-sm z-50">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-3 sm:gap-4 text-center sm:text-left">
          <div className="text-base sm:text-sm">🎉</div>
          <div className="leading-tight">
            <div className="font-bold text-sm sm:text-base">ManyMarkets is free today (effective {effectiveDate})</div>
            <div className="text-xs text-gray-600 sm:text-sm">Billing & paid plans are temporarily disabled</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {(() => {
            function Countdown() {
              const [time, setTime] = useState(() => {
                const diff = newYear.getTime() - Date.now();
                return formatDiff(diff);
              });

              useEffect(() => {
                const tick = () => {
                  const diff = newYear.getTime() - Date.now();
                  setTime(formatDiff(diff));
                };
                tick();
                const id = setInterval(tick, 1000);
                return () => clearInterval(id);
              }, []);

              function formatDiff(ms: number) {
                if (ms <= 0) return '0d 0h 0m 0s';
                const s = Math.floor(ms / 1000);
                const d = Math.floor(s / 86400);
                const h = Math.floor((s % 86400) / 3600);
                const m = Math.floor((s % 3600) / 60);
                const sec = s % 60;
                return `${d}d ${h}h ${m}m ${sec}s`;
              }

              return (
                <div className="text-xs sm:text-sm text-uvz-orange font-medium" aria-live="polite">
                  Ends in {time}
                </div>
              );
            }
            return <Countdown />;
          })()}

          <Link href="/settings" className="hidden sm:inline-block text-xs underline text-gray-700">Learn more</Link>

          <button onClick={onClose} aria-label="Dismiss announcement" className="ml-1 sm:ml-3 bg-white p-1 rounded-full text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
