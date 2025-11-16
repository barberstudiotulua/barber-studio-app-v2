import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import Spinner from './Spinner';
import RescheduleClientModal from './RescheduleClientModal';

const StatusBadge = ({ status }) => {
  const styles = {
    'Pendiente': 'bg-yellow-200 text-yellow-800',
    'Cumplida': 'bg-green-200 text-green-800',
    'Incumplida': 'bg-red-200 text-red-800',
  };
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
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [appointmentToReschedule, setAppointmentToReschedule] = useState(null);
  const [allowReschedule, setAllowReschedule] = useState(false);

  useEffect(() => {
    async function fetchRescheduleSetting() {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'allow_client_reschedule')
        .single();
        
      if (!error && data) {
        setAllowReschedule(data.value === 'true' || data.value === true);
      }
    }
    fetchRescheduleSetting();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!phone.trim()) {
      toast.error('Por favor, introduce un número de teléfono.');
      return;
    }
    
    setLoading(true);
    setHasSearched(true);
    setAppointments([]);

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id, start_time, end_time, notes, status, 
        clients!inner(full_name, phone_number)
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

  const handleOpenRescheduleModal = (appointment) => {
    setAppointmentToReschedule(appointment);
    setIsRescheduleModalOpen(true);
  };

  const handleRescheduleSuccess = () => {
    setIsRescheduleModalOpen(false);
    setAppointmentToReschedule(null);
    // Para refrescar la lista, creamos un evento falso y llamamos a handleSearch
    const fakeEvent = { preventDefault: () => {} };
    handleSearch(fakeEvent); 
  };

  return (
    <>
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
                {appointments.map(appt => {
                  // --- INICIO DE LA NUEVA LÓGICA DE TIEMPO ---
                  const appointmentStartTime = new Date(appt.start_time);
                  const now = new Date();
                  // Calculamos la diferencia en horas
                  const hoursUntilAppointment = (appointmentStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);
                  
                  // La cita es reprogramable si está pendiente, la opción está activa y faltan más de 5 horas.
                  const isReschedulable = allowReschedule && appt.status === 'Pendiente' && hoursUntilAppointment > 5;
                  
                  // Mostramos el mensaje de aviso si la opción está activa, la cita pendiente, pero faltan menos de 5 horas (y aún no ha pasado).
                  const showTimeLimitMessage = allowReschedule && appt.status === 'Pendiente' && hoursUntilAppointment <= 5 && appointmentStartTime > now;
                  // --- FIN DE LA NUEVA LÓGICA DE TIEMPO ---

                  return (
                    <div key={appt.id} className="p-4 rounded-lg bg-light-primary dark:bg-dark-primary border border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-bold text-lg text-brand-gold">
                          {appointmentStartTime.toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' })}
                        </p>
                        <StatusBadge status={appt.status || 'Pendiente'} />
                      </div>
                      <p className="text-text-dark dark:text-text-light mt-1">{appt.notes}</p>

                      {/* Si es reprogramable, mostramos el botón */}
                      {isReschedulable && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button 
                              onClick={() => handleOpenRescheduleModal(appt)}
                              className="w-full sm:w-auto bg-brand-gold text-dark-primary font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
                            >
                              Reprogramar Cita
                            </button>
                        </div>
                      )}

                      {/* Si no, pero cumple las condiciones, mostramos el mensaje */}
                      {showTimeLimitMessage && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-sm text-text-soft dark:text-text-medium italic">
                            Las citas solo se pueden reprogramar con más de 5 horas de antelación.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {isRescheduleModalOpen && appointmentToReschedule && (
        <RescheduleClientModal 
          appointment={appointmentToReschedule}
          onClose={() => setIsRescheduleModalOpen(false)}
          onRescheduleSuccess={handleRescheduleSuccess}
        />
      )}
    </>
  );
}

export default HistoryModal;