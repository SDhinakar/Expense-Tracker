"use client"

import { motion } from "framer-motion"

const RINGS = [
  { color: "oklch(0.65 0.24 264)", shadow: "oklch(0.65 0.24 264 / 0.6)" },   // Purple
  { color: "oklch(0.70 0.22 300)", shadow: "oklch(0.70 0.22 300 / 0.5)" },   // Pink/Fuchsia
  { color: "oklch(0.75 0.18 195)", shadow: "oklch(0.75 0.18 195 / 0.5)" },   // Cyan
]

export function Loader({ inline = false }: { inline?: boolean }) {
  const content = (
    <div className="relative flex items-center justify-center w-20 h-20">
      {RINGS.map((ring, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${(i + 1) * 1.75}rem`,
            height: `${(i + 1) * 1.75}rem`,
            border: "2px solid transparent",
            borderTopColor: ring.color,
            borderRightColor: ring.color,
            boxShadow: `0 0 16px 2px ${ring.shadow}`,
          }}
          animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
          transition={{
            duration: 1.4 + i * 0.5,
            ease: "linear",
            repeat: Infinity,
          }}
        />
      ))}

      {/* Pulsing center orb */}
      <motion.div
        className="w-3 h-3 rounded-full"
        style={{
          background: "radial-gradient(circle, oklch(0.85 0.18 264), oklch(0.65 0.24 264))",
          boxShadow: "0 0 24px 6px oklch(0.65 0.24 264 / 0.8)",
        }}
        animate={{ scale: [0.8, 1.4, 0.8], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.6, ease: "easeInOut", repeat: Infinity }}
      />
    </div>
  )

  if (inline) {
    return (
      <div className="flex items-center justify-center py-16">
        {content}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-6 bg-background/70 backdrop-blur-lg">
      {content}
      <motion.p
        className="text-sm font-semibold tracking-widest uppercase"
        style={{ color: "oklch(0.7 0.02 264)" }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.8, ease: "easeInOut", repeat: Infinity }}
      >
        Loading...
      </motion.p>
    </div>
  )
}
