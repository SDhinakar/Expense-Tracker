"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Zap, Target, Flame, Activity, AlertCircle, Sparkles, TrendingUp, ShieldCheck, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/context/ToastContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface InsightsCardProps {
  insights: any[]
  loading?: boolean
  onToggleAI?: () => void
  isAIMode?: boolean
  aiLoading?: boolean
}

export function InsightsCard({ insights, loading, onToggleAI, isAIMode, aiLoading }: InsightsCardProps) {
  const iconMap: Record<string, any> = {
    Target,
    Flame,
    Activity,
    AlertCircle,
    TrendingUp,
    Zap,
    ShieldCheck
  }
  if (loading) {
    return (
      <Card className="glass border-primary/20 bg-primary/5 animate-pulse">
        <CardHeader className="h-12 w-1/2 bg-white/5 rounded-lg mb-4" />
        <CardContent className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-20 bg-white/5 rounded-xl border border-white/5 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(
      "glass border-primary/20 transition-all duration-500",
      isAIMode ? "bg-primary/[0.08]" : "bg-primary/5"
    )}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          {isAIMode ? (
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          ) : (
            <Zap className="w-5 h-5 text-primary" />
          )}
          <CardTitle className="text-lg font-bold">
            {isAIMode ? "Zenithe Intelligence" : "Smart Insights"}
          </CardTitle>
        </div>
        <button
          onClick={onToggleAI}
          disabled={loading || aiLoading}
          className={cn(
            "p-2 rounded-xl transition-all border border-white/5",
            isAIMode ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white/5 text-muted-foreground hover:text-white"
          )}
        >
          {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        </button>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.length === 0 ? (
          <p className="text-sm text-muted-foreground">Add more transactions to unlock insights.</p>
        ) : (
          <AnimatePresence mode="popLayout">
            {insights.map((insight, i) => (
              <motion.div
                key={insight.title}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={cn("p-4 rounded-2xl flex gap-4 items-start border border-white/5", insight.bg)}
              >
                <div className={cn("p-2.5 rounded-xl bg-background/40 shrink-0", insight.color)}>
                  {React.createElement(iconMap[insight.icon] || AlertCircle, { className: "w-5 h-5" })}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{insight.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{insight.description}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  )
}
