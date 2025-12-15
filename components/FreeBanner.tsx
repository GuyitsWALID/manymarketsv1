"use client";

import { useEffect, useState } from "react";
import { usePathname } from 'next/navigation';
import Link from "next/link";
import { ENABLE_PRICING } from '@/lib/config';

export default function FreeBanner() {
  // Only show the announcement when pricing is disabled
  if (ENABLE_PRICING) return null;

  // Only render the banner on the homepage to avoid site-wide repetition
  const pathname = usePathname();
  if (typeof pathname !== 'string' || pathname !== '/') return null;

  const now = new Date();
  const newYear = new Date(now.getFullYear() + 1, 0, 1);
  const effectiveDate = newYear.toLocaleDateString();

  return (
    <div className="mx-auto inline-flex flex-wrap sm:flex-nowrap items-center gap-2 bg-white/70 backdrop-blur-sm border-2 border-uvz-orange text-black py-2 px-3 rounded-full text-sm font-semibold shadow-sm z-50">
      <div className="flex items-center gap-3">
        <div className="text-base">🎉</div>
        <div className="leading-tight">
          <div className="font-bold text-sm sm:text-base">
            <span className="hidden sm:inline">ManyMarkets is free today</span>
            <span className="inline sm:hidden">ManyMarkets is free today</span>
          </div>
          
        </div>
      </div>

      <div className="flex items-center gap-3">
        {(() => {
          function Countdown() {
            const [times, setTimes] = useState(() => {
              const diff = newYear.getTime() - Date.now();
              return formatDiffs(diff);
            });

            useEffect(() => {
              const tick = () => {
                const diff = newYear.getTime() - Date.now();
                setTimes(formatDiffs(diff));
              };
              tick();
              const id = setInterval(tick, 1000);
              return () => clearInterval(id);
            }, []);

            function formatDiffs(ms: number) {
              if (ms <= 0) return { full: '0d 0h 0m 0s', compact: '0d' };
              const s = Math.floor(ms / 1000);
              const d = Math.floor(s / 86400);
              const h = Math.floor((s % 86400) / 3600);
              const m = Math.floor((s % 3600) / 60);
              const sec = s % 60;
              const full = `${d}d ${h}h ${m}m ${sec}s`;
              const compact = d > 0 ? `${d}d ${h}h` : `${h}h ${m}m`;
              return { full, compact };
            }

            return (
              <div className="text-xs sm:text-sm text-uvz-orange font-medium" aria-live="polite">
                <span className="block sm:hidden">Ends in {times.compact}</span>
                <span className="hidden sm:block">Ends in {times.full}</span>
              </div>
            );
          }

          return <Countdown />;
        })()}

        
      </div>
    </div>
  );
}
