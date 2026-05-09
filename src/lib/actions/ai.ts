"use server"

import { groq } from "@/lib/groq"
import { auth } from "@/auth"

export async function getFinancialAdvisorInsights(data: any) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const {
    incomeTotal,
    expenseTotal,
    balance,
    transactions,
    savingsRate
  } = data

  const prompt = `
    You are Zenithe AI, a friendly financial advisor. 
    Analyze the following financial data and provide 3-4 simple, clear, and actionable insights.
    
    CRITICAL: Use VERY SIMPLE English. No complex financial jargon. Speak like you are talking to a friend.
    
    DATA:
    - Total Income: ₹${incomeTotal}
    - Total Expenses: ₹${expenseTotal}
    - Current Balance: ₹${balance}
    - Savings Rate: ${savingsRate.toFixed(1)}%
    - Recent Transactions: ${JSON.stringify(transactions.slice(0, 15).map((t: any) => ({ title: t.title, amount: t.amount, type: t.type, category: t.category.name })))}

    FORMAT:
    Return ONLY a JSON array of objects:
    [
      { "title": "Simple Title", "description": "Easy to understand advice", "icon": "LucideIconName", "color": "text-color", "bg": "bg-color" }
    ]
    
    Icon options: Target, AlertCircle, Flame, Activity, TrendingUp, Zap, ShieldCheck
    Color options: text-emerald-500, text-rose-500, text-amber-500, text-primary, text-blue-500
    BG options: bg-emerald-500/10, bg-rose-500/10, bg-amber-500/10, bg-primary/10, bg-blue-500/10
  `

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
    })

    const response = JSON.parse(completion.choices[0].message.content || "{}")
    const insights = response.insights || response 
    return Array.isArray(insights) ? insights : []
  } catch (error) {
    console.error("Groq AI Error:", error)
    return []
  }
}

export async function processNoteWithAI(content: string, action: "summarize" | "extract_tasks" | "refine") {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const prompts = {
    summarize: "Summarize this note using very simple bullet points. Use easy words.",
    extract_tasks: "List the main things to do from this note. Use simple language.",
    refine: "Make this note clearer and easier to read. Use simple, friendly English."
  }

  const prompt = `
    ${prompts[action]}
    Use SIMPLE English. No big words.
    
    NOTE CONTENT:
    "${content}"
    
    Return ONLY the processed text.
  `

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
    })

    return completion.choices[0].message.content
  } catch (error) {
    console.error("Groq AI Note Error:", error)
    return "Something went wrong with the AI."
  }
}

export async function generateTaskDescription(title: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const prompt = `
    Create a very short, simple description for a task titled: "${title}".
    The description should be 1-2 easy sentences. Use simple English.
    
    Return ONLY the description text.
  `

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
    })

    return completion.choices[0].message.content?.trim()
  } catch (error) {
    return ""
  }
}

export async function suggestCategory(title: string, categories: { id: string, name: string }[]) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const prompt = `
    Pick the best category for "${title}".
    CATEGORIES: ${categories.map(c => c.name).join(", ")}
    
    Return ONLY the category name. If none fit, return "Other".
  `

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
    })

    const suggestedName = completion.choices[0].message.content?.trim()
    const category = categories.find(c => c.name.toLowerCase() === suggestedName?.toLowerCase())
    return category?.id || null
  } catch (error) {
    return null
  }
}
