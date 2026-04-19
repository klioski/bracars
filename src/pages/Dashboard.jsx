import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Car, CheckCircle, Clock, TrendingUp, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Dashboard() {
  const { profile, user } = useAuth()
  const displayName = profile?.name || user?.email?.split('@')[0] || 'Usuario'
  const [stats, setStats] = useState({ total: 0, available: 0, sold: 0, totalRevenue: 0 })
  const [recentCars, setRecentCars] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: cars }, { data: sales }] = await Promise.all([
        supabase.from('cars').select('id, status, brand, model, year, price, created_at').order('created_at', { ascending: false }),
        supabase.from('sales').select('sale_price')
      ])
      const available = cars?.filter(c => c.status === 'available').length ?? 0
      const sold = cars?.filter(c => c.status === 'sold').length ?? 0
      const totalRevenue = sales?.reduce((sum, s) => sum + (s.sale_price || 0), 0) ?? 0
      setStats({ total: cars?.length ?? 0, available, sold, totalRevenue })
      setRecentCars(cars?.slice(0, 5) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const cards = [
    { label: 'Total en inventario', value: stats.total, icon: Car, accent: 'bg-slate-700 text-slate-200', badge: 'bg-slate-100 text-slate-700' },
    { label: 'Disponibles', value: stats.available, icon: Clock, accent: 'bg-emerald-500/10 text-emerald-500', badge: 'bg-emerald-50 text-emerald-700' },
    { label: 'Vendidos', value: stats.sold, icon: CheckCircle, accent: 'bg-red-600/10 text-red-600', badge: 'bg-red-50 text-red-700' },
    { label: 'Ingresos totales', value: `$${stats.totalRevenue.toLocaleString('es-MX')}`, icon: TrendingUp, accent: 'bg-blue-500/10 text-blue-500', badge: 'bg-blue-50 text-blue-700' },
  ]

  if (loading) return (
    <div className="flex justify-center py-24">
      <div className="w-8 h-8 border-[3px] border-red-600/30 border-t-red-600 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="flex flex-col gap-7">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Bienvenido de vuelta, <span className="text-red-600">{displayName}</span>
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-4 hover:shadow-md transition-shadow duration-200">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}>
              <Icon size={19} strokeWidth={2} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 leading-tight">{value}</p>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent cars */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800 text-sm">Últimos autos agregados</h2>
          <Link to="/inventory" className="flex items-center gap-1 text-red-600 text-xs font-medium hover:text-red-700 transition-colors">
            Ver todos <ArrowRight size={13} />
          </Link>
        </div>

        {recentCars.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Car size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No hay autos registrados aún.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {recentCars.map(car => (
              <Link
                key={car.id}
                to={`/inventory/${car.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/80 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                    <Car size={15} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm leading-tight">{car.brand} {car.model} <span className="text-slate-400 font-normal">{car.year}</span></p>
                    <p className="text-xs text-slate-400 mt-0.5">${car.price?.toLocaleString('es-MX')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium
                    ${car.status === 'available' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {car.status === 'available' ? 'Disponible' : 'Vendido'}
                  </span>
                  <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
