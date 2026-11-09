'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function AuthPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [vista, setVista] = useState<'login' | 'registro'>('login')
  const [cedula, setCedula] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'error' | 'exito', texto: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setMensaje(null)

    if (vista === 'login') {
      const { data: usuario, error: errorBusqueda } = await supabase
        .from('usuarios')
        .select('email')
        .eq('cedula', cedula)
        .single()

      if (errorBusqueda || !usuario) {
        setMensaje({ tipo: 'error', texto: 'Cédula no encontrada en el sistema.' })
        setCargando(false)
        return
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: usuario.email,
        password: password,
      })

      if (authError) {
        setMensaje({ tipo: 'error', texto: 'Contraseña incorrecta.' })
        setCargando(false)
        return
      }

      router.push('/dashboard')
      router.refresh()
    } else {
      const { error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            cedula: cedula,
            nombre: nombre,
            rol: 'docente'
          }
        }
      })

      if (error) {
        setMensaje({ tipo: 'error', texto: 'Error al registrar: ' + error.message })
        setCargando(false)
        return
      }

      setMensaje({ tipo: 'exito', texto: 'Registro exitoso. Ya puedes iniciar sesión.' })
      setPassword('')
      setVista('login')
      setCargando(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        
        <div className="mb-6 text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/logo.png" 
              alt="Logo UNELLEZ" 
              className="h-20 w-auto object-contain"
            />
          </div>
          <h2 className="text-xl font-bold text-gray-800">
            {vista === 'login' ? 'INICIAR SESIÓN' : 'REGISTRO DE USUARIO'}
          </h2>
        </div>
        
        {mensaje && (
          <div className={`px-4 py-3 rounded mb-6 text-sm border ${mensaje.tipo === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
            {mensaje.texto}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {vista === 'registro' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required className="w-full border border-gray-300 rounded-md p-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gmail</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full border border-gray-300 rounded-md p-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cédula (V)</label>
            <input type="text" value={cedula} onChange={(e) => setCedula(e.target.value)} required className="w-full border border-gray-300 rounded-md p-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full border border-gray-300 rounded-md p-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
          </div>

          <button type="submit" disabled={cargando} className="w-full text-white font-medium py-2.5 px-4 rounded-md bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 mt-2">
            {cargando ? 'Procesando...' : (vista === 'login' ? 'Ingresar' : 'Registrar')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            type="button" 
            onClick={() => {
              setVista(vista === 'login' ? 'registro' : 'login')
              setMensaje(null)
            }} 
            className="text-sm text-blue-600 hover:underline"
          >
            {vista === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  )
}