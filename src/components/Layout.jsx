import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { LayoutDashboard, Car, ClipboardList, Users, LogOut, Menu, X, ChevronRight } from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/inventory', label: 'Inventario', icon: Car },
  { to: '/sales', label: 'Ventas', icon: ClipboardList },
]

export default function Layout({ children }) {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const items = profile?.role === 'admin'
    ? [...navItems, { to: '/admin/users', label: 'Usuarios', icon: Users }]
    : navItems

  const isActive = (to) => location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to))

  return (
    <div className="flex min-h-dvh bg-slate-100 font-[Inter,system-ui,sans-serif]">

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-[#172554] flex flex-col z-30 transition-transform duration-300
        md:translate-x-0 md:sticky md:top-0 md:h-screen
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo con fondo transparente */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <img src="/icons/BraCars.png" alt="BraCars" className="h-14 object-contain" />
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white p-1 rounded ml-2">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
          {items.map(({ to, label, icon: Icon }) => {
            const active = isActive(to)
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                  ${active ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/8'}`}
              >
                <Icon size={17} strokeWidth={active ? 2.5 : 2} />
                {label}
                {active && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            )
          })}
        </nav>

        {/* User + logout */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-red-600/20 border border-red-600/40 flex items-center justify-center shrink-0">
              <span className="text-red-400 text-xs font-bold">{profile?.name?.[0]?.toUpperCase() ?? 'U'}</span>
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-sm font-medium truncate leading-tight">{profile?.name ?? 'Usuario'}</p>
              <p className="text-slate-500 text-xs">{profile?.role === 'admin' ? 'Administrador' : 'Empleado'}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
          >
            <LogOut size={17} strokeWidth={2} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="md:hidden bg-[#172554] text-white px-4 h-14 flex items-center justify-between sticky top-0 z-10 shadow-lg">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" aria-label="Abrir menú">
            <Menu size={20} />
          </button>
          <img src="/icons/BraCars.png" alt="BraCars" className="h-8 object-contain" />
          <div className="w-8" />
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
