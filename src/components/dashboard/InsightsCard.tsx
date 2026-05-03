"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Zap, Target, Flame, Activity, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface InsightsCardProps {
  insights: any[]
  loading?: boolean
}

export function InsightsCard({ insights, loading }: InsightsCardProps) {
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
    <Card className="glass border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg font-bold">Smart Insights</CardTitle>
        </div>
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
                  {insight.icon === "Target" ? (
                    <Target className="w-5 h-5" />
                  ) : insight.icon === "Flame" ? (
                    <Flame className="w-5 h-5" />
                  ) : insight.icon === "Activity" ? (
                    <Activity className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
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
