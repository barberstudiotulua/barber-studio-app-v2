import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';
import Spinner from '../Spinner';
import RescheduleModal from './RescheduleModal';
import ManualBookingModal from './ManualBookingModal'; // <-- 1. IMPORTAR EL NUEVO MODAL

function AppointmentsView() {
  const [date, setDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para los modales
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [appointmentToReschedule, setAppointmentToReschedule] = useState(null);
  const [isManualBookingModalOpen, setIsManualBookingModalOpen] = useState(false); // <-- 2. ESTADO PARA EL NUEVO MODAL

  useEffect(() => {
    fetchAppointments();
  }, [date]);

  async function fetchAppointments() {
    setLoading(true);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('appointments')
      .select(`*, clients(full_name, phone_number), services(name, duration_minutes)`)
      .gte('start_time', startOfDay.toISOString())
      .lte('start_time', endOfDay.toISOString())
      .order('start_time', { ascending: true });

    if (error) {
      toast.error("Error al cargar las citas.");
      console.error(error);
    } else {
      setAppointments(data);
    }
    setLoading(false);
  }

  const handleCancelAppointment = async (appointmentId, isBlock) => {
    const msg = isBlock ? "¿Estás seguro de que quieres eliminar este bloqueo?" : "¿Estás seguro de que quieres cancelar esta cita?";
    if (window.confirm(msg)) {
      const { error } = await supabase.from('appointments').delete().eq('id', appointmentId);
      if (error) {
        toast.error("Error al eliminar.");
      } else {
        toast.success(isBlock ? "Bloqueo eliminado." : "Cita cancelada.");
        fetchAppointments();
      }
    }
  };

  const handleOpenReschedule = (appointment) => {
    setAppointmentToReschedule(appointment);
    setIsRescheduleModalOpen(true);
  };

  const handleSaveReschedule = async (newStartTime) => {
    const duration = appointmentToReschedule.services?.duration_minutes || 60;
    const newEndTime = new Date(newStartTime.getTime() + duration * 60000);
    const { error } = await supabase.from('appointments').update({ start_time: newStartTime.toISOString(), end_time: newEndTime.toISOString() }).eq('id', appointmentToReschedule.id);
    if (error) {
      toast.error("Error al reprogramar la cita.");
    } else {
      toast.success("Cita reprogramada con éxito.");
      setIsRescheduleModalOpen(false);
      setAppointmentToReschedule(null);
      if (newStartTime.toDateString() !== date.toDateString()) {
        setDate(newStartTime);
      } else {
        fetchAppointments();
      }
    }
  };
  
  // <-- 3. FUNCIÓN PARA MANEJAR EL ÉXITO Y ACTUALIZAR
  const handleManualBookingSuccess = () => {
    setIsManualBookingModalOpen(false);
    fetchAppointments();
  }

  const formatDate = (dateString) => new Date(dateString).toLocaleTimeString('es-ES', { hour: 'numeric', minute: '2-digit', hour12: true });

  return (
    <>
      <div className="card-bg p-4 rounded-lg">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-3xl font-serif">Citas del Día</h2>
          {/* 4. BOTÓN PARA ABRIR EL MODAL */}
          <button 
            onClick={() => setIsManualBookingModalOpen(true)}
            className="w-full sm:w-auto bg-brand-gold text-dark-primary font-bold py-2 px-5 rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            + Agendar Cita
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/3"><Calendar onChange={setDate} value={date} /></div>
          <div className="lg:w-2/3">
            {loading ? <Spinner /> : (
              <div className="space-y-4">
                {appointments.length > 0 ? (
                  appointments.map(appt => (
                    <div key={appt.id} className={`p-4 rounded-lg border-l-4 ${appt.is_personal_block ? 'bg-red-900/50 border-red-500' : 'card-bg border-brand-gold'}`}>
                       <p className="font-bold text-lg">{formatDate(appt.start_time)} - {formatDate(appt.end_time)}</p>
                      {appt.is_personal_block ? (
                        <>
                          <p className="text-red-300 font-semibold italic">-- {appt.notes || 'Bloqueo Personal'} --</p>
                          <div className="flex gap-4 mt-4 border-t border-red-800 pt-3">
                            <button onClick={() => handleCancelAppointment(appt.id, true)} className="text-red-400 hover:underline font-semibold">Eliminar Bloqueo</button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-xl text-text-light mt-1">{appt.clients?.full_name || 'Cliente'}</p>
                          <p className="text-text-medium">{appt.clients?.phone_number}</p>
                          <p className="mt-2 text-brand-gold font-semibold">{appt.notes || appt.services?.name || 'Cita'}</p>
                          <div className="flex gap-4 mt-4 border-t border-gray-700 pt-3">
                            <button onClick={() => handleOpenReschedule(appt)} className="text-blue-400 hover:underline font-semibold">Reprogramar</button>
                            <button onClick={() => handleCancelAppointment(appt.id, false)} className="text-red-400 hover:underline font-semibold">Cancelar Cita</button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center text-text-medium card-bg p-8 rounded-lg">
                    <p>No hay citas programadas para este día.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 5. RENDERIZADO CONDICIONAL DE LOS MODALES */}
      {isRescheduleModalOpen && appointmentToReschedule && (<RescheduleModal appointment={appointmentToReschedule} onClose={() => setIsRescheduleModalOpen(false)} onSave={handleSaveReschedule} />)}
      {isManualBookingModalOpen && <ManualBookingModal onClose={() => setIsManualBookingModalOpen(false)} onBookingSuccess={handleManualBookingSuccess} />}
    </>
  );
}

export default AppointmentsView;