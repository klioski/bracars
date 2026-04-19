import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { UserPlus, Trash2, Shield, User, Crown } from 'lucide-react'

export default function Users() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    const { data } = await supabase.from('profiles').select('*').order('name')
    setUsers(data ?? [])
    setLoading(false)
  }

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    const { data: { session: adminSession } } = await supabase.auth.getSession()

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })

    if (adminSession) {
      await supabase.auth.setSession({
        access_token: adminSession.access_token,
        refresh_token: adminSession.refresh_token,
      })
    }

    if (signUpError) { setError(signUpError.message); setSaving(false); return }
    if (!data.user) { setError('No se pudo crear el usuario. Verifica que el email no esté registrado.'); setSaving(false); return }

    await supabase.from('profiles').insert({ id: data.user.id, name: form.name, role: form.role })
    setForm({ name: '', email: '', password: '', role: 'employee' })
    setSuccess(`Usuario ${form.name} creado correctamente.`)
    setSaving(false)
    loadUsers()
  }

  async function handleDelete(userId) {
    if (!confirm('¿Eliminar este usuario?')) return
    await supabase.from('profiles').delete().eq('id', userId)
    setUsers(u => u.filter(x => x.id !== userId))
  }

  async function handleRoleChange(userId, role) {
    await supabase.from('profiles').update({ role }).eq('id', userId)
    setUsers(u => u.map(x => x.id === userId ? { ...x, role } : x))
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestión de usuarios</h1>
        <p className="text-slate-400 text-sm mt-0.5">Administra el acceso de los empleados</p>
      </div>

      {/* Create form */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 bg-[#172554] rounded-xl flex items-center justify-center">
            <UserPlus size={15} className="text-white" />
          </div>
          <p className="font-semibold text-slate-800 text-sm">Crear nuevo usuario</p>
        </div>

        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Nombre completo *</label>
              <input required value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="Juan Pérez"
                className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-600/40 focus:border-red-600/60 transition-all" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Rol</label>
              <select value={form.role} onChange={e => set('role', e.target.value)}
                className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600/40 focus:border-red-600/60 transition-all bg-white cursor-pointer">
                <option value="employee">Empleado</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Correo electrónico *</label>
            <input required type="email" value={form.email} onChange={e => set('email', e.target.value)}
              placeholder="usuario@bracars.com"
              className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-600/40 focus:border-red-600/60 transition-all" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Contraseña inicial *</label>
            <input required type="password" minLength={6} value={form.password} onChange={e => set('password', e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-600/40 focus:border-red-600/60 transition-all" />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
          )}
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3">{success}</div>
          )}

          <button type="submit" disabled={saving}
            className="bg-[#172554] hover:bg-slate-800 text-white rounded-xl py-3 font-bold text-sm transition-all disabled:opacity-60 cursor-pointer shadow-sm">
            {saving ? 'Creando...' : 'Crear usuario'}
          </button>
        </form>
      </div>

      {/* Users list */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="font-semibold text-slate-800 text-sm">Empleados activos <span className="text-slate-400 font-normal">({users.length})</span></p>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-[3px] border-red-600/30 border-t-red-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {users.map(u => (
              <div key={u.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <span className="text-slate-600 text-sm font-bold">{u.name?.[0]?.toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-slate-800 text-sm truncate">{u.name}</p>
                    {u.id === currentUser.id && (
                      <span className="text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md font-medium">Tú</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {u.role === 'admin'
                      ? <Crown size={11} className="text-red-600" />
                      : <User size={11} className="text-slate-400" />
                    }
                    <p className="text-xs text-slate-400 capitalize">{u.role === 'admin' ? 'Administrador' : 'Empleado'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {u.id !== currentUser.id && (
                    <>
                      <select
                        value={u.role}
                        onChange={e => handleRoleChange(u.id, e.target.value)}
                        className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-600/40 bg-white cursor-pointer"
                      >
                        <option value="employee">Empleado</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                        aria-label="Eliminar usuario"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
