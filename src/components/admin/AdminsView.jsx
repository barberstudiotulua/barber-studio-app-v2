import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';
import Spinner from '../Spinner';

function AdminsView() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  // Función para obtener la lista de administradores
  async function fetchAdmins() {
    setLoading(true);
    // Llamamos a la función segura que creamos en Supabase
    const { data, error } = await supabase.rpc('get_all_users');
    if (error) {
      toast.error('Error al cargar la lista de administradores.');
      console.error(error);
    } else {
      setAdmins(data);
    }
    setLoading(false);
  }

  // Cargar la lista de administradores cuando el componente se muestra
  useEffect(() => {
    fetchAdmins();
  }, []);

  // Función para manejar la invitación de un nuevo admin
  const handleInvite = async (e) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) {
      toast.error('Por favor, introduce un correo electrónico válido.');
      return;
    }
    setIsInviting(true);
    // Llamamos a la función segura para invitar
    const { data, error } = await supabase.rpc('invite_admin', { p_email: newAdminEmail });

    if (error || (data && data.startsWith('Error'))) {
      toast.error(data || 'No se pudo enviar la invitación.');
    } else {
      toast.success(data);
      setNewAdminEmail('');
      fetchAdmins(); // Actualizamos la lista
    }
    setIsInviting(false);
  };

  // Función para manejar la eliminación de un admin
  const handleDelete = async (adminId, adminEmail) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar al administrador: ${adminEmail}? Esta acción no se puede deshacer.`)) {
      // Llamamos a la función segura para eliminar
      const { data, error } = await supabase.rpc('delete_admin_user', { p_user_id: adminId });
      
      if (error || (data && data.startsWith('Error'))) {
        toast.error(data || 'No se pudo eliminar al administrador.');
      } else {
        toast.success(data);
        fetchAdmins(); // Actualizamos la lista
      }
    }
  };

  return (
    <div className="p-4 bg-light-bg rounded-lg shadow-xl space-y-8">
      <div>
        <h2 className="text-3xl font-serif mb-4">Invitar Nuevo Administrador</h2>
        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-4">
          <input
            type="email"
            placeholder="correo@ejemplo.com"
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            className="input-primary flex-grow"
            required
          />
          <button type="submit" disabled={isInviting} className="bg-brand-gold text-dark-primary font-bold py-2 px-6 rounded hover:opacity-90 transition-opacity disabled:bg-yellow-800">
            {isInviting ? 'Enviando...' : 'Enviar Invitación'}
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-3xl font-serif mb-4">Administradores Actuales</h2>
        {loading ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-dark-bg">
              <thead className="bg-gray-700">
                <tr>
                  <th className="py-3 px-4 text-left">Correo Electrónico</th>
                  <th className="py-3 px-4 text-left">Rol</th>
                  <th className="py-3 px-4 text-left">Fecha de Creación</th>
                  <th className="py-3 px-4 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {admins.map(admin => (
                  <tr key={admin.id} className="hover:bg-gray-800">
                    <td className="py-3 px-4 font-medium">{admin.email}</td>
                    <td className="py-3 px-4">
                      {admin.is_admin ? (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-700 text-green-100">Admin</span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-600 text-gray-200">Usuario</span>
                      )}
                    </td>
                    <td className="py-3 px-4">{new Date(admin.created_at).toLocaleDateString('es-ES')}</td>
                    <td className="py-3 px-4">
                      <button onClick={() => handleDelete(admin.id, admin.email)} className="text-red-400 hover:underline font-semibold">
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminsView;