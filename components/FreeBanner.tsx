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
            <span className="hidden sm:inline">ManyMarkets is free today (effective {effectiveDate})</span>
            <span className="inline sm:hidden">ManyMarkets is free today</span>
          </div>
          <div className="text-xs text-gray-600 hidden sm:block">Billing & paid plans are temporarily disabled</div>
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
      </div>
    </div>
  );
}
