import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { ArrowLeft, Upload, X, ImagePlus } from 'lucide-react'

const EMPTY = {
  brand: '', model: '', version: '', year: new Date().getFullYear(), price: '', mileage: '',
  color: '', condition: 'bueno', num_owners: 1, has_debts: false, debt_amount: '',
  theft_report_clean: true, tenencia_paid: true, has_original_invoice: true,
  invoice_type: 'fisica', status: 'available', notes: '',
  serial_number: '', moto_serial_number: '', repair_cost: '', total_investment: ''
}

export default function CarForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { user } = useAuth()
  const [form, setForm] = useState(EMPTY)
  const [existingPhotos, setExistingPhotos] = useState([])
  const [newFiles, setNewFiles] = useState([])
  const [photosToDelete, setPhotosToDelete] = useState([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)

  useEffect(() => {
    if (!isEdit) return
    async function load() {
      const [{ data: car }, { data: photos }] = await Promise.all([
        supabase.from('cars').select('*').eq('id', id).single(),
        supabase.from('car_photos').select('*').eq('car_id', id).order('order')
      ])
      if (car) {
        const { id: _id, created_at, updated_at, created_by, ...rest } = car
        setForm({ ...EMPTY, ...rest, debt_amount: rest.debt_amount ?? '' })
      }
      setExistingPhotos(photos ?? [])
      setLoading(false)
    }
    load()
  }, [id, isEdit])

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function convertToWebP(file, quality = 0.85) {
    return new Promise(resolve => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        canvas.getContext('2d').drawImage(img, 0, 0)
        canvas.toBlob(blob => resolve(blob ?? file), 'image/webp', quality)
        URL.revokeObjectURL(img.src)
      }
      img.onerror = () => resolve(file)
      img.src = URL.createObjectURL(file)
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      ...form,
      price: Number(form.price),
      mileage: Number(form.mileage),
      num_owners: Number(form.num_owners),
      debt_amount: form.has_debts ? Number(form.debt_amount) : null,
      updated_at: new Date().toISOString()
    }
    let carId = id
    if (isEdit) {
      await supabase.from('cars').update(payload).eq('id', id)
    } else {
      payload.created_by = user.id
      payload.created_at = new Date().toISOString()
      const { data } = await supabase.from('cars').insert(payload).select().single()
      carId = data.id
    }
    for (const photo of photosToDelete) {
      const path = photo.photo_url.split('/car-photos/')[1]
      if (path) await supabase.storage.from('car-photos').remove([path])
      await supabase.from('car_photos').delete().eq('id', photo.id)
    }
    const currentMax = existingPhotos.filter(p => !photosToDelete.find(d => d.id === p.id)).length
    for (let i = 0; i < newFiles.length; i++) {
      const webpBlob = await convertToWebP(newFiles[i])
      const path = `${carId}/${Date.now()}_${i}.webp`
      const { data: uploaded } = await supabase.storage.from('car-photos').upload(path, webpBlob, { contentType: 'image/webp' })
      if (uploaded) {
        const { data: { publicUrl } } = supabase.storage.from('car-photos').getPublicUrl(path)
        await supabase.from('car_photos').insert({ car_id: carId, photo_url: publicUrl, order: currentMax + i })
      }
    }
    navigate(`/inventory/${carId}`)
  }

  if (loading) return (
    <div className="flex justify-center py-24">
      <div className="w-8 h-8 border-[3px] border-red-600/30 border-t-red-600 rounded-full animate-spin" />
    </div>
  )

  const remainingPhotos = existingPhotos.filter(p => !photosToDelete.find(d => d.id === p.id))

  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer p-1">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{isEdit ? 'Editar auto' : 'Agregar auto'}</h1>
          <p className="text-slate-400 text-sm">{isEdit ? 'Modifica la información del vehículo' : 'Registra un nuevo vehículo'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        <Section title="Información básica">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Marca *"><Input value={form.brand} onChange={e => set('brand', e.target.value)} required placeholder="Toyota" /></Field>
            <Field label="Modelo *"><Input value={form.model} onChange={e => set('model', e.target.value)} required placeholder="Corolla" /></Field>
            <Field label="Versión"><Input value={form.version} onChange={e => set('version', e.target.value)} placeholder="XLE, Sport, GLS..." /></Field>
            <Field label="Año"><Input type="number" value={form.year} onChange={e => set('year', e.target.value)} min="1980" max="2030" /></Field>
            <Field label="Color"><Input value={form.color} onChange={e => set('color', e.target.value)} placeholder="Blanco" /></Field>
            <Field label="Precio ($MXN) *"><Input type="number" value={form.price} onChange={e => set('price', e.target.value)} min="0" required placeholder="250000" /></Field>
            <Field label="Kilometraje"><Input type="number" value={form.mileage} onChange={e => set('mileage', e.target.value)} min="0" placeholder="45000" /></Field>
          </div>
          <Field label="Condición">
            <Select value={form.condition} onChange={e => set('condition', e.target.value)}>
              <option value="excelente">Excelente</option>
              <option value="bueno">Bueno</option>
              <option value="regular">Regular</option>
            </Select>
          </Field>
        </Section>

        <Section title="Historial y documentación">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Número de dueños"><Input type="number" value={form.num_owners} onChange={e => set('num_owners', e.target.value)} min="1" /></Field>
            <Field label="Tipo de factura">
              <Select value={form.invoice_type} onChange={e => set('invoice_type', e.target.value)}>
                <option value="fisica">Persona Física</option>
                <option value="empresarial">Empresarial</option>
                <option value="ninguna">Sin factura</option>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Toggle label="Factura original" checked={form.has_original_invoice} onChange={v => set('has_original_invoice', v)} />
            <Toggle label="Reporte de robo limpio" checked={form.theft_report_clean} onChange={v => set('theft_report_clean', v)} />
            <Toggle label="Tenencias pagadas" checked={form.tenencia_paid} onChange={v => set('tenencia_paid', v)} />
            <Toggle label="Tiene adeudos" checked={form.has_debts} onChange={v => set('has_debts', v)} />
          </div>
          {form.has_debts && (
            <Field label="Monto adeudado ($MXN)">
              <Input type="number" value={form.debt_amount} onChange={e => set('debt_amount', e.target.value)} min="0" placeholder="0" />
            </Field>
          )}
        </Section>

        <Section title="Fotos del vehículo">
          {remainingPhotos.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {remainingPhotos.map(photo => (
                <div key={photo.id} className="relative w-20 h-20 group">
                  <img src={photo.photo_url} className="w-full h-full object-cover rounded-xl border border-slate-200" alt="" />
                  <button
                    type="button"
                    onClick={() => setPhotosToDelete(prev => [...prev, photo])}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer shadow-sm"
                  >
                    <X size={11} strokeWidth={3} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <label className="flex flex-col items-center gap-2 cursor-pointer border-2 border-dashed border-slate-200 hover:border-red-400 rounded-xl p-6 transition-colors hover:bg-red-50/30 group">
            <div className="w-10 h-10 bg-slate-100 group-hover:bg-red-100 rounded-xl flex items-center justify-center transition-colors">
              <ImagePlus size={18} className="text-slate-400 group-hover:text-red-600 transition-colors" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600 group-hover:text-slate-800">
                {newFiles.length > 0 ? `${newFiles.length} foto(s) seleccionada(s)` : 'Seleccionar fotos'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">JPG, PNG, WEBP</p>
            </div>
            <input type="file" multiple accept="image/*" className="hidden" onChange={e => setNewFiles(Array.from(e.target.files))} />
          </label>
        </Section>

        <Section title="Números de serie e inversión">
          <div className="grid grid-cols-2 gap-4">
            <Field label="No. serie del auto"><Input value={form.serial_number} onChange={e => set('serial_number', e.target.value)} placeholder="3VWFE21C04M000001" /></Field>
            <Field label="No. serie de motor"><Input value={form.moto_serial_number} onChange={e => set('moto_serial_number', e.target.value)} placeholder="4A-FE123456" /></Field>
            <Field label="Costo de reparación ($MXN)"><Input type="number" value={form.repair_cost} onChange={e => set('repair_cost', e.target.value)} min="0" placeholder="0" /></Field>
            <Field label="Total de inversión ($MXN)"><Input type="number" value={form.total_investment} onChange={e => set('total_investment', e.target.value)} min="0" placeholder="0" /></Field>
          </div>
        </Section>

        <Section title="Notas adicionales">
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            rows={3}
            placeholder="Observaciones, detalles extras del vehículo..."
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-600/40 focus:border-red-600/60 transition-all resize-none"
          />
        </Section>

        <button
          type="submit"
          disabled={saving}
          className="bg-[#172554] hover:bg-slate-800 text-white rounded-xl py-3.5 font-bold text-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-md hover:shadow-lg"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Guardando...
            </span>
          ) : isEdit ? 'Guardar cambios' : 'Agregar auto'}
        </button>
      </form>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-4">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
      {children}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  )
}

function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-600/40 focus:border-red-600/60 transition-all ${className}`}
      {...props}
    />
  )
}

function Select({ children, ...props }) {
  return (
    <select
      className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600/40 focus:border-red-600/60 transition-all bg-white cursor-pointer"
      {...props}
    >
      {children}
    </select>
  )
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none group">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 shrink-0 ${checked ? 'bg-red-600' : 'bg-slate-200'}`}
      >
        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
      <span className="text-sm text-slate-700 font-medium group-hover:text-slate-900 transition-colors">{label}</span>
    </label>
  )
}
