"use client";

import { motion } from "framer-motion";

const DoodleContainer = ({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <motion.div
    className={`absolute ${className}`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ 
      opacity: 1, 
      y: [0, -10, 0],
      rotate: [0, 2, -2, 0]
    }}
    transition={{ 
      opacity: { duration: 0.5, delay },
      y: { repeat: Infinity, duration: 4, ease: "easeInOut", delay },
      rotate: { repeat: Infinity, duration: 5, ease: "easeInOut", delay: delay + 1 }
    }}
  >
    {children}
  </motion.div>
);

const CatDoodle = () => (
  <svg width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 80 L20 40 L30 20 L40 40 L60 40 L70 20 L80 40 L80 80 Z" stroke="black" strokeWidth="3" fill="white" />
    <path d="M30 50 L70 50" stroke="black" strokeWidth="3" /> {/* Sunglasses top */}
    <path d="M30 50 Q30 65 45 65 Q60 65 60 50" fill="black" /> {/* Left lens */}
    <path d="M60 50 Q60 65 75 65 Q90 65 90 50" fill="black" /> {/* Right lens */}
    <path d="M50 75 L45 80 L55 80 Z" fill="black" /> {/* Nose */}
    <path d="M20 80 Q50 90 80 80" stroke="black" strokeWidth="3" fill="white"/> {/* Body bottom */}
  </svg>
);

const HandDoodle = () => (
  <svg width="100" height="120" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 100 L20 60 Q20 40 40 40 L40 30 Q40 20 50 20 Q60 20 60 30 L60 40 L70 40 L70 50 L80 50 L80 80 Q80 100 60 100 Z" stroke="black" strokeWidth="3" fill="white" />
    <path d="M10 60 Q5 50 20 60" stroke="black" strokeWidth="3" /> {/* Thumb */}
    <path d="M80 60 Q95 50 80 80" stroke="black" strokeWidth="3" /> {/* Pinky */}
  </svg>
);

const PencilDoodle = () => (
  <svg width="60" height="120" viewBox="0 0 60 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="15" y="30" width="30" height="70" stroke="black" strokeWidth="3" fill="white" />
    <path d="M15 30 L30 5 L45 30 Z" stroke="black" strokeWidth="3" fill="white" />
    <path d="M30 5 L30 15" stroke="black" strokeWidth="3" />
    <path d="M25 50 Q30 55 35 50" stroke="black" strokeWidth="3" /> {/* Face */}
    <circle cx="22" cy="45" r="2" fill="black" />
    <circle cx="38" cy="45" r="2" fill="black" />
  </svg>
);

const CupDoodle = () => (
  <svg width="100" height="80" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 10 L20 60 Q20 75 50 75 Q80 75 80 60 L80 10 Z" stroke="black" strokeWidth="3" fill="white" />
    <path d="M80 20 Q95 20 95 40 Q95 60 80 60" stroke="black" strokeWidth="3" fill="none" />
    <path d="M30 10 Q50 20 70 10" stroke="black" strokeWidth="3" />
    <circle cx="40" cy="40" r="3" fill="black" />
    <circle cx="60" cy="40" r="3" fill="black" />
    <path d="M45 55 Q50 60 55 55" stroke="black" strokeWidth="3" />
  </svg>
);

const FireCursorDoodle = () => (
  <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M30 70 L30 30 L70 50 L50 60 L60 80 L50 85 L40 65 L30 70 Z" stroke="black" strokeWidth="3" fill="white" />
    <path d="M30 30 Q10 10 30 0 Q50 10 30 30" stroke="black" strokeWidth="3" fill="white" /> {/* Flame */}
    <circle cx="45" cy="50" r="3" fill="black" />
    <circle cx="55" cy="55" r="3" fill="black" />
  </svg>
);

const ComputerDoodle = () => (
  <svg width="120" height="100" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="10" width="100" height="70" rx="5" stroke="black" strokeWidth="3" fill="white" />
    <rect x="20" y="20" width="80" height="50" stroke="black" strokeWidth="2" />
    <path d="M40 80 L30 95 L90 95 L80 80" stroke="black" strokeWidth="3" fill="white" />
    <circle cx="45" cy="45" r="3" fill="black" />
    <circle cx="75" cy="45" r="3" fill="black" />
    <path d="M50 60 Q60 65 70 60" stroke="black" strokeWidth="3" />
  </svg>
);

export default function HeroAnimation() {
  return (
    <div className="relative w-full h-64 md:h-96 overflow-hidden mt-10 border-t-4 border-b-4 border-black bg-zinc-100">
      <div className="absolute inset-0 flex items-center justify-around px-10">
        <DoodleContainer delay={0} className="top-10 left-10 md:left-20">
          <CatDoodle />
        </DoodleContainer>
        
        <DoodleContainer delay={0.2} className="top-20 left-1/4 hidden md:block">
          <HandDoodle />
        </DoodleContainer>

        <DoodleContainer delay={0.4} className="top-5 left-1/3 hidden md:block">
          <PencilDoodle />
        </DoodleContainer>

        <DoodleContainer delay={0.6} className="top-24 right-1/3 hidden md:block">
          <CupDoodle />
        </DoodleContainer>

        <DoodleContainer delay={0.8} className="top-10 right-1/4 hidden md:block">
          <FireCursorDoodle />
        </DoodleContainer>

        <DoodleContainer delay={1.0} className="top-16 right-10 md:right-20">
          <ComputerDoodle />
        </DoodleContainer>
      </div>
      
      {/* Scrolling Text Background or Pattern could go here */}
      <div className="absolute bottom-2 right-4 font-black text-xs opacity-50">
        UVZ DOODLES
      </div>
    </div>
  );
}
