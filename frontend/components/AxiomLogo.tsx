"use client";
import { motion } from "framer-motion";

interface Props {
  size?: number;
}

/**
 * Axiom Premium Logo: "The Recursive Prism"
 * 
 * Represents the depth of the 5-agent reasoning engine.
 * A central diamond core with surrounding orbital fragments that suggest 
 * information synthesis and alignment.
 */
export default function AxiomLogo({ size = 24 }: Props) {
  const primaryColor = "#3B82F6"; // Electric Blue
  
  return (
    <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* Background Glow */}
      <div 
        style={{
          position: "absolute",
          inset: -size * 0.2,
          background: `radial-gradient(circle, ${primaryColor}44 0%, transparent 70%)`,
          filter: "blur(4px)",
          borderRadius: "50%",
          zIndex: 0
        }}
      />
      
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: "relative", zIndex: 1 }}
      >
        {/* Core Diamond */}
        <motion.path
          d="M12 3L20 12L12 21L4 12L12 3Z"
          stroke={primaryColor}
          strokeWidth="1.5"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
        
        {/* Inner Synthesis Pass */}
        <motion.path
          d="M12 7L16.5 12L12 17L7.5 12L12 7Z"
          fill={primaryColor}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.6 }}
          transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
        />
        
        {/* Orbital Fragments */}
        <motion.circle 
          cx="12" cy="3" r="1" fill={primaryColor}
          animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
        <motion.circle 
          cx="20" cy="12" r="1" fill="currentColor"
          animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.8, 0.2] }}
          transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
        />
        <motion.circle 
          cx="12" cy="21" r="1" fill={primaryColor}
          animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 2, delay: 1 }}
        />
        <motion.circle 
          cx="4" cy="12" r="1" fill="currentColor"
          animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.8, 0.2] }}
          transition={{ repeat: Infinity, duration: 2, delay: 1.5 }}
        />
      </svg>
    </div>
  );
}
