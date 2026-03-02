import { MLModel, Zone, ZoneCluster } from '@/lib/types'
import { predictZoneAQI } from '@/lib/ml/inference'

export const model: MLModel = {
  async estimateAQI(zone: Zone): Promise<number> {
    return Math.round(predictZoneAQI(zone).estimated_aqi)
  },

  async clusterZones(zones: Zone[]): Promise<ZoneCluster[]> {
    const groups = new Map<number, Zone[]>()

    for (const zone of zones) {
      const prediction = predictZoneAQI(zone)
      const clusterId = prediction.cluster_id
      if (!groups.has(clusterId)) groups.set(clusterId, [])
      groups.get(clusterId)?.push(zone)
    }

    return Array.from(groups.entries()).map(([clusterId, members]) => ({
      cluster_id: clusterId,
      zones: members.map((zone) => zone.id),
      average_aqi:
        Math.round(
          members.reduce((sum, zone) => sum + predictZoneAQI(zone).estimated_aqi, 0) / Math.max(members.length, 1)
        ),
      dominant_land_use: members[0]?.land_use_type ?? 'mixed',
      characteristics: `Cluster ${clusterId} based on trained AQI + KMeans features.`,
    }))
  },
}

