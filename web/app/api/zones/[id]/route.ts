import { NextRequest, NextResponse } from 'next/server'
import { getLatestAQIForZone, getZoneById } from '@/lib/db/repository'
import { db } from '@/lib/db/adapter'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cityId = request.nextUrl.searchParams.get('cityId') ?? undefined
    const zone = await getZoneById(id, cityId)

    if (!zone) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 })
    }

    const estimate = await getLatestAQIForZone(zone)
    return NextResponse.json({ zone, estimate })
  } catch (error) {
    console.error('Error fetching zone:', error)
    return NextResponse.json({ error: 'Failed to fetch zone details' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.zones.delete(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting zone:', error)
    return NextResponse.json({ error: 'Failed to delete zone' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const updates = await request.json()
    const data = await db.zones.update(id, updates)

    return NextResponse.json({ zone: data })
  } catch (error) {
    console.error('Error updating zone:', error)
    return NextResponse.json({ error: 'Failed to update zone' }, { status: 500 })
  }
}
