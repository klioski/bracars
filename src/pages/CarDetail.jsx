import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Pencil, Trash2, Tag, ChevronLeft, ChevronRight, Car, AlertTriangle, RotateCcw } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const CONDITION_LABELS = { excelente: 'Excelente', bueno: 'Bueno', regular: 'Regular' }
const INVOICE_LABELS = { fisica: 'Persona Física', empresarial: 'Empresarial', ninguna: 'Sin factura' }

export default function CarDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [car, setCar] = useState(null)
  const [photos, setPhotos] = useState([])
  const [saleInfo, setSaleInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [cancelingSale, setCancelingSale] = useState(false)
  const [confirmCancelSale, setConfirmCancelSale] = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: carData }, { data: photoData }, { data: saleData }] = await Promise.all([
        supabase.from('cars').select('*').eq('id', id).single(),
        supabase.from('car_photos').select('*').eq('car_id', id).order('order'),
        supabase.from('sales').select('*').eq('car_id', id).maybeSingle()
      ])
      setCar(carData)
      setPhotos(photoData ?? [])
      setSaleInfo(saleData)
      setLoading(false)
    }
    load()
  }, [id])

  async function handleCancelSale() {
    setCancelingSale(true)
    await supabase.from('sales').delete().eq('car_id', id)
    await supabase.from('cars').update({ status: 'available' }).eq('id', id)
    setCar(c => ({ ...c, status: 'available' }))
    setSaleInfo(null)
    setCancelingSale(false)
    setConfirmCancelSale(false)
  }

  async function handleDelete() {
    setDeleting(true)
    for (const photo of photos) {
      const path = photo.photo_url.split('/car-photos/')[1]
      if (path) await supabase.storage.from('car-photos').remove([path])
    }
    await supabase.from('car_photos').delete().eq('car_id', id)
    await supabase.from('sales').delete().eq('car_id', id)
    await supabase.from('cars').delete().eq('id', id)
    navigate('/inventory')
  }

  if (loading) return (
    <div className="flex justify-center py-24">
      <div className="w-8 h-8 border-[3px] border-red-600/30 border-t-red-600 rounded-full animate-spin" />
    </div>
  )

  if (!car) return (
    <div className="text-center py-20 text-slate-500">Auto no encontrado.</div>
  )

  return (
    <div className="flex flex-col gap-5 max-w-3xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} /> Regresar
        </button>
        <div className="flex gap-2">
          {car.status === 'available' && (
            <Link
              to={`/inventory/${id}/sell`}
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 shadow-sm cursor-pointer"
            >
              <Tag size={14} strokeWidth={2.5} /> Registrar venta
            </Link>
          )}
          {car.status === 'sold' && (
            <button
              onClick={() => setConfirmCancelSale(true)}
              className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer border border-amber-200"
            >
              <RotateCcw size={14} strokeWidth={2.5} /> Cancelar venta
            </button>
          )}
          <Link
            to={`/inventory/${id}/edit`}
            className="flex items-center gap-1.5 bg-[#172554] hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 shadow-sm cursor-pointer"
          >
            <Pencil size={14} strokeWidth={2.5} /> Editar
          </Link>
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer"
          >
            <Trash2 size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-red-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-red-800 text-sm">¿Eliminar este auto?</p>
            <p className="text-red-600 text-xs mt-0.5">Esta acción no se puede deshacer. Se eliminarán también las fotos y el registro de venta.</p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 cursor-pointer"
              >
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="bg-white text-slate-600 hover:bg-slate-50 px-4 py-1.5 rounded-lg text-sm font-medium border border-slate-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmCancelSale && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <RotateCcw size={18} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-amber-800 text-sm">¿Cancelar esta venta?</p>
            <p className="text-amber-700 text-xs mt-0.5">Se eliminará el registro de venta y el auto volverá a estar disponible.</p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleCancelSale}
                disabled={cancelingSale}
                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 cursor-pointer"
              >
                {cancelingSale ? 'Procesando...' : 'Sí, cancelar venta'}
              </button>
              <button
                onClick={() => setConfirmCancelSale(false)}
                className="bg-white text-slate-600 hover:bg-slate-50 px-4 py-1.5 rounded-lg text-sm font-medium border border-slate-200 transition-colors cursor-pointer"
              >
                No, mantener
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Photo gallery */}
        <div className="relative bg-slate-900 h-72 md:h-96 flex items-center justify-center">
          {photos.length > 0 ? (
            <>
              <img
                src={photos[photoIndex]?.photo_url}
                alt="Foto del auto"
                className="h-full w-full object-cover"
              />
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => setPhotoIndex(i => (i - 1 + photos.length) % photos.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setPhotoIndex(i => (i + 1) % photos.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <ChevronRight size={18} />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {photos.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPhotoIndex(i)}
                        className={`rounded-full transition-all cursor-pointer ${i === photoIndex ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-600">
              <Car size={40} className="opacity-30" />
              <p className="text-sm opacity-50">Sin fotos</p>
            </div>
          )}
          <span className={`absolute top-4 left-4 text-xs px-3 py-1.5 rounded-full font-bold shadow-lg
            ${car.status === 'available' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-white'}`}>
            {car.status === 'available' ? '● Disponible' : '● Vendido'}
          </span>
        </div>

        <div className="p-5 md:p-7 flex flex-col gap-6">
          {/* Title */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{car.brand} {car.model} {car.version && <span className="text-slate-500 font-medium">{car.version}</span>} <span className="text-slate-400 font-medium">{car.year}</span></h1>
              <p className="text-3xl font-bold text-red-600 mt-1">${car.price?.toLocaleString('es-MX')}</p>
            </div>
          </div>

          {/* Specs grid */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Especificaciones</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Spec label="Color" value={car.color} />
              <Spec label="Kilometraje" value={`${car.mileage?.toLocaleString('es-MX')} km`} />
              <Spec label="Condición" value={CONDITION_LABELS[car.condition]} />
              <Spec label="Dueños anteriores" value={car.num_owners} />
              <Spec label="Reporte de robo" value={car.theft_report_clean ? '✓ Limpio' : '⚠ Con reporte'} highlight={!car.theft_report_clean} />
              <Spec label="Tenencias" value={car.tenencia_paid ? '✓ Pagadas' : '✗ Pendientes'} highlight={!car.tenencia_paid} />
              <Spec label="Factura original" value={car.has_original_invoice ? '✓ Sí' : '✗ No'} />
              <Spec label="Tipo de factura" value={INVOICE_LABELS[car.invoice_type]} />
              <Spec label="Adeudos" value={car.has_debts ? `$${car.debt_amount?.toLocaleString('es-MX')}` : '✓ Sin adeudos'} highlight={car.has_debts} />
            </div>
          </div>

          {(car.serial_number || car.moto_serial_number || car.repair_cost || car.total_investment) && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Números de serie e inversión</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {car.serial_number && <Spec label="No. serie auto" value={car.serial_number} />}
                {car.moto_serial_number && <Spec label="No. serie motor" value={car.moto_serial_number} />}
                {car.repair_cost != null && car.repair_cost > 0 && <Spec label="Costo de reparación" value={`$${Number(car.repair_cost).toLocaleString('es-MX')}`} />}
                {car.total_investment != null && car.total_investment > 0 && <Spec label="Total inversión" value={`$${Number(car.total_investment).toLocaleString('es-MX')}`} />}
              </div>
            </div>
          )}

          {car.notes && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Notas</p>
              <p className="text-slate-600 text-sm bg-slate-50 rounded-xl p-4 leading-relaxed border border-slate-100">{car.notes}</p>
            </div>
          )}

          {saleInfo && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-widest mb-3">Registro de venta</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-white rounded-xl p-3 border border-emerald-100">
                  <p className="text-xs text-slate-400 font-medium mb-1">Comprador</p>
                  <p className="text-sm font-bold text-slate-800">{saleInfo.buyer_name ?? '—'}</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-emerald-100">
                  <p className="text-xs text-slate-400 font-medium mb-1">Precio final</p>
                  <p className="text-sm font-bold text-emerald-700">${saleInfo.sale_price?.toLocaleString('es-MX')}</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-emerald-100">
                  <p className="text-xs text-slate-400 font-medium mb-1">Fecha de venta</p>
                  <p className="text-sm font-bold text-slate-800">{new Date(saleInfo.sale_date + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
              {saleInfo.notes && (
                <p className="text-slate-600 text-sm bg-white rounded-xl p-4 mt-3 border border-emerald-100 leading-relaxed">{saleInfo.notes}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Spec({ label, value, highlight }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
      <p className="text-xs text-slate-400 font-medium mb-1">{label}</p>
      <p className={`text-sm font-semibold ${highlight ? 'text-red-600' : 'text-slate-800'}`}>{value ?? '—'}</p>
    </div>
  )
}
