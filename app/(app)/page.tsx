"use client"

import { useMemo, useState } from "react"
import {
  ArrowRight,
  Bitcoin,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Gamepad2,
  Gift,
  Landmark,
  LockKeyhole,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Wallet,
  Zap,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const feedItems = [
  ["Mia R.", "US", "completed Board Kings", "+$12.40", "Torox"],
  ["Lucas B.", "GB", "cashed out via PayPal", "+$8.25", "PayPal"],
  ["Sofia M.", "CA", "finished a survey", "+$4.80", "BitLabs"],
  ["Ethan K.", "AU", "reached Level 40", "+$45.00", "Revlum"],
]

const offerwalls = [
  { name: "Torox", description: "Games & app milestones", reward: "+50% bonus", rating: "4.9", color: "from-emerald-400 to-teal-600", icon: Gamepad2 },
  { name: "Revlum", description: "Premium game offers", reward: "High paying", rating: "4.8", color: "from-blue-400 to-cyan-500", icon: Zap },
  { name: "AdGate", description: "Surveys that pay fast", reward: "+25% event", rating: "4.7", color: "from-violet-400 to-indigo-600", icon: Search },
  { name: "TaskWall", description: "Simple daily tasks", reward: "Instant credit", rating: "4.8", color: "from-amber-300 to-orange-500", icon: Check },
  { name: "BitLabs", description: "Quick opinion surveys", reward: "New offers", rating: "4.6", color: "from-pink-400 to-rose-500", icon: Sparkles },
]

const payouts = [
  { rank: "1", name: "Jasmine T.", flag: "US", amount: "$184.20", tone: "text-amber-300" },
  { rank: "2", name: "Oliver P.", flag: "GB", amount: "$162.75", tone: "text-slate-300" },
  { rank: "3", name: "Nina K.", flag: "DE", amount: "$139.40", tone: "text-orange-300" },
  { rank: "4", name: "Marco S.", flag: "IT", amount: "$118.60", tone: "text-white" },
]

const methods = [
  { name: "PayPal", icon: Wallet },
  { name: "Bitcoin", icon: Bitcoin },
  { name: "Gift Cards", icon: Gift },
  { name: "USDT", icon: CircleDollarSign },
  { name: "FaucetPay", icon: Landmark },
]

export default function EarnPage() {
  const { userData } = useAuth()
  const [selectedWall, setSelectedWall] = useState<string | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const username = userData?.username ?? "Alex"

  const duplicatedFeed = useMemo(() => [...feedItems, ...feedItems], [])

  return (
    <main className="min-h-full overflow-hidden bg-[#090a0f] text-white">
      <div className="mx-auto max-w-[1440px] px-4 pb-12 sm:px-6 lg:px-10">
        <header className="flex items-center justify-between border-b border-white/[0.06] py-4">
          <a href="#top" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-400 text-[#07110d] shadow-[0_0_24px_rgba(16,185,129,.28)]"><Zap className="size-5 fill-current" /></span>
            <span className="text-xl font-black tracking-tight">mr<span className="text-emerald-400">cash</span></span>
          </a>
          <nav className="hidden items-center gap-7 text-sm text-white/55 md:flex">
            <a className="text-white transition-colors hover:text-emerald-300" href="#offers">Earn</a>
            <a className="transition-colors hover:text-white" href="#cashouts">Cashouts</a>
            <a className="transition-colors hover:text-white" href="#leaderboard">Leaderboard</a>
          </nav>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/65 sm:flex"><span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" /> {username}</div>
            <Button size="icon" variant="ghost" className="text-white/70 hover:bg-white/10 hover:text-white md:hidden" onClick={() => setShowMenu(!showMenu)} aria-label="Open navigation"><Menu /></Button>
            <Button className="hidden rounded-xl bg-white text-sm font-bold text-black hover:bg-emerald-300 sm:flex" onClick={() => document.getElementById("offers")?.scrollIntoView({ behavior: "smooth" })}>Start earning</Button>
          </div>
        </header>

        <section className="relative mt-4 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0f131b]">
          <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-2.5 text-[11px] font-bold tracking-[0.14em] text-emerald-300"><span className="size-2 animate-pulse rounded-full bg-emerald-400" /> LIVE PAYOUTS <span className="font-normal tracking-normal text-white/35">Members are earning right now</span></div>
          <div className="no-scrollbar overflow-hidden py-2"><div className="animate-scroll flex min-w-max gap-3 px-3 hover:[animation-play-state:paused]">{duplicatedFeed.map(([name, flag, action, amount, wall], index) => <div key={`${name}-${index}`} className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2 text-xs"><span className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-cyan-300 to-blue-600 text-[10px] font-black">{name[0]}</span><span className="text-white/70">{name} <span className="text-white/35">{flag}</span> {action}</span><span className="font-bold text-emerald-300">{amount}</span><span className="rounded-md bg-white/[0.06] px-1.5 py-1 text-[10px] text-white/40">{wall}</span></div>)}</div></div>
        </section>

        {showMenu && <div className="mt-2 flex flex-col gap-2 rounded-2xl border border-white/10 bg-[#11151d] p-3 text-sm text-white/70 md:hidden"><a href="#offers">Earn</a><a href="#cashouts">Cashouts</a><a href="#leaderboard">Leaderboard</a></div>}

        <section id="top" className="relative grid gap-10 py-14 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:py-20">
          <div className="relative z-10">
            <Badge className="mb-5 border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-[10px] font-black tracking-[0.12em] text-amber-200">🏆 #1 HIGHEST PAYING REWARDS PLATFORM</Badge>
            <h1 className="max-w-3xl text-4xl font-black leading-[1.02] tracking-[-0.045em] sm:text-6xl lg:text-7xl">Earn cash & crypto by <span className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent">playing games</span> and taking surveys.</h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/50 sm:text-lg">Average user cashes out in 17 minutes. Complete simple offers and withdraw instantly via PayPal, crypto, and gift cards.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button size="lg" className="h-13 rounded-xl bg-emerald-400 px-6 font-black text-[#07110d] shadow-[0_0_28px_rgba(16,185,129,.2)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-300" onClick={() => document.getElementById("offers")?.scrollIntoView({ behavior: "smooth" })}>Start earning <ArrowRight data-icon="inline-end" /></Button><Button size="lg" variant="outline" className="h-13 rounded-xl border-white/10 bg-white/[0.03] px-6 text-white hover:bg-white/10" onClick={() => document.getElementById("leaderboard")?.scrollIntoView({ behavior: "smooth" })}>View leaderboard <Trophy data-icon="inline-end" /></Button></div>
            <div className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-t border-white/[0.08] pt-5"><div><p className="text-xl font-black text-white">$540,290<span className="text-emerald-300">+</span></p><p className="mt-1 text-[11px] text-white/35">Paid to members</p></div><div><p className="text-xl font-black text-white">1,420<span className="text-emerald-300"> online</span></p><p className="mt-1 text-[11px] text-white/35">Active earners</p></div><div><p className="flex items-center gap-1 text-xl font-black text-white">4.9 <Star className="size-4 fill-amber-300 text-amber-300" /></p><p className="mt-1 text-[11px] text-white/35">Trustpilot rating</p></div></div>
          </div>
          <div className="relative mx-auto w-full max-w-[480px]">
            <div className="absolute inset-8 rounded-full bg-emerald-400/10 blur-3xl" />
            <div className="relative rotate-1 rounded-[28px] border border-white/10 bg-[#131a22] p-3 shadow-2xl shadow-black/50 transition-transform duration-500 hover:rotate-0"><div className="rounded-[21px] border border-white/[0.08] bg-[#0d1117] p-5 sm:p-7"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 shadow-lg"><Gamepad2 className="size-6" /></div><div><p className="font-bold">Board Kings</p><p className="text-xs text-white/40">Reach Level 40</p></div></div><Badge className="border-emerald-300/20 bg-emerald-300/10 text-emerald-300">🔥 Hot</Badge></div><div className="mt-8 flex items-end justify-between"><div><p className="text-xs text-white/40">Potential reward</p><p className="mt-1 text-4xl font-black text-emerald-300">+$45.00</p></div><Badge className="border-cyan-300/20 bg-cyan-300/10 text-cyan-200">Instant</Badge></div><div className="mt-7"><div className="mb-2 flex justify-between text-xs text-white/45"><span>Offer progress</span><span>0 / 40 levels</span></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[8%] rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300" /></div></div><Button className="mt-7 h-12 w-full rounded-xl bg-white font-bold text-black transition-all hover:bg-emerald-300">Claim offer <ArrowRight data-icon="inline-end" /></Button><div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-white/35"><ShieldCheck className="size-4 text-emerald-400" /> Verified by 12,840 members</div></div></div>
          </div>
        </section>

        <section id="offers" className="scroll-mt-6 py-10"><div className="mb-5 flex items-end justify-between"><div><p className="text-xs font-bold tracking-[0.16em] text-emerald-300">TOP OFFERWALLS</p><h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Choose how you want to earn</h2></div><a href="#offers" className="hidden items-center gap-1 text-sm font-bold text-white/45 transition hover:text-white sm:flex">All networks <ChevronRight className="size-4" /></a></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{offerwalls.map((wall) => { const Icon = wall.icon; return <Card key={wall.name} className="group border-white/[0.08] bg-[#10141c] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300/30 hover:bg-[#151b25]"><CardContent className="p-4"><div className={`flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br ${wall.color} shadow-lg`}><Icon className="size-5 text-white" /></div><div className="mt-4 flex items-start justify-between gap-2"><div><h3 className="font-bold">{wall.name}</h3><p className="mt-1 text-xs leading-5 text-white/40">{wall.description}</p></div><span className="text-amber-300">★</span></div><div className="mt-5 flex items-center justify-between text-[11px]"><span className="font-bold text-emerald-300">{wall.reward}</span><span className="text-white/35">{wall.rating}/5</span></div><Button variant="outline" size="sm" className="mt-4 w-full rounded-lg border-white/10 bg-white/[0.03] text-xs text-white hover:bg-emerald-400 hover:text-black" onClick={() => setSelectedWall(wall.name)}>Open wall <ArrowRight data-icon="inline-end" /></Button></CardContent></Card> })}</div></section>

        <section id="cashouts" className="scroll-mt-6 grid gap-4 py-8 lg:grid-cols-[.75fr_1.25fr]"><Card className="border-emerald-300/15 bg-gradient-to-br from-emerald-400/10 to-cyan-400/[0.03]"><CardContent className="flex h-full flex-col justify-between gap-8 p-6 sm:p-8"><div><Badge className="border-emerald-300/20 bg-emerald-300/10 text-emerald-300">⚡ INSTANT CASHOUT</Badge><h2 className="mt-5 text-3xl font-black">Your rewards,<br /><span className="text-emerald-300">your way.</span></h2><p className="mt-3 max-w-sm text-sm leading-6 text-white/45">Withdraw your balance when you want. No waiting, no complicated requirements.</p></div><div className="flex items-center gap-3 text-sm font-bold"><Clock3 className="size-5 text-emerald-300" /> Starting at only <span className="text-emerald-300">$0.50</span></div></CardContent></Card><Card className="border-white/[0.08] bg-[#10141c]"><CardContent className="p-6 sm:p-8"><div className="flex items-center justify-between"><div><p className="text-xs font-bold tracking-[0.16em] text-white/35">PAYMENT METHODS</p><h3 className="mt-2 text-xl font-bold">Cash out in seconds</h3></div><LockKeyhole className="size-5 text-white/25" /></div><div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-5">{methods.map((method) => { const Icon = method.icon; return <div key={method.name} className="flex flex-col items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 text-center transition-all hover:border-emerald-300/30 hover:bg-emerald-300/[0.05]"><Icon className="size-6 text-emerald-300" /><span className="text-xs font-semibold text-white/65">{method.name}</span></div> })}</div></CardContent></Card></section>

        <section id="leaderboard" className="scroll-mt-6 py-10"><div className="mb-5 flex items-end justify-between"><div><p className="text-xs font-bold tracking-[0.16em] text-blue-300">COMMUNITY WINS</p><h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Recent cashouts</h2></div><Badge className="border-blue-300/20 bg-blue-300/10 text-blue-200">Today</Badge></div><Card className="overflow-hidden border-white/[0.08] bg-[#10141c]"><CardContent className="p-0"><div className="grid grid-cols-[48px_1fr_80px] border-b border-white/[0.07] px-5 py-3 text-[10px] font-bold tracking-[0.14em] text-white/30 sm:grid-cols-[64px_1fr_120px_120px]"><span>RANK</span><span>MEMBER</span><span className="hidden sm:block">COUNTRY</span><span className="text-right">EARNED</span></div>{payouts.map((payout) => <div key={payout.rank} className="grid grid-cols-[48px_1fr_80px] items-center border-b border-white/[0.05] px-5 py-4 last:border-0 sm:grid-cols-[64px_1fr_120px_120px]"><span className={`text-lg font-black ${payout.tone}`}>{payout.rank}</span><span className="flex items-center gap-3"><span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-violet-500 text-xs font-black">{payout.name[0]}</span><span className="text-sm font-bold">{payout.name}</span></span><span className="hidden text-sm text-white/45 sm:block">{payout.flag}</span><span className="text-right text-sm font-black text-emerald-300">{payout.amount}</span></div>)}</CardContent></Card></section>

        <footer className="flex flex-col gap-3 border-t border-white/[0.07] pt-6 text-xs text-white/30 sm:flex-row sm:items-center sm:justify-between"><span>© 2026 mrcash. Rewards made simple.</span><span className="flex items-center gap-2"><ShieldCheck className="size-4 text-emerald-400" /> Secure. Fast. Transparent.</span></footer>
      </div>
      {selectedWall && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onClick={() => setSelectedWall(null)}><Card className="w-full max-w-sm border-white/10 bg-[#10141c]" onClick={(event) => event.stopPropagation()}><CardContent className="p-7 text-center"><div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-400/15"><Sparkles className="size-7 text-emerald-300" /></div><h2 className="mt-5 text-2xl font-black">{selectedWall} is ready</h2><p className="mt-2 text-sm leading-6 text-white/45">Sign in to unlock personalized offers and start earning instantly.</p><Button className="mt-6 w-full rounded-xl bg-emerald-400 font-bold text-black hover:bg-emerald-300" onClick={() => setSelectedWall(null)}>Continue <ArrowRight data-icon="inline-end" /></Button></CardContent></Card></div>}
    </main>
  )
}
