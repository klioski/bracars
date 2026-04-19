import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ClipboardList, ArrowRight, TrendingUp } from 'lucide-react'

export default function Sales() {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('sales')
        .select('*, cars(brand, model, year)')
        .order('created_at', { ascending: false })
      setSales(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const totalRevenue = sales.reduce((sum, s) => sum + (s.sale_price || 0), 0)

  if (loading) return (
    <div className="flex justify-center py-24">
      <div className="w-8 h-8 border-[3px] border-red-600/30 border-t-red-600 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Historial de ventas</h1>
          <p className="text-slate-400 text-sm mt-0.5">{sales.length} venta{sales.length !== 1 ? 's' : ''} registrada{sales.length !== 1 ? 's' : ''}</p>
        </div>
        {sales.length > 0 && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5 text-right">
            <p className="text-xs text-emerald-600 font-medium">Total ingresos</p>
            <p className="text-lg font-bold text-emerald-700">${totalRevenue.toLocaleString('es-MX')}</p>
          </div>
        )}
      </div>

      {sales.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
            <ClipboardList size={28} className="text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium text-sm">No hay ventas registradas</p>
          <p className="text-slate-400 text-xs">Las ventas aparecerán aquí una vez que registres la primera</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sales.map((sale, i) => (
            <Link
              key={sale.id}
              to={`/inventory/${sale.car_id}`}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                    <TrendingUp size={16} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm leading-tight">
                      {sale.cars?.brand} {sale.cars?.model} <span className="text-slate-400 font-normal">{sale.cars?.year}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">Comprador: <span className="font-medium text-slate-700">{sale.buyer_name}</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="font-bold text-emerald-600 text-base">${sale.sale_price?.toLocaleString('es-MX')}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(sale.sale_date + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <ArrowRight size={15} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                </div>
              </div>
              {sale.notes && (
                <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-50 line-clamp-1">{sale.notes}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
