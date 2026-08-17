'use client'

import { useState, useEffect, useRef } from 'react'
import { HeroDashboard } from './hero-dashboard'
import { HeroAnalyticsCard } from './hero-analytics-card'
import { HeroTradeJournalCard } from './hero-trade-journal-card'
import { HeroGoalsCard } from './hero-goals-card'
import { HeroImportCard } from './hero-import-card'
import { HeroAICoachCard } from './hero-ai-coach-card'

export function HeroShowcaseGrid() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left - rect.width / 2) / 25
      const y = (e.clientY - rect.top - rect.height / 2) / 25
      setMousePosition({ x, y })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const cardVariants = [
    {
      title: 'Dashboard',
      component: HeroDashboard,
      gridClass: 'lg:col-span-2 lg:row-span-2',
      animationDelay: '0s',
    },
    {
      title: 'Real-Time Analytics',
      component: HeroAnalyticsCard,
      gridClass: 'lg:col-span-1 lg:row-span-1',
      animationDelay: '0.1s',
    },
    {
      title: 'Trade Journal',
      component: HeroTradeJournalCard,
      gridClass: 'lg:col-span-1 lg:row-span-1',
      animationDelay: '0.2s',
    },
    {
      title: 'Trading Goals',
      component: HeroGoalsCard,
      gridClass: 'lg:col-span-1 lg:row-span-1',
      animationDelay: '0.3s',
    },
    {
      title: 'Import Strategies',
      component: HeroImportCard,
      gridClass: 'lg:col-span-1 lg:row-span-1',
      animationDelay: '0.4s',
    },
    {
      title: 'AI Coach',
      component: HeroAICoachCard,
      gridClass: 'lg:col-span-1 lg:row-span-1',
      animationDelay: '0.5s',
    },
  ]

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ perspective: '1200px' }}
    >
      {/* Background gradient orbs */}
      <div className="absolute top-10 right-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-10 left-20 w-96 h-96 bg-primary/3 rounded-full blur-3xl -z-10" />

      {/* Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 lg:p-6">
        {cardVariants.map(({ title, component: Component, gridClass, animationDelay }) => (
          <div
            key={title}
            className={`${gridClass} rounded-2xl overflow-hidden relative`}
            style={{
              backdropFilter: 'blur(20px)',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: 'inset 0 0 20px rgba(255, 255, 255, 0.1)',
              animation: `float 6s ease-in-out infinite`,
              animationDelay,
            }}
          >
            <div
              style={{
                transform: `perspective(1200px) rotateX(${mousePosition.y * 0.3}deg) rotateY(${mousePosition.x * 0.3}deg)`,
                transition: 'transform 0.1s ease-out',
                width: '100%',
                height: '100%',
              }}
            >
              <Component />
            </div>
            <div
              className="absolute inset-0 pointer-events-none rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(15, 62, 127, 0.05) 0%, transparent 100%)',
              }}
            />
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  )
}
