import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import MapPicker from '../components/MapPicker';

const steps = ['Basic info', 'Address & map', 'Role details'];

const roleCards = [
  { value: 'donor', icon: '🧑‍🍳', title: 'Donor', desc: 'Share surplus meals safely.' },
  { value: 'ngo', icon: '🏢', title: 'NGO', desc: 'Accept and route food to communities.' },
  { value: 'volunteer', icon: '🚴', title: 'Volunteer', desc: 'Deliver between donors and NGOs.' },
];

const Register = () => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const certZoneRef = useRef();
  const profileInputRef = useRef();

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    hno: '', landmark: '', district: '', pincode: '',
    lat: 17.385, lng: 78.4867,
    role: '',
    idType: '', idNumber: '',
    organizationName: '', serviceAreaRadius: 10,
    availabilityTime: '', transportUi: 'cycle', maxCapacity: 2,
    foodType: '', defaultQuantity: 5,
    pickupSameAsAddress: true,
  });

  const [files, setFiles] = useState({ profilePhoto: null, idFile: null, ngoCertificate: null });
  const [profilePreview, setProfilePreview] = useState(null);
  const [passwordMatch, setPasswordMatch] = useState(null);
  const [certDrag, setCertDrag] = useState(false);

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handlePasswordCheck = (confirmVal) => {
    update('confirmPassword', confirmVal);
    setPasswordMatch(confirmVal === '' ? null : form.password === confirmVal);
  };

  const handleFileChange = (field, file) => setFiles((p) => ({ ...p, [field]: file }));

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported in this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        update('lat', pos.coords.latitude);
        update('lng', pos.coords.longitude);
        toast.success('Location detected from device');
      },
      () => toast.error('Unable to read your location. Pin the map manually.'),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  const isStep0Valid =
    form.name && form.email && form.phone && form.password && form.password === form.confirmPassword && form.role;
  const isStep1Valid = form.hno && form.district && form.pincode;
  const isStep2Valid =
    form.role && form.idType && form.idNumber && (form.role !== 'ngo' || form.organizationName.trim());

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isStep2Valid) {
      toast.error('Please complete all required fields');
      return;
    }

    setLoading(true);
    const transportMap = { bike: 'motorcycle', cycle: 'bicycle', none: 'walking' };
    const formData = new FormData();
    const payload = {
      ...form,
      transportOption: transportMap[form.transportUi] || 'bicycle',
    };
    delete payload.confirmPassword;
    delete payload.transportUi;
    delete payload.pickupSameAsAddress;

    Object.entries(payload).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) formData.append(k, v);
    });

    if (files.profilePhoto) formData.append('profilePhoto', files.profilePhoto);
    if (files.idFile) formData.append('idFile', files.idFile);
    if (files.ngoCertificate) formData.append('ngoCertificate', files.ngoCertificate);

    try {
      await authAPI.register(formData);
      toast.success('Account created. Pending admin approval.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const idPatterns = {
    aadhaar: { pattern: /^\d{12}$/, hint: '12-digit Aadhaar number' },
    pan: { pattern: /^[A-Z]{5}\d{4}[A-Z]{1}$/, hint: 'Format: ABCDE1234F' },
    voter: { pattern: /^[A-Z0-9]{8,12}$/, hint: '8–12 alphanumeric characters' },
    driving: { pattern: /.+/, hint: 'Enter licence number' },
  };

  const idValid = form.idType && form.idNumber
    ? idPatterns[form.idType]?.pattern.test(form.idNumber.toUpperCase())
    : true;

  const onProfilePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleFileChange('profilePhoto', file);
    const reader = new FileReader();
    reader.onload = (ev) => setProfilePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-surface dark:bg-surface-dark flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-3xl animate-slide-up">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-gray-900 dark:text-white font-display font-bold text-xl">
            <span className="text-3xl">🍽</span> Food Bridge
          </Link>
          <h2 className="mt-3 font-display font-bold text-2xl text-gray-900 dark:text-white">Create your account</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Three quick steps — built for clarity.</p>
        </div>

        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8">
          {steps.map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1 max-w-[140px] sm:max-w-none">
              <div
                className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  i <= step ? 'bg-brand-600 text-white shadow-md' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                }`}
              >
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-xs sm:text-sm font-medium truncate ${i <= step ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                {label}
              </span>
              {i < steps.length - 1 && <div className={`hidden sm:block flex-1 h-0.5 mx-2 ${i < step ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'}`} />}
            </div>
          ))}
        </div>

        <div className="card p-6 sm:p-10 shadow-xl border-gray-200/80 dark:border-gray-700">
          <form onSubmit={handleSubmit}>
            {step === 0 && (
              <div className="space-y-5 animate-fade-in">
                <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white">Basic information</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Full name *</label>
                    <input className="input" placeholder="Your name" value={form.name} onChange={(e) => update('name', e.target.value)} required />
                  </div>
                  <div>
                    <label className="input-label">Phone *</label>
                    <input
                      className="input"
                      placeholder="10-digit mobile"
                      maxLength={10}
                      value={form.phone}
                      onChange={(e) => update('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="input-label">Email *</label>
                  <input type="email" className="input" placeholder="you@example.com" value={form.email} onChange={(e) => update('email', e.target.value)} required />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Password *</label>
                    <input type="password" className="input" placeholder="Min 6 characters" value={form.password} onChange={(e) => update('password', e.target.value)} required minLength={6} />
                  </div>
                  <div>
                    <label className="input-label">Confirm password *</label>
                    <input
                      type="password"
                      className={`input ${passwordMatch === false ? 'border-red-400' : passwordMatch === true ? 'border-brand-500' : ''}`}
                      placeholder="Repeat password"
                      value={form.confirmPassword}
                      onChange={(e) => handlePasswordCheck(e.target.value)}
                      required
                    />
                    {passwordMatch === false && <p className="text-red-500 text-xs mt-1">Passwords do not match</p>}
                    {passwordMatch === true && <p className="text-brand-600 text-xs mt-1">Looks good</p>}
                  </div>
                </div>

                <div>
                  <p className="input-label">I am joining as *</p>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {roleCards.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => update('role', r.value)}
                        className={`text-left p-4 rounded-2xl border-2 transition-all duration-200 ${
                          form.role === r.value
                            ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/25 shadow-md ring-2 ring-brand-500/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-secondary-300 dark:hover:border-secondary-700'
                        }`}
                      >
                        <span className="text-2xl">{r.icon}</span>
                        <p className="font-display font-bold text-gray-900 dark:text-white mt-2">{r.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-snug">{r.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5 animate-fade-in">
                <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white">Address & map</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Address line *</label>
                    <input className="input" placeholder="House / flat / street" value={form.hno} onChange={(e) => update('hno', e.target.value)} required />
                  </div>
                  <div>
                    <label className="input-label">Landmark</label>
                    <input className="input" placeholder="Near metro, school…" value={form.landmark} onChange={(e) => update('landmark', e.target.value)} />
                  </div>
                  <div>
                    <label className="input-label">District *</label>
                    <input className="input" placeholder="City / district" value={form.district} onChange={(e) => update('district', e.target.value)} required />
                  </div>
                  <div>
                    <label className="input-label">PIN code *</label>
                    <input
                      className="input"
                      placeholder="6 digits"
                      maxLength={6}
                      value={form.pincode}
                      onChange={(e) => update('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                  <button type="button" onClick={detectLocation} className="btn-secondary text-sm py-2.5 px-4">
                    Auto-detect my location
                  </button>
                  <span className="text-xs text-gray-500">Uses your browser. You can still drag the pin.</span>
                </div>
                <div>
                  <label className="input-label">Pin on map *</label>
                  <MapPicker lat={form.lat} lng={form.lng} onLocationSelect={(lat, lng) => { update('lat', lat); update('lng', lng); }} height={280} markerRole="donor" />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white">Role details & verification</h3>

                {form.role === 'donor' && (
                  <div className="p-5 rounded-2xl border border-brand-100 dark:border-brand-900/40 bg-brand-50/40 dark:bg-brand-900/10 space-y-4">
                    <p className="text-sm font-semibold text-brand-800 dark:text-brand-300">Donor profile</p>
                    <div>
                      <label className="input-label">Typical food type</label>
                      <select className="input" value={form.foodType} onChange={(e) => update('foodType', e.target.value)} required>
                        <option value="">Select…</option>
                        <option value="veg">Vegetarian</option>
                        <option value="non-veg">Non-vegetarian</option>
                        <option value="both">Mixed</option>
                      </select>
                    </div>
                    <div>
                      <label className="input-label">Default quantity (kg): {form.defaultQuantity}</label>
                      <input
                        type="range"
                        min={1}
                        max={50}
                        value={form.defaultQuantity}
                        onChange={(e) => update('defaultQuantity', Number(e.target.value))}
                        className="w-full accent-brand-600"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
                      <input type="checkbox" checked={form.pickupSameAsAddress} onChange={(e) => update('pickupSameAsAddress', e.target.checked)} className="rounded border-gray-300 text-brand-600" />
                      Pickup is the same as my registered address
                    </label>
                    <div>
                      <p className="input-label">Profile photo</p>
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-800">
                          {profilePreview ? (
                            <img src={profilePreview} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl text-gray-400">👤</div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <input ref={profileInputRef} type="file" accept="image/*" className="hidden" onChange={onProfilePick} />
                          <button type="button" onClick={() => profileInputRef.current?.click()} className="btn-outline text-sm py-2">
                            Upload
                          </button>
                          {profilePreview && (
                            <button
                              type="button"
                              className="text-sm text-red-500 font-semibold px-2"
                              onClick={() => {
                                setProfilePreview(null);
                                setFiles((p) => ({ ...p, profilePhoto: null }));
                              }}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {form.role === 'ngo' && (
                  <div className="p-5 rounded-2xl border border-secondary-100 dark:border-secondary-900/40 bg-secondary-50/30 dark:bg-secondary-900/10 space-y-4">
                    <p className="text-sm font-semibold text-secondary-800 dark:text-secondary-300">NGO details</p>
                    <input
                      className="input"
                      placeholder="Organization name *"
                      value={form.organizationName}
                      onChange={(e) => update('organizationName', e.target.value)}
                      required={form.role === 'ngo'}
                    />
                    <div>
                      <label className="input-label">Service radius: {form.serviceAreaRadius} km</label>
                      <input
                        type="range"
                        min={1}
                        max={50}
                        value={form.serviceAreaRadius}
                        onChange={(e) => update('serviceAreaRadius', Number(e.target.value))}
                        className="w-full accent-secondary-500"
                      />
                    </div>
                    <div>
                      <label className="input-label">Certificate upload</label>
                      <div
                        ref={certZoneRef}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter') certZoneRef.current?.querySelector('input')?.click(); }}
                        onDragOver={(e) => { e.preventDefault(); setCertDrag(true); }}
                        onDragLeave={() => setCertDrag(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setCertDrag(false);
                          const f = e.dataTransfer.files?.[0];
                          if (f) handleFileChange('ngoCertificate', f);
                        }}
                        className={`mt-2 border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
                          certDrag ? 'border-accent-500 bg-accent-50/50 dark:bg-accent-900/10' : 'border-gray-300 dark:border-gray-600 hover:border-secondary-400'
                        }`}
                        onClick={() => certZoneRef.current?.querySelector('input')?.click()}
                      >
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => handleFileChange('ngoCertificate', e.target.files?.[0])}
                        />
                        <p className="text-2xl mb-2">📄</p>
                        <p className="font-semibold text-gray-800 dark:text-gray-200">Drag & drop certificate</p>
                        <p className="text-xs text-gray-500 mt-1">PDF or image · {files.ngoCertificate?.name || 'No file selected'}</p>
                      </div>
                    </div>
                    <div>
                      <label className="input-label">Primary contact (phone)</label>
                      <input className="input opacity-70 cursor-not-allowed" value={form.phone} readOnly />
                    </div>
                  </div>
                )}

                {form.role === 'volunteer' && (
                  <div className="p-5 rounded-2xl border border-accent-100 dark:border-accent-900/30 bg-accent-50/20 dark:bg-accent-900/10 space-y-4">
                    <p className="text-sm font-semibold text-accent-800 dark:text-accent-400">Volunteer details</p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="input-label">Availability</label>
                        <input type="time" className="input" value={form.availabilityTime} onChange={(e) => update('availabilityTime', e.target.value)} />
                      </div>
                      <div>
                        <label className="input-label">Carry capacity</label>
                        <select className="input" value={form.maxCapacity} onChange={(e) => update('maxCapacity', Number(e.target.value))}>
                          {[1, 2, 3].map((v) => (
                            <option key={v} value={v}>
                              {v} kg
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="input-label">Transport</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'bike', label: 'Bike' },
                          { id: 'cycle', label: 'Cycle' },
                          { id: 'none', label: 'None' },
                        ].map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => update('transportUi', t.id)}
                            className={`py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                              form.transportUi === t.id
                                ? 'border-accent-500 bg-white dark:bg-gray-800 shadow'
                                : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3 border-t border-gray-100 dark:border-gray-800 pt-6">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Identity verification</p>
                  <div>
                    <label className="input-label">ID type *</label>
                    <select className="input" value={form.idType} onChange={(e) => update('idType', e.target.value)} required>
                      <option value="">Select ID</option>
                      <option value="aadhaar">Aadhaar</option>
                      <option value="pan">PAN</option>
                      <option value="voter">Voter ID</option>
                      <option value="driving">Driving licence</option>
                    </select>
                  </div>
                  {form.idType && (
                    <div>
                      <label className="input-label">
                        ID number * <span className="font-normal text-gray-400">({idPatterns[form.idType]?.hint})</span>
                      </label>
                      <input
                        className={`input ${form.idNumber && !idValid ? 'border-red-400' : form.idNumber && idValid ? 'border-brand-500' : ''}`}
                        placeholder={idPatterns[form.idType]?.hint}
                        value={form.idNumber}
                        onChange={(e) => update('idNumber', e.target.value)}
                        required
                      />
                      {form.idNumber && !idValid && <p className="text-red-500 text-xs mt-1">Check the format</p>}
                    </div>
                  )}
                  <div>
                    <label className="input-label">Upload ID scan</label>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="input text-sm py-2" onChange={(e) => handleFileChange('idFile', e.target.files?.[0])} />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-10 gap-4">
              {step > 0 ? (
                <button type="button" onClick={() => setStep((p) => p - 1)} className="btn-secondary flex-1 sm:flex-none sm:px-10">
                  Back
                </button>
              ) : (
                <span className="flex-1 sm:hidden" />
              )}
              {step < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((p) => p + 1)}
                  disabled={(step === 0 && !isStep0Valid) || (step === 1 && !isStep1Valid)}
                  className="btn-primary flex-1 sm:min-w-[200px]"
                >
                  Continue
                </button>
              ) : (
                <button type="submit" disabled={loading || !isStep2Valid || !idValid} className="btn-primary flex-1 sm:min-w-[220px]">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating…
                    </span>
                  ) : (
                    'Create account'
                  )}
                </button>
              )}
            </div>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
            Already registered?{' '}
            <Link to="/login" className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
