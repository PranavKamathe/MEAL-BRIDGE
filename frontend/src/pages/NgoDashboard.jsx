import { useState, useEffect } from 'react';
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
  { id: 'requests', label: 'Requests', icon: '📥' },
  { id: 'accepted', label: 'Accepted', icon: '✅' },
  { id: 'profile', label: 'Profile', icon: '👤' },
];

const NgoDashboard = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, accepted: 0, delivered: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [rejectModal, setRejectModal] = useState({ open: false, id: null });
  const [rejectReason, setRejectReason] = useState('');
  const [activeNav, setActiveNav] = useState('requests');

  const nLat = user?.address?.lat;
  const nLng = user?.address?.lng;

  const distFor = (d) => {
    if (nLat == null || nLng == null) return null;
    return distanceKm(nLat, nLng, d.pickupAddress?.lat, d.pickupAddress?.lng);
  };

  const fetchData = async () => {
    try {
      const [statsRes, donRes] = await Promise.all([
        donationAPI.getStats(),
        donationAPI.getAll({ page: 1, limit: 50 }),
      ]);
      setStats(statsRes.data.stats);
      setDonations(donRes.data.donations);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAccept = async (id) => {
    try {
      await donationAPI.accept(id);
      toast.success('Donation accepted.');
      fetchData();
      setSelectedDonation(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept');
    }
  };

  const handleReject = async () => {
    try {
      await donationAPI.reject(rejectModal.id, { reason: rejectReason });
      toast.success('Donation rejected');
      setRejectModal({ open: false, id: null });
      setRejectReason('');
      fetchData();
    } catch {
      toast.error('Failed to reject');
    }
  };

  const pending = donations.filter((d) => d.status === 'pending');
  const acceptedList = donations.filter((d) => ['accepted', 'picked_up', 'delivered'].includes(d.status));

  const extraNav = (
    <Link
      to="/map"
      className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-900/20 transition-colors"
    >
      <span>🗺</span> Map
    </Link>
  );

  if (loading) {
    return (
      <DashboardLayout title="NGO" subtitle="Loading…" nav={nav} active={activeNav} onNav={setActiveNav} extraNav={extraNav}>
        <div className="space-y-4">
          <div className="skeleton h-32 rounded-2xl" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="NGO console"
      subtitle={user?.roleData?.organizationName || user?.name}
      nav={nav}
      active={activeNav}
      onNav={setActiveNav}
      extraNav={extraNav}
    >
      {user?.status === 'approved' && (
        <div className="hidden lg:inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full bg-secondary-50 dark:bg-secondary-900/30 text-secondary-800 dark:text-secondary-300 text-xs font-semibold">
          ✅ Verified partner
        </div>
      )}
      {stats.pending > 0 && activeNav === 'requests' && (
        <div className="mb-4 badge-yellow px-4 py-2 text-sm rounded-xl w-fit animate-pulse-slow">
          🔔 {stats.pending} pending request{stats.pending !== 1 ? 's' : ''}
        </div>
      )}

      {activeNav === 'requests' && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard icon="📩" label="Pending" value={stats.pending} color="yellow" />
            <StatsCard icon="✅" label="Accepted" value={stats.accepted} color="brand" />
            <StatsCard icon="🚚" label="Delivered" value={stats.delivered} color="teal" />
            <StatsCard icon="📊" label="Total" value={stats.total} color="blue" />
          </div>

          <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">Incoming requests</h2>
          {pending.length === 0 ? (
            <div className="card p-12 text-center text-gray-500 border-dashed">
              <p className="text-4xl mb-2">📭</p>
              <p>No pending requests</p>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-5">
              {pending.map((d) => {
                const km = distFor(d);
                const eta = km != null ? estimateEtaMinutes(km) : null;
                return (
                  <div
                    key={d._id}
                    className="card p-5 border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all cursor-pointer"
                    onClick={() => setSelectedDonation(d)}
                  >
                    <div className="flex justify-between gap-3">
                      <div>
                        <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white">{d.foodName}</h3>
                        <p className="text-sm text-gray-500 mt-1">{d.donorName}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{d.quantity} kg · {d.pickupAddress?.district}</p>
                        {km != null && (
                          <p className="text-xs font-semibold text-secondary-600 dark:text-secondary-400 mt-2">
                            ≈ {km} km away{eta != null ? ` · ~${eta} min` : ''}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={d.status} />
                    </div>
                    <div className="mt-4 h-36 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 pointer-events-none">
                      {d.pickupAddress?.lat != null && (
                        <MapPicker lat={d.pickupAddress.lat} lng={d.pickupAddress.lng} readOnly height={144} markerRole="donor" />
                      )}
                    </div>
                    <div className="flex gap-3 mt-4" onClick={(e) => e.stopPropagation()}>
                      <button type="button" onClick={() => handleAccept(d._id)} className="btn-primary flex-1 min-h-[44px]">
                        Accept
                      </button>
                      <button type="button" onClick={() => setRejectModal({ open: true, id: d._id })} className="btn-danger flex-1 min-h-[44px]">
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeNav === 'accepted' && (
        <div className="space-y-4">
          <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">Delivery progress</h2>
          {acceptedList.length === 0 ? (
            <p className="text-gray-500">No accepted pipeline yet.</p>
          ) : (
            <div className="space-y-3">
              {acceptedList.map((d) => (
                <div key={d._id} className="card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{d.foodName}</p>
                    <p className="text-sm text-gray-500">{d.donorName} · {d.quantity} kg</p>
                    <p className="text-sm text-gray-500 mt-1">Volunteer: {d.volunteerName || '—'}</p>
                  </div>
                  <StatusBadge status={d.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeNav === 'profile' && (
        <div className="max-w-lg mx-auto card p-8 text-center">
          <ProfileUpload />
          <h3 className="font-display font-bold text-xl mt-4 text-gray-900 dark:text-white">{user?.roleData?.organizationName || user?.name}</h3>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <div className="mt-3 flex justify-center flex-wrap gap-2">
            <span className="badge-blue">NGO partner</span>
            {user?.status === 'approved' && <span className="badge-green">✅ Verified</span>}
          </div>
          {user?.roleData?.serviceAreaRadius && (
            <p className="text-xs text-gray-400 mt-3">Service radius: {user.roleData.serviceAreaRadius} km</p>
          )}
        </div>
      )}

      <Modal isOpen={!!selectedDonation} onClose={() => setSelectedDonation(null)} title="Donation details" size="lg">
        {selectedDonation && (
          <div className="space-y-4">
            {selectedDonation.foodPhoto && (
              <img src={`/uploads/food/${selectedDonation.foodPhoto}`} className="w-full h-48 object-cover rounded-xl" alt="" />
            )}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-xs text-gray-400">Food</p><p className="font-semibold">{selectedDonation.foodName}</p></div>
              <div><p className="text-xs text-gray-400">Qty</p><p className="font-semibold">{selectedDonation.quantity} kg</p></div>
              <div><p className="text-xs text-gray-400">Donor</p><p className="font-semibold">{selectedDonation.donorName}</p></div>
              <div><p className="text-xs text-gray-400">Phone</p><p className="font-semibold">{selectedDonation.donorPhone}</p></div>
            </div>
            {selectedDonation.pickupAddress?.lat != null && (
              <MapPicker lat={selectedDonation.pickupAddress.lat} lng={selectedDonation.pickupAddress.lng} readOnly height={200} markerRole="donor" />
            )}
            {selectedDonation.status === 'pending' && (
              <div className="flex gap-3">
                <button type="button" onClick={() => { handleAccept(selectedDonation._id); }} className="btn-primary flex-1">Accept</button>
                <button
                  type="button"
                  onClick={() => { setRejectModal({ open: true, id: selectedDonation._id }); setSelectedDonation(null); }}
                  className="btn-danger flex-1"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={rejectModal.open} onClose={() => setRejectModal({ open: false, id: null })} title="Reject donation" size="sm">
        <div className="space-y-4">
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="Optional reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="flex gap-3">
            <button type="button" onClick={() => setRejectModal({ open: false, id: null })} className="btn-secondary flex-1">Back</button>
            <button type="button" onClick={handleReject} className="btn-danger flex-1">Reject</button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default NgoDashboard;
