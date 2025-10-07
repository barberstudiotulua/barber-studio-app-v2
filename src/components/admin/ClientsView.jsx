import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';
import Spinner from '../Spinner';

function ClientsView() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false); // --- NUEVO: Estado para feedback de guardado
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState({ id: null, full_name: '', phone_number: '' });

  useEffect(() => { fetchClients(); }, []);

  async function fetchClients() {
    setLoading(true);
    const { data, error } = await supabase.from('clients').select('*').order('full_name');
    if (error) toast.error("Error al cargar los clientes.");
    else setClients(data);
    setLoading(false);
  }

  const openModalForEdit = (client) => {
    setCurrentClient(client);
    setIsModalOpen(true);
  };

  const openModalForNew = () => {
    setCurrentClient({ id: null, full_name: '', phone_number: '' });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); // --- NUEVO: Activar feedback
    const { id, full_name, phone_number } = currentClient;

    const { error } = await (id
      ? supabase.from('clients').update({ full_name, phone_number }).eq('id', id)
      : supabase.from('clients').insert([{ full_name, phone_number }])
    );

    if (error) toast.error(`Error al guardar: ${error.message}`);
    else {
      toast.success(`Cliente ${id ? 'actualizado' : 'creado'} con éxito.`);
      setIsModalOpen(false);
      fetchClients();
    }
    setSaving(false); // --- NUEVO: Desactivar feedback
  };

  const handleDelete = async (clientId) => {
    if (window.confirm("¿Seguro que quieres eliminar este cliente?")) {
      const { error } = await supabase.from('clients').delete().eq('id', clientId);
      if (error) toast.error(`Error al eliminar: ${error.message}`);
      else {
        toast.success("Cliente eliminado.");
        fetchClients();
      }
    }
  };

  const filteredClients = clients.filter(c =>
    c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone_number.includes(searchTerm)
  );

  return (
    <div className="p-4 bg-light-bg rounded-lg">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-3xl font-serif">Clientes Registrados</h2>
        <div className="flex gap-4 w-full md:w-auto">
          <input type="text" placeholder="Buscar cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-primary w-full md:w-64"/>
          <button onClick={openModalForNew} className="bg-brand-gold text-dark-bg font-bold py-2 px-4 rounded hover:opacity-90 transition-opacity whitespace-nowrap">+ Añadir Cliente</button>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-dark-bg">
            <thead className="bg-gray-700">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider">Nombre Completo</th>
                <th className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider">Teléfono</th>
                <th className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider">Registrado</th>
                <th className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredClients.map(client => (
                <tr key={client.id} className="hover:bg-gray-800">
                  <td className="py-3 px-4 whitespace-nowrap">{client.full_name}</td>
                  <td className="py-3 px-4 whitespace-nowrap">{client.phone_number}</td>
                  <td className="py-3 px-4 whitespace-nowrap">{new Date(client.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-4 flex gap-4 items-center whitespace-nowrap">
                    <button onClick={() => openModalForEdit(client)} className="text-blue-400 hover:underline">Editar</button>
                    <button onClick={() => handleDelete(client.id)} className="text-red-400 hover:underline">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
          <div className="bg-light-bg p-8 rounded-lg w-full max-w-md shadow-xl border border-gray-700">
            <h3 className="text-2xl font-serif mb-6">{currentClient.id ? 'Editar' : 'Nuevo'} Cliente</h3>
            <form onSubmit={handleSave}>
              <div className="mb-4">
                  <label className="block mb-2 text-medium-text">Nombre Completo</label>
                  <input type="text" value={currentClient.full_name} onChange={e => setCurrentClient({...currentClient, full_name: e.target.value})} className="input-primary" required/>
              </div>
              <div className="mb-6">
                  <label className="block mb-2 text-medium-text">Número de Teléfono</label>
                  <input type="tel" value={currentClient.phone_number} onChange={e => setCurrentClient({...currentClient, phone_number: e.target.value})} className="input-primary" required/>
              </div>
              <div className="flex justify-end gap-4 mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-600 hover:bg-gray-700 py-2 px-4 rounded text-white font-bold transition-colors">Cancelar</button>
                {/* --- BOTÓN CON FEEDBACK DE CARGA --- */}
                <button type="submit" disabled={saving} className="bg-brand-gold hover:opacity-90 py-2 px-4 rounded text-dark-bg font-bold transition-opacity disabled:bg-yellow-800 disabled:cursor-wait">
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientsView;