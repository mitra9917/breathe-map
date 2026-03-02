import path from 'path'
import { spawnSync } from 'child_process'
import { Zone } from '@/lib/types'

type InferenceOutput = {
  estimated_aqi: number
  category: 'good' | 'moderate' | 'poor' | 'severe'
  cluster_id: number
  feature_contributions: {
    traffic: number
    population: number
    road_network: number
    land_use: number
  }
  model_version: string
}

function deriveAmbientFeatures(zone: Zone) {
  const temperature = 28 + zone.traffic_density * 0.08
  const humidity = Math.max(30, Math.min(90, 70 - zone.traffic_density * 0.2 + zone.population_density * 0.1))
  const timeOfDay = 12
  return { temperature, humidity, timeOfDay }
}

export function predictZoneAQI(zone: Zone): InferenceOutput {
  const inferScript = path.join(process.cwd(), 'lib', 'ml', 'infer.py')
  const ambient = deriveAmbientFeatures(zone)
  const payload = {
    trafficDensity: zone.traffic_density,
    populationDensity: zone.population_density,
    roadLength: zone.road_length,
    temperature: ambient.temperature,
    humidity: ambient.humidity,
    timeOfDay: ambient.timeOfDay,
    landUseType: zone.land_use_type,
  }

  const result = spawnSync('python3', [inferScript], {
    input: JSON.stringify(payload),
    encoding: 'utf-8',
    maxBuffer: 1024 * 1024,
  })

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || 'ML inference process failed')
  }

  const parsed = JSON.parse(result.stdout) as InferenceOutput | { error: string }
  if ('error' in parsed) {
    throw new Error(parsed.error)
  }
  return parsed
}

