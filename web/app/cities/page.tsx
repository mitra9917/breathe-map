'use client'

import { useRouter } from 'next/navigation'
import { NavBar } from '@/components/nav-bar'
import { FooterDisclaimer } from '@/components/footer-disclaimer'
import { toastWarning } from '@/lib/toast'
import { ErrorCodes } from '@/lib/errorCodes'
import { MOCK_CITIES } from '@/lib/mockCities'
import { useCity } from '@/context/CityContext'
import { useState } from 'react'
import { Building2 } from 'lucide-react'

export default function CitiesPage() {
    const router = useRouter()
    const { currentCityId, setCurrentCity } = useCity()
    const [hoveredCity, setHoveredCity] = useState<string | null>(null)

    const handleSelectCity = (id: string) => {
        setCurrentCity(id)
        router.push('/dashboard')
    }

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col">
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-title { font-family: 'DM Serif Display', serif; }
        .body-font  { font-family: 'DM Sans', sans-serif; }
      `}</style>
            <NavBar />

            <main className="body-font flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10 md:py-20 flex flex-col items-center">
                <div style={{ animation: 'fadeSlideUp 0.5s ease both' }} className="text-center mb-12">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-[0.2em]">Workspace</span>
                    </div>
                    <h1 className="hero-title text-4xl sm:text-5xl text-zinc-100 tracking-tight mb-4">
                        Select City Workspace
                    </h1>
                    <p className="text-zinc-500 text-[15px] max-w-xl mx-auto">
                        Choose a city to view and manage its air quality monitoring zones.
                    </p>
                </div>

                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                    {MOCK_CITIES.map((city, i) => {
                        const isActive = city.id === currentCityId
                        const isHovered = hoveredCity === city.id
                        return (
                            <div
                                key={city.id}
                                onClick={() => handleSelectCity(city.id)}
                                onMouseEnter={() => setHoveredCity(city.id)}
                                onMouseLeave={() => setHoveredCity(null)}
                                style={{
                                    animation: `fadeSlideUp 0.5s ease ${i * 100}ms both`,
                                    transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                                    transition: 'all 0.2s ease',
                                    borderColor: isActive ? '#10b981' : isHovered ? 'rgba(52,211,153,0.5)' : 'rgba(255,255,255,0.1)',
                                    backgroundColor: isActive ? 'rgba(16, 185, 129, 0.1)' : isHovered ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.02)',
                                }}
                                className="relative rounded-2xl p-6 border cursor-pointer text-left overflow-hidden group"
                            >
                                {isActive && (
                                    <div className="absolute top-4 right-4 focus:outline-none">
                                        <span className="flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                                        <Building2 size={18} className="text-zinc-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-zinc-200 text-lg">{city.name}</h3>
                                        <p className="text-xs text-zinc-500">Workspace</p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div style={{ animation: 'fadeSlideUp 0.5s ease 500ms both' }} className="w-full text-center">
                    <button
                        onClick={() => toastWarning(ErrorCodes.CITY_CREATE_MOCK.message, ErrorCodes.CITY_CREATE_MOCK.code)}
                        className="px-6 py-3 rounded-xl border border-dashed border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 hover:bg-zinc-900 transition-all text-sm font-medium inline-flex items-center gap-2"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        Create New City Workspace
                    </button>
                </div>
            </main >

            <FooterDisclaimer />
        </div >
    )
}
