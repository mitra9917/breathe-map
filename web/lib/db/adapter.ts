import { AQIEstimate, DatabaseAdapter, Zone } from '../types'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { predictZoneAQI } from '@/lib/ml/inference'

function toZone(row: any): Zone {
  const trafficDensity = Number(row.traffic_density)
  const populationDensity = Number(row.population_density)
  const roadLength = Number(row.road_length)

  return {
    id: row.id,
    name: row.name,
    land_use_type: row.land_use_type,
    traffic_density: Number.isFinite(trafficDensity) ? trafficDensity : 0,
    population_density: Number.isFinite(populationDensity) ? populationDensity : 0,
    road_length: Number.isFinite(roadLength) ? roadLength : 0,
    notes: row.notes ?? '',
    city_id: row.city_id ?? 'default-city',
    geometry: row.geometry ?? null,
    created_at: row.created_at,
  }
}

async function estimateAndPersist(zone: Zone): Promise<AQIEstimate> {
  const prediction = predictZoneAQI(zone)
  const estimatedAQI = Math.round(prediction.estimated_aqi)
  const featureContributions = {
    ...prediction.feature_contributions,
    cluster_id: prediction.cluster_id,
  }
  const assumptions = `ML inference from trained model (${prediction.model_version}).`

  const estimate: AQIEstimate = {
    zone_id: zone.id,
    estimated_aqi: estimatedAQI,
    category: prediction.category,
    feature_contributions: featureContributions,
    assumptions,
    timestamp: new Date().toISOString(),
  }

  try {
    const supabase = getSupabaseServerClient()
    const { error } = await supabase.from('aqi_estimates').insert({
      zone_id: zone.id,
      estimated_aqi: estimatedAQI,
      category: prediction.category,
      feature_contributions: featureContributions,
      assumptions,
      source: prediction.model_version,
    })
    if (error) {
      console.error('Failed to persist AQI estimate:', error)
    }
  } catch (error) {
    console.error('AQI persistence error:', error)
  }

  return estimate
}

const realAdapter: DatabaseAdapter = {
  zones: {
    async getAll(cityId?: string): Promise<Zone[]> {
      const supabase = getSupabaseServerClient()
      let query = supabase.from('zones').select('*').order('created_at', { ascending: false })
      if (cityId) query = query.eq('city_id', cityId)

      const { data, error } = await query
      if (error) throw error
      return (data ?? []).map(toZone)
    },

    async getById(id: string, cityId?: string): Promise<Zone | null> {
      const supabase = getSupabaseServerClient()
      let query = supabase.from('zones').select('*').eq('id', id)
      if (cityId) query = query.eq('city_id', cityId)

      const { data, error } = await query.maybeSingle()
      if (error) throw error
      if (!data) return null
      return toZone(data)
    },

    async create(zone: Omit<Zone, 'id' | 'created_at'>): Promise<Zone> {
      const supabase = getSupabaseServerClient()
      const cityId = zone.city_id ?? 'default-city'

      const { data, error } = await supabase
        .from('zones')
        .insert({
          name: zone.name,
          land_use_type: zone.land_use_type,
          traffic_density: zone.traffic_density,
          population_density: zone.population_density,
          road_length: zone.road_length,
          notes: zone.notes ?? '',
          city_id: cityId,
          geometry: zone.geometry ?? null,
        })
        .select('*')
        .single()

      if (error) throw error
      return toZone(data)
    },

    async update(id: string, updates: Partial<Zone>): Promise<Zone> {
      const supabase = getSupabaseServerClient()
      const { data, error } = await supabase
        .from('zones')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single()
      if (error) throw error
      return toZone(data)
    },

    async delete(id: string): Promise<void> {
      const supabase = getSupabaseServerClient()
      const { error } = await supabase.from('zones').delete().eq('id', id)
      if (error) throw error
    },
  },

  aqi: {
    async estimate(zone: Zone): Promise<AQIEstimate> {
      return estimateAndPersist(zone)
    },

    async getHistorical(zoneId: string): Promise<AQIEstimate[]> {
      const supabase = getSupabaseServerClient()
      const { data, error } = await supabase
        .from('aqi_estimates')
        .select('zone_id, estimated_aqi, category, feature_contributions, assumptions, created_at')
        .eq('zone_id', zoneId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data ?? []).map((row) => ({
        zone_id: row.zone_id,
        estimated_aqi: row.estimated_aqi,
        category: row.category,
        feature_contributions: row.feature_contributions,
        assumptions: row.assumptions,
        timestamp: row.created_at,
      }))
    },
  },
}

export const db: DatabaseAdapter = realAdapter
