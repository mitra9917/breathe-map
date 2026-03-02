import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

const FALLBACK_CITY = {
  id: 'default-city',
  name: 'Default City',
  center_lat: 13.0827,
  center_lng: 80.2707,
  zoom: 12,
}

export async function GET() {
  try {
    const supabase = getSupabaseServerClient()

    const { data, error } = await supabase
      .from('cities')
      .select('id, name, center_lat, center_lng, zoom')
      .order('name', { ascending: true })

    // Table missing or not migrated yet: keep app usable with one fallback city.
    if (error) {
      console.error('Error fetching cities:', error)
      return NextResponse.json({
        cities: [FALLBACK_CITY],
        count: 1,
        fallback: true,
        timestamp: new Date().toISOString(),
      })
    }

    const cities = data && data.length > 0 ? data : [FALLBACK_CITY]

    return NextResponse.json({
      cities,
      count: cities.length,
      fallback: !data || data.length === 0,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error in cities route:', error)
    return NextResponse.json({
      cities: [FALLBACK_CITY],
      count: 1,
      fallback: true,
      timestamp: new Date().toISOString(),
      error: 'Failed to fetch cities',
    })
  }
}
