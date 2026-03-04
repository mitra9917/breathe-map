import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { SimulationResult } from '@/lib/types'
import { getZoneById } from '@/lib/db/repository'
import { predictZoneAQI } from '@/lib/ml/inference'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getFallbackAQIPrediction } from '@/lib/ml/fallback'

function toFiniteNumber(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : fallback
}

/**
 * POST /api/simulation/run
 * Simulates AQI reduction based on intervention parameters
 * Uses the same transparent logic as AQI estimation
 * 
 * Request body:
 * {
 *   zone_id: string,
 *   scenario_name?: string,
 *   vehicle_reduction_percentage: number (0-100),
 *   green_cover_increase: number (0-100),
 *   traffic_rerouting_factor: number (0-1)
 * }
 * 
 * Response:
 * {
 *   before_aqi: number,
 *   after_aqi: number,
 *   delta: number,
 *   delta_percentage: number,
 *   explanation: string,
 *   recommendation: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      zone_id,
      cityId,
      scenario_name,
      vehicle_reduction_percentage = 0,
      green_cover_increase = 0,
      traffic_rerouting_factor = 0,
    } = body as {
      zone_id: string
      cityId?: string
      scenario_name?: string
      vehicle_reduction_percentage: number
      green_cover_increase: number
      traffic_rerouting_factor: number
    }

    if (!zone_id) {
      return NextResponse.json(
        { error: 'zone_id is required' },
        { status: 400 }
      )
    }

    const zone = await getZoneById(zone_id, cityId)
    if (!zone) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 })
    }

    // Validate input ranges
    if (
      vehicle_reduction_percentage < 0 ||
      vehicle_reduction_percentage > 100 ||
      green_cover_increase < 0 ||
      green_cover_increase > 100 ||
      traffic_rerouting_factor < 0 ||
      traffic_rerouting_factor > 1
    ) {
      return NextResponse.json(
        { error: 'Invalid parameter ranges' },
        { status: 400 }
      )
    }

    let baselinePrediction
    try {
      baselinePrediction = predictZoneAQI(zone)
    } catch (error) {
      console.error(`Simulation baseline inference failed for zone ${zone.id}, using fallback:`, error)
      baselinePrediction = getFallbackAQIPrediction(zone)
    }
    const beforeAQI = Math.max(0, Math.min(500, Math.round(toFiniteNumber(baselinePrediction.estimated_aqi, 0))))

    const trafficFactor = (1 - vehicle_reduction_percentage / 100) * (1 - traffic_rerouting_factor * 0.35)
    const adjustedTraffic = Math.max(0, Math.round(zone.traffic_density * trafficFactor))
    const adjustedRoadLength = Number((zone.road_length * (1 - traffic_rerouting_factor * 0.2)).toFixed(2))

    const projectedZone = {
      ...zone,
      traffic_density: adjustedTraffic,
      road_length: Math.max(0, adjustedRoadLength),
    }

    let projectedPrediction
    try {
      projectedPrediction = predictZoneAQI(projectedZone)
    } catch (error) {
      console.error(`Simulation projected inference failed for zone ${zone.id}, using fallback:`, error)
      projectedPrediction = getFallbackAQIPrediction(projectedZone)
    }
    const greeningReduction = Math.round(green_cover_increase * 0.6)
    const projectedAqi = Math.max(0, Math.min(500, Math.round(toFiniteNumber(projectedPrediction.estimated_aqi, beforeAQI))))
    const afterAQI = Math.max(0, projectedAqi - greeningReduction)
    const delta = toFiniteNumber(beforeAQI - afterAQI, 0)
    const deltaPercentageRaw = beforeAQI > 0 ? (delta / beforeAQI) * 100 : 0
    const deltaPercentage = toFiniteNumber(deltaPercentageRaw, 0)

    // Generate explanation
    const factors = []
    if (vehicle_reduction_percentage > 0) {
      factors.push(
        `${vehicle_reduction_percentage}% vehicle reduction and rerouting lower modeled traffic load`
      )
    }
    if (green_cover_increase > 0) {
      factors.push(`${green_cover_increase}% green cover applies additional reduction (~${greeningReduction} pts)`)
    }
    if (traffic_rerouting_factor > 0) {
      factors.push(`Traffic rerouting factor: ${traffic_rerouting_factor.toFixed(2)}`)
    }

    const explanation =
      factors.length > 0
        ? `Estimated reduction breakdown: ${factors.join('; ')}`
        : 'No interventions applied in this scenario'

    // Generate recommendation
    let recommendation = ''
    if (deltaPercentage < 5) {
      recommendation =
        'Minimal impact expected. Consider combining interventions for greater effect.'
    } else if (deltaPercentage < 15) {
      recommendation =
        'Modest improvement possible. Monitor real-world implementation effectiveness.'
    } else if (deltaPercentage < 30) {
      recommendation =
        'Significant improvement potential. Worth implementing with regular monitoring.'
    } else {
      recommendation =
        'Substantial improvement projected. This represents a meaningful environmental intervention.'
    }

    const scenarioId = randomUUID()
    const resultId = randomUUID()
    const result: SimulationResult = {
      scenario_id: scenarioId,
      zone_id: zone.id,
      before_aqi: beforeAQI,
      after_aqi: afterAQI,
      delta,
      delta_percentage: Math.round(deltaPercentage * 10) / 10,
      explanation,
      recommendation,
      timestamp: new Date().toISOString(),
    }

    const supabase = getSupabaseServerClient()
    const { error: scenarioError } = await supabase.from('simulation_scenarios').insert({
      id: scenarioId,
      zone_id: zone.id,
      name: scenario_name ?? `Simulation for ${zone.name}`,
      vehicle_reduction_percentage,
      green_cover_increase,
      traffic_rerouting_factor,
    })
    if (scenarioError) {
      console.error('Failed to store scenario:', scenarioError)
      return NextResponse.json({ error: 'Failed to persist scenario' }, { status: 500 })
    }

    const { error: resultError } = await supabase.from('simulation_results').insert({
      id: resultId,
      scenario_id: scenarioId,
      zone_id: zone.id,
      before_aqi: beforeAQI,
      after_aqi: afterAQI,
      delta,
      delta_percentage: Number((Math.round(deltaPercentage * 10) / 10).toFixed(2)),
      explanation,
      recommendation,
    })
    if (resultError) {
      console.error('Failed to store simulation result:', resultError)
      return NextResponse.json({ error: 'Failed to persist simulation result' }, { status: 500 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Simulation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to run simulation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
