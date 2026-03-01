export interface City {
  id: string
  name: string
  center_lat: number
  center_lng: number
  zoom: number
}

export const MOCK_CITIES: City[] = [
  {
    id: "default-city",
    name: "Demo City",
    center_lat: 13.0827,
    center_lng: 80.2707,
    zoom: 12
  },
  {
    id: "chennai",
    name: "Chennai",
    center_lat: 13.0827,
    center_lng: 80.2707,
    zoom: 12
  },
  {
    id: "bangalore",
    name: "Bangalore",
    center_lat: 12.9716,
    center_lng: 77.5946,
    zoom: 12
  },
  {
    id: "singapore",
    name: "Singapore",
    center_lat: 1.3521,
    center_lng: 103.8198,
    zoom: 11
  }
]
