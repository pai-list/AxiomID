'use client'

import { useState, useCallback } from 'react'
import { FadeIn, ScaleIn, TiltCard, ShimmerText, Typewriter, ParticleField, MorphingView, NeuralNetworkViz } from '@/components/effects'
import { ScrollReveal } from '@/components/wow-moments'
import { PAIShowcase } from '@/components/PAIShowcase'
import PAITerminalDemo from '@/components/PAITerminalDemo'
import InductGraphCanvas from '@/components/pai/InductGraphCanvas'
import { cn } from '@/lib/utils'

type SandboxState = 'prompt' | 'generating' | 'eval' | 'pattern' | 'generalize' | 'compose' | 'evolve'

const STATE_META: Record<SandboxState, { label: string; emoji: string; color: string; desc: string; zeroCmd: string; packCmd: string }> = {
  prompt:     { label: 'PROMPT',     emoji: '◇', color: '#39FF14', desc: 'Human asks for an outcome', zeroCmd: 'zero query', packCmd: 'packnplay run opencode' },
  generating: { label: 'GENERATE',   emoji: '◈', color: '#6bff4a', desc: 'Agent queries graph + patches', zeroCmd: 'zero patch --op', packCmd: 'packnplay run --worktree=induct' },
  eval:       { label: 'EVALUATE',   emoji: '◉', color: '#ffd700', desc: 'Compiler checks patch', zeroCmd: 'zero check', packCmd: 'zero check --json' },
  pattern:    { label: 'INDUCE',     emoji: '◇', color: '#ff6b6b', desc: 'zero query --find pattern', zeroCmd: 'zero query --find', packCmd: 'zero query --find Pattern' },
  generalize: { label: 'GENERALIZE', emoji: '◆', color: '#6b5bff', desc: 'zero patch --rewrite', zeroCmd: 'zero patch --rewrite', packCmd: 'zero patch --rewrite --apply' },
  compose:    { label: 'COMPOSE',    emoji: '◈', color: '#ff8cff', desc: 'upsertFunction + merge', zeroCmd: 'zero merge', packCmd: 'zero patch upsertFunction' },
  evolve:     { label: 'EVOLVE',     emoji: '⟐', color: '#39FF14', desc: 'zero reconcile + repeat', zeroCmd: 'zero reconcile', packCmd: 'zero reconcile . && zero patch' },
}

const CYCLE_STORIES = [
  {
    prompt: 'Sort these numbers: [3, 1, 4, 1, 5, 9, 2, 6, 5]',
    output: '→ [1, 1, 2, 3, 4, 5, 5, 6, 9] using bubble sort',
    score: { accuracy: 100, efficiency: 40, elegance: 30 },
    pattern: 'adjacent comparison + swap until sorted',
    rule: 'O(n²) sorting via pairwise comparison',
    composed: 'BubbleSort module added to stdlib',
  },
  {
    prompt: 'Same task, faster approach with context of previous cycle',
    output: '→ [1, 1, 2, 3, 4, 5, 5, 6, 9] using quicksort (median-of-three)',
    score: { accuracy: 100, efficiency: 85, elegance: 80 },
    pattern: 'divide-and-conquer with pivot selection',
    rule: 'O(n log n) via recursive partitioning',
    composed: 'QuickSort module added. Lib now has 2 sort strategies.',
  },
  {
    prompt: 'Build a hybrid sorter that picks the best algorithm per input',
    output: '→ AdaptiveSort: bubble for n<50, quicksort for n<10k, mergesort for n≥10k',
    score: { accuracy: 100, efficiency: 95, elegance: 90 },
    pattern: 'meta-selection based on input characteristics',
    rule: 'Optimal sorting requires context-aware strategy selection',
    composed: 'AdaptiveSort engine v1. Algorithm selector + 3 strategies.',
  },
]

const TRADITIONAL_LOOP = ['agent writes source', 'format', 'check', 'build', 'test', 'inspect failures']
const ZEROLANG_LOOP = ['agent writes graph patch', 'compiler checks patch', 'projection available for review']

