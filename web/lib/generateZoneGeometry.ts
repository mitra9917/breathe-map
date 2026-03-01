import { ZoneFeature } from '@/components/zone-map'

/**
 * Generate a grid of rough rectangular zones surrounding a city center coordinate.
 * 
 * @param centerLat The city center latitude
 * @param centerLng The city center longitude
 * @param count Number of zones to layout
 * @returns Array of GeoJSON Polygon geometries
 */
export function generateGridZones(centerLat: number, centerLng: number, count: number): GeoJSON.Geometry[] {
    const geometries: GeoJSON.Geometry[] = []

    // Approximate conversion factors for bounding boxes near equator
    // 1 degree lat ≈ 111 km
    // We want boxes roughly 1.5km x 1.5km
    const latOffset = 0.012
    const lngOffset = 0.012

    // Create a grid outward from the center
    // Grid size n x n where n ≈ sqrt(count)
    let index = 0
    const cols = Math.ceil(Math.sqrt(count))

    const startLat = centerLat - ((cols / 2) * latOffset)
    const startLng = centerLng - ((cols / 2) * lngOffset)

    for (let row = 0; row < cols; row++) {
        for (let col = 0; col < cols; col++) {
            if (index >= count) break

            const boxLat = startLat + (row * latOffset * 1.5) // 1.5 spacer
            const boxLng = startLng + (col * lngOffset * 1.5)

            // Generate an irregular polygon with 5-8 vertices
            const numVertices = Math.floor(Math.random() * 4) + 5;
            const baseRadius = 0.007; // Approx radius scale

            const coordinates: number[][] = [];
            for (let i = 0; i < numVertices; i++) {
                const angle = (i / numVertices) * Math.PI * 2;
                // Add random jitter to radius (80% to 120%)
                const radiusJitter = baseRadius * (0.8 + Math.random() * 0.4);
                const vertexLng = boxLng + Math.cos(angle) * (radiusJitter * 1.2); // stretch slightly horizontally
                const vertexLat = boxLat + Math.sin(angle) * radiusJitter;
                coordinates.push([vertexLng, vertexLat]);
            }
            // Close the boundary loop
            coordinates.push([...coordinates[0]]);

            const polygon: GeoJSON.Polygon = {
                type: "Polygon",
                coordinates: [coordinates]
            }

            geometries.push(polygon)
            index++
        }
    }

    return geometries
}

/**
 * Generate a single irregular polygon centered at a specific point.
 * Used for map-click zone placement.
 *
 * @param lat Latitude of the click point
 * @param lng Longitude of the click point
 * @returns A single GeoJSON Polygon geometry
 */
export function generateSinglePolygon(lat: number, lng: number): GeoJSON.Polygon {
    const numVertices = Math.floor(Math.random() * 4) + 5
    const baseRadius = 0.006

    const coordinates: number[][] = []
    for (let i = 0; i < numVertices; i++) {
        const angle = (i / numVertices) * Math.PI * 2
        const radiusJitter = baseRadius * (0.8 + Math.random() * 0.4)
        const vertexLng = lng + Math.cos(angle) * (radiusJitter * 1.2)
        const vertexLat = lat + Math.sin(angle) * radiusJitter
        coordinates.push([vertexLng, vertexLat])
    }
    coordinates.push([...coordinates[0]])

    return { type: "Polygon", coordinates: [coordinates] }
}

/**
 * Attach generated geometry to zones that are missing spatial data.
 * Does NOT overwrite existing zone.geometry payloads.
 * 
 * @param zones Array of zone models to parse
 * @param cityCenterLat Center latitude for anchoring
 * @param cityCenterLng Center longitude for anchoring
 * @returns Zones with attached GeoJSON
 */
export function injectMissingGeometry(zones: ZoneFeature[], cityCenterLat: number, cityCenterLng: number): ZoneFeature[] {
    const missingGeomZones = zones.filter(z => !z.geometry || !z.geometry.type || !(z.geometry as any).coordinates?.length)

    if (missingGeomZones.length > 0) {
        console.log(`Generated geometry for ${missingGeomZones.length} zones`)
        const generatedGeoms = generateGridZones(cityCenterLat, cityCenterLng, missingGeomZones.length)

        // Map missing geoms safely
        let geomIndex = 0
        return zones.map(zone => {
            // Zone possesses valid GeoJSON
            if (zone.geometry && zone.geometry.type && (zone.geometry as any).coordinates?.length) {
                return zone
            }

            // Needs injection
            const newZone = { ...zone, geometry: generatedGeoms[geomIndex] }
            geomIndex++
            return newZone
        })
    }

    return zones
}
