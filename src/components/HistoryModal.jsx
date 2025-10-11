import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import Spinner from './Spinner';
import RescheduleModal from './admin/RescheduleModal';

const StatusBadge = ({ status }) => {
  const styles = {
    'Pendiente': 'bg-yellow-200 text-yellow-800',
    'Cumplida': 'bg-green-200 text-green-800',
    'Incumplida': 'bg-red-200 text-red-800',
  };
  const style = styles[status] || 'bg-gray-200 text-gray-800';
  return <span className={`px-2.5 py-1 text-sm font-semibold rounded-full ${style}`}>{status}</span>;
};

function HistoryModal({ onClose }) {
  const [phone, setPhone] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [appointmentToReschedule, setAppointmentToReschedule] = useState(null);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!phone.trim()) {
      toast.error('Por favor, introduce un número de teléfono.');
      return;
    }
    
    setLoading(true);
    setHasSearched(true);
    setAppointments([]);

    // --- CORRECCIÓN IMPORTANTE: Se ha quitado el filtro de fecha ---
    // Ahora la consulta trae TODAS las citas del cliente.
    const { data, error } = await supabase
      .from('appointments')
      .select('id, start_time, end_time, notes, status, clients!inner(full_name, phone_number)')
      .eq('clients.phone_number', phone)
      .order('start_time', { ascending: false }); // Se mantiene el orden de la más reciente a la más antigua

    if (error) {
      toast.error('Hubo un error al buscar tus citas.');
    } else {
      setAppointments(data);
    }
    setLoading(false);
  };

  const handleOpenReschedule = (appointment) => {
    setAppointmentToReschedule(appointment);
    setIsRescheduleModalOpen(true);
  };

  const handleSaveReschedule = async (newStartTime) => {
    const toastId = toast.loading('Reprogramando tu cita...');
    
    const { data, error } = await supabase.rpc('reschedule_appointment_by_client', {
      p_appointment_id: appointmentToReschedule.id,
      p_client_phone_number: phone,
      p_new_start_time: newStartTime.toISOString(),
    });

    if (error || (data && data.startsWith('Error'))) {
      toast.error(error?.message || data || 'No se pudo reprogramar la cita.', { id: toastId });
    } else {
      toast.success('¡Tu cita ha sido reprogramada con éxito!', { id: toastId });
      setIsRescheduleModalOpen(false);
      setAppointmentToReschedule(null);
      handleSearch(); 
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
        <div className="card-bg p-6 sm:p-8 rounded-lg w-full max-w-lg shadow-xl relative animate-fade-in-up max-h-[80vh] flex flex-col">
          <button onClick={onClose} className="absolute top-3 right-3 text-4xl text-text-soft dark:text-text-medium hover:text-text-dark dark:hover:text-text-light transition-colors" aria-label="Cerrar modal">&times;</button>
          <h3 className="text-2xl sm:text-3xl font-serif text-center mb-6 text-brand-gold">Historial de Citas</h3>
          
          <form onSubmit={handleSearch} className="flex gap-2 mb-6">
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-primary flex-grow" placeholder="Ingresa tu número de teléfono" required />
            <button type="submit" disabled={loading} className="btn-secondary whitespace-nowrap">{loading ? 'Buscando...' : 'Buscar'}</button>
          </form>

          <div className="overflow-y-auto flex-grow pr-2">
            {loading && <Spinner />}
            {!loading && hasSearched && appointments.length === 0 && <p className="text-center text-text-soft dark:text-text-medium mt-4">No se encontraron citas para este número.</p>}
            {!loading && appointments.length > 0 && (
              <div className="space-y-4">
                {appointments.map(appt => {
                  // --- LÓGICA CLAVE: Condición para mostrar el botón ---
                  // La cita debe estar 'Pendiente' Y la fecha debe ser futura.
                  const isReschedulable = appt.status === 'Pendiente' && new Date(appt.start_time) > new Date();

                  return (
                    <div key={appt.id} className="p-4 rounded-lg bg-light-primary dark:bg-dark-primary border border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-bold text-lg text-brand-gold">{new Date(appt.start_time).toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' })}</p>
                        <StatusBadge status={appt.status || 'Pendiente'} />
                      </div>
                      <p className="text-text-dark dark:text-text-light mt-1">{appt.notes}</p>
                      
                      {/* El botón solo se muestra si la condición es verdadera */}
                      {isReschedulable && (
                        <div className="text-right mt-3">
                          <button onClick={() => handleOpenReschedule(appt)} className="text-blue-500 dark:text-blue-400 font-semibold hover:underline">
                            Reprogramar Cita
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {isRescheduleModalOpen && (
        <RescheduleModal
          appointment={appointmentToReschedule}
          onClose={() => setIsRescheduleModalOpen(false)}
          onSave={handleSaveReschedule}
        />
      )}
    </>
  );