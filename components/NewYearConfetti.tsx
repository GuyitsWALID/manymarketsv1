"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";

export default function NewYearConfetti() {
  const [showMessage, setShowMessage] = useState(false);
  const [isValidDate, setIsValidDate] = useState(false);

  useEffect(() => {
    // Only show during the first 7 days of 2026 (Jan 1-7)
    const now = new Date();
    const endDate = new Date(2026, 0, 8); // January 8, 2026 (exclusive)
    const startDate = new Date(2026, 0, 1); // January 1, 2026
    
    if (now < startDate || now >= endDate) {
      return;
    }
    
    setIsValidDate(true);

    // Check if we've already shown the confetti this session
    const hasShown = sessionStorage.getItem("newYearConfettiShown");
    if (hasShown) {
      return;
    }

    // Show the message
    setShowMessage(true);

    // Mark as shown for this session
    sessionStorage.setItem("newYearConfettiShown", "true");

    // Fire confetti from multiple angles
    const duration = 4000;
    const end = Date.now() + duration;

    const colors = ["#f97316", "#1e3a8a", "#fbbf24", "#10b981", "#ef4444", "#8b5cf6"];

    // Initial burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors,
    });

    // Continuous confetti rain
    const interval = setInterval(() => {
      if (Date.now() > end) {
        clearInterval(interval);
        return;
      }

      // Left side
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });

      // Right side
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });
    }, 50);

    // Hide message after animation
    const messageTimeout = setTimeout(() => {
      setShowMessage(false);
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(messageTimeout);
    };
  }, []);

  if (!showMessage) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center">
      <div 
        className="text-center"
        style={{
          animation: 'fade-in-out 5s ease-in-out forwards',
        }}
      >
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-8 py-6 shadow-2xl border-2 border-uvz-orange">
          <div className="text-4xl mb-2">🎆</div>
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-uvz-orange to-uvz-blue bg-clip-text text-transparent">
            Happy New Year 2026!
          </h2>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            Wishing you success in all your ventures! 🚀
          </p>
        </div>
      </div>
    </div>
  );
}
