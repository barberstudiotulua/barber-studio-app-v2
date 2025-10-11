import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import Spinner from './Spinner';

// --- NUEVO: Pequeño componente para mostrar la etiqueta de estado con color ---
const StatusBadge = ({ status }) => {
  const styles = {
    'Pendiente': 'bg-yellow-200 text-yellow-800',
    'Cumplida': 'bg-green-200 text-green-800',
    'Incumplida': 'bg-red-200 text-red-800',
  };
  // Aplicamos un estilo por defecto si el estado no es uno de los esperados
  const style = styles[status] || 'bg-gray-200 text-gray-800';
  
  return (
    <span className={`px-2.5 py-1 text-sm font-semibold rounded-full ${style}`}>
      {status}
    </span>
  );
};


function HistoryModal({ onClose }) {
  const [phone, setPhone] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!phone.trim()) {
      toast.error('Por favor, introduce un número de teléfono.');
      return;
    }
    
    setLoading(true);
    setHasSearched(true);
    setAppointments([]);

    // AHORA TAMBIÉN PEDIMOS LA COLUMNA "status" EN LA CONSULTA
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        start_time,
        notes,
        status, 
        clients!inner(
          full_name,
          phone_number
        )
      `)
      .eq('clients.phone_number', phone)
      .order('start_time', { ascending: false });

    if (error) {
      toast.error('Hubo un error al buscar tus citas.');
      console.error(error);
    } else {
      setAppointments(data);
    }
    
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="card-bg p-6 sm:p-8 rounded-lg w-full max-w-lg shadow-xl relative animate-fade-in-up max-h-[80vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-4xl text-text-soft dark:text-text-medium hover:text-text-dark dark:hover:text-text-light transition-colors"
          aria-label="Cerrar modal"
        >
          &times;
        </button>

        <h3 className="text-2xl sm:text-3xl font-serif text-center mb-6 text-brand-gold">Consultar mis Citas</h3>
        
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <input 
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input-primary flex-grow" 
            placeholder="Ingresa tu número de teléfono" 
            required 
          />
          <button type="submit" disabled={loading} className="btn-secondary whitespace-nowrap">
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </form>

        <div className="overflow-y-auto flex-grow pr-2">
          {loading && <Spinner />}
          
          {!loading && hasSearched && appointments.length === 0 && (
            <p className="text-center text-text-soft dark:text-text-medium mt-4">No se encontraron citas para este número de teléfono.</p>
          )}

          {!loading && appointments.length > 0 && (
            <div className="space-y-4">
              {appointments.map(appt => (
                <div key={appt.start_time} className="p-4 rounded-lg bg-light-primary dark:bg-dark-primary border border-gray-200 dark:border-gray-700">
                  {/* AÑADIMOS LA ETIQUETA DE ESTADO AQUÍ */}
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-bold text-lg text-brand-gold">
                      {new Date(appt.start_time).toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' })}
                    </p>
                    <StatusBadge status={appt.status || 'Pendiente'} />
                  </div>
                  <p className="text-text-dark dark:text-text-light mt-1">{appt.notes}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default HistoryModal;