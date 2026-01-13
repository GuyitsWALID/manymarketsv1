'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function PromoBanner() {
  const CODE = 'LIFETIMEOFFERS';
  const [copied, setCopied] = useState(false);
  const [repeats, setRepeats] = useState(2);
  const [duration, setDuration] = useState(16);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sampleRef = useRef<HTMLSpanElement | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  useEffect(() => {
    function measureAndSet() {
      if (!containerRef.current || !sampleRef.current) return;
      const containerWidth = containerRef.current.getBoundingClientRect().width;
      const singleWidth = sampleRef.current.getBoundingClientRect().width;
      if (singleWidth === 0) return;

      // Number of repeats so the sequence is at least as wide as the container
      const minRepeats = Math.max(2, Math.ceil(containerWidth / singleWidth) + 1);
      setRepeats(minRepeats);

      // Compute animation duration so speed ~ 80px/s
      const sequenceWidth = singleWidth * minRepeats;
      const speed = 80; // px per second
      const dur = Math.max(8, Math.round(sequenceWidth / speed));
      setDuration(dur);

      // Publish banner height as a CSS variable so the header can offset itself
      const height = containerRef.current.getBoundingClientRect().height;
      try {
        document.documentElement.style.setProperty('--promo-banner-height', `${height}px`);
      } catch (e) {
        // ignore in non-browser environments
      }
    }

    measureAndSet();

    let rafId: number;
    function onResize() {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(measureAndSet);
    }

    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(rafId);
      try {
        document.documentElement.style.removeProperty('--promo-banner-height');
      } catch (e) {
        // ignore
      }
    };
  }, []);

  const message = `One time payment for a full pro lifetime access of ManyMarkets — Use code "${CODE}" for 50% off`;
  const router = useRouter();

  const handleJoin = async () => {
    const supabase = createClient();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        router.push('/upgrade');
      } else {
        router.push(`/login?returnTo=${encodeURIComponent('/upgrade')}`);
      }
    } catch (err) {
      console.error('Join click auth check failed:', err);
      window.location.href = '/login?returnTo=' + encodeURIComponent('/upgrade');
    }
  };

  return (
    <div className="fixed top-0 left-0 w-full z-[9999] bg-orange-600 text-black pointer-events-auto">
      <div className="relative overflow-hidden" ref={containerRef}>
        <div className="flex items-center justify-between gap-4 px-2 sm:px-6 py-2 sm:py-2">
          {/* Marquee (flexes to fill available space) */}
          <div className="flex-1 overflow-hidden">
            <div className="marquee font-bold text-xs sm:text-sm md:text-base">
              {/* Invisible sample for measurements */}
              <span ref={sampleRef} className="inline-block opacity-0 whitespace-nowrap mr-6">{message}</span>

              <div
                className="marquee-track flex items-center"
                style={{ animation: `marquee ${duration}s linear infinite` }}
                aria-hidden
              >
                <div className="marquee-seq flex items-center gap-8">
                  {Array.from({ length: repeats }).map((_, i) => (
                    <span key={`a-${i}`} className="inline-block whitespace-nowrap">{message}</span>
                  ))}
                </div>

                <div className="marquee-seq flex items-center gap-8" aria-hidden>
                  {Array.from({ length: repeats }).map((_, i) => (
                    <span key={`b-${i}`} className="inline-block whitespace-nowrap">{message}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Controls (copy & join) */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <button
              aria-label={`Copy promo code ${CODE}`}
              onClick={handleCopy}
              className="flex items-center gap-2 bg-white text-black px-2 py-1 rounded border-2 border-black font-bold shadow-brutal text-xs sm:text-sm"
            >
              <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{copied ? 'Copied!' : CODE}</span>
              <span className="sm:hidden">{copied ? '✓' : CODE}</span>
            </button>

            <button
              onClick={handleJoin}
              className="ml-2 bg-black text-white px-2 py-1 rounded border-2 border-black font-bold shadow-brutal hover:bg-white hover:text-black transition text-xs sm:text-sm"
            >
              Join
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .marquee { position: relative; overflow: hidden; }
        .marquee-track { display: flex; gap: 0; align-items: center; }
        .marquee-seq { display: inline-flex; }

        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        /* Respect reduce motion preference */
        @media (prefers-reduced-motion: reduce) {
          .marquee-track { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
