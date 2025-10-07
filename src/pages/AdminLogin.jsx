import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import { supabase } from '../supabaseClient'; // Importamos supabase

function AdminLogin() {
  const [email, setEmail] = useState(''); // Nuevo estado para el email
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // La función de login ahora es asíncrona para hablar con Supabase
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Usamos la función de autenticación de Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      // Si Supabase devuelve un error, lo mostramos
      toast.error('Email o contraseña incorrectos.');
      setPassword(''); // Limpiamos la contraseña por seguridad
    } else {
      // Si el inicio de sesión es exitoso, Supabase maneja la sesión automáticamente.
      // Ya no necesitamos guardar nada en sessionStorage.
      toast.success('¡Bienvenido!');
      navigate('/admin');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto p-4 flex justify-center items-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
        <div className="w-full max-w-sm p-8 card-bg rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
          <h2 className="text-3xl font-serif text-center mb-6">Acceso de Administrador</h2>
          <form onSubmit={handleLogin}>
            {/* Campo para el Email */}
            <div className="mb-4">
              <label htmlFor="email" className="block mb-2 font-medium text-text-soft dark:text-text-medium">Correo Electrónico</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-primary"
                placeholder="tu@email.com"
                required
              />
            </div>

            {/* Campo para la Contraseña */}
            <div className="mb-6">
              <label htmlFor="password" className="block mb-2 font-medium text-text-soft dark:text-text-medium">Contraseña</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-primary"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default AdminLogin;