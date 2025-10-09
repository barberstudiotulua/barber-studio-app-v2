import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import Spinner from './Spinner';

// Este es el componente completo de la ventana emergente
function HistoryModal({ onClose }) {
  // Estado para guardar el número de teléfono que el cliente escribe
  const [phone, setPhone] = useState('');
  // Estado para guardar las citas que encontremos
  const [appointments, setAppointments] = useState([]);
  // Estado para mostrar el spinner mientras se busca
  const [loading, setLoading] = useState(false);
  // Estado para saber si ya se realizó una búsqueda
  const [hasSearched, setHasSearched] = useState(false);

  // Función que se activa cuando el cliente presiona "Buscar"
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!phone.trim()) {
      toast.error('Por favor, introduce un número de teléfono.');
      return;
    }
    
    setLoading(true);
    setHasSearched(true);
    setAppointments([]);

    // Hacemos una consulta a Supabase para buscar las citas
    // Pide las citas que pertenecen a un cliente cuyo número de teléfono coincide con el que se escribió
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        start_time,
        notes,
        clients!inner(
          full_name,
          phone_number
        )
      `)
      .eq('clients.phone_number', phone)
      .order('start_time', { ascending: false }); // Ordenamos de la más reciente a la más antigua

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
        {/* Botón para cerrar la ventana */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-4xl text-text-soft dark:text-text-medium hover:text-text-dark dark:hover:text-text-light transition-colors"
          aria-label="Cerrar modal"
        >
          &times;
        </button>

        <h3 className="text-2xl sm:text-3xl font-serif text-center mb-6 text-brand-gold">Consultar mis Citas</h3>
        
        {/* Formulario para buscar por teléfono */}
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

        {/* Área para mostrar los resultados */}
        <div className="overflow-y-auto flex-grow pr-2">
          {loading && <Spinner />}
          
          {!loading && hasSearched && appointments.length === 0 && (
            <p className="text-center text-text-soft dark:text-text-medium mt-4">No se encontraron citas para este número de teléfono.</p>
          )}

          {!loading && appointments.length > 0 && (
            <div className="space-y-4">
              {appointments.map(appt => (
                <div key={appt.start_time} className="p-4 rounded-lg bg-light-primary dark:bg-dark-primary border border-gray-200 dark:border-gray-700">
                  <p className="font-bold text-lg text-brand-gold">
                    {new Date(appt.start_time).toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' })}
                  </p>
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