'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { City } from '@/lib/types'

interface CityContextType {
  currentCityId: string
  currentCity: City
  cities: City[]
  setCurrentCity: (id: string) => void
}

const FALLBACK_CITY: City = {
  id: 'default-city',
  name: 'Demo City',
  center_lat: 13.0827,
  center_lng: 80.2707,
  zoom: 12,
}

const CityContext = createContext<CityContextType | undefined>(undefined)

export function CityProvider({ children }: { children: React.ReactNode }) {
  const [cities, setCities] = useState<City[]>([FALLBACK_CITY])
  const [currentCityId, setCurrentCityIdState] = useState<string>(FALLBACK_CITY.id)

  useEffect(() => {
    const loadCities = async () => {
      try {
        const res = await fetch('/api/cities', { cache: 'no-store' })
        const data = await res.json()
        const loadedCities = (data.cities as City[] | undefined)?.length ? (data.cities as City[]) : [FALLBACK_CITY]
        setCities(loadedCities)

        const stored = localStorage.getItem('breathe_map_city_id')
        const initialId =
          stored && loadedCities.some((city) => city.id === stored) ? stored : loadedCities[0].id
        setCurrentCityIdState(initialId)
      } catch {
        setCities([FALLBACK_CITY])
        setCurrentCityIdState(FALLBACK_CITY.id)
      }
    }

    void loadCities()
  }, [])

  const setCurrentCity = (id: string) => {
    setCurrentCityIdState(id)
    localStorage.setItem('breathe_map_city_id', id)
  }

  const currentCity = useMemo(
    () => cities.find((city) => city.id === currentCityId) || cities[0] || FALLBACK_CITY,
    [cities, currentCityId]
  )

  return (
    <CityContext.Provider value={{ currentCityId, currentCity, cities, setCurrentCity }}>
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

