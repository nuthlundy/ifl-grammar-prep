import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, BookOpen, BarChart3 } from 'lucide-react';
import { cn } from '../utils';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/grammar-map', label: 'Grammar Map', icon: Map },
  { to: '/diagnostic', label: 'Diagnostic', icon: BookOpen },
  { to: '/progress', label: 'Progress', icon: BarChart3 },
];

export function Navbar() {
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-lg font-bold text-blue-700 tracking-tight">IFL</span>
            <span className="hidden sm:inline text-xs font-medium text-slate-400 uppercase tracking-widest">
              Grammar Prep
            </span>
          </div>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  )
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
