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
    <div className="inline-flex items-center bg-white/70 backdrop-blur-sm border-2 border-uvz-orange text-black py-2 px-4 rounded-full text-sm font-semibold shadow-sm z-50">
      <div className="mr-3">🎉 <span className="font-bold">ManyMarkets is free today (effective {effectiveDate})</span></div>
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
                <div className="ml-2 text-sm text-uvz-orange font-medium" aria-live="polite">
                    Ends in {time}
                </div>
            );
        }
        return <Countdown />;
    })()}
    </div>
  );
}
