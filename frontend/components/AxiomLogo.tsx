"use client";
import React from 'react';
import { motion } from 'framer-motion';

const AxiomLogo = ({ size = 24 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 48 48" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0 }}
  >
    {/* Hexagonal Frame */}
    <path 
      d="M24 4L8 14V34L24 44L40 34V14L24 4Z" 
      stroke="var(--text-primary)" 
      strokeWidth="1.5" 
      strokeLinejoin="round"
    />
    {/* Crystalline Core */}
    <path 
      d="M24 44V24" 
      stroke="var(--text-primary)" 
      strokeWidth="1" 
      opacity="0.4"
    />
    <path 
      d="M24 24L8 14" 
      stroke="var(--text-primary)" 
      strokeWidth="1" 
      opacity="0.4"
    />
    <path 
      d="M24 24L40 14" 
      stroke="var(--text-primary)" 
      strokeWidth="1" 
      opacity="0.4"
    />
    {/* Central Focus Node */}
    <motion.circle 
      cx="24" 
      cy="24" 
      r="3" 
      fill="var(--accent)" 
      animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.circle 
      cx="24" 
      cy="24" 
      r="6" 
      stroke="var(--accent)" 
      strokeWidth="0.5" 
      animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.4, 0.1] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    />
  </svg>
);

export default AxiomLogo;
