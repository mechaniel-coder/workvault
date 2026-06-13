import { NavLink } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { useState } from 'react'
import { MobileMenuSheet } from './MobileMenuSheet'
import { useIndustry } from '../../context/IndustryContext'
import { buildMobileTabs } from '../../lib/industry-nav'

export function MobileNav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { config } = useIndustry()
  const tabs = buildMobileTabs(config)

  return (
    <>
      <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-surface-200/80 bg-white/95 backdrop-blur-xl md:hidden safe-area-pb">
        <div className="flex items-stretch justify-around px-1 pt-1 pb-2">
          {tabs.map(({ to, icon: Icon, label, id }) => (
            <NavLink
              key={id}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-brand-600' : 'text-surface-500'
                }`
              }
            >
              <Icon size={20} />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[10px] font-medium text-surface-500"
          >
            <Menu size={20} />
            <span>More</span>
          </button>
        </div>
      </nav>
      <MobileMenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}
