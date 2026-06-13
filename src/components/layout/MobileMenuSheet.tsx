import { NavLink } from 'react-router-dom'
import { X } from 'lucide-react'
import { useIndustry } from '../../context/IndustryContext'
import { buildMobileTabs, buildNavSections } from '../../lib/industry-nav'

type MobileMenuSheetProps = {
  open: boolean
  onClose: () => void
}

export function MobileMenuSheet({ open, onClose }: MobileMenuSheetProps) {
  const { config } = useIndustry()

  if (!open) return null

  const tabIds = new Set(buildMobileTabs(config).map((t) => t.id))
  const moreItems = buildNavSections(config)
    .flatMap((s) => s.items)
    .filter((item) => !tabIds.has(item.id) && item.id !== 'dashboard')

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close menu"
      />
      <div className="absolute inset-x-0 bottom-0 max-h-[70vh] overflow-y-auto rounded-t-2xl bg-white p-4 pb-8 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-surface-900">More</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-surface-400 hover:bg-surface-100"
          >
            <X size={18} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {moreItems.map(({ to, icon: Icon, label, id }) => (
            <NavLink
              key={id}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium ${
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'bg-surface-50 text-surface-700 hover:bg-surface-100'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  )
}
