import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';
import Spinner from '../Spinner';

function ServicesView() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState({ id: null, name: '', description: '', price: '', duration_minutes: '', is_active: true });

  useEffect(() => { fetchServices(); }, []);
  async function fetchServices() { setLoading(true); const { data, error } = await supabase.from('services').select('*').order('name'); if (error) toast.error("Error al cargar servicios."); else setServices(data); setLoading(false); }
  const openModalForEdit = (service) => { setCurrentService(service); setIsModalOpen(true); };
  const openModalForNew = () => { setCurrentService({ id: null, name: '', description: '', price: '', duration_minutes: '', is_active: true }); setIsModalOpen(true); };
  const handleSave = async (e) => { e.preventDefault(); const { id, name, description, price, duration_minutes, is_active } = currentService; const { error } = await (id ? supabase.from('services').update({ name, description, price, duration_minutes, is_active }).eq('id', id) : supabase.from('services').insert([{ name, description, price, duration_minutes, is_active }])); if (error) toast.error("Error al guardar."); else { toast.success(`Servicio ${id ? 'actualizado' : 'creado'}.`); setIsModalOpen(false); fetchServices(); } };
  const handleDelete = async (serviceId) => { if (window.confirm("¿Seguro que quieres eliminar este servicio?")) { const { error } = await supabase.from('services').delete().eq('id', serviceId); if (error) toast.error("Error al eliminar."); else { toast.success("Servicio eliminado."); fetchServices(); } } };

  return (
    <div className="p-4 bg-light-bg rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-6"><h2 className="text-3xl font-serif">Gestionar Servicios</h2><button onClick={openModalForNew} className="bg-brand-gold text-dark-bg font-bold py-2 px-4 rounded hover:opacity-90 transition-transform hover:scale-105">+ Añadir Servicio</button></div>
      {loading ? <Spinner /> : (
        <div className="overflow-x-auto"><table className="min-w-full bg-dark-bg rounded-lg overflow-hidden"><thead className="bg-gray-700"><tr><th className="py-3 px-4 text-left">Nombre</th><th className="py-3 px-4 text-left">Precio</th><th className="py-3 px-4 text-left">Duración</th><th className="py-3 px-4 text-left">Estado</th><th className="py-3 px-4 text-left">Acciones</th></tr></thead><tbody className="divide-y divide-gray-700">
          {services.map(service => (<tr key={service.id} className="hover:bg-gray-800 transition-colors"><td className="py-3 px-4">{service.name}</td><td className="py-3 px-4">${service.price}</td><td className="py-3 px-4">{service.duration_minutes} min</td><td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${service.is_active ? 'bg-green-700 text-green-100' : 'bg-red-800 text-red-200'}`}>{service.is_active ? 'Activo' : 'Inactivo'}</span></td><td className="py-3 px-4 flex gap-4"><button onClick={() => openModalForEdit(service)} className="text-blue-400 hover:underline">Editar</button><button onClick={() => handleDelete(service.id)} className="text-red-400 hover:underline">Eliminar</button></td></tr>))}
        </tbody></table></div>
      )}
      {isModalOpen && (<div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4"><div className="bg-light-bg p-8 rounded-lg w-full max-w-md shadow-xl border border-gray-700"><h3 className="text-2xl font-serif mb-6">{currentService.id ? 'Editar' : 'Nuevo'} Servicio</h3><form onSubmit={handleSave}><div className="mb-4"><label className="block mb-1 text-medium-text">Nombre</label><input type="text" value={currentService.name} onChange={e => setCurrentService({...currentService, name: e.target.value})} className="input-primary" required/></div><div className="mb-4"><label className="block mb-1 text-medium-text">Descripción</label><textarea value={currentService.description} onChange={e => setCurrentService({...currentService, description: e.target.value})} className="input-primary"></textarea></div><div className="flex gap-4 mb-4"><div className="flex-1"><label className="block mb-1 text-medium-text">Precio ($)</label><input type="number" step="0.01" value={currentService.price} onChange={e => setCurrentService({...currentService, price: e.target.value})} className="input-primary" required/></div><div className="flex-1"><label className="block mb-1 text-medium-text">Duración (min)</label><input type="number" value={currentService.duration_minutes} onChange={e => setCurrentService({...currentService, duration_minutes: e.target.value})} className="input-primary" required/></div></div><div className="mb-6"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={currentService.is_active} onChange={e => setCurrentService({...currentService, is_active: e.target.checked})} className="h-5 w-5 rounded bg-gray-700 border-gray-600 focus:ring-brand-gold text-brand-gold"/><span>Servicio Activo</span></label></div><div className="flex justify-end gap-4"><button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancelar</button><button type="submit" className="bg-brand-gold hover:opacity-90 py-2 px-4 rounded text-dark-bg font-bold">Guardar</button></div></form></div></div>)}
    </div>
  );
}
export default ServicesView;