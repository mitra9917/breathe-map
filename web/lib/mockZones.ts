import { ZoneFeature } from '@/components/zone-map'

const generateRealisticAQI = (landUseType: string): number => {
    let min = 50, max = 50;
    switch (landUseType.toLowerCase()) {
        case 'industrial': min = 220; max = 300; break;
        case 'commercial': min = 160; max = 220; break;
        case 'residential': min = 100; max = 160; break;
        case 'mixed': min = 120; max = 200; break;
        case 'green_space': min = 40; max = 90; break;
    }
    // Add small random noise inside the constrained band for realism
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const applyHeterogeneousData = (zones: ZoneFeature[]) => {
    return zones.map(z => ({
        ...z,
        estimatedAQI: generateRealisticAQI(z.landUseType)
    }))
}

// Realistic bounding shapes per city coordinates
const _baseMockZones: Record<string, ZoneFeature[]> = {
    'default-city': [
        {
            id: "demo-1",
            name: "Fort St. George (Demo)",
            landUseType: "commercial",
            trafficDensity: 82,
            populationDensity: 70,
            roadLength: 15.2,
            estimatedAQI: 124,
            geometry: { type: "Polygon", coordinates: [[[80.25, 13.06], [80.29, 13.06], [80.29, 13.10], [80.25, 13.10], [80.25, 13.06]]] }
        },
        {
            id: "demo-2",
            name: "Marina Beach (Demo)",
            landUseType: "green_space",
            trafficDensity: 30,
            populationDensity: 45,
            roadLength: 8.5,
            estimatedAQI: 58,
            geometry: { type: "Polygon", coordinates: [[[80.27, 13.03], [80.30, 13.03], [80.30, 13.06], [80.27, 13.06], [80.27, 13.03]]] }
        },
        {
            id: "demo-3",
            name: "Guindy Estate (Demo)",
            landUseType: "industrial",
            trafficDensity: 95,
            populationDensity: 20,
            roadLength: 22.4,
            estimatedAQI: 215,
            geometry: { type: "Polygon", coordinates: [[[80.20, 12.99], [80.24, 12.99], [80.24, 13.03], [80.20, 13.03], [80.20, 12.99]]] }
        },
        {
            id: "demo-4",
            name: "Adyar Res. (Demo)",
            landUseType: "residential",
            trafficDensity: 55,
            populationDensity: 65,
            roadLength: 14.8,
            estimatedAQI: 92,
            geometry: { type: "Polygon", coordinates: [[[80.24, 12.98], [80.28, 12.98], [80.28, 13.02], [80.24, 13.02], [80.24, 12.98]]] }
        },
        {
            id: "demo-5",
            name: "T. Nagar (Demo)",
            landUseType: "commercial",
            trafficDensity: 88,
            populationDensity: 85,
            roadLength: 18.0,
            estimatedAQI: 165,
            geometry: { type: "Polygon", coordinates: [[[80.22, 13.02], [80.25, 13.02], [80.25, 13.05], [80.22, 13.05], [80.22, 13.02]]] }
        }
    ],
    'chennai': [
        {
            id: "chennai-1",
            name: "Parrys Corner",
            landUseType: "commercial",
            trafficDensity: 82,
            populationDensity: 70,
            roadLength: 15.2,
            estimatedAQI: 135,
            geometry: { type: "Polygon", coordinates: [[[80.25, 13.06], [80.29, 13.06], [80.29, 13.10], [80.25, 13.10], [80.25, 13.06]]] }
        },
        {
            id: "chennai-2",
            name: "Marina Beach Coastal",
            landUseType: "green_space",
            trafficDensity: 30,
            populationDensity: 45,
            roadLength: 8.5,
            estimatedAQI: 55,
            geometry: { type: "Polygon", coordinates: [[[80.27, 13.03], [80.30, 13.03], [80.30, 13.06], [80.27, 13.06], [80.27, 13.03]]] }
        },
        {
            id: "chennai-3",
            name: "Guindy Industrial",
            landUseType: "industrial",
            trafficDensity: 95,
            populationDensity: 20,
            roadLength: 22.4,
            estimatedAQI: 230,
            geometry: { type: "Polygon", coordinates: [[[80.20, 12.99], [80.24, 12.99], [80.24, 13.03], [80.20, 13.03], [80.20, 12.99]]] }
        },
        {
            id: "chennai-4",
            name: "Adyar Residential",
            landUseType: "residential",
            trafficDensity: 55,
            populationDensity: 65,
            roadLength: 14.8,
            estimatedAQI: 88,
            geometry: { type: "Polygon", coordinates: [[[80.24, 12.98], [80.28, 12.98], [80.28, 13.02], [80.24, 13.02], [80.24, 12.98]]] }
        },
        {
            id: "chennai-5",
            name: "T. Nagar Shopping",
            landUseType: "mixed",
            trafficDensity: 88,
            populationDensity: 85,
            roadLength: 18.0,
            estimatedAQI: 175,
            geometry: { type: "Polygon", coordinates: [[[80.22, 13.02], [80.25, 13.02], [80.25, 13.05], [80.22, 13.05], [80.22, 13.02]]] }
        }
    ],
    'bangalore': [
        {
            id: "blr-1",
            name: "MG Road Central",
            landUseType: "commercial",
            trafficDensity: 92,
            populationDensity: 80,
            roadLength: 16.5,
            estimatedAQI: 145,
            geometry: { type: "Polygon", coordinates: [[[77.58, 12.96], [77.62, 12.96], [77.62, 12.99], [77.58, 12.99], [77.58, 12.96]]] }
        },
        {
            id: "blr-2",
            name: "Cubbon Park",
            landUseType: "green_space",
            trafficDensity: 25,
            populationDensity: 10,
            roadLength: 6.2,
            estimatedAQI: 48,
            geometry: { type: "Polygon", coordinates: [[[77.59, 12.97], [77.61, 12.97], [77.61, 12.98], [77.59, 12.98], [77.59, 12.97]]] }
        },
        {
            id: "blr-3",
            name: "Peenya Industrial",
            landUseType: "industrial",
            trafficDensity: 90,
            populationDensity: 30,
            roadLength: 20.0,
            estimatedAQI: 260,
            geometry: { type: "Polygon", coordinates: [[[77.49, 13.01], [77.53, 13.01], [77.53, 13.04], [77.49, 13.04], [77.49, 13.01]]] }
        },
        {
            id: "blr-4",
            name: "Jayanagar",
            landUseType: "residential",
            trafficDensity: 60,
            populationDensity: 75,
            roadLength: 18.2,
            estimatedAQI: 105,
            geometry: { type: "Polygon", coordinates: [[[77.56, 12.92], [77.60, 12.92], [77.60, 12.95], [77.56, 12.95], [77.56, 12.92]]] }
        },
        {
            id: "blr-5",
            name: "Indiranagar",
            landUseType: "mixed",
            trafficDensity: 85,
            populationDensity: 65,
            roadLength: 15.6,
            estimatedAQI: 138,
            geometry: { type: "Polygon", coordinates: [[[77.62, 12.96], [77.65, 12.96], [77.65, 12.99], [77.62, 12.99], [77.62, 12.96]]] }
        }
    ],
    'singapore': [
        {
            id: "sg-1",
            name: "Marina Bay CBD",
            landUseType: "commercial",
            trafficDensity: 75,
            populationDensity: 85,
            roadLength: 14.5,
            estimatedAQI: 65,
            geometry: { type: "Polygon", coordinates: [[[103.84, 1.27], [103.87, 1.27], [103.87, 1.30], [103.84, 1.30], [103.84, 1.27]]] }
        },
        {
            id: "sg-2",
            name: "Botanic Gardens",
            landUseType: "green_space",
            trafficDensity: 15,
            populationDensity: 5,
            roadLength: 4.2,
            estimatedAQI: 25,
            geometry: { type: "Polygon", coordinates: [[[103.81, 1.30], [103.82, 1.30], [103.82, 1.32], [103.81, 1.32], [103.81, 1.30]]] }
        },
        {
            id: "sg-3",
            name: "Jurong Island",
            landUseType: "industrial",
            trafficDensity: 40,
            populationDensity: 2,
            roadLength: 25.0,
            estimatedAQI: 115,
            geometry: { type: "Polygon", coordinates: [[[103.68, 1.25], [103.73, 1.25], [103.73, 1.29], [103.68, 1.29], [103.68, 1.25]]] }
        },
        {
            id: "sg-4",
            name: "Tampines Heart",
            landUseType: "residential",
            trafficDensity: 50,
            populationDensity: 90,
            roadLength: 16.8,
            estimatedAQI: 55,
            geometry: { type: "Polygon", coordinates: [[[103.93, 1.34], [103.96, 1.34], [103.96, 1.37], [103.93, 1.37], [103.93, 1.34]]] }
        },
        {
            id: "sg-5",
            name: "Bugis Hub",
            landUseType: "mixed",
            trafficDensity: 80,
            populationDensity: 75,
            roadLength: 12.0,
            estimatedAQI: 82,
            geometry: { type: "Polygon", coordinates: [[[103.85, 1.29], [103.87, 1.29], [103.87, 1.31], [103.85, 1.31], [103.85, 1.29]]] }
        }
    ]
}

export const offineMockZones: Record<string, ZoneFeature[]> = Object.fromEntries(
    Object.entries(_baseMockZones).map(([city, zones]) => [
        city,
        applyHeterogeneousData(zones)
    ])
)
