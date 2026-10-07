import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { donationAPI } from '../services/api';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/DashboardLayout';
import StatsCard from '../components/StatsCard';
import StatusBadge from '../components/StatusBadge';
import { ConfirmModal } from '../components/Modal';
import Modal from '../components/Modal';
import MapPicker from '../components/MapPicker';
import ProfileUpload from '../components/ProfileUpload';

const nav = [
  { id: 'overview', label: 'Dashboard', icon: '📊' },
  { id: 'donations', label: 'My donations', icon: '🍱' },
  { id: 'profile', label: 'Profile', icon: '👤' },
];

const DonorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, pending: 0, accepted: 0, cancelled: 0, delivered: 0 });
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancelModal, setCancelModal] = useState({ open: false, id: null });
  const [activeNav, setActiveNav] = useState('overview');
  const [donateOpen, setDonateOpen] = useState(false);
  const foodPhotoRef = useRef();

  const [form, setForm] = useState({
    foodName: '', foodType: 'veg', quantity: '', servesCount: '', description: '',
    pickupTime: '', expiryTime: '', lat: user?.address?.lat || 17.385, lng: user?.address?.lng || 78.4867,
  });
  const [foodPhoto, setFoodPhoto] = useState(null);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.foodName || !form.quantity) {
      toast.error('Food name and quantity are required');
      return;
    }
    setSubmitting(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (foodPhoto) fd.append('foodPhoto', foodPhoto);
    try {
      await donationAPI.create(fd);
      toast.success('Donation submitted successfully!');
      setForm({
        foodName: '', foodType: 'veg', quantity: '', servesCount: '', description: '', pickupTime: '', expiryTime: '',
        lat: form.lat, lng: form.lng,
      });
      setFoodPhoto(null);
      if (foodPhotoRef.current) foodPhotoRef.current.value = '';
      setDonateOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit donation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    try {
      await donationAPI.cancel(cancelModal.id, {});
      toast.success('Donation cancelled');
      setCancelModal({ open: false, id: null });
      fetchData();
    } catch {
      toast.error('Failed to cancel');
    }
  };

  const pending = donations.filter((d) => d.status === 'pending');
  const accepted = donations.filter((d) => ['accepted', 'picked_up'].includes(d.status));

  const extraNav = (
    <Link
      to="/map"
      className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-900/20 transition-colors"
    >
      <span>🗺</span> Map
    </Link>
  );

  const DonationForm = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="input-label">Food name *</label>
          <input className="input" placeholder="e.g. Veg meals" value={form.foodName} onChange={(e) => setForm((p) => ({ ...p, foodName: e.target.value }))} required />
        </div>
        <div>
          <label className="input-label">Food type</label>
          <select className="input" value={form.foodType} onChange={(e) => setForm((p) => ({ ...p, foodType: e.target.value }))}>
            <option value="veg">Vegetarian</option>
            <option value="non-veg">Non-vegetarian</option>
            <option value="both">Mixed</option>
          </select>
        </div>
        <div>
          <label className="input-label">Quantity (kg) *</label>
          <input type="number" min="0.1" step="0.1" className="input" placeholder="e.g. 3" value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))} required />
        </div>
        <div>
          <label className="input-label">Serves (people)</label>
          <input type="number" min="1" className="input" placeholder="Optional" value={form.servesCount} onChange={(e) => setForm((p) => ({ ...p, servesCount: e.target.value }))} />
        </div>
        <div>
          <label className="input-label">Pickup time</label>
          <input type="time" className="input" value={form.pickupTime} onChange={(e) => setForm((p) => ({ ...p, pickupTime: e.target.value }))} />
        </div>
        <div>
          <label className="input-label">Expiry time</label>
          <input type="time" className="input" value={form.expiryTime} onChange={(e) => setForm((p) => ({ ...p, expiryTime: e.target.value }))} />
        </div>
      </div>
      <div>
        <label className="input-label">Notes</label>
        <textarea className="input resize-none" rows={2} placeholder="Allergens, packaging…" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
      </div>
      <div>
        <label className="input-label">Pickup location</label>
        <MapPicker lat={form.lat} lng={form.lng} onLocationSelect={(lat, lng) => setForm((p) => ({ ...p, lat, lng }))} height={220} markerRole="donor" />
      </div>
      <div>
        <label className="input-label">Food photo</label>
        <input ref={foodPhotoRef} type="file" accept="image/*" className="input text-sm py-2" onChange={(e) => setFoodPhoto(e.target.files[0])} />
      </div>
      <button type="submit" disabled={submitting} className="btn-primary w-full min-h-[48px]">
        {submitting ? 'Submitting…' : 'Submit donation'}
      </button>
    </form>
  );

  if (loading) {
    return (
      <DashboardLayout
        title="Donor"
        subtitle="Loading…"
        nav={nav}
        active={activeNav}
        onNav={setActiveNav}
        extraNav={extraNav}
      >
        <div className="space-y-4">
          <div className="skeleton h-40 rounded-2xl w-full" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-28 rounded-2xl" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Donor hub"
      subtitle={`Hi ${user?.name || 'donor'} — keep surplus food moving.`}
      nav={nav}
      active={activeNav}
      onNav={setActiveNav}
      extraNav={extraNav}
    >
      {user?.status === 'approved' && (
        <div className="hidden lg:inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-800 dark:text-brand-300 text-xs font-semibold">
          ✅ Verified user
        </div>
      )}
      {user?.status === 'pending' && (
        <div className="mb-6 badge-yellow px-4 py-2 text-sm rounded-xl w-fit">
          ⏳ Account pending admin approval
        </div>
      )}

      {activeNav === 'overview' && (
        <div className="space-y-8">
          <div className="card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-gradient-to-br from-brand-600 to-brand-700 text-white border-0 shadow-xl">
            <div>
              <p className="text-brand-100 text-sm font-medium">Ready when you are</p>
              <h2 className="font-display font-bold text-2xl mt-1">Donate surplus food in minutes</h2>
              <p className="text-brand-100 text-sm mt-2 max-w-md">We route your donation to NGOs and volunteers with live status.</p>
            </div>
            <button type="button" onClick={() => setDonateOpen(true)} className="min-h-[52px] px-8 rounded-xl font-bold bg-white text-brand-700 hover:bg-brand-50 shadow-lg transition-transform hover:-translate-y-0.5">
              Donate food
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard icon="🍽" label="Total" value={stats.total} color="brand" />
            <StatsCard icon="⏳" label="Pending" value={stats.pending} color="yellow" />
            <StatsCard icon="✅" label="Accepted" value={stats.accepted} color="blue" />
            <StatsCard icon="🚚" label="Delivered" value={stats.delivered} color="teal" />
          </div>

          <div>
            <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-3">Pending requests</h3>
            {pending.length === 0 ? (
              <div className="card p-10 text-center text-gray-500 dark:text-gray-400 border-dashed">
                <p className="text-4xl mb-2">📭</p>
                <p className="font-medium text-gray-700 dark:text-gray-300">No donations yet</p>
                <p className="text-sm mt-1">Start with the green button above.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {pending.slice(0, 4).map((d) => (
                  <div key={d._id} className="card p-5 border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">{d.foodName}</p>
                        <p className="text-sm text-gray-500">{d.quantity} kg</p>
                      </div>
                      <StatusBadge status={d.status} />
                    </div>
                    <button
                      type="button"
                      onClick={() => setCancelModal({ open: true, id: d._id })}
                      className="mt-4 text-sm font-semibold text-red-600 hover:underline"
                    >
                      Cancel donation
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-3">Accepted & in progress</h3>
            {accepted.length === 0 ? (
              <p className="text-sm text-gray-500">Nothing in this stage yet.</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {accepted.slice(0, 4).map((d) => (
                  <div key={d._id} className="card p-5 border-gray-100 dark:border-gray-700">
                    <p className="font-bold text-gray-900 dark:text-white">{d.foodName}</p>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">NGO: {d.ngoName || '—'}</p>
                    <p className="text-sm text-gray-500 mt-1">Volunteer: {d.volunteerName || 'Assigning…'}</p>
                    <div className="mt-3"><StatusBadge status={d.status} /></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeNav === 'donations' && (
        <div className="space-y-6">
          <button type="button" onClick={() => setDonateOpen(true)} className="btn-primary w-full sm:w-auto min-h-[48px] px-8">
            + New donation
          </button>
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="font-display font-bold text-lg mb-3">Pending</h3>
              {pending.length === 0 ? (
                <p className="text-gray-500 text-sm">No pending donations.</p>
              ) : (
                <div className="space-y-3">
                  {pending.map((d) => (
                    <div key={d._id} className="card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{d.foodName}</p>
                        <p className="text-sm text-gray-500">{d.quantity} kg</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={d.status} />
                        <button type="button" className="text-sm font-semibold text-red-600" onClick={() => setCancelModal({ open: true, id: d._id })}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h3 className="font-display font-bold text-lg mb-3">Accepted</h3>
              {accepted.length === 0 ? (
                <p className="text-gray-500 text-sm">No accepted donations yet.</p>
              ) : (
                <div className="space-y-3">
                  {accepted.map((d) => (
                    <div key={d._id} className="card p-4">
                      <p className="font-semibold text-gray-900 dark:text-white">{d.foodName}</p>
                      <p className="text-sm text-gray-500 mt-1">{d.quantity} kg</p>
                      <p className="text-sm text-secondary-600 mt-2">NGO: {d.ngoName || '—'}</p>
                      <p className="text-sm text-gray-500">Volunteer: {d.volunteerName || '—'}</p>
                      <div className="mt-2"><StatusBadge status={d.status} /></div>
                      {d.status === 'accepted' && (
                        <button type="button" className="text-sm text-red-600 font-semibold mt-3" onClick={() => setCancelModal({ open: true, id: d._id })}>
                          Cancel donation
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeNav === 'profile' && (
        <div className="max-w-lg card p-8 text-center">
          <ProfileUpload />
          <h3 className="font-display font-bold text-xl text-gray-900 dark:text-white mt-4">{user?.name}</h3>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <div className="mt-3 flex justify-center gap-2 flex-wrap">
            <span className="badge-green">Donor</span>
            {user?.status === 'approved' && <span className="badge-green">✅ Verified user</span>}
          </div>
          {user?.address?.full && <p className="text-xs text-gray-400 mt-4 leading-relaxed">📍 {user.address.full}</p>}
        </div>
      )}

      <Modal isOpen={donateOpen} onClose={() => setDonateOpen(false)} title="New donation" size="lg">
        {DonationForm}
      </Modal>

      <ConfirmModal
        isOpen={cancelModal.open}
        onClose={() => setCancelModal({ open: false, id: null })}
        onConfirm={handleCancel}
        title="Cancel donation?"
        message="This frees the meal for others to claim. Continue?"
        confirmLabel="Yes, cancel"
        danger
      />
    </DashboardLayout>
  );
};

export default DonorDashboard;
