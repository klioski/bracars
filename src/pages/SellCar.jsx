import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { ArrowLeft, Tag, CheckCircle } from 'lucide-react'

export default function SellCar() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [car, setCar] = useState(null)
  const [form, setForm] = useState({
    buyer_name: '', sale_price: '', sale_date: new Date().toISOString().split('T')[0], notes: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('cars').select('brand, model, year, price').eq('id', id).single()
      .then(({ data }) => { if (data) { setCar(data); setForm(f => ({ ...f, sale_price: data.price })) } })
  }, [id])

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('sales').insert({
      car_id: id,
      buyer_name: form.buyer_name,
      sale_price: Number(form.sale_price),
      sale_date: form.sale_date,
      notes: form.notes || null,
      sold_by: user.id,
      created_at: new Date().toISOString()
    })
    await supabase.from('cars').update({ status: 'sold', updated_at: new Date().toISOString() }).eq('id', id)
    navigate(`/inventory/${id}`)
  }

  return (
    <div className="flex flex-col gap-5 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer p-1">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Registrar venta</h1>
          <p className="text-slate-400 text-sm">Completa los datos del comprador</p>
        </div>
      </div>

      {car && (
        <div className="bg-[#172554] rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600/20 border border-red-600/30 rounded-xl flex items-center justify-center shrink-0">
            <Tag size={16} className="text-red-400" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{car.brand} {car.model} {car.year}</p>
            <p className="text-slate-400 text-xs">Precio original: ${car.price?.toLocaleString('es-MX')}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-4">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Datos de la venta</p>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Nombre del comprador *</label>
          <input
            required
            value={form.buyer_name}
            onChange={e => set('buyer_name', e.target.value)}
            placeholder="Ej. Juan Pérez García"
            className="border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-600/40 focus:border-red-600/60 transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Precio final ($MXN) *</label>
            <input
              required
              type="number"
              min="0"
              value={form.sale_price}
              onChange={e => set('sale_price', e.target.value)}
              className="border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600/40 focus:border-red-600/60 transition-all"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Fecha de venta *</label>
            <input
              required
              type="date"
              value={form.sale_date}
              onChange={e => set('sale_date', e.target.value)}
              className="border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600/40 focus:border-red-600/60 transition-all"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Notas <span className="text-slate-400 font-normal">(opcional)</span></label>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            rows={3}
            placeholder="Observaciones de la venta, forma de pago, etc."
            className="border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-600/40 focus:border-red-600/60 transition-all resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-3.5 font-bold text-sm transition-all duration-150 disabled:opacity-60 cursor-pointer shadow-md hover:shadow-lg"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <><CheckCircle size={16} strokeWidth={2.5} /> Confirmar venta</>
          )}
        </button>
      </form>
    </div>
  )
}
