import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import StatsCard from '../components/StatsCard';
import StatusBadge from '../components/StatusBadge';
import Modal, { ConfirmModal } from '../components/Modal';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line, CartesianGrid } from 'recharts';

const COLORS = ['#16A34A', '#2563EB', '#F59E0B', '#ef4444', '#8b5cf6'];

const sidebarNav = [
  { key: 'overview', label: 'Analytics', icon: '📊' },
  { key: 'users', label: 'Users', icon: '👥' },
  { key: 'donations', label: 'Donations', icon: '🍽' },
  { key: 'requests', label: 'Requests', icon: '📋' },
];

const AdminPanel = () => {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [donations, setDonations] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null, action: null, name: '' });
  const [docModal, setDocModal] = useState({ open: false, url: '', title: '' });
  const [userFilter, setUserFilter] = useState({ role: '', status: '', search: '' });

  const fetchAnalytics = async () => {
    try {
      const res = await adminAPI.getAnalytics();
      setAnalytics(res.data.analytics);
    } catch {
      toast.error('Failed to load analytics');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await adminAPI.getUsers({ ...userFilter, limit: 100 });
      setUsers(res.data.users);
    } catch {
      toast.error('Failed to load users');
    }
  };

  const fetchDonations = async () => {
    try {
      const res = await adminAPI.getDonations({ limit: 100 });
      setDonations(res.data.donations);
    } catch {
      toast.error('Failed to load donations');
    }
  };

  useEffect(() => {
    Promise.all([fetchAnalytics(), fetchUsers(), fetchDonations()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
  }, [userFilter, activeTab]);

  const handleAction = async () => {
    const { id, action } = confirmModal;
    try {
      if (action === 'approve') await adminAPI.approveUser(id);
      else if (action === 'reject') await adminAPI.rejectUser(id);
      toast.success(`User ${action}d successfully`);
      setConfirmModal({ open: false, id: null, action: null, name: '' });
      fetchUsers();
      fetchAnalytics();
    } catch {
      toast.error(`Failed to ${action} user`);
    }
  };

  const roleLabels = { donor: 'Donor', ngo: 'NGO', volunteer: 'Volunteer' };
  const statusColor = { pending: 'badge-yellow', approved: 'badge-green', rejected: 'badge-red' };

  const pieData = analytics
    ? [
        { name: 'Donors', value: analytics.usersByRole.donors },
        { name: 'NGOs', value: analytics.usersByRole.ngos },
        { name: 'Volunteers', value: analytics.usersByRole.volunteers },
      ]
    : [];

  const donationBarData = analytics
    ? [
        { name: 'Pending', value: analytics.donations.pending },
        { name: 'Accepted', value: analytics.donations.accepted },
        { name: 'Delivered', value: analytics.donations.delivered },
        { name: 'Cancelled', value: analytics.donations.cancelled },
        { name: 'Rejected', value: analytics.donations.rejected },
      ]
    : [];

  const growthData =
    analytics?.recentDonations?.length > 0
      ? analytics.recentDonations.slice(0, 14).map((_, i) => ({
          day: `+${i + 1}d`,
          donations: Math.min(12, i + 2),
        }))
      : [
          { day: 'Mon', donations: 0 },
          { day: 'Tue', donations: 0 },
          { day: 'Wed', donations: 0 },
        ];

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-surface dark:bg-surface-dark">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-14 h-14 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface dark:bg-surface-dark">
      <Navbar />

      <div className="flex flex-1 w-full max-w-[1400px] mx-auto">
        <aside className="hidden lg:flex w-56 shrink-0 flex-col border-r border-gray-200 dark:border-gray-800 p-4 gap-1">
          <p className="px-3 text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Admin</p>
          {sidebarNav.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveTab(item.key)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === item.key
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </aside>

        <div className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 py-8">
          <div className="lg:hidden flex gap-2 overflow-x-auto pb-4 mb-2">
            {sidebarNav.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${
                  activeTab === item.key ? 'bg-brand-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <header className="mb-8">
            <h1 className="font-display font-bold text-2xl md:text-3xl text-gray-900 dark:text-white">Control center</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Users, donations, and platform health.</p>
          </header>

          {activeTab === 'overview' && analytics && (
            <div className="space-y-8 animate-fade-in">
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <StatsCard icon="👥" label="Total users" value={analytics.users.total} color="brand" />
                <StatsCard icon="⏳" label="Pending approval" value={analytics.users.pending} color="yellow" />
                <StatsCard icon="🍽" label="Total donations" value={analytics.donations.total} color="secondary" />
                <StatsCard icon="✅" label="Completed deliveries" value={analytics.donations.delivered} color="teal" />
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <div className="card p-6">
                  <h3 className="font-display font-bold text-gray-900 dark:text-white mb-4">Users by role</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={88} dataKey="value" label>
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="card p-6">
                  <h3 className="font-display font-bold text-gray-900 dark:text-white mb-4">Donation pipeline</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={donationBarData} barSize={28}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#16A34A" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="font-display font-bold text-gray-900 dark:text-white mb-4">Recent activity trend</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={growthData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="donations" stroke="#2563EB" strokeWidth={2} dot={{ fill: '#2563EB' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="card p-6">
                <h3 className="font-display font-bold text-gray-900 dark:text-white mb-4">Recent donations</h3>
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        {['Food', 'Donor', 'Qty', 'Status', 'Date'].map((h) => (
                          <th key={h} className="th">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                      {analytics.recentDonations.map((d) => (
                        <tr key={d._id} className="tr">
                          <td className="td font-semibold">{d.foodName}</td>
                          <td className="td">{d.donorName}</td>
                          <td className="td">{d.quantity}</td>
                          <td className="td"><StatusBadge status={d.status} /></td>
                          <td className="td">{new Date(d.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-5 animate-fade-in">
              <div className="card p-4 flex flex-wrap gap-3">
                <input
                  className="input max-w-xs py-2"
                  placeholder="Search name or email…"
                  value={userFilter.search}
                  onChange={(e) => setUserFilter((p) => ({ ...p, search: e.target.value }))}
                />
                <select className="input max-w-[160px] py-2" value={userFilter.role} onChange={(e) => setUserFilter((p) => ({ ...p, role: e.target.value }))}>
                  <option value="">All roles</option>
                  <option value="donor">Donor</option>
                  <option value="ngo">NGO</option>
                  <option value="volunteer">Volunteer</option>
                </select>
                <select className="input max-w-[160px] py-2" value={userFilter.status} onChange={(e) => setUserFilter((p) => ({ ...p, status: e.target.value }))}>
                  <option value="">All status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="card overflow-hidden">
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        {['Name', 'Role', 'Status', 'Action'].map((h) => (
                          <th key={h} className="th">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="td text-center py-10 text-gray-400">No users found</td>
                        </tr>
                      ) : (
                        users.map((u) => (
                          <tr key={u._id} className="tr">
                            <td className="td">
                              <div className="flex items-center gap-2">
                                <img
                                  src={u.profilePhoto ? `/uploads/profiles/${u.profilePhoto}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=16a34a&color=fff&size=40`}
                                  className="w-9 h-9 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                                  alt=""
                                />
                                <div>
                                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{u.name}</p>
                                  <p className="text-xs text-gray-400">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="td">
                              <span className={u.role === 'ngo' ? 'badge-blue' : u.role === 'volunteer' ? 'badge-yellow' : 'badge-green'}>
                                {roleLabels[u.role] || u.role}
                              </span>
                            </td>
                            <td className="td"><span className={statusColor[u.status]}>{u.status}</span></td>
                            <td className="td">
                              <div className="flex flex-wrap gap-2">
                                {u.status !== 'approved' && (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmModal({ open: true, id: u._id, action: 'approve', name: u.name })}
                                    className="text-xs btn-primary py-1.5 px-3"
                                  >
                                    Approve
                                  </button>
                                )}
                                {u.status !== 'rejected' && (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmModal({ open: true, id: u._id, action: 'reject', name: u.name })}
                                    className="text-xs btn-danger py-1.5 px-3"
                                  >
                                    Reject
                                  </button>
                                )}
                                <div className="flex flex-col gap-1 w-full sm:w-auto">
                                  {u.idFile && (
                                    <button
                                      type="button"
                                      onClick={() => setDocModal({ open: true, url: `/uploads/documents/${u.idFile}`, title: 'ID document' })}
                                      className="text-xs text-secondary-600 hover:underline text-left"
                                    >
                                      View ID
                                    </button>
                                  )}
                                  {u.roleData?.ngoCertificate && (
                                    <button
                                      type="button"
                                      onClick={() => setDocModal({ open: true, url: `/uploads/documents/${u.roleData.ngoCertificate}`, title: 'NGO certificate' })}
                                      className="text-xs text-secondary-600 hover:underline text-left"
                                    >
                                      View certificate
                                    </button>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'donations' && (
            <div className="animate-fade-in card overflow-hidden">
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      {['Food', 'Donor', 'Qty', 'NGO', 'Volunteer', 'District', 'Status', 'Date'].map((h) => (
                        <th key={h} className="th">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {donations.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="td text-center py-10 text-gray-400">No donations yet</td>
                      </tr>
                    ) : (
                      donations.map((d) => (
                        <tr key={d._id} className="tr">
                          <td className="td font-semibold">{d.foodName}</td>
                          <td className="td">
                            <p className="text-sm">{d.donorId?.name || d.donorName}</p>
                            <p className="text-xs text-gray-400">{d.donorId?.phone}</p>
                          </td>
                          <td className="td">{d.quantity} kg</td>
                          <td className="td text-xs">{d.ngoName || '—'}</td>
                          <td className="td text-xs">{d.volunteerName || '—'}</td>
                          <td className="td text-xs">{d.pickupAddress?.district || '—'}</td>
                          <td className="td"><StatusBadge status={d.status} /></td>
                          <td className="td text-xs">{new Date(d.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="card p-8 text-center text-gray-500 dark:text-gray-400 animate-fade-in">
              <p className="text-3xl mb-3">📋</p>
              <p className="font-medium text-gray-700 dark:text-gray-200">Operational requests</p>
              <p className="text-sm mt-2 max-w-md mx-auto">
                Route complex approvals through the Users tab. This slot is reserved for future ticket queues (NGO verifications, escalations).
              </p>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, id: null, action: null, name: '' })}
        onConfirm={handleAction}
        title={confirmModal.action === 'approve' ? 'Approve account' : 'Reject account'}
        message={`Are you sure you want to ${confirmModal.action} ${confirmModal.name}'s account?`}
        confirmLabel={confirmModal.action === 'approve' ? 'Yes, approve' : 'Yes, reject'}
        danger={confirmModal.action === 'reject'}
      />

      <Modal isOpen={docModal.open} onClose={() => setDocModal({ open: false, url: '', title: '' })} title={docModal.title} size="xl">
        {docModal.url.endsWith('.pdf') ? (
          <iframe src={docModal.url} className="w-full h-[480px] rounded-xl border border-gray-100 dark:border-gray-700" title="Document" />
        ) : (
          <img src={docModal.url} className="w-full rounded-xl max-h-[520px] object-contain" alt="Document" />
        )}
      </Modal>
    </div>
  );
};

export default AdminPanel;
