'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function AuthPage() {
  const router = useRouter()
  const supabase = createClient()
  
  // 1. Ampliamos las vistas para incluir la pantalla de éxito
  const [vista, setVista] = useState<'login' | 'registro' | 'exito'>('login')
  const [cedula, setCedula] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  
  // 2. Nuevo estado para confirmar el correo
  const [confirmEmail, setConfirmEmail] = useState('')
  
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
        // 3. Manejo inteligente del error 403 / Credenciales
        if (authError.message.includes('Email not confirmed') || authError.message.includes('Invalid login credentials')) {
          setMensaje({ tipo: 'error', texto: 'Credenciales incorrectas o correo sin verificar. Por favor, revisa tu Gmail si acabas de registrarte.' })
        } else {
          setMensaje({ tipo: 'error', texto: 'Error al iniciar sesión: ' + authError.message })
        }
        setCargando(false)
        return
      }

      router.push('/dashboard')
      router.refresh()
    } else if (vista === 'registro') {
      // 4. Validación: Candado contra errores tipográficos
      if (email !== confirmEmail) {
        setMensaje({ tipo: 'error', texto: 'Los correos electrónicos no coinciden. Por favor, verifica.' })
        setCargando(false)
        return
      }

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

      // 5. En lugar de ir a login, disparamos la pantalla de éxito
      setVista('exito')
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
            {vista === 'login' && 'INICIAR SESIÓN'}
            {vista === 'registro' && 'REGISTRO DE USUARIO'}
            {vista === 'exito' && 'VERIFICACIÓN REQUERIDA'}
          </h2>
        </div>
        
        {mensaje && (
          <div className={`px-4 py-3 rounded mb-6 text-sm border ${mensaje.tipo === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
            {mensaje.texto}
          </div>
        )}

        {/* 6. LA PANTALLA DE RETENCIÓN */}
        {vista === 'exito' && (
          <div className="text-center space-y-4 animate-fade-in">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 mb-2">
              <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-800">¡Registro creado!</h3>
            <p className="text-gray-600">
              Hemos enviado un enlace seguro a <br/>
              <span className="font-semibold text-gray-900 block mt-1">{email}</span>
            </p>
            <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
              Abre tu bandeja de entrada (o la carpeta de Spam), haz clic en el enlace para verificar tu identidad y luego regresa aquí.
            </p>
            <button
              type="button"
              onClick={() => {
                setVista('login')
                setEmail('')
                setConfirmEmail('')
                setPassword('')
                setMensaje(null)
              }}
              className="w-full mt-4 bg-gray-800 hover:bg-gray-900 text-white font-medium py-2.5 px-4 rounded-md transition-colors"
            >
              Ya verifiqué mi correo, iniciar sesión
            </button>
          </div>
        )}

        {/* FORMULARIOS (Solo se muestran si NO estamos en la pantalla de éxito) */}
        {vista !== 'exito' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {vista === 'registro' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                  <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required className="w-full border border-gray-300 rounded-md p-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gmail</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full border border-gray-300 rounded-md p-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Gmail</label>
                    <input type="email" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50" />
                  </div>
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
        )}

        {/* Botón inferior (Oculto en pantalla de éxito) */}
        {vista !== 'exito' && (
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
        )}
      </div>
    </div>
  )
}