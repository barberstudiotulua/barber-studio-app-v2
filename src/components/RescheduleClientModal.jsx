import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // Reutilizamos los estilos del calendario
import { supabase } from '../supabaseClient';
import Spinner from './Spinner';
import toast from 'react-hot-toast';

function RescheduleClientModal({ appointment, onClose, onRescheduleSuccess }) {
  const [date, setDate] = useState(new Date(appointment.start_time));
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Calculamos la duración de la cita original para buscar nuevos espacios
  const appointmentDuration = useMemo(() => {
    const start = new Date(appointment.start_time);
    const end = new Date(appointment.end_time);
    return (end - start) / (1000 * 60); // Duración en minutos
  }, [appointment.start_time, appointment.end_time]);

  const fetchAvailableSlots = useCallback(async (selectedDate) => {
    setLoading(true);
    setSelectedSlot(null);
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    
    // Usamos la misma función que en la página principal para encontrar huecos
    const { data: slots, error } = await supabase.rpc('get_available_slots_final', {
      p_selected_date: selectedDateStr,
      p_service_duration_mins: appointmentDuration
    });

    if (error) {
      toast.error("Hubo un problema al buscar nuevos horarios.");
      setAvailableSlots([]);
    } else {
      setAvailableSlots(slots || []);
    }
    setLoading(false);
  }, [appointmentDuration]);

  useEffect(() => {
    fetchAvailableSlots(date);
  }, [date, fetchAvailableSlots]);
  
  const handleDateChange = (newDate) => {
    setDate(newDate);
  };
  
  const handleSave = async () => {
    if (!selectedSlot) {
      toast.error("Por favor, selecciona un nuevo horario.");
      return;
    }
    
    setLoading(true);
    const newStartTime = new Date(selectedSlot);
    const newEndTime = new Date(newStartTime.getTime() + appointmentDuration * 60000);

    const { error } = await supabase
      .from('appointments')
      .update({ 
        start_time: newStartTime.toISOString(), 
        end_time: newEndTime.toISOString() 
      })
      .eq('id', appointment.id);

    if (error) {
      toast.error("No se pudo reprogramar la cita. Inténtalo de nuevo.");
      console.error(error);
    } else {
      toast.success("¡Tu cita ha sido reprogramada con éxito!");
      onRescheduleSuccess(); // Llamamos a la función para cerrar y refrescar
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4 animate-fade-in">
      <div className="card-bg p-6 sm:p-8 rounded-lg w-full max-w-4xl shadow-xl relative max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-4xl text-text-soft dark:text-text-medium hover:text-text-dark dark:hover:text-text-light transition-colors"
          aria-label="Cerrar modal"
        >
          &times;
        </button>

        <h3 className="text-2xl sm:text-3xl font-serif text-center mb-1 text-brand-gold">Reprogramar Cita</h3>
        <p className="text-center text-text-soft dark:text-text-medium mb-6">Elige una nueva fecha y hora para tu cita.</p>
        
        <div className="flex-grow overflow-y-auto pr-2">
            <div className="flex flex-col lg:flex-row gap-8 mt-2">
                <div className="flex-1">
                <Calendar 
                    onChange={handleDateChange} 
                    value={date} 
                    minDate={new Date()} 
                />
                </div>
                <div className="flex-1">
                <h4 className="text-xl font-serif mb-4 text-center lg:text-left">
                    Horarios para {date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h4>
                {loading ? <Spinner /> : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {availableSlots.length > 0 ? (
                        availableSlots.map((slot) => {
                        const slotTime = new Date(slot.available_slot).toLocaleTimeString('es-ES', { hour: 'numeric', minute: '2-digit', hour12: true });
                        const isSelected = selectedSlot === slot.available_slot;
                        return (
                            <button 
                            key={slot.available_slot} 
                            onClick={() => setSelectedSlot(slot.available_slot)}
                            className={`p-2 border-2 rounded-md text-center font-semibold transition-colors duration-200 ${ isSelected ? 'bg-brand-gold text-dark-primary border-brand-gold' : 'border-gray-300 dark:border-gray-600 text-text-dark dark:text-text-light hover:border-brand-gold hover:text-brand-gold'}`}
                            >
                            {slotTime}
                            </button>
                        )
                        })
                    ) : (
                        <div className="col-span-full text-center text-text-soft dark:text-text-medium card-bg p-4 rounded-lg">
                            <p>No hay horarios disponibles para la duración de tu cita en este día.</p>
                        </div>
                    )}
                    </div>
                )}
                </div>
            </div>
        </div>
        
        <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button onClick={onClose} className="btn-secondary">
                Cancelar
            </button>
            <button onClick={handleSave} disabled={!selectedSlot || loading} className="btn-primary flex-grow sm:flex-grow-0">
                {loading ? 'Guardando...' : 'Confirmar Nuevo Horario'}
            </button>
        </div>

      </div>
    </div>
  );
}

export default RescheduleClientModal;