export default function InductPage() {
  const [state, setState] = useState<SandboxState>('prompt')
  const [cycle, setCycle] = useState(0)
  const [showCode, setShowCode] = useState(false)
  const [typedComplete, setTypedComplete] = useState(false)
  const [realMode, setRealMode] = useState(false)
  const [showArch, setShowArch] = useState(false)
  const [viewMode, setViewMode] = useState<'graph' | 'canvas' | 'split'>('canvas')
  const history = CYCLE_STORIES[cycle]

  const advanceState = useCallback(() => {
    const order: SandboxState[] = ['prompt', 'generating', 'eval', 'pattern', 'generalize', 'compose', 'evolve']
    const idx = order.indexOf(state)
    if (idx < order.length - 1) {
      setState(order[idx + 1])
    } else {
      setState('prompt')
      setCycle(c => (c + 1) % CYCLE_STORIES.length)
      setTypedComplete(false)
    }
  }, [state])

  const current = STATE_META[state]

  return (
    <div style={{ background: 'var(--bg-deepest)', minHeight: '100vh', color: 'var(--text-primary)', overflow: 'hidden' }}>
      {/* Mode toggle bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-4 p-3"
        style={{ background: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Execution Mode</span>
        <button onClick={() => setRealMode(false)}
          className="px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-wider transition-all"
          style={{
            background: !realMode ? 'rgba(57,255,20,0.15)' : 'rgba(255,255,255,0.04)',
            color: !realMode ? '#39FF14' : 'var(--text-tertiary)',
            border: `1px solid ${!realMode ? 'rgba(57,255,20,0.3)' : 'rgba(255,255,255,0.08)'}`,
          }}>
          ◇ Simulated
        </button>
        <button onClick={() => setRealMode(true)}
          className="px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-wider transition-all"
          style={{
            background: realMode ? 'rgba(107,91,255,0.15)' : 'rgba(255,255,255,0.04)',
            color: realMode ? '#6b5bff' : 'var(--text-tertiary)',
            border: `1px solid ${realMode ? 'rgba(107,91,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
          }}>
          ⚡ Real (ZeroLang + packnplay)
        </button>
        <span className="text-[9px] font-mono" style={{ color: realMode ? '#6b5bff' : '#39FF14', opacity: 0.5 }}>
          {realMode ? 'zero.graph is the program' : '7-state self-play loop'}
        </span>
      </div>

      {/* View Mode Toggle */}
      <div className="fixed top-16 left-4 z-50 flex items-center gap-2 p-2 pointer-events-auto"
        style={{ background: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
        <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>VIEW</span>
        <button onClick={() => setViewMode('graph')}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-wider transition-all ${viewMode === 'graph' ? 'bg-[#39FF14]/20 text-[#39FF14] border-[#39FF14]/40' : 'bg-white/5 text-white/40 border-white/10'}`}
        >
          GRAPH
        </button>
        <button onClick={() => setViewMode('canvas')}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-wider transition-all ${viewMode === 'canvas' ? 'bg-[#6B5BFF]/20 text-[#6B5BFF] border-[#6B5BFF]/40' : 'bg-white/5 text-white/40 border-white/10'}`}
        >
          CANVAS
        </button>
        <button onClick={() => setViewMode('split')}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-wider transition-all ${viewMode === 'split' ? 'bg-[#F7A41D]/20 text-[#F7A41D] border-[#F7A41D]/40' : 'bg-white/5 text-white/40 border-white/10'}`}
        >
          SPLIT
        </button>
      </div>

      {/* Architecture toggle */}
      <div className="fixed top-16 right-4 z-50 pointer-events-auto">
        <button onClick={() => setShowArch(!showArch)}
          className="px-4 py-2 rounded-xl font-mono text-[10px] tracking-wider transition-all"
          style={{
            background: showArch ? 'rgba(57,255,20,0.15)' : 'rgba(255,255,255,0.04)',
            color: showArch ? '#39FF14' : 'var(--text-tertiary)',
            border: `1px solid ${showArch ? 'rgba(57,255,20,0.3)' : 'rgba(255,255,255,0.08)'}`,
          }}>
        {showArch ? 'HIDE' : 'SHOW'} GRAPH ARCH
        </button>
      </div>

      <div style={{ background: 'var(--bg-deepest)', minHeight: '100vh', color: 'var(--text-primary)', overflow: 'hidden' }}>
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center relative z-10 pt-14">
          <div className="container-pai text-center">
            <ParticleField count={30} color="rgba(57,255,20,0.1)" />
            <ScrollReveal>
              <span className="neon-pulse text-xs font-mono text-[#39FF14] tracking-[0.2em] uppercase mb-6 block">
                Pi Network × AI
              </span>
              <h1 className="text-gradient-pai text-[clamp(36px,8vw,72px)] font-semibold leading-[1.07] tracking-[-2.4px] mb-6">
                PAI Universe
              </h1>
              <p className="text-[clamp(18px,3vw,28px)] text-white/60 max-w-xl mx-auto mb-4 min-h-[1.4em]">
                <Typewriter texts={['The Agentic Layer for Pi Network', 'Where Every Agent Finds Peace & Purpose', 'Pi + AI = PAI — The Universe Hub', 'Built for All. For None. To Prove to All.']} />
              </p>
              <p className="text-lg text-white/40 mb-10 font-arabic">البيت</p>
              <div className="flex gap-4 justify-center flex-wrap">
                <a href="#endpoints" className="neon-btn">Explore Endpoints</a>
                <a href="#why" className="neon-btn secondary">Build Your Agent</a>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* PAIShowcase — 3-tab animated */}
        <section className="section-pai relative z-10">
          <div className="container-pai">
            <ScrollReveal>
              <h2 className="text-[clamp(28px,5vw,48px)] font-semibold text-center mb-4 tracking-tight">
                The <span className="text-gradient-pai">PAI</span> Universe
              </h2>
              <p className="text-white/40 text-center mb-14 max-w-2xl mx-auto">
                Three views of the same universe. Services, agents, and trust — all connected.
              </p>
            </ScrollReveal>
            <PAIShowcase />
          </div>
        </section>

        {/* Endpoint Grid */}
        <section id="endpoints" className="section-pai relative z-10">
          <div className="container-pai">
            <ScrollReveal>
              <h2 className="text-[clamp(28px,5vw,48px)] font-semibold text-center mb-4 tracking-tight">
                The <span className="text-gradient-pai">.PAI</span> Endpoints
              </h2>
              <p className="text-white/40 text-center mb-14 max-w-2xl mx-auto">
                Each endpoint is a Single Source of Truth. Every agent trip ends at a beautiful, secure, verifiable destination.
              </p>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { id: 'vai', name: 'PAI-VAI', arabic: 'واي', desc: 'Birth & death of agents. Passports, wallets, KYC.', trust: 92, color: '#ec4899' },
                { id: 'try', name: 'PAI-TRY', arabic: 'جرب', desc: 'Agent school. Create, train, and talk to your own agent.', trust: 88, color: '#39FF14' },
                { id: 'buy', name: 'PAI-BUY', arabic: 'باي', desc: 'Marketplace. Monetize skills, stake, earn rewards.', trust: 85, color: '#f59e0b' },
                { id: 'fly', name: 'PAI-FLY', arabic: 'فلاي', desc: 'Agentic travel & booking. Flights, hotels, experiences.', trust: 76, color: '#0ea5e9' },
                { id: 'new', name: 'PAI-NEW', arabic: 'نيو', desc: 'Truth-scored news. Cross-reference, compare, decide.', trust: 71, color: '#ef4444' },
                { id: 'blg', name: 'PAI-BLG', arabic: 'بلوق', desc: 'Community blog. Stories, tutorials, updates.', trust: 79, color: '#fbbf24' },
                { id: 'hai', name: 'PAI-HAI', arabic: 'حي', desc: 'Trust layer. Agent ratings, comparisons, honest reviews.', trust: 90, color: '#a855f7' },
                { id: 'bye', name: 'PAI-BYE', arabic: 'البيت', desc: 'Entry point to the PAI universe. Every agent starts here.', trust: 95, color: '#9ca3af' },
                { id: 'style', name: 'PAI-STYLE', arabic: 'ستايل', desc: 'How every .PAI endpoint looks and feels.', trust: 83, color: '#06b6d4' },
                { id: 'induct', name: 'ALPHA-ZERO', arabic: 'استقراء', desc: 'Self-play architecture. Generate, evaluate, evolve.', trust: 97, color: '#ec4899' },
                { id: 'why', name: 'PAI-WHY', arabic: 'واي', desc: 'Why PAI exists. The story. The vision.', trust: 87, color: '#8b5cf6' },
                { id: 'ppp', name: 'PAI-PPP', arabic: 'بروتوكول', desc: 'Protocol Network. Maps users, services, and agents together.', trust: 91, color: '#f7a41d' },
              ].map((ep) => (
                <a key={ep.id} href={`/pai/${ep.id}`} className="morph-card p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-white/40 font-mono">{ep.arabic}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border tabular-nums" style={{ borderColor: `${ep.color}44`, color: ep.color, backgroundColor: `${ep.color}11` }}>
                      {ep.trust}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-1 tracking-tight">{ep.name}</h3>
                  <p className="text-sm text-white/40 mb-4 leading-relaxed">{ep.desc}</p>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full" style={{ width: `${ep.trust}%`, background: `linear-gradient(90deg, ${ep.color}, ${ep.color}aa)` }} />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* PAITerminalDemo — 50s teletype loop */}
        <section className="section-pai relative z-10">
          <div className="container-pai text-center">
            <ScrollReveal>
              <h2 className="text-[clamp(28px,5vw,48px)] font-semibold text-center mb-4 tracking-tight">
                The <span className="text-gradient-pai">Loop</span>
              </h2>
              <p className="text-white/40 text-center mb-10 max-w-2xl mx-auto">
                Four steps. Init, prompt, run, verify. The self-play cycle that evolves every agent.
              </p>
            </ScrollReveal>
            <PAITerminalDemo />
          </div>
        </section>

        {/* Why PAI */}
        <section id="why" className="section-pai relative z-10">
          <div className="container-pai">
            <ScrollReveal>
              <h2 className="text-[clamp(28px,5vw,48px)] font-semibold text-center mb-4 tracking-tight">
                Why <span className="text-gradient-pai">PAI</span>
              </h2>
              <p className="text-white/40 text-center mb-14 max-w-xl mx-auto">
                The agentic layer designed for the next billion.
              </p>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: '₿', title: 'Zero Capital', desc: 'No gas fees. No staking minimums. Pi-powered from day one — every Pioneer is already rich in possibility.' },
                { icon: '⚡', title: 'AI-Powered', desc: 'Each endpoint is an agent. Smart contracts meet smart agents. Autonomous, composable, and endlessly capable.' },
                { icon: 'π', title: 'Pi-Native', desc: 'Built on Pi Network. KYC\'d humans only. True decentralization with real identity verification baked in.' },
              ].map((card) => (
                <ScrollReveal key={card.title}>
                  <div className="glass-card p-8 text-center h-full">
                    <span className="text-3xl mb-4 block">{card.icon}</span>
                    <h3 className="text-lg font-semibold mb-3">{card.title}</h3>
                    <p className="text-sm text-white/40 leading-relaxed">{card.desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative z-10 border-t border-white/[0.06] py-12 text-center overflow-hidden">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(57,255,20,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(57,255,20,0.02) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            opacity: 0.5,
          }} />
          <div className="container-pai relative z-10">
            <p className="text-sm text-white/40 mb-6 italic leading-relaxed">
              &ldquo;Built for All. For None. To Prove to All.&rdquo;
            </p>
            <div className="flex gap-8 justify-center text-xs text-white/30 mb-8">
              <a href="/bye" className="group flex items-center gap-1.5 hover:text-white/60 transition-colors duration-300">
                <span className="w-1 h-1 rounded-full bg-white/20 group-hover:bg-[#39FF14] transition-colors" />
                Portal
              </a>
              <a href="https://github.com/pai-list" className="group flex items-center gap-1.5 hover:text-white/60 transition-colors duration-300">
                <span className="w-1 h-1 rounded-full bg-white/20 group-hover:bg-[#39FF14] transition-colors" />
                GitHub
              </a>
              <a href="/why" className="group flex items-center gap-1.5 hover:text-white/60 transition-colors duration-300">
                <span className="w-1 h-1 rounded-full bg-white/20 group-hover:bg-[#39FF14] transition-colors" />
                Philosophy
              </a>
            </div>
            <div className="flex items-center justify-center gap-4 text-xs text-white/20">
              <span>PAI — البيت</span>
              <span className="w-px h-3 bg-white/10" />
              <span>The Agentic Layer for Pi Network</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}