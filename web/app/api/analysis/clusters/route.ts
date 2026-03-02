import { NextResponse } from 'next/server'
import { getClustersFromEstimates, getLatestAQIForZones, listZonesByCity } from '@/lib/db/repository'

/**
 * GET /api/analysis/clusters
 * Returns mock zone clusters based on similarity in AQI and characteristics
 * 
 * Response:
 * Array of clusters with zones, average AQI, and characteristics
 * 
 * DISCLAIMER: Clusters are exploratory groupings from mock data only
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const cityId = url.searchParams.get('cityId') ?? undefined
    const zones = await listZonesByCity(cityId)
    const estimates = await getLatestAQIForZones(zones)
    const clusters = getClustersFromEstimates(zones, estimates)
    const zoneLookup = Object.fromEntries(zones.map((zone) => [zone.id, zone.name]))

    const response = {
      data: clusters,
      zone_lookup: zoneLookup,
      total_zones: zones.length,
      total_clusters: clusters.length,
      disclaimer:
        'Exploratory ML clustering based on model-derived AQI and zone features.',
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Clustering analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to generate clusters' },
      { status: 500 }
    )
  }
}
