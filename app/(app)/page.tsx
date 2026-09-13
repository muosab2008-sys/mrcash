"use client"

import { useMemo, useState } from "react"
import { ArrowUpRight, Check, Flame, Gamepad2, Gift, LockKeyhole, Search, Sparkles, Star, Trophy, Wallet, Zap } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

const offerwalls = [
  { name: "PlayTime", category: "Games", reward: "Up to 18,400 MC", color: "from-violet-500 to-fuchsia-500", icon: Gamepad2, featured: true },
  { name: "Survey Harbor", category: "Surveys", reward: "Average 2,250 MC", color: "from-cyan-400 to-blue-600", icon: Search, featured: false },
  { name: "GemiAd", category: "Apps", reward: "Average 8,900 MC", color: "from-orange-400 to-rose-500", icon: Zap, featured: true },
  { name: "TaskWall", category: "Tasks", reward: "Average 5,600 MC", color: "from-emerald-400 to-teal-600", icon: Check, featured: false },
  { name: "Offery", category: "Surveys", reward: "Average 3,200 MC", color: "from-amber-300 to-orange-500", icon: Gift, featured: false },
  { name: "PixyLabs", category: "Apps", reward: "Average 7,100 MC", color: "from-blue-400 to-indigo-600", icon: Sparkles, featured: false },
]

const activity = [
  ["Mia R.", "completed Solitaire Grand Harvest", "+4,250 MC", "2m ago"],
  ["Jordan K.", "finished a Survey Harbor study", "+1,800 MC", "4m ago"],
  ["Sam T.", "reached level 3 in PlayTime", "+6,400 MC", "8m ago"],
]

export default function EarnPage() {
  const { userData } = useAuth()
  const [filter, setFilter] = useState("All offers")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<string | null>(null)
  const points = userData?.points ?? 24850
  const level = userData?.level ?? 7
  const username = userData?.username ?? "Alex"
  const filteredOffers = useMemo(() => offerwalls.filter((offer) => (filter === "All offers" || offer.category === filter) && offer.name.toLowerCase().includes(search.toLowerCase())), [filter, search])

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_75%_0%,rgba(79,70,229,.16),transparent_30%),radial-gradient(circle_at_10%_30%,rgba(6,182,212,.08),transparent_25%)] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-8">
          <div className="absolute -right-20 -top-24 size-72 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Badge className="mb-4 border-cyan-400/20 bg-cyan-400/10 text-cyan-300">MEMBER DASHBOARD</Badge>
              <h1 className="max-w-xl text-3xl font-black tracking-tight text-white sm:text-5xl">Turn your spare time into <span className="bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">real rewards.</span></h1>
              <p className="mt-3 max-w-lg text-sm leading-6 text-white/55">Welcome back, {username}. Pick an offer, complete it, and watch your balance grow.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-[380px]">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex items-center gap-2 text-xs text-white/45"><Wallet className="size-4 text-cyan-300" /> Available balance</div><p className="mt-2 text-2xl font-black text-white">{points.toLocaleString()} <span className="text-sm font-semibold text-cyan-300">MC</span></p><p className="mt-1 text-xs text-white/40">${(points / 1000).toFixed(2)} cash value</p></div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex items-center gap-2 text-xs text-white/45"><Trophy className="size-4 text-violet-300" /> Current level</div><p className="mt-2 text-2xl font-black text-white">Level {level}</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[68%] rounded-full bg-gradient-to-r from-cyan-400 to-violet-500" /></div></div>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="text-xl font-bold text-white">Featured ways to earn</h2><p className="mt-1 text-sm text-white/45">Higher rewards, verified and ready for you.</p></div>
          <div className="flex gap-2 overflow-x-auto pb-1">{["All offers", "Games", "Surveys", "Apps", "Tasks"].map((item) => <Button key={item} size="sm" variant={filter === item ? "secondary" : "ghost"} onClick={() => setFilter(item)} className={filter === item ? "border border-white/10 bg-white/10 text-white" : "text-white/50 hover:text-white"}>{item}</Button>)}</div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredOffers.map((offer) => { const Icon = offer.icon; return <Card key={offer.name} className="group overflow-hidden border-white/10 bg-white/[0.04] transition-all hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-white/[0.07]">
            <CardHeader className="relative pb-3"><div className={`mb-2 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${offer.color} shadow-lg`}><Icon className="size-6 text-white" /></div><div className="flex items-center justify-between gap-3"><CardTitle className="text-lg text-white">{offer.name}</CardTitle>{offer.featured && <Badge className="border-orange-400/20 bg-orange-400/10 text-orange-300"><Flame className="mr-1 size-3" /> Hot</Badge>}</div><p className="text-sm text-white/45">{offer.category} · {offer.reward}</p></CardHeader>
            <CardContent><Button className="w-full bg-white text-black hover:bg-cyan-100" onClick={() => setSelected(offer.name)}>View offers <ArrowUpRight data-icon="inline-end" /></Button></CardContent>
          </Card> })}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.3fr_.7fr]">
          <Card className="border-white/10 bg-white/[0.035]"><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="text-white">Live community activity</CardTitle><p className="mt-1 text-sm text-white/45">Members earning right now</p></div><span className="flex items-center gap-2 text-xs text-emerald-300"><span className="size-2 animate-pulse rounded-full bg-emerald-400" /> Live</span></CardHeader><CardContent className="flex flex-col gap-3">{activity.map(([name, action, reward, time]) => <div key={name} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-black/20 p-3"><div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 text-xs font-bold text-white">{name[0]}</div><div className="min-w-0 flex-1"><p className="truncate text-sm text-white"><span className="font-semibold">{name}</span> {action}</p><p className="text-xs text-white/35">{time}</p></div><span className="text-sm font-bold text-emerald-300">{reward}</span></div>)}</CardContent></Card>
          <Card className="border-violet-300/15 bg-gradient-to-br from-violet-500/15 to-cyan-400/5"><CardContent className="flex h-full flex-col justify-between gap-8 p-6"><div><div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-violet-400/15"><Star className="size-5 text-violet-300" /></div><h3 className="text-xl font-bold text-white">Level up faster</h3><p className="mt-2 text-sm leading-6 text-white/50">Complete featured offers to unlock bigger multipliers and exclusive cashout methods.</p></div><Button variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10">View rewards <ArrowUpRight data-icon="inline-end" /></Button></CardContent></Card>
        </div>
      </div>
      {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setSelected(null)}><Card className="w-full max-w-md border-white/15 bg-zinc-950" onClick={(event) => event.stopPropagation()}><CardContent className="flex flex-col items-center gap-4 p-8 text-center"><div className="flex size-16 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-400 to-violet-500"><LockKeyhole className="size-7 text-white" /></div><h2 className="text-2xl font-bold text-white">{selected} is ready</h2><p className="text-sm leading-6 text-white/50">Offerwall access is connected to your account. Choose an offer to start earning MC.</p><Button className="w-full bg-white text-black hover:bg-cyan-100" onClick={() => setSelected(null)}>Continue earning</Button></CardContent></Card></div>}
    </div>
  )
}
