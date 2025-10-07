import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Spinner from './Spinner'; // Usaremos el spinner para la pantalla de carga

function ProtectedRoute({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserIsAdmin = async () => {
      // 1. Preguntamos a Supabase si hay una sesión activa.
      const { data: { session } } = await supabase.auth.getSession();

      // 2. Verificamos si hay una sesión Y si el usuario tiene la marca de "admin" que configuramos.
      if (session && session.user.user_metadata?.admin === true) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      setLoading(false); // 3. Terminamos de cargar
    };

    checkUserIsAdmin();
    
    // Opcional pero recomendado: Escuchar cambios de sesión en tiempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
       if (session && session.user.user_metadata?.admin === true) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    });

    // Limpiar la suscripción cuando el componente se desmonte
    return () => subscription.unsubscribe();

  }, []);

  // Mientras verificamos, mostramos una pantalla de carga.
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-dark-primary">
        <Spinner />
      </div>
    );
  }

  // Si no es admin, lo redirigimos a la página de login.
  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  // Si es admin, mostramos el contenido protegido (el panel).
  return children;
}

export default ProtectedRoute;