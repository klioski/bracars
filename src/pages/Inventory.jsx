import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Plus, Search, Car, SlidersHorizontal } from 'lucide-react'

export default function Inventory() {
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('available')

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('cars')
        .select('id, brand, model, year, price, mileage, color, condition, status, car_photos(photo_url, order)')
        .order('created_at', { ascending: false })
      setCars(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = cars.filter(c => {
    const matchStatus = filter === 'all' || c.status === filter
    const q = search.toLowerCase()
    const matchSearch = !q || `${c.brand} ${c.model} ${c.year}`.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  const filterTabs = [
    { val: 'available', label: 'Disponibles', count: cars.filter(c => c.status === 'available').length },
    { val: 'sold', label: 'Vendidos', count: cars.filter(c => c.status === 'sold').length },
    { val: 'all', label: 'Todos', count: cars.length },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inventario</h1>
          <p className="text-slate-400 text-sm mt-0.5">{filtered.length} vehículo{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          to="/inventory/new"
          className="flex items-center gap-2 bg-[#172554] hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 shadow-sm hover:shadow-md cursor-pointer"
        >
          <Plus size={16} strokeWidth={2.5} /> Agregar auto
        </Link>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por marca, modelo, año..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-600/40 focus:border-red-600/60 transition-all shadow-sm"
          />
        </div>
        <div className="flex gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
          {filterTabs.map(({ val, label, count }) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer
                ${filter === val
                  ? 'bg-[#172554] text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              {label}
              <span className={`text-xs px-1.5 py-0.5 rounded-md font-semibold
                ${filter === val ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-[3px] border-red-600/30 border-t-red-600 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 flex flex-col items-center gap-3 text-slate-300">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
            <Car size={28} className="text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium text-sm">No se encontraron autos</p>
          <p className="text-slate-400 text-xs">Intenta con otra búsqueda o filtro</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(car => {
            const firstPhoto = car.car_photos?.sort((a, b) => a.order - b.order)[0]
            return (
              <Link
                key={car.id}
                to={`/inventory/${car.id}`}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
              >
                {/* Photo */}
                <div className="relative bg-slate-50 h-44 flex items-center justify-center overflow-hidden">
                  {firstPhoto ? (
                    <img
                      src={firstPhoto.photo_url}
                      alt={`${car.brand} ${car.model}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <Car size={40} className="text-slate-200" />
                  )}
                  <span className={`absolute top-3 right-3 text-xs px-2.5 py-1 rounded-full font-semibold shadow-sm
                    ${car.status === 'available'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-700 text-white'}`}>
                    {car.status === 'available' ? 'Disponible' : 'Vendido'}
                  </span>
                </div>

                {/* Info */}
                <div className="p-4">
                  <p className="font-bold text-slate-900 text-sm leading-tight">{car.brand} {car.model}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{car.year} • {car.color}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                    <p className="font-bold text-[#172554] text-base">${car.price?.toLocaleString('es-MX')}</p>
                    <p className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">{car.mileage?.toLocaleString('es-MX')} km</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
