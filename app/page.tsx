'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { GoalsPreview } from '@/components/landing/goals-preview'

// ─── Mock Data ────────────────────────────────────────────────────────────────
const EQUITY_DATA = [12400, 12850, 12600, 13200, 13050, 13800, 13500, 14100, 13900, 14600, 14400, 15100, 14900, 15600, 15400, 16000, 15700, 16400, 16200, 16800, 16600, 17200, 17000, 17800, 17600, 18200, 18000, 18700, 18500, 19100]
const OPEN_POSITIONS = [
  { symbol: 'NAS100', side: 'BUY', entry: 18420.5, pnl: +342.80, pct: '+1.86%' },
  { symbol: 'XAUUSD', side: 'SELL', entry: 2318.40, pnl: -124.50, pct: '-0.54%' },
  { symbol: 'EURUSD', side: 'BUY', entry: 1.08240, pnl: +88.20, pct: '+0.41%' },
]
const BAR_DATA = [42, 67, 55, 78, 61, 84, 72, 91, 68, 88, 76, 95]

export default function LandingPage() {
  const [hoveredBroker, setHoveredBroker] = useState<string | null>(null)
  const [showFeaturesDropdown, setShowFeaturesDropdown] = useState(false)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [goalProgress, setGoalProgress] = useState(0)
  const [goalPhase, setGoalPhase] = useState<'creating' | 'progress' | 'complete'>('creating')
  const [journalState, setJournalState] = useState<'form' | 'ai'>('form')
  const [chatStep, setChatStep] = useState(0)
  const [livePrice, setLivePrice] = useState(342.80)
  const goalRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)

  // Goal loop animation
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    const runLoop = () => {
      setGoalPhase('creating')
      setGoalProgress(0)
      timeout = setTimeout(() => {
        setGoalPhase('progress')
        let p = 0
        const interval = setInterval(() => {
          p += 2
          setGoalProgress(p)
          if (p >= 100) { clearInterval(interval); timeout = setTimeout(() => { setGoalPhase('complete'); timeout = setTimeout(runLoop, 2500) }, 400) }
        }, 40)
      }, 1800)
    }
    runLoop()
    return () => clearTimeout(timeout)
  }, [])

  // Journal state cycle
  useEffect(() => {
    const t = setInterval(() => setJournalState(s => s === 'form' ? 'ai' : 'form'), 4000)
    return () => clearInterval(t)
  }, [])

  // Chat reveal
  useEffect(() => {
    const t = setInterval(() => setChatStep(s => s < 2 ? s + 1 : s), 1800)
    return () => clearInterval(t)
  }, [])

  // Live P&L tick
  useEffect(() => {
    const t = setInterval(() => setLivePrice(p => +(p + (Math.random() - 0.48) * 6).toFixed(2)), 1200)
    return () => clearInterval(t)
  }, [])

  const svgEquityPath = () => {
    const w = 240, h = 88
    const min = Math.min(...EQUITY_DATA), max = Math.max(...EQUITY_DATA)
    const pts = EQUITY_DATA.map((v, i) => {
      const x = (i / (EQUITY_DATA.length - 1)) * w
      const y = h - ((v - min) / (max - min)) * (h - 8) - 4
      return `${x},${y}`
    })
    return `M ${pts.join(' L ')}`
  }

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

    :root {
      --navy: #0A1F44;
      --navy-mid: #112952;
      --navy-deep: #071530;
      --blue-accent: #1A4B8F;
      --blue-bright: #2563c9;
      --blue-glow: #3B7EFF;
      --text-primary: #0A1F44;
      --text-secondary: #3d5a8a;
      --text-muted: #6b82a8;
      --surface: #f5f7fb;
      --surface-2: #eef1f8;
      --border: #d5dce8;
      --white: #ffffff;
      --green: #16a34a;
      --red: #dc2626;
      --font-display: 'Syne', sans-serif;
      --font-body: 'DM Sans', sans-serif;
      --radius: 10px;
      --radius-lg: 16px;
      --shadow-sm: 0 1px 3px rgba(10,31,68,0.08), 0 1px 2px rgba(10,31,68,0.04);
      --shadow-md: 0 4px 16px rgba(10,31,68,0.10), 0 2px 6px rgba(10,31,68,0.06);
      --shadow-lg: 0 12px 40px rgba(10,31,68,0.14), 0 4px 12px rgba(10,31,68,0.08);

      /* Card tokens per spec */
      --card-bg: #FFFFFF;
      --card-border: 1px solid rgba(10,22,40,0.06);
      --card-shadow-rest: 0 1px 2px rgba(10,22,40,0.04), 0 4px 12px rgba(10,22,40,0.03);
      --card-shadow-hover: 0 2px 4px rgba(10,22,40,0.06), 0 8px 24px rgba(59,123,248,0.08);
      --card-radius: 16px;
      --card-padding: 24px;
      --icon-chip-size: 40px;
      --icon-chip-radius: 10px;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { font-family: var(--font-body); color: var(--text-primary); background: var(--white); line-height: 1.6; font-size: 16px; -webkit-font-smoothing: antialiased; }

    /* ── HEADER ── */
    .header { position: sticky; top: 0; z-index: 100; background: rgba(255,255,255,0.95); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); height: 64px; display: flex; align-items: center; }
    .header-inner { max-width: 1200px; margin: 0 auto; width: 100%; padding: 0 2rem; display: flex; align-items: center; justify-content: space-between; }
    .logo { font-family: var(--font-display); font-weight: 800; font-size: 1.3rem; color: var(--navy); letter-spacing: -0.02em; text-decoration: none; display: flex; align-items: center; gap: 6px; }
    .logo-badge { background: var(--navy); color: white; font-size: 0.6rem; font-weight: 700; padding: 2px 6px; border-radius: 4px; letter-spacing: 0.08em; }
    nav { display: flex; align-items: center; gap: 2rem; }
    nav a { font-size: 0.875rem; font-weight: 500; color: var(--text-secondary); text-decoration: none; transition: color 0.2s; }
    nav a:hover { color: var(--navy); }
    .features-dropdown-wrapper { position: relative; }
    .features-dropdown-button { font-size: 0.875rem; font-weight: 500; color: var(--text-secondary); text-decoration: none; transition: color 0.2s; background: none; border: none; cursor: pointer; padding: 0; font-family: inherit; }
    .features-dropdown-button:hover { color: var(--navy); }
    .features-dropdown-menu { position: absolute; top: 100%; left: 0; background: white; border: 1px solid var(--border); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); min-width: 250px; margin-top: 12px; z-index: 1000; opacity: 0; visibility: hidden; transform: translateY(-10px); transition: opacity 0.2s, visibility 0.2s, transform 0.2s; }
    .features-dropdown-menu.active { opacity: 1; visibility: visible; transform: translateY(0); }
    .features-dropdown-item { display: block; padding: 12px 16px; color: var(--text-primary); text-decoration: none; font-size: 0.875rem; font-weight: 500; transition: background 0.2s, color 0.2s; border: none; background: none; cursor: pointer; width: 100%; text-align: left; font-family: inherit; }
    .features-dropdown-item:first-child { border-radius: var(--radius-lg) var(--radius-lg) 0 0; }
    .features-dropdown-item:last-child { border-radius: 0 0 var(--radius-lg) var(--radius-lg); }
    .features-dropdown-item:hover { background: var(--surface); color: var(--navy); }
    .header-actions { display: flex; align-items: center; gap: 12px; }
    .btn-pricing { font-family: var(--font-body); font-size: 0.875rem; font-weight: 600; color: var(--blue-bright); background: transparent; border: 1.5px solid var(--blue-bright); border-radius: var(--radius); padding: 8px 18px; cursor: pointer; text-decoration: none; transition: background 0.2s, color 0.2s, transform 0.15s; display: inline-flex; align-items: center; gap: 6px; }
    .btn-pricing:hover { background: var(--blue-bright); color: white; transform: translateY(-1px); }
    .btn-ghost { font-size: 0.875rem; font-weight: 500; color: var(--text-primary); background: none; border: none; cursor: pointer; padding: 8px 14px; border-radius: var(--radius); transition: background 0.2s; text-decoration: none; }
    .btn-ghost:hover { background: var(--surface); }
    .btn-primary { font-family: var(--font-body); font-size: 0.875rem; font-weight: 600; color: white; background: linear-gradient(135deg, var(--navy) 0%, var(--blue-accent) 100%); border: none; border-radius: var(--radius); padding: 9px 20px; cursor: pointer; text-decoration: none; transition: opacity 0.2s, transform 0.15s; display: inline-flex; align-items: center; gap: 6px; }
    .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }

    /* ── HERO ── */
    .hero { padding: 80px 2rem 0; max-width: 1200px; margin: 0 auto; position: relative; overflow: hidden; }
    .hero-content { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; padding-bottom: 80px; }
    .hero-eyebrow { display: inline-flex; align-items: center; gap: 6px; background: #EFF4FF; color: var(--blue-accent); border: 1px solid #C7D9F9; border-radius: 100px; font-size: 0.78rem; font-weight: 600; padding: 4px 12px; letter-spacing: 0.04em; text-transform: uppercase; margin-bottom: 20px; }
    .eyebrow-dot { width: 6px; height: 6px; background: var(--blue-bright); border-radius: 50%; animation: pulse 2s ease-in-out infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }
    .hero-headline { font-family: var(--font-display); font-size: 3.6rem; font-weight: 800; line-height: 1.05; letter-spacing: -0.04em; color: var(--navy); margin-bottom: 20px; }
    .hero-headline .accent { background: linear-gradient(135deg, var(--blue-bright), var(--blue-glow)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .hero-sub { font-size: 1.05rem; color: var(--text-secondary); line-height: 1.65; margin-bottom: 32px; max-width: 480px; font-weight: 300; }
    .accountability-banner { display: inline-flex; align-items: center; gap: 8px; background: #FFF8F0; border: 1px solid #FFD6A5; border-radius: var(--radius); padding: 10px 16px; font-size: 0.85rem; font-weight: 500; color: #92400e; margin-bottom: 32px; }
    .hero-actions { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
    .btn-hero { font-family: var(--font-body); font-size: 0.95rem; font-weight: 600; color: white; background: linear-gradient(135deg, #0A1F44 0%, #1A4B8F 100%); border: none; border-radius: var(--radius); padding: 13px 28px; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 16px rgba(10,31,68,0.25); transition: transform 0.2s, box-shadow 0.2s; }
    .btn-hero:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(10,31,68,0.3); }
    .btn-hero-outline { font-family: var(--font-body); font-size: 0.95rem; font-weight: 500; color: var(--navy); background: white; border: 1.5px solid var(--border); border-radius: var(--radius); padding: 13px 28px; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; transition: border-color 0.2s; }
    .btn-hero-outline:hover { border-color: var(--navy); }
    .micro-trust { font-size: 0.8rem; color: var(--text-muted); display: flex; align-items: center; gap: 16px; }
    .micro-trust span { display: flex; align-items: center; gap: 5px; }
    .micro-trust span::before { content: '✓'; color: var(--green); font-weight: 700; }

    /* ── HERO SHOWCASE CARD ── */
    .hero-showcase-card {
      background: var(--card-bg);
      border: var(--card-border);
      border-radius: var(--card-radius);
      box-shadow: var(--card-shadow-rest);
      padding: var(--card-padding);
      position: relative;
      animation: float 5s ease-in-out infinite;
      transition: box-shadow 0.18s ease-out, transform 0.18s ease-out;
    }
    .hero-showcase-card:hover { box-shadow: var(--card-shadow-hover); transform: translateY(-2px); }
    @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
    .showcase-topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .showcase-title { font-family: var(--font-display); font-size: 0.78rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; }
    .live-badge { display: inline-flex; align-items: center; gap: 5px; background: #DCFCE7; color: #15803d; font-size: 0.68rem; font-weight: 700; padding: 3px 9px; border-radius: 100px; text-transform: uppercase; letter-spacing: 0.06em; }
    .live-dot { width: 5px; height: 5px; background: #16a34a; border-radius: 50%; animation: pulse 1.4s ease-in-out infinite; }
    .showcase-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
    .showcase-stat { background: var(--surface); border-radius: 10px; padding: 10px 12px; border: 1px solid var(--border); }
    .showcase-stat-label { font-size: 0.6rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 3px; }
    .showcase-stat-value { font-family: var(--font-display); font-size: 1.3rem; font-weight: 700; line-height: 1.1; color: var(--navy); }
    .showcase-stat-value.green { color: var(--green); }
    .showcase-stat-value.red { color: var(--red); }
    .showcase-chart { background: var(--surface); border-radius: 10px; border: 1px solid var(--border); padding: 10px; height: 100px; position: relative; overflow: hidden; }
    .callout-pill { position: absolute; background: var(--navy); color: white; font-size: 0.65rem; font-weight: 600; padding: 4px 9px; border-radius: 100px; white-space: nowrap; pointer-events: none; }
    .callout-pill::after { content: ''; position: absolute; width: 6px; height: 6px; background: var(--navy); }

    /* ── BROKER STRIP ── */
    .broker-strip { background: var(--surface); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 28px 0; overflow: hidden; position: relative; }
    .broker-strip > div { width: 100%; }
    .broker-strip-label { text-align: center; font-size: 0.72rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 20px; }
    .broker-scroll-track { display: flex; gap: 16px; animation: scroll-left 32s linear infinite; width: max-content; }
    @keyframes scroll-left { from { transform: translateX(0); } to { transform: translateX(-50%); } }
    .broker-card { background: white; border: 1px solid var(--border); border-radius: var(--radius); padding: 14px 24px; display: flex; align-items: center; gap: 12px; white-space: nowrap; box-shadow: var(--shadow-sm); height: 64px; cursor: pointer; transition: box-shadow 0.2s ease, transform 0.2s ease; }
    .broker-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1); transform: translateY(-2px); }
    .broker-name { font-size: 0.9rem; font-weight: 600; color: var(--text-primary); }

    /* ── SECTION COMMON ── */
    .section-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: var(--blue-accent); margin-bottom: 12px; }
    .section-title { font-family: var(--font-display); font-size: 2.4rem; font-weight: 700; color: var(--navy); line-height: 1.15; letter-spacing: -0.03em; margin-bottom: 16px; }
    .section-sub { font-size: 1rem; color: var(--text-secondary); max-width: 520px; line-height: 1.65; font-weight: 300; }

    /* ── FEATURE SECTION ── */
    .features-section { padding: 100px 2rem; max-width: 1200px; margin: 0 auto; }
    .features-section-header { text-align: center; margin-bottom: 80px; }
    .features-section-header .section-sub { margin: 0 auto; }

    /* ── FEATURE CARD (Interactive) ── */
    .feature-row { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; align-items: center; margin-bottom: 100px; }
    .feature-row:last-child { margin-bottom: 0; }
    .feature-row.reversed { direction: rtl; }
    .feature-row.reversed > * { direction: ltr; }

    .feature-copy { }
    .feature-copy-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--blue-accent); background: rgba(37,99,201,0.08); padding: 4px 12px; border-radius: 100px; margin-bottom: 16px; }
    .feature-copy-title { font-family: var(--font-display); font-size: 2rem; font-weight: 700; color: var(--navy); line-height: 1.15; letter-spacing: -0.02em; margin-bottom: 14px; }
    .feature-copy-desc { font-size: 0.95rem; color: var(--text-secondary); line-height: 1.7; font-weight: 300; margin-bottom: 24px; }
    .feature-copy-stat { display: flex; align-items: baseline; gap: 6px; margin-bottom: 6px; }
    .stat-hero { font-family: var(--font-display); font-size: 2.2rem; font-weight: 700; line-height: 1.0; color: var(--navy); }
    .stat-label { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); }
    .coming-soon-badge { display: inline-flex; align-items: center; gap: 5px; background: #FEF3C7; color: #92400e; font-size: 0.7rem; font-weight: 700; padding: 4px 10px; border-radius: 100px; text-transform: uppercase; letter-spacing: 0.06em; }
    .feature-cta-link { display: inline-flex; align-items: center; gap: 6px; font-size: 0.9rem; font-weight: 600; color: var(--blue-bright); text-decoration: none; transition: gap 0.2s; }
    .feature-cta-link:hover { gap: 10px; }

    /* Feature Demo Panel */
    .demo-panel { background: var(--card-bg); border: var(--card-border); border-radius: var(--card-radius); box-shadow: var(--card-shadow-rest); padding: var(--card-padding); transition: box-shadow 0.18s ease-out, transform 0.18s ease-out; overflow: hidden; }
    .demo-panel:hover { box-shadow: var(--card-shadow-hover); transform: translateY(-2px); }
    .demo-panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
    .demo-panel-title { font-size: 0.78rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; }

    /* Open Positions table */
    .positions-table { width: 100%; border-collapse: collapse; font-size: 0.78rem; margin-bottom: 12px; }
    .positions-table th { text-align: left; font-size: 0.65rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; padding: 0 0 6px; }
    .positions-table td { padding: 7px 0; border-bottom: 1px solid var(--border); color: var(--text-primary); font-weight: 500; }
    .positions-table tr:last-child td { border-bottom: none; }
    .side-badge { display: inline-block; padding: 1px 7px; border-radius: 4px; font-size: 0.65rem; font-weight: 700; }
    .side-badge.buy { background: #DCFCE7; color: #15803d; }
    .side-badge.sell { background: #FEE2E2; color: #dc2626; }
    .pnl-pos { color: var(--green); font-weight: 600; }
    .pnl-neg { color: var(--red); font-weight: 600; }

    /* Mini Equity Curve */
    .mini-chart { height: 88px; position: relative; }

    /* Journal form */
    .journal-form { }
    .form-row { margin-bottom: 10px; }
    .form-label { font-size: 0.65rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
    .form-input { width: 100%; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 8px 10px; font-size: 0.82rem; color: var(--text-primary); font-family: var(--font-body); }
    .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
    .note-area { width: 100%; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 8px 10px; font-size: 0.82rem; color: var(--text-primary); font-family: var(--font-body); height: 56px; resize: none; }

    /* AI transcribe */
    .ai-transcribe { background: linear-gradient(135deg, #EFF4FF, #F5F3FF); border: 1px solid #C7D9F9; border-radius: 10px; padding: 14px; }
    .ai-waveform { display: flex; align-items: center; gap: 3px; height: 28px; margin-bottom: 10px; }
    .wave-bar { background: var(--blue-bright); border-radius: 2px; width: 3px; animation: wave 1s ease-in-out infinite; }
    @keyframes wave { 0%, 100% { transform: scaleY(0.4); } 50% { transform: scaleY(1); } }

    /* Goal Tracking */
    .goal-card-inner { }
    .goal-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .goal-label { font-size: 0.82rem; font-weight: 600; color: var(--navy); }
    .goal-pct { font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; color: var(--navy); }
    .progress-track { background: var(--surface); border-radius: 100px; height: 8px; margin-bottom: 14px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 100px; background: linear-gradient(90deg, var(--blue-bright), var(--blue-glow)); transition: width 0.04s linear; }
    .goal-toast { background: var(--green); color: white; border-radius: 10px; padding: 10px 14px; display: flex; align-items: center; gap: 8px; font-size: 0.82rem; font-weight: 600; animation: toast-in 0.4s ease-out; }
    @keyframes toast-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

    /* AI Coach chat */
    .chat-area { display: flex; flex-direction: column; gap: 10px; }
    .chat-bubble { max-width: 85%; padding: 10px 13px; border-radius: 12px; font-size: 0.82rem; line-height: 1.55; animation: bubble-in 0.3s ease-out; }
    @keyframes bubble-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    .chat-bubble.user { background: var(--navy); color: white; align-self: flex-end; border-bottom-right-radius: 4px; }
    .chat-bubble.ai { background: var(--surface); color: var(--text-primary); align-self: flex-start; border-bottom-left-radius: 4px; border: 1px solid var(--border); }
    .chat-bubble.ai strong { color: var(--blue-bright); }

    /* ── TESTIMONIAL SECTION ── */
    .testimonials-section { background: var(--surface); border-top: 1px solid var(--border); padding: 100px 2rem; }
    .testimonials-inner { max-width: 1200px; margin: 0 auto; }
    .testimonials-header { text-align: center; margin-bottom: 60px; }
    .trusted-eyebrow { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em; color: var(--blue-accent); margin-bottom: 10px; }
    .testimonial-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; align-items: stretch; }
    .testimonial-card { background: var(--card-bg); border: var(--card-border); border-radius: var(--card-radius); box-shadow: var(--card-shadow-rest); padding: var(--card-padding); display: flex; flex-direction: column; transition: box-shadow 0.18s ease-out, transform 0.18s ease-out; }
    .testimonial-card:hover { box-shadow: var(--card-shadow-hover); transform: translateY(-2px); }
    .stars { display: flex; gap: 3px; margin-bottom: 12px; }
    .star { width: 16px; height: 16px; background: #F59E0B; clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%); }
    .testimonial-stat { font-family: var(--font-display); font-size: 1.6rem; font-weight: 700; color: var(--blue-bright); line-height: 1.0; margin-bottom: 4px; }
    .testimonial-stat-label { font-size: 0.65rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin-bottom: 12px; }
    .testimonial-quote { font-size: 0.88rem; color: var(--text-secondary); line-height: 1.65; font-style: italic; flex: 1; margin-bottom: 16px; }
    .testimonial-author { display: flex; align-items: center; gap: 10px; border-top: 1px solid var(--border); padding-top: 14px; }
    .author-avatar { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, var(--navy), var(--blue-accent)); display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; color: white; flex-shrink: 0; }
    .author-name { font-size: 0.82rem; font-weight: 600; color: var(--navy); }
    .author-role { font-size: 0.72rem; color: var(--text-muted); }

    /* ── GETTING STARTED ── */
    .connect-section { padding: 80px 2rem; max-width: 1200px; margin: 0 auto; }
    .platform-cards { display: flex; flex-direction: column; gap: 12px; margin-top: 50px; }
    .platform-card { background: white; border: 1.5px solid var(--border); border-radius: var(--radius-lg); padding: 18px 20px; display: flex; align-items: center; gap: 16px; cursor: pointer; transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s; }
    .platform-card:hover { border-color: var(--blue-bright); box-shadow: var(--shadow-md); transform: translateX(4px); }
    .platform-info { flex: 1; }
    .platform-name { font-size: 0.95rem; font-weight: 600; color: var(--navy); }
    .platform-desc { font-size: 0.8rem; color: var(--text-muted); margin-top: 2px; }
    .connect-badge { font-size: 0.7rem; font-weight: 600; padding: 4px 10px; border-radius: 100px; }
    .connect-badge.live { background: #DCFCE7; color: #15803d; }

    /* ── FOOTER ── */
    footer { background: var(--navy); color: white; padding: 60px 2rem 30px; border-top: 1px solid rgba(255,255,255,0.1); }
    .footer-inner { max-width: 1200px; margin: 0 auto; }
    .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px; margin-bottom: 40px; }
    .footer-col h3 { font-family: var(--font-display); font-weight: 700; margin-bottom: 16px; font-size: 0.95rem; }
    .footer-col a { display: block; font-size: 0.85rem; color: rgba(255,255,255,0.7); text-decoration: none; margin-bottom: 10px; transition: color 0.2s; }
    .footer-col a:hover { color: white; }
    .footer-bottom { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px; text-align: center; font-size: 0.8rem; color: rgba(255,255,255,0.6); }

    /* ── RESPONSIVE ── */
    @media (max-width: 768px) {
      .hero-content { grid-template-columns: 1fr; gap: 40px; }
      .hero-headline { font-size: 2.4rem; }
      .feature-row { grid-template-columns: 1fr; gap: 32px; }
      .feature-row.reversed { direction: ltr; }
      .testimonial-grid { grid-template-columns: 1fr; overflow-x: auto; display: flex; scroll-snap-type: x mandatory; gap: 16px; padding-bottom: 16px; }
      .testimonial-card { min-width: 280px; scroll-snap-align: start; }
      .footer-grid { grid-template-columns: 1fr; }
    }
  `

  const brokers = ['Interactive Brokers', 'TD Ameritrade', 'Alpaca', 'Polygon', 'IBKR', 'Tradier', 'MetaTrader 5', 'cTrader']
  const brokerLogos: Record<string, string> = {
    'Interactive Brokers': 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-j9SxgnvYDlybXgXzL9oP0FwxyP9M7G.png',
    'TD Ameritrade': 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-kI5yA4ZHoaLhYCdR7hSFVkVvKPYG0z.png',
    'Alpaca': 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-Wr0qAbGE7bur5uBzMbqbfraaXJe3RB.png',
    'Polygon': 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-FEv49FlEZnbbZ9pe2iO4eSfwxTWFNo.png',
    'IBKR': 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-j9SxgnvYDlybXgXzL9oP0FwxyP9M7G.png',
    'Tradier': 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-npYAoL2WZbzwTIV7qetOgSV31BNqvC.png',
    'MetaTrader 5': 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-nIi9cH2ZgGMStEJJz8fW234zzdeKFy.png',
    'cTrader': 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-x8wnTt30HSx0kuY887YIroFwjVj1yx.png',
  }

  return (
    <>
      <style>{styles}</style>

      {/* ── HEADER ── */}
      <header className="header">
        <div className="header-inner">
          <a href="/" className="logo">JNV<span className="logo-badge">PRO</span></a>
          <nav>
            <div className="features-dropdown-wrapper" onMouseEnter={() => setShowFeaturesDropdown(true)} onMouseLeave={() => setShowFeaturesDropdown(false)}>
              <button className="features-dropdown-button" onClick={() => setShowFeaturesDropdown(!showFeaturesDropdown)}>Features</button>
              <div className={`features-dropdown-menu ${showFeaturesDropdown ? 'active' : ''}`}>
                <Link href="/auth/sign-up" className="features-dropdown-item">Advanced Statistics</Link>
                <Link href="/auth/sign-up" className="features-dropdown-item">Monthly Performance Chart</Link>
                <Link href="/auth/sign-up" className="features-dropdown-item">Personal Area</Link>
                <Link href="/auth/sign-up" className="features-dropdown-item">Notes</Link>
              </div>
            </div>
            <a href="#connect">Getting Started</a>
          </nav>
          <div className="header-actions">
            <a href="#features" className="btn-pricing">Explore Features</a>
            <Link href="/auth/login" className="btn-ghost">Sign In</Link>
            <Link href="/auth/sign-up" className="btn-primary">Get Started</Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-content">
          {/* Left — copy */}
          <div>
            <div className="hero-eyebrow"><span className="eyebrow-dot"></span>Now Live</div>
            <h1 className="hero-headline">Stop repeating mistakes with a <span className="accent">trading journal</span> built around your data</h1>
            <p className="hero-sub">Track every trade, analyze your performance, and improve your consistency with advanced analytics and AI-powered insights.</p>
            <div className="accountability-banner">Your journal, goals, and performance in one focused workspace</div>
            <div className="hero-actions">
              <Link href="/auth/sign-up" className="btn-hero">Get Started Now</Link>
              <a href="#features" className="btn-hero-outline">Learn More</a>
            </div>
            <div className="micro-trust">
              <span>Free plan available</span>
            </div>
          </div>

          {/* Right — Real dashboard preview, full-width, extends to page edge */}
          <div style={{ 
            flex: 1, 
            minWidth: 0,
            marginRight: 'calc(-50vw + 50%)',
            paddingRight: 'calc(50vw - 50%)',
          }}>
            <GoalsPreview />
          </div>
        </div>
      </section>

      {/* ── BROKER STRIP ── */}
      <div className="broker-strip">
        <div>
          <div className="broker-strip-label">Broker Support</div>
          <div className="broker-scroll-track" style={{animationPlayState: hoveredBroker ? 'paused' : 'running'}}>
            {[...brokers, ...brokers].map((broker, idx) => (
              <div key={idx} className="broker-card" onMouseEnter={() => setHoveredBroker(broker)} onMouseLeave={() => setHoveredBroker(null)}>
                {brokerLogos[broker]
                  ? <img src={brokerLogos[broker]} alt={broker} style={{width:'40px',height:'40px',borderRadius:'8px',objectFit:'cover'}} />
                  : <div style={{width:'40px',height:'40px',background:'var(--surface-2)',borderRadius:'8px'}}></div>}
                <span className="broker-name">{broker}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FEATURE CARDS ── */}
      <section id="features" style={{background: 'var(--white)', borderTop: '1px solid var(--border)'}}>
        <div className="features-section">
          <div className="features-section-header">
            <div className="section-label">Platform Features</div>
            <h2 className="section-title">Built for how real traders work</h2>
            <p className="section-sub">Every feature is built around a single goal: help you make fewer emotional decisions and more data-driven ones.</p>
          </div>

          {/* 1. Real-Time Analytics — copy left, demo right */}
          <div className="feature-row">
            <div className="feature-copy">
              <div className="feature-copy-badge">Analytics</div>
              <h3 className="feature-copy-title">Watch your edge in real time</h3>
              <p className="feature-copy-desc">See your open positions, unrealized P&amp;L, and equity curve updating live — before a trade closes. Know when you're overexposed before it costs you.</p>
              <div className="feature-copy-stat">
                <span className="stat-hero">64%</span>
                <div><div className="stat-label">Win Rate</div></div>
              </div>
              <div style={{marginBottom:'20px'}}><span className="stat-label">Based on last 30 sessions</span></div>
              <Link href="/auth/sign-up" className="feature-cta-link">Start tracking free →</Link>
            </div>
            <div className="demo-panel">
              <div className="demo-panel-header">
                <span className="demo-panel-title">Open Positions</span>
                <span className="live-badge"><span className="live-dot"></span>Live</span>
              </div>
              <table className="positions-table">
                <thead>
                  <tr><th>Symbol</th><th>Side</th><th>Entry</th><th>P&amp;L</th></tr>
                </thead>
                <tbody>
                  {OPEN_POSITIONS.map((p, i) => (
                    <tr key={i}>
                      <td style={{fontWeight:700}}>{p.symbol}</td>
                      <td><span className={`side-badge ${p.side.toLowerCase()}`}>{p.side}</span></td>
                      <td>{p.entry}</td>
                      <td className={p.pnl > 0 ? 'pnl-pos' : 'pnl-neg'}>{p.pnl > 0 ? '+' : ''}{p.pnl.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mini-chart" style={{marginTop:8}}>
                <svg width="100%" height="88" viewBox="0 0 240 88" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="mini-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#16a34a" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#16a34a" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={svgEquityPath() + ` L 240,88 L 0,88 Z`} fill="url(#mini-grad)" />
                  <path d={svgEquityPath()} fill="none" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>

          {/* 2. Trade Journal — demo left, copy right */}
          <div className="feature-row reversed">
            <div className="feature-copy">
              <div className="feature-copy-badge">Journal</div>
              <h3 className="feature-copy-title">Log it once, learn from it forever</h3>
              <p className="feature-copy-desc">Manual entry with screenshots and notes is live now. AI voice transcription — turning your post-trade commentary into structured journal entries automatically — is coming soon.</p>
              <div style={{display:'flex', gap:'10px', flexWrap:'wrap', marginBottom:'20px'}}>
                <span style={{background:'#DCFCE7', color:'#15803d', fontSize:'0.72rem', fontWeight:700, padding:'4px 10px', borderRadius:'100px'}}>✓ Manual Entry — Live</span>
                <span className="coming-soon-badge">✦ AI Transcription — Coming Soon</span>
              </div>
              <Link href="/auth/sign-up" className="feature-cta-link">Start your first journal →</Link>
            </div>
            <div className="demo-panel">
              <div className="demo-panel-header">
                <span className="demo-panel-title">{journalState === 'form' ? 'New Trade Entry' : 'AI Transcription'}</span>
                {journalState === 'ai' && <span className="coming-soon-badge">Coming Soon</span>}
              </div>
              {journalState === 'form' ? (
                <div className="journal-form">
                  <div className="form-row-2">
                    <div><div className="form-label">Symbol</div><div className="form-input" style={{background:'var(--surface)',padding:'8px 10px',borderRadius:'8px',fontSize:'0.82rem',fontWeight:600}}>NAS100</div></div>
                    <div><div className="form-label">Side</div><div className="form-input" style={{background:'#DCFCE7',padding:'8px 10px',borderRadius:'8px',fontSize:'0.82rem',fontWeight:700,color:'#15803d'}}>BUY</div></div>
                  </div>
                  <div className="form-row-2">
                    <div><div className="form-label">Entry</div><div className="form-input" style={{background:'var(--surface)',padding:'8px 10px',borderRadius:'8px',fontSize:'0.82rem'}}>18,420.50</div></div>
                    <div><div className="form-label">Exit</div><div className="form-input" style={{background:'var(--surface)',padding:'8px 10px',borderRadius:'8px',fontSize:'0.82rem'}}>18,763.00</div></div>
                  </div>
                  <div className="form-row">
                    <div className="form-label">Notes</div>
                    <div className="note-area" style={{background:'var(--surface)',padding:'8px 10px',borderRadius:'8px',fontSize:'0.82rem',lineHeight:1.5}}>Entered on London session open, confirmed by volume spike above VWAP...</div>
                  </div>
                </div>
              ) : (
                <div className="ai-transcribe">
                  <div style={{fontSize:'0.72rem',fontWeight:700,color:'var(--blue-accent)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'8px'}}>🎙 Listening...</div>
                  <div className="ai-waveform">
                    {[0.3,0.8,0.5,1,0.6,0.9,0.4,0.7,0.5,0.8,0.3,1,0.6].map((h,i) => (
                      <div key={i} className="wave-bar" style={{height:`${h*28}px`, animationDelay:`${i*0.08}s`}} />
                    ))}
                  </div>
                  <div style={{fontSize:'0.8rem',color:'var(--text-secondary)',lineHeight:1.55,background:'white',borderRadius:8,padding:'10px',border:'1px solid var(--border)'}}>
                    <span style={{color:'var(--blue-bright)',fontWeight:600}}>AI:</span> &quot;Entered NAS100 long at 18,420 after London open volume confirmation. Target 18,763 based on prior resistance. Discipline check: waited for setup rather than chasing.&quot;
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. Goal Tracking — copy left, demo right */}
          <div className="feature-row">
            <div className="feature-copy">
              <div className="feature-copy-badge">Goals</div>
              <h3 className="feature-copy-title">Discipline that compounds</h3>
              <p className="feature-copy-desc">Set a target — win rate, drawdown limit, trade frequency — and the platform tracks your progress session by session. When you hit it, you&apos;ll know.</p>
              <div className="feature-copy-stat">
                <span className="stat-hero">12</span>
                <div><div className="stat-label">Day streak</div></div>
              </div>
              <div style={{marginBottom:'20px'}}><span className="stat-label">Consecutive days meeting daily goal</span></div>
              <Link href="/auth/sign-up" className="feature-cta-link">Set your first goal →</Link>
            </div>
            <div className="demo-panel">
              <div className="demo-panel-header">
                <span className="demo-panel-title">Goal Tracker</span>
                <span style={{fontSize:'0.72rem',fontWeight:600,color:'var(--text-muted)'}}>This month</span>
              </div>
              <div className="goal-card-inner">
                <div className="goal-row">
                  <span className="goal-label">
                    {goalPhase === 'creating' ? '+ Creating new goal...' : 'Hit 60% win rate this month'}
                  </span>
                  <span className="goal-pct">{goalProgress}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{width: `${goalProgress}%`}} />
                </div>
                {goalPhase === 'complete' && (
                  <div className="goal-toast">
                    🎯 Goal reached: 60% win rate this month!
                  </div>
                )}
                {goalPhase !== 'complete' && (
                  <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'4px',marginTop:'4px'}}>
                    {Array.from({length:14}).map((_,i) => (
                      <div key={i} style={{height:'22px',borderRadius:'4px',background: i < 12 ? (i%3===0?'#DCFCE7':i%3===1?'#DCFCE7':'#D1FAE5') : 'var(--surface)',border:'1px solid var(--border)',opacity: i<12?1:0.4}} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4. AI Coach — demo left, copy right */}
          <div className="feature-row reversed">
            <div className="feature-copy">
              <div className="feature-copy-badge">AI Coach</div>
              <h3 className="feature-copy-title">Pattern detection from your own data</h3>
              <p className="feature-copy-desc">Most traders repeat the same mistakes. The AI Coach reads your journal, finds the pattern, and tells you exactly what it is — not generic advice, your data.</p>
              <div style={{marginBottom:'20px'}}>
                <span className="coming-soon-badge">✦ Coming Soon</span>
              </div>
              <p style={{fontSize:'0.82rem',color:'var(--text-muted)',lineHeight:1.6}}>Join the waitlist to be notified when AI Coach launches.</p>
              <Link href="/auth/sign-up" className="feature-cta-link" style={{marginTop:'12px',display:'inline-flex'}}>Join waitlist →</Link>
            </div>
            <div className="demo-panel">
              <div className="demo-panel-header">
                <span className="demo-panel-title">AI Coach</span>
                <span className="coming-soon-badge">Coming Soon</span>
              </div>
              <div className="chat-area">
                {chatStep >= 0 && (
                  <div className="chat-bubble user">Why did I lose on my last 3 NAS100 trades?</div>
                )}
                {chatStep >= 1 && (
                  <div className="chat-bubble ai">
                    Your last 3 losses all occurred <strong>after 2+ consecutive winning trades</strong> — that&apos;s a revenge-trading pattern. Your average R:R dropped from 1.8 to 0.6 on those entries.
                  </div>
                )}
                {chatStep >= 2 && (
                  <div className="chat-bubble ai">
                    Want me to pull up those 3 journal entries so we can review the setups together?
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="testimonials-section">
        <div className="testimonials-inner">
          <div className="testimonials-header">
            <div className="trusted-eyebrow">Trusted by Traders</div>
            <h2 className="section-title">Built with feedback from serious traders</h2>
            <p className="section-sub" style={{margin:'0 auto'}}>Real traders, real results. Here&apos;s what they said after switching to JNV Pro.</p>
          </div>
          <div className="testimonial-grid">
            {[
              { initials:'MK', name:'Marcus K.', role:'Prop firm trader', stat:'+38%', statLabel:'Win rate improvement', quote:'"I went from 44% to 62% win rate in 3 months. The journal made me realize I was always overtrading Fridays — I had no idea until I saw the data."' },
              { initials:'SR', name:'Sofia R.', role:'Forex day trader', stat:'$12K', statLabel:'Drawdown prevented', quote:'"The drawdown alert stopped me from blowing my account during a losing streak. I would not have noticed the pattern without the equity curve staring back at me."' },
              { initials:'TN', name:'Theo N.', role:'JNV Pro user, futures', stat:'2.3×', statLabel:'R:R ratio improvement', quote:'"Logging my trades used to feel like admin. Now it&apos;s the most useful part of my day. My average risk-reward went from 1.1 to 2.3 because I can actually see which setups work."' },
              { initials:'AL', name:'Amara L.', role:'Swing trader', stat:'22', statLabel:'Day streak maintained', quote:'"I&apos;ve tried 4 other journals. This is the only one where I actually stuck to logging every trade. The goal streak makes it feel like progress, not a chore."' },
              { initials:'JB', name:'James B.', role:'Options trader', stat:'61%', statLabel:'Accuracy this quarter', quote:'"The analytics are at the level of tools I paid $200/mo for at my old fund. For a solo trader, this is genuinely insane value. The monthly P&L breakdown alone changed how I size."' },
              { initials:'CW', name:'Chloe W.', role:'JNV Pro user', stat:'−67%', statLabel:'Emotional trades reduced', quote:'"I started tagging trades as &apos;emotional&apos; or &apos;planned&apos;. After 6 weeks, I could see my emotional trades were losing me 3x more per loss. I cut them by two-thirds."' },
            ].map((t, i) => (
              <div key={i} className="testimonial-card">
                <div className="stars">{Array(5).fill(0).map((_,si)=><div key={si} className="star"/>)}</div>
                {t.stat && (
                  <>
                    <div className="testimonial-stat">{t.stat}</div>
                    <div className="testimonial-stat-label">{t.statLabel}</div>
                  </>
                )}
                <p className="testimonial-quote">{t.quote}</p>
                <div className="testimonial-author">
                  <div className="author-avatar">{t.initials}</div>
                  <div>
                    <div className="author-name">{t.name}</div>
                    <div className="author-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GETTING STARTED ── */}
      <section id="connect" className="connect-section">
        <div className="section-label">Getting Started</div>
        <h2 className="section-title">Start Trading Better Today</h2>
        <p className="section-sub">JNV PRO is designed to be simple to use while providing the power and features you need as a serious trader.</p>
        <div className="platform-cards">
          {[
            { icon:'✍️', name:'Log Your Trades', desc:'Easily log trades with entry/exit prices, quantity, and notes', status:'live' },
            { icon:'📊', name:'View Analytics', desc:'Get detailed analytics on your trading performance', status:'live' },
            { icon:'🎯', name:'Set Goals', desc:'Track progress towards your trading goals', status:'live' },
            { icon:'🤖', name:'AI Coach', desc:'Get personalized coaching and insights from our AI system', status:'soon' },
          ].map((item, i) => (
            <div key={i} className="platform-card">
              <div style={{width:'48px',height:'48px',background:'var(--blue-accent)',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'1.5rem',flexShrink:0}}>{item.icon}</div>
              <div className="platform-info">
                <div className="platform-name">{item.name}</div>
                <div className="platform-desc">{item.desc}</div>
              </div>
              {item.status === 'live'
                ? <span className="connect-badge live">Live</span>
                : <span className="connect-badge" style={{background:'#FEF3C7',color:'#92400e'}}>Coming Soon</span>
              }
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer>
        <div className="footer-inner">
          <div className="footer-grid">
            <div>
              <h3 style={{fontFamily:'var(--font-display)',fontSize:'1.3rem'}}>JNV PRO</h3>
              <p style={{fontSize:'0.85rem',color:'rgba(255,255,255,0.7)',marginTop:'8px'}}>The professional trade journal for serious traders.</p>
            </div>
            <div className="footer-col">
              <h3>Product</h3>
              <a href="#features">Features</a>
              <a href="#connect">Getting Started</a>
            </div>
            <div className="footer-col">
              <h3>Company</h3>
              <a href="#">About</a>
              <a href="#">Blog</a>
              <a href="#">Contact</a>
            </div>
            <div className="footer-col">
              <h3>Legal</h3>
              <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy</a>
              <a href="/terms-of-service" target="_blank" rel="noopener noreferrer">Terms</a>
              <a href="/return-policy" target="_blank" rel="noopener noreferrer">Return Policy</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 JNV PRO. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  )
}
