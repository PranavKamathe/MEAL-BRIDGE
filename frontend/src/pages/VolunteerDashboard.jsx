import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { donationAPI } from '../services/api';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/DashboardLayout';
import StatsCard from '../components/StatsCard';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import MapPicker from '../components/MapPicker';
import ProfileUpload from '../components/ProfileUpload';
import { distanceKm, estimateEtaMinutes } from '../utils/geo';

const nav = [
  { id: 'nearby', label: 'Nearby', icon: '📍' },
  { id: 'active', label: 'Active', icon: '🚴' },
  { id: 'profile', label: 'Profile', icon: '👤' },
];

const uid = (u) => (u?.id || u?._id || '').toString();

const VolunteerDashboard = () => {
  const { user } = useAuth();
  const [available, setAvailable] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [stats, setStats] = useState({ total: 0, picked_up: 0, delivered: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [activeNav, setActiveNav] = useState('nearby');

  const maxCapacity = user?.roleData?.maxCapacity || 3;
  const vLat = user?.address?.lat;
  const vLng = user?.address?.lng;

  const fetchData = async () => {
    try {
      const [statsRes, availRes, myRes] = await Promise.all([
        donationAPI.getStats(),
        donationAPI.getAll({ page: 1, limit: 50 }),
        donationAPI.getAll({ status: 'picked_up', page: 1, limit: 50 }),
      ]);
      setStats(statsRes.data.stats);
      const raw = availRes.data.donations || [];
      setAvailable(raw.filter((d) => Number(d.quantity) <= maxCapacity));
      const mine = (myRes.data.donations || []).filter((d) => {
        const av = d.assignedVolunteer;
        const id = typeof av === 'object' && av !== null ? av._id : av;
        return id && String(id) === uid(user);
      });
      setMyDeliveries(mine);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAcceptDelivery = async (id) => {
    try {
      await donationAPI.assignVolunteer(id);
      toast.success('Task accepted — head to pickup.');
      fetchData();
      setSelectedDonation(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not accept task');
    }
  };

  const handleMarkDelivered = async (id) => {
    try {
      await donationAPI.markDelivered(id);
      toast.success('Marked as delivered. Great work!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const ranked = useMemo(() => {
    return [...available].map((d) => {
      const km = vLat != null ? distanceKm(vLat, vLng, d.pickupAddress?.lat, d.pickupAddress?.lng) : null;
      const eta = km != null ? estimateEtaMinutes(km) : null;
      return { d, km, eta };
    }).sort((a, b) => (a.km ?? 999) - (b.km ?? 999));
  }, [available, vLat, vLng]);

  const extraNav = (
    <Link
      to="/map"
      className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-900/20 transition-colors"
    >
      <span>🗺</span> Map
    </Link>
  );

  const DeliverySteps = ({ status }) => {
    const steps = [
      { key: 'pickup', label: 'Pickup' },
      { key: 'transit', label: 'On the way' },
      { key: 'done', label: 'Delivered' },
    ];
    let idx = 0;
    if (status === 'picked_up') idx = 1;
    if (status === 'delivered') idx = 2;
    return (
      <div className="flex items-center gap-2 mt-3">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2 flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                i <= idx ? 'bg-accent-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
              }`}
            >
              {i + 1}
            </div>
            <span className={`text-xs font-medium ${i <= idx ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{s.label}</span>
            {i < steps.length - 1 && <div className={`hidden sm:block flex-1 h-0.5 mx-1 ${i < idx ? 'bg-accent-400' : 'bg-gray-200 dark:bg-gray-700'}`} />}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <DashboardLayout title="Volunteer" subtitle="Loading…" nav={nav} active={activeNav} onNav={setActiveNav} extraNav={extraNav}>
        <div className="skeleton h-40 rounded-2xl w-full" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Volunteer"
      subtitle={`${user?.name} · up to ${maxCapacity} kg`}
      nav={nav}
      active={activeNav}
      onNav={setActiveNav}
      extraNav={extraNav}
    >
      {user?.status === 'approved' && (
        <div className="hidden lg:inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full bg-accent-50 dark:bg-accent-900/20 text-accent-800 dark:text-accent-300 text-xs font-semibold">
          ✅ Verified volunteer
        </div>
      )}

      {activeNav === 'nearby' && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard icon="📦" label="Nearby tasks" value={ranked.length} color="brand" />
            <StatsCard icon="🚴" label="In progress" value={stats.picked_up} color="yellow" />
            <StatsCard icon="✅" label="Delivered" value={stats.delivered} color="teal" />
            <StatsCard icon="📊" label="Total" value={stats.total} color="blue" />
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">Nearby tasks</h2>
            <span className="text-xs font-semibold text-accent-600 bg-accent-50 dark:bg-accent-900/30 px-3 py-1 rounded-full">
              Auto-filter ≤ {maxCapacity} kg
            </span>
          </div>

          {ranked.length === 0 ? (
            <div className="card p-12 text-center text-gray-500 border-dashed">
              <p className="text-4xl mb-2">🎉</p>
              <p className="font-medium text-gray-700 dark:text-gray-300">No nearby tasks</p>
              <p className="text-sm mt-1">Accepted NGO donations in your weight range will appear here.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {ranked.map(({ d, km, eta }) => (
                <div
                  key={d._id}
                  className="card p-5 border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedDonation(d)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white">{d.foodName}</h3>
                      <p className="text-sm text-gray-500">{d.quantity} kg · {d.donorName}</p>
                    </div>
                    <span className="text-xl font-bold text-brand-600">{d.quantity}kg</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">Pickup → NGO drop-off</p>
                  <p className="text-xs text-gray-500">{d.pickupAddress?.district}{d.pickupAddress?.landmark ? ` · ${d.pickupAddress.landmark}` : ''}</p>
                  {km != null && (
                    <p className="text-xs font-semibold text-secondary-600 mt-2">
                      ≈ {km} km{eta != null ? ` · ~${eta} min ETA` : ''}
                    </p>
                  )}
                  <div className="flex gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                    <button type="button" onClick={() => handleAcceptDelivery(d._id)} className="btn-primary flex-1 min-h-[48px]">
                      Accept task
                    </button>
                    <button
                      type="button"
                      onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${d.pickupAddress?.lat},${d.pickupAddress?.lng}`)}
                      className="btn-secondary px-4"
                    >
                      Map
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeNav === 'active' && (
        <div className="space-y-4">
          <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">Active deliveries</h2>
          {myDeliveries.length === 0 ? (
            <div className="card p-10 text-center text-gray-500 border-dashed">
              <p className="text-3xl mb-2">📦</p>
              <p>No active deliveries</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myDeliveries.map((d) => (
                <div key={d._id} className="card p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{d.foodName}</p>
                      <p className="text-sm text-gray-500">{d.quantity} kg · {d.donorName}</p>
                    </div>
                    <StatusBadge status={d.status} />
                  </div>
                  <DeliverySteps status={d.status} />
                  {d.status === 'picked_up' && (
                    <button type="button" onClick={() => handleMarkDelivered(d._id)} className="btn-primary mt-4 w-full sm:w-auto min-h-[44px]">
                      Mark delivered
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeNav === 'profile' && (
        <div className="max-w-lg mx-auto card p-8 text-center">
          <ProfileUpload />
          <h3 className="font-display font-bold text-xl mt-4 text-gray-900 dark:text-white">{user?.name}</h3>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <div className="mt-3 flex justify-center flex-wrap gap-2">
            <span className="badge-yellow">Volunteer</span>
            {user?.status === 'approved' && <span className="badge-green">✅ Verified</span>}
          </div>
          <div className="mt-4 text-xs text-gray-400 space-y-1">
            <p>🕐 {user?.roleData?.availabilityTime || 'Flexible'}</p>
            <p>🚲 {user?.roleData?.transportOption || 'Bicycle'}</p>
            <p>📦 Max {maxCapacity} kg</p>
          </div>
        </div>
      )}

      <Modal isOpen={!!selectedDonation} onClose={() => setSelectedDonation(null)} title="Task details" size="lg">
        {selectedDonation && (
          <div className="space-y-4">
            {selectedDonation.foodPhoto && (
              <img src={`/uploads/food/${selectedDonation.foodPhoto}`} className="w-full h-40 object-cover rounded-xl" alt="" />
            )}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-gray-400">Food</p><p className="font-semibold">{selectedDonation.foodName}</p></div>
              <div><p className="text-xs text-gray-400">Qty</p><p className="font-semibold text-brand-600">{selectedDonation.quantity} kg</p></div>
            </div>
            {selectedDonation.pickupAddress?.lat != null && (
              <MapPicker lat={selectedDonation.pickupAddress.lat} lng={selectedDonation.pickupAddress.lng} readOnly height={220} markerRole="volunteer" />
            )}
            <button type="button" onClick={() => handleAcceptDelivery(selectedDonation._id)} className="btn-primary w-full min-h-[48px]">
              Accept this task
            </button>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default VolunteerDashboard;
