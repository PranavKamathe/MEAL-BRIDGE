/** Haversine distance in km */
export function distanceKm(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/** Rough ETA in minutes for short urban trips (cap 60 for "within 1 hour" UX) */
export function estimateEtaMinutes(distanceKmVal, mode = 'bike') {
  if (distanceKmVal == null || distanceKmVal < 0) return null;
  const speeds = { bike: 14, car: 25, walk: 4 };
  const kmh = speeds[mode] || speeds.bike;
  const mins = Math.ceil((distanceKmVal / kmh) * 60);
  return Math.min(60, Math.max(5, mins));
}
