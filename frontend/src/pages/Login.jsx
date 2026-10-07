import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';

const OTP_LEN = 6;
const TIMER_SEC = 120;

const Login = () => {
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otpDigits, setOtpDigits] = useState(Array(OTP_LEN).fill(''));
  const otpRefs = useRef([]);
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(TIMER_SEC);
  const { login } = useAuth();
  const navigate = useNavigate();

  const otp = otpDigits.join('');

  useEffect(() => {
    if (step !== 2) return;
    setSecondsLeft(TIMER_SEC);
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [step, userId]);

  const redirectByRole = (role) => {
    const routes = { donor: '/donor', ngo: '/ngo', volunteer: '/volunteer', admin: '/admin' };
    navigate(routes[role] || '/');
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.login({ identifier: identifier.trim(), password });
      setUserId(res.data.userId);
      setOtpDigits(Array(OTP_LEN).fill(''));
      setStep(2);
      toast.success('OTP sent. Check the server console.');
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== OTP_LEN) {
      toast.error('Enter the 6-digit code');
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.verifyOTP({ userId, otp });
      login(res.data.user, res.data.token);

      if (res.data.user.status === 'pending') {
        setShowSuccessModal(true);
      } else {
        redirectByRole(res.data.user.role);
        toast.success(`Welcome back, ${res.data.user.name}!`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      await authAPI.resendOTP({ userId });
      toast.success('OTP resent — check the server console.');
      setSecondsLeft(TIMER_SEC);
    } catch {
      toast.error('Failed to resend OTP');
    }
  };

  const setDigit = useCallback((index, val) => {
    const d = val.replace(/\D/g, '').slice(-1);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = d;
      return next;
    });
    if (d && index < OTP_LEN - 1) otpRefs.current[index + 1]?.focus();
  }, []);

  const onOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < OTP_LEN - 1) otpRefs.current[index + 1]?.focus();
  };

  const onOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LEN);
    if (!pasted) return;
    const next = [...otpDigits];
    for (let i = 0; i < OTP_LEN; i++) next[i] = pasted[i] || '';
    setOtpDigits(next);
    const last = Math.min(pasted.length, OTP_LEN) - 1;
    otpRefs.current[last]?.focus();
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(1, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div className="min-h-screen bg-surface dark:bg-surface-dark flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-600/5 via-secondary-500/5 to-accent-500/10 pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-secondary-500/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md animate-slide-up relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-2 group">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-500 flex items-center justify-center text-3xl shadow-xl group-hover:scale-[1.02] transition-transform">🍽</div>
            <span className="font-display font-bold text-2xl text-gray-900 dark:text-white">Food Bridge</span>
          </Link>
        </div>

        <div className="card shadow-2xl border-gray-200/80 dark:border-gray-700 overflow-hidden">
          <div className="flex h-1.5">
            {[1, 2].map((s) => (
              <div key={s} className={`flex-1 transition-all duration-500 ${step >= s ? 'bg-brand-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
            ))}
          </div>

          <div className="p-8 sm:p-10">
            {step === 1 ? (
              <>
                <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white">Login to Food Bridge</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-8">We&apos;ll email your one-time code after password check.</p>

                <form onSubmit={handleSendOtp} className="space-y-5">
                  <div>
                    <label className="input-label">Email or phone</label>
                    <input
                      className="input"
                      placeholder="you@example.com or 10-digit mobile"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      autoComplete="username"
                      required
                    />
                  </div>
                  <div>
                    <label className="input-label">Password</label>
                    <input
                      type="password"
                      className="input"
                      placeholder="Your account password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1.5">Password verifies your identity before we send the OTP.</p>
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full min-h-[48px] text-base">
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending…
                      </span>
                    ) : (
                      'Send OTP'
                    )}
                  </button>
                </form>

                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
                  New here?{' '}
                  <Link to="/register" className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">
                    Create an account
                  </Link>
                </p>
              </>
            ) : (
              <>
                <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white text-center">Enter verification code</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2 mb-6">
                  6-digit code was printed to your <strong>server console</strong> (dev mode).
                </p>

                <form onSubmit={handleVerifyOTP} className="space-y-6">
                  <div className="flex justify-center gap-2 sm:gap-3" onPaste={onOtpPaste}>
                    {otpDigits.map((d, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={d}
                        onChange={(e) => setDigit(i, e.target.value)}
                        onKeyDown={(e) => onOtpKeyDown(i, e)}
                        className="w-11 h-14 sm:w-12 sm:h-16 text-center text-xl font-bold rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 outline-none transition-all"
                        aria-label={`Digit ${i + 1}`}
                      />
                    ))}
                  </div>

                  <p className={`text-center text-sm font-medium ${secondsLeft === 0 ? 'text-accent-600' : 'text-gray-500 dark:text-gray-400'}`}>
                    {secondsLeft === 0 ? 'Code may have expired — request a new one.' : `Expires in ${mm}:${ss}`}
                  </p>

                  <button type="submit" disabled={loading || otp.length !== OTP_LEN} className="btn-primary w-full min-h-[48px]">
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Verifying…
                      </span>
                    ) : (
                      'Verify & continue'
                    )}
                  </button>
                </form>

                <div className="flex items-center justify-between mt-6 text-sm">
                  <button type="button" onClick={() => setStep(1)} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 font-medium">
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    className="text-secondary-600 dark:text-secondary-500 font-semibold hover:underline"
                  >
                    Resend OTP
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-gray-400 text-xs mt-8">© {new Date().getFullYear()} Food Bridge</p>
      </div>

      <Modal isOpen={showSuccessModal} onClose={() => { setShowSuccessModal(false); navigate('/'); }} title="Welcome" size="sm">
        <div className="text-center py-2">
          <div className="w-16 h-16 bg-brand-50 dark:bg-brand-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl" aria-hidden>
            ✅
          </div>
          <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white">Login successful</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-3 leading-relaxed">
            Your account is under admin approval. You&apos;ll get full access once an administrator verifies your profile.
          </p>
          <button
            type="button"
            onClick={() => { setShowSuccessModal(false); navigate('/'); }}
            className="btn-primary w-full mt-6"
          >
            OK
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Login;
