"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function CyberBackground() {
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    const generatedPositions = Array.from({ length: 5 }, () => ({
      top: Math.random() * 100,
      left: Math.random() * 100,
    }));

    setPositions(generatedPositions);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-0">
      {positions.map((position, index) => (
        <motion.div
          key={index}
          className="absolute h-72 w-72 rounded-full bg-cyan-500 opacity-20 blur-3xl"
          style={{
            top: `${position.top}%`,
            left: `${position.left}%`,
          }}
          animate={{
            x: [0, 50, -50, 0],
            y: [0, -50, 50, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
          }}
        />
      ))}
    </div>
  );
}
