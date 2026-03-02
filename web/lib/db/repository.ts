import { AQIEstimate, AQICorrelation, Zone, ZoneCluster } from '@/lib/types'
import { db } from './adapter'

export async function listZones(): Promise<Zone[]> {
  return db.zones.getAll()
}

export async function listZonesByCity(cityId?: string): Promise<Zone[]> {
  return db.zones.getAll(cityId)
}

export async function getZoneById(id: string, cityId?: string): Promise<Zone | null> {
  return db.zones.getById(id, cityId)
}

export async function createZone(zone: Omit<Zone, 'id' | 'created_at'>): Promise<Zone> {
  return db.zones.create(zone)
}

export async function storeAQIEstimate(zone: Zone): Promise<AQIEstimate> {
  return db.aqi.estimate(zone)
}

export async function getLatestAQIForZone(zone: Zone): Promise<AQIEstimate> {
  return db.aqi.estimate(zone)
}

export async function getLatestAQIForZones(zones: Zone[]): Promise<Map<string, AQIEstimate>> {
  const estimates = new Map<string, AQIEstimate>()

  await Promise.all(
    zones.map(async (zone) => {
      const estimate = await getLatestAQIForZone(zone)
      estimates.set(zone.id, estimate)
    })
  )

  return estimates
}

export function getCorrelationsFromEstimates(zones: Zone[], estimates: Map<string, AQIEstimate>): AQICorrelation[] {
  const withEstimates = zones
    .map((zone) => ({ zone, estimate: estimates.get(zone.id) }))
    .filter((item): item is { zone: Zone; estimate: AQIEstimate } => Boolean(item.estimate))

  if (withEstimates.length === 0) {
    return []
  }

  const rows = withEstimates.map(({ zone, estimate }) => ({
    traffic: zone.traffic_density,
    population: zone.population_density,
    roads: zone.road_length,
    industrial: zone.land_use_type === 'industrial' ? 1 : 0,
    green: zone.land_use_type === 'green_space' ? 1 : 0,
    aqi: estimate.estimated_aqi,
  }))

  const correlation = (x: number[], y: number[]): number => {
    const n = x.length
    if (n < 2) return 0

    const meanX = x.reduce((s, v) => s + v, 0) / n
    const meanY = y.reduce((s, v) => s + v, 0) / n

    const numerator = x.reduce((s, _, i) => s + (x[i] - meanX) * (y[i] - meanY), 0)
    const denomX = Math.sqrt(x.reduce((s, v) => s + Math.pow(v - meanX, 2), 0))
    const denomY = Math.sqrt(y.reduce((s, v) => s + Math.pow(v - meanY, 2), 0))

    if (denomX === 0 || denomY === 0) return 0
    return numerator / (denomX * denomY)
  }

  const aqi = rows.map((r) => r.aqi)

  return [
    {
      factor: 'Traffic Density',
      correlation_coefficient: Number(correlation(rows.map((r) => r.traffic), aqi).toFixed(2)),
      description: 'Correlation between traffic density and estimated AQI',
    },
    {
      factor: 'Population Density',
      correlation_coefficient: Number(correlation(rows.map((r) => r.population), aqi).toFixed(2)),
      description: 'Correlation between population density and estimated AQI',
    },
    {
      factor: 'Road Network Length',
      correlation_coefficient: Number(correlation(rows.map((r) => r.roads), aqi).toFixed(2)),
      description: 'Correlation between road network length and estimated AQI',
    },
    {
      factor: 'Industrial Presence',
      correlation_coefficient: Number(correlation(rows.map((r) => r.industrial), aqi).toFixed(2)),
      description: 'Correlation between industrial land use and estimated AQI',
    },
    {
      factor: 'Green Space Presence',
      correlation_coefficient: Number(correlation(rows.map((r) => r.green), aqi).toFixed(2)),
      description: 'Correlation between green space land use and estimated AQI',
    },
  ]
}

export function getClustersFromEstimates(zones: Zone[], estimates: Map<string, AQIEstimate>): ZoneCluster[] {
  const grouped = new Map<string, Zone[]>()

  for (const zone of zones) {
    const estimate = estimates.get(zone.id)
    const clusterKey =
      estimate && typeof (estimate.feature_contributions as any)?.cluster_id === 'number'
        ? `cluster_${(estimate.feature_contributions as any).cluster_id}`
        : zone.land_use_type
    const key = clusterKey
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)?.push(zone)
  }

  let clusterId = 1
  const clusters: ZoneCluster[] = []

  for (const [landUse, members] of grouped) {
    if (members.length === 0) continue
    const avgAQI = Math.round(
      members.reduce((sum, zone) => sum + (estimates.get(zone.id)?.estimated_aqi ?? 0), 0) / members.length
    )

    clusters.push({
      cluster_id: clusterId++,
      zones: members.map((m) => m.id),
      average_aqi: avgAQI,
      dominant_land_use: members[0].land_use_type,
      characteristics: `ML similarity cluster ${landUse.replace('_', ' ')} with comparable AQI behavior.`,
    })
  }

  return clusters.sort((a, b) => b.average_aqi - a.average_aqi)
}
