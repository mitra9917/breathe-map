'use client'

import { useEffect, useRef } from 'react'
import { useCity } from '@/context/CityContext'
import { injectMissingGeometry, generateSinglePolygon } from '@/lib/generateZoneGeometry'

// ── CPCB AQI scale — matches app palette ────────────────────────────────────

export function aqiColor(aqi: number): string {
  if (aqi <= 50) return '#34d399' // Good       — emerald
  if (aqi <= 100) return '#fbbf24' // Satisfactory — amber
  if (aqi <= 200) return '#f97316' // Moderate   — orange
  if (aqi <= 300) return '#ef4444' // Poor       — red
  if (aqi <= 400) return '#a855f7' // Very Poor  — purple
  return '#7f1d1d'                  // Severe     — dark red
}

export function aqiLabel(aqi: number): string {
  if (aqi <= 50) return 'Good'
  if (aqi <= 100) return 'Satisfactory'
  if (aqi <= 200) return 'Moderate'
  if (aqi <= 300) return 'Poor'
  if (aqi <= 400) return 'Very Poor'
  return 'Severe'
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface ZoneFeature {
  id: string
  name: string
  landUseType: string
  trafficDensity: number
  populationDensity: number
  roadLength: number
  notes?: string
  estimatedAQI: number
  geometry: GeoJSON.Geometry
}

interface ZoneMapProps {
  zones: ZoneFeature[]
  isPlacingZone?: boolean
  onZonePlaced?: (lat: number, lng: number, geometry: GeoJSON.Polygon) => void
  onPlacementCancelled?: () => void
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ZoneMap({ zones, isPlacingZone, onZonePlaced, onPlacementCancelled }: ZoneMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const previewLayerRef = useRef<any>(null)
  const { currentCity } = useCity()

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !currentCity || !currentCity.center_lat) return

    let isMounted = true

      ; (async () => {
        const L = (await import('leaflet')).default
        if (!isMounted || !containerRef.current || (containerRef.current as any)._leaflet_id) return

        // Inject Leaflet CSS once
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link')
          link.id = 'leaflet-css'
          link.rel = 'stylesheet'
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
          document.head.appendChild(link)
        }

        // Fix webpack broken default icon paths
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        })

        const map = L.map(containerRef.current!, {
          center: [currentCity.center_lat, currentCity.center_lng],
          zoom: currentCity.zoom,
          zoomControl: true,
          attributionControl: true,
        })
        mapRef.current = map

        // Dark tile layer — CARTO Dark Matter
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
          subdomains: 'abcd',
          maxZoom: 19,
        }).addTo(map)

        // Override Leaflet control/popup chrome to match dark theme
        const themeStyle = document.createElement('style')
        themeStyle.textContent = `
        .zone-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: 0 8px 40px rgba(0,0,0,0.6) !important;
          padding: 0 !important;
          border-radius: 14px !important;
          border: none !important;
        }
        .zone-popup .leaflet-popup-content { margin: 0 !important; line-height: normal !important; }
        .zone-popup .leaflet-popup-tip-container { display: none !important; }
        .zone-popup .leaflet-popup-close-button {
          color: #71717a !important;
          font-size: 18px !important;
          top: 8px !important;
          right: 10px !important;
        }
        .zone-popup .leaflet-popup-close-button:hover { color: #e4e4e7 !important; }
        .leaflet-control-zoom a {
          background: rgba(24,24,27,0.92) !important;
          color: #a1a1aa !important;
          border-color: rgba(255,255,255,0.08) !important;
          backdrop-filter: blur(8px) !important;
        }
        .leaflet-control-zoom a:hover { color: #34d399 !important; background: rgba(24,24,27,1) !important; }
        .leaflet-control-zoom-in  { border-radius: 10px 10px 0 0 !important; }
        .leaflet-control-zoom-out { border-radius: 0 0 10px 10px !important; }
        .leaflet-control-attribution {
          background: rgba(24,24,27,0.75) !important;
          color: #52525b !important;
          font-size: 10px !important;
          backdrop-filter: blur(4px) !important;
          border-radius: 8px 0 0 0 !important;
        }
        .leaflet-control-attribution a { color: #71717a !important; }
      `
        document.head.appendChild(themeStyle)

        // ── Draw zones ─────────────────────────────────────────────────────────
        const allBounds: ReturnType<typeof L.latLngBounds>[] = []

        // Safely parse geometries and attach them if they were skipped via backend payload.
        const zonedFeatures = injectMissingGeometry(zones, currentCity.center_lat, currentCity.center_lng)

        zonedFeatures.forEach((zone: any) => {
          const estimatedAQI = zone.estimatedAQI ?? zone.estimated_aqi ?? 50
          const color = aqiColor(estimatedAQI)
          const label = aqiLabel(estimatedAQI)

          const layer = L.geoJSON(zone.geometry as any, {
            style: {
              color,
              weight: 2,
              opacity: 0.85,
              fillColor: color,
              fillOpacity: 0.2,
            },
          })

          // Hover highlight
          layer.on('mouseover', () => layer.setStyle({ fillOpacity: 0.42, weight: 3 }))
          layer.on('mouseout', () => layer.setStyle({ fillOpacity: 0.2, weight: 2 }))

          // Popup
          const popup = `
          <div style="
            font-family: 'DM Sans', system-ui, sans-serif;
            min-width: 230px;
            background: #18181b;
            border: 1px solid rgba(255,255,255,0.09);
            border-radius: 14px;
            padding: 16px;
            color: #e4e4e7;
          ">
            <!-- Header -->
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:12px;">
              <p style="font-weight:700;font-size:14px;line-height:1.3;margin:0;color:#f4f4f5;padding-right:16px;">
                ${zone.name}
              </p>
              <span style="
                flex-shrink:0;
                background:${color}1a;
                color:${color};
                border:1px solid ${color}35;
                border-radius:999px;
                padding:2px 9px;
                font-size:11px;
                font-weight:700;
                white-space:nowrap;
              ">${label}</span>
            </div>

            <!-- Divider -->
            <div style="height:1px;background:rgba(255,255,255,0.07);margin-bottom:12px;"></div>

            <!-- Fields -->
            <div style="display:grid;gap:7px;">
              ${[
              ['Land Use', String(zone.landUseType || zone.land_use_type || '').replace(/_/g, ' ')],
              ['Traffic Density', `${zone.trafficDensity ?? zone.traffic_density}%`],
              ['Population Density', `${zone.populationDensity ?? zone.population_density}%`],
              ['Road Network', `${zone.roadLength ?? zone.road_length} km`],
            ].map(([k, v]) => `
                <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;">
                  <span style="color:#71717a;">${k}</span>
                  <span style="color:#d4d4d8;font-weight:500;text-transform:capitalize;">${v}</span>
                </div>
              `).join('')}

              <!-- AQI — bigger -->
              <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;margin-top:2px;">
                <span style="color:#71717a;">Estimated AQI</span>
                <span style="color:${color};font-weight:800;font-size:20px;line-height:1;">${estimatedAQI}</span>
              </div>

              ${zone.notes ? `
                <div style="border-top:1px solid rgba(255,255,255,0.07);padding-top:9px;margin-top:3px;">
                  <p style="color:#71717a;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 4px;">Notes</p>
                  <p style="color:#a1a1aa;font-size:12px;margin:0;line-height:1.55;">${zone.notes}</p>
                </div>
              ` : ''}
            </div>
          </div>
        `

          layer.bindPopup(popup, { maxWidth: 300, className: 'zone-popup' })
          layer.addTo(map)

          try {
            allBounds.push(layer.getBounds())
          } catch (_) {
            // Non-polygon geometries (points etc.) — skip bounds extend
          }
        })

        // Fit viewport to all zones
        const validBounds = allBounds.filter((b) => b && b.isValid && b.isValid())
        if (validBounds.length > 0) {
          const combined = validBounds.reduce((acc, b) => acc.extend(b))
          if (combined.isValid()) {
            map.fitBounds(combined, { padding: [48, 48], animate: false })
          }
        }

        // ── AQI Legend (bottom-right) ───────────────────────────────────────────
        const Legend = (L.Control as any).extend({
          options: { position: 'bottomright' },
          onAdd() {
            const el = L.DomUtil.create('div')
            el.innerHTML = `
            <div style="
              font-family: 'DM Sans', system-ui, sans-serif;
              background: rgba(24,24,27,0.92);
              border: 1px solid rgba(255,255,255,0.09);
              border-radius: 12px;
              padding: 12px 14px;
              min-width: 162px;
              backdrop-filter: blur(10px);
            ">
              <p style="
                color:#71717a;font-size:9.5px;font-weight:700;
                text-transform:uppercase;letter-spacing:0.13em;
                margin:0 0 9px;
              ">AQI Scale (CPCB)</p>
              ${[
                { range: '0 – 50', label: 'Good', color: '#34d399' },
                { range: '51 – 100', label: 'Satisfactory', color: '#fbbf24' },
                { range: '101 – 200', label: 'Moderate', color: '#f97316' },
                { range: '201 – 300', label: 'Poor', color: '#ef4444' },
                { range: '301 – 400', label: 'Very Poor', color: '#a855f7' },
                { range: '400+', label: 'Severe', color: '#7f1d1d' },
              ].map(({ range, label, color }) => `
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                  <div style="
                    width:10px;height:10px;border-radius:50%;flex-shrink:0;
                    background:${color};box-shadow:0 0 5px ${color}90;
                  "></div>
                  <span style="color:#a1a1aa;font-size:11.5px;flex:1;">${label}</span>
                  <span style="color:#3f3f46;font-size:10px;">${range}</span>
                </div>
              `).join('')}
            </div>
          `
            return el
          },
        })
        new Legend().addTo(map)
      })()

    return () => {
      isMounted = false
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [zones, currentCity.id])

  // ── Placement mode: click handler + preview layer + ESC key ──────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Crosshair cursor
    const container = map.getContainer() as HTMLElement
    if (isPlacingZone) {
      container.style.cursor = 'crosshair'
    } else {
      container.style.cursor = ''
      // Clean up any leftover preview
      if (previewLayerRef.current) {
        map.removeLayer(previewLayerRef.current)
        previewLayerRef.current = null
      }
      return
    }

    const handleClick = async (e: any) => {
      if (!isPlacingZone || !onZonePlaced) return

      const { lat, lng } = e.latlng
      const geometry = generateSinglePolygon(lat, lng)

      // Isolated preview layer — never touches permanent zones
      const L = (await import('leaflet')).default
      if (previewLayerRef.current) {
        map.removeLayer(previewLayerRef.current)
      }
      previewLayerRef.current = L.geoJSON(geometry as any, {
        style: {
          color: '#34d399',
          weight: 2,
          opacity: 0.9,
          fillColor: '#34d399',
          fillOpacity: 0.15,
          dashArray: '6 4',
        },
      }).addTo(map)

      onZonePlaced(lat, lng, geometry)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPlacingZone && onPlacementCancelled) {
        onPlacementCancelled()
      }
    }

    map.on('click', handleClick)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      map.off('click', handleClick)
      document.removeEventListener('keydown', handleKeyDown)
      container.style.cursor = ''
      if (previewLayerRef.current) {
        map.removeLayer(previewLayerRef.current)
        previewLayerRef.current = null
      }
    }
  }, [isPlacingZone, onZonePlaced, onPlacementCancelled])

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ minHeight: '100%' }}
    />
  )
}