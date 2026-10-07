import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import toast from 'react-hot-toast';

/**
 * @param {{ title: string, subtitle?: string, nav: { id: string, label: string, icon: string }[], active: string, onNav: (id: string) => void, children: import('react').ReactNode, extraNav?: import('react').ReactNode }} props
 */
const DashboardLayout = ({ title, subtitle, nav, active, onNav, children, extraNav }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Signed out');
  };

  const NavButton = ({ item, mobile }) => (
    <button
      type="button"
      key={item.id}
      onClick={() => onNav(item.id)}
      className={`w-full flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-1 lg:gap-3 px-3 py-2 rounded-xl text-xs lg:text-sm font-medium transition-all duration-200 ${
        active === item.id
          ? 'bg-brand-600 text-white shadow-md'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
      } ${mobile ? 'flex-1 min-w-0' : ''}`}
    >
      <span className="text-lg lg:text-base" aria-hidden>{item.icon}</span>
      <span className="truncate max-w-[72px] lg:max-w-none">{item.label}</span>
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col bg-surface dark:bg-surface-dark">
      <Navbar />

      <div className="flex flex-1 w-full max-w-7xl mx-auto">
        <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-gray-200 dark:border-gray-800 p-4 gap-1 animate-fade-in">
          <div className="px-2 py-4 mb-2">
            <h1 className="font-display font-bold text-lg text-gray-900 dark:text-white leading-tight">{title}</h1>
            {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
          </div>
          {nav.map((item) => (
            <NavButton key={item.id} item={item} mobile={false} />
          ))}
          {extraNav}
          <button
            type="button"
            onClick={handleLogout}
            className="mt-auto flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <span>🚪</span> Logout
          </button>
        </aside>

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 animate-fade-in page-enter">
          <div className="lg:hidden mb-6">
            <h1 className="font-display font-bold text-xl text-gray-900 dark:text-white">{title}</h1>
            {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          {children}
        </main>
      </div>

      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-2 pt-2 pb-3 flex justify-around gap-1 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]"
        aria-label="Primary"
      >
        {nav.map((item) => (
          <NavButton key={item.id} item={item} mobile />
        ))}
        <button
          type="button"
          onClick={handleLogout}
          className="flex flex-col items-center justify-center flex-1 min-w-0 px-2 py-2 rounded-xl text-xs font-medium text-red-600"
        >
          <span className="text-lg">🚪</span>
          <span className="truncate">Out</span>
        </button>
      </nav>
    </div>
  );
};

export default DashboardLayout;
