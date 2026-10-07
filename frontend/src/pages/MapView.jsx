import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { donationAPI } from '../services/api';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import MapPicker from '../components/MapPicker';
import { distanceKm, estimateEtaMinutes } from '../utils/geo';

const MapView = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await donationAPI.getAll({ page: 1, limit: 80 });
        setDonations(res.data.donations || []);
      } catch {
        toast.error('Could not load map data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const uLat = user?.address?.lat;
  const uLng = user?.address?.lng;

  const donationPins = useMemo(() => {
    const list = [];
    donations.forEach((d) => {
      const lat = d.pickupAddress?.lat;
      const lng = d.pickupAddress?.lng;
      if (lat == null || lng == null) return;
      let role = 'donor';
      if (d.status === 'accepted') role = 'ngo';
      if (d.status === 'picked_up') role = 'volunteer';
      list.push({ lat, lng, role, key: d._id });
    });
    return list;
  }, [donations]);

  const centerLat = uLat ?? donationPins[0]?.lat ?? 17.385;
  const centerLng = uLng ?? donationPins[0]?.lng ?? 78.4867;

  const markerRole = user?.role === 'ngo' ? 'ngo' : user?.role === 'volunteer' ? 'volunteer' : 'donor';

  const extraMarkers = useMemo(() => {
    if (uLat != null && uLng != null) return donationPins;
    return donationPins.slice(1);
  }, [donationPins, uLat, uLng]);

  const nearby = useMemo(() => {
    if (uLat == null || uLng == null) return [];
    return donations
      .map((d) => {
        const lat = d.pickupAddress?.lat;
        const lng = d.pickupAddress?.lng;
        const dist = distanceKm(uLat, uLng, lat, lng);
        const eta = estimateEtaMinutes(dist);
        return { d, dist, eta };
      })
      .filter((x) => x.dist != null && x.dist <= 25 && x.eta != null && x.eta <= 60)
      .sort((a, b) => (a.dist || 99) - (b.dist || 99))
      .slice(0, 12);
  }, [donations, uLat, uLng]);

  return (
    <div className="min-h-screen flex flex-col bg-surface dark:bg-surface-dark">
      <Navbar />
      <div className="flex-1 flex flex-col px-4 sm:px-6 py-6 max-w-7xl mx-auto w-full gap-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">Live map</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Pins: <span className="text-brand-600 font-medium">donors</span> ·{' '}
              <span className="text-secondary-600 font-medium">in progress</span> ·{' '}
              <span className="text-accent-600 font-medium">delivery</span>. Filter cards show ~1 hour travel window.
            </p>
          </div>
          <Link to={user?.role === 'ngo' ? '/ngo' : user?.role === 'volunteer' ? '/volunteer' : '/donor'} className="btn-secondary text-sm py-2 self-start">
            ← Back to dashboard
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 flex-1 min-h-[480px]">
          <div className="lg:col-span-2 card overflow-hidden p-0 border-0 shadow-xl">
            {loading ? (
              <div className="h-[520px] skeleton w-full rounded-2xl" />
            ) : (
              <MapPicker
                lat={centerLat}
                lng={centerLng}
                readOnly
                height={520}
                markerRole={markerRole}
                extraMarkers={extraMarkers}
              />
            )}
          </div>
          <div className="card p-4 flex flex-col max-h-[520px] overflow-hidden">
            <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-2">Nearby & ETA</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Within about an hour of travel from your saved location.</p>
            <div className="overflow-y-auto flex-1 space-y-2 pr-1">
              {uLat == null ? (
                <p className="text-sm text-gray-500">Add your address coordinates in your profile to see distance-aware cards.</p>
              ) : nearby.length === 0 ? (
                <p className="text-sm text-gray-500">No pickups in range right now.</p>
              ) : (
                nearby.map(({ d, dist, eta }) => (
                  <div key={d._id} className="rounded-xl border border-gray-100 dark:border-gray-700 p-3 bg-gray-50/80 dark:bg-gray-800/50">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{d.foodName}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {dist} km · ~{eta} min · {d.status}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
