import type { Locale } from "@/lib/types";

export interface IndianCity {
  id: string;
  name: Record<Locale, string>;
  latitude: number;
  longitude: number;
  timezone: string;
}

function cityName(en: string): Record<Locale, string> {
  return { en, hi: en, mr: en, kn: en, te: en, ta: en };
}

export const INDIAN_CITIES: IndianCity[] = [
  {
    id: "hyderabad",
    name: cityName("Hyderabad"),
    latitude: 17.385,
    longitude: 78.4867,
    timezone: "Asia/Kolkata",
  },
  {
    id: "visakhapatnam",
    name: cityName("Visakhapatnam"),
    latitude: 17.6868,
    longitude: 83.2185,
    timezone: "Asia/Kolkata",
  },
  {
    id: "vijayawada",
    name: cityName("Vijayawada"),
    latitude: 16.5062,
    longitude: 80.648,
    timezone: "Asia/Kolkata",
  },
  {
    id: "chennai",
    name: cityName("Chennai"),
    latitude: 13.0827,
    longitude: 80.2707,
    timezone: "Asia/Kolkata",
  },
  {
    id: "bengaluru",
    name: cityName("Bengaluru"),
    latitude: 12.9716,
    longitude: 77.5946,
    timezone: "Asia/Kolkata",
  },
  {
    id: "mumbai",
    name: cityName("Mumbai"),
    latitude: 19.076,
    longitude: 72.8777,
    timezone: "Asia/Kolkata",
  },
  {
    id: "delhi",
    name: cityName("New Delhi"),
    latitude: 28.6139,
    longitude: 77.209,
    timezone: "Asia/Kolkata",
  },
  {
    id: "kolkata",
    name: cityName("Kolkata"),
    latitude: 22.5726,
    longitude: 88.3639,
    timezone: "Asia/Kolkata",
  },
  {
    id: "tirupati",
    name: cityName("Tirupati"),
    latitude: 13.6288,
    longitude: 79.4192,
    timezone: "Asia/Kolkata",
  },
  {
    id: "warangal",
    name: cityName("Warangal"),
    latitude: 17.9689,
    longitude: 79.5941,
    timezone: "Asia/Kolkata",
  },
];
