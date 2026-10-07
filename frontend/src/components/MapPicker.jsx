import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const pinColors = {
  donor: '#16A34A',
  ngo: '#2563EB',
  volunteer: '#F59E0B',
  default: '#6b7280',
};

function coloredIcon(role) {
  const fill = pinColors[role] || pinColors.default;
  return L.divIcon({
    className: 'fb-map-pin',
    html: `<div style="width:22px;height:22px;border-radius:50%;background:${fill};border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.25);"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

const LocationPicker = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

/**
 * @param {{ lat?: number, lng?: number, onLocationSelect?: (lat: number, lng: number) => void, readOnly?: boolean, height?: number|string, markerRole?: keyof typeof pinColors, extraMarkers?: { lat: number, lng: number, role?: keyof typeof pinColors, key?: string }[] }} props
 */
const MapPicker = ({
  lat = 17.385,
  lng = 78.4867,
  onLocationSelect,
  readOnly = false,
  height = 250,
  markerRole = 'default',
  extraMarkers = [],
}) => {
  const [position, setPosition] = useState({ lat, lng });

  useEffect(() => {
    setPosition({ lat, lng });
  }, [lat, lng]);

  const handleSelect = (newLat, newLng) => {
    setPosition({ lat: newLat, lng: newLng });
    if (onLocationSelect) onLocationSelect(newLat, newLng);
  };

  const mainIcon = useMemo(() => coloredIcon(markerRole), [markerRole]);

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
      {!readOnly && (
        <p className="text-xs text-gray-500 dark:text-gray-400 px-3 py-2 bg-gray-50 dark:bg-gray-800/80">
          Tap the map to drop a pin — donors <span className="text-brand-600 font-semibold">green</span>, NGOs{' '}
          <span className="text-secondary-600 font-semibold">blue</span>, volunteers{' '}
          <span className="text-accent-600 font-semibold">orange</span>
        </p>
      )}
      <MapContainer center={[position.lat, position.lng]} zoom={13} style={{ height, width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[position.lat, position.lng]} icon={mainIcon} />
        {extraMarkers.map((m, i) => (
          <Marker key={m.key || `${m.lat}-${m.lng}-${i}`} position={[m.lat, m.lng]} icon={coloredIcon(m.role || 'donor')} />
        ))}
        {!readOnly && <LocationPicker onLocationSelect={handleSelect} />}
      </MapContainer>
      {!readOnly && (
        <p className="text-xs text-gray-400 px-3 py-1.5 bg-gray-50 dark:bg-gray-800/80">
          Selected: {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
        </p>
      )}
    </div>
  );
};

export default MapPicker;
