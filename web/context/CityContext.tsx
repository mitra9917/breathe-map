'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { City, MOCK_CITIES } from '@/lib/mockCities'

const DEFAULT_CITY = MOCK_CITIES[0]

interface CityContextType {
    currentCityId: string
    currentCity: City
    setCurrentCity: (id: string) => void
}

const CityContext = createContext<CityContextType | undefined>(undefined)

export function CityProvider({ children }: { children: React.ReactNode }) {
    const [currentCityId, setCurrentCityIdState] = useState<string>(DEFAULT_CITY.id)

    useEffect(() => {
        const stored = localStorage.getItem('breathe_map_city_id')
        if (stored && MOCK_CITIES.some(c => c.id === stored)) {
            setCurrentCityIdState(stored)
        }
    }, [])

    const setCurrentCity = (id: string) => {
        setCurrentCityIdState(id)
        localStorage.setItem('breathe_map_city_id', id)
    }

    const currentCity = MOCK_CITIES.find(c => c.id === currentCityId) || DEFAULT_CITY

    return (
        <CityContext.Provider value={{ currentCityId, currentCity, setCurrentCity }}>
            {children}
        </CityContext.Provider>
    )
}

export function useCity() {
    const context = useContext(CityContext)
    if (context === undefined) {
        throw new Error('useCity must be used within a CityProvider')
    }
    return context
}
