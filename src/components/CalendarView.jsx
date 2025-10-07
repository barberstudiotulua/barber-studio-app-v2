import React, { useState, useEffect, useCallback } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { supabase } from '../../supabaseClient';
import Spinner from './Spinner';

function CalendarView({ totalServiceDuration, slotInterval, onSlotSelect, selectedTimeSlot }) {
  const [date, setDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  // Usamos useCallback para que la función no se recree en cada renderizado
  const fetchAvailableSlots = useCallback(async (selectedDate) => {
    // Si no hay duración de servicio, no hay nada que buscar.
    if (!totalServiceDuration || totalServiceDuration === 0) {
      setAvailableSlots([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);

    const selectedDateStr = selectedDate.toISOString().split('T')[0];

    // --- CAMBIO CLAVE ---
    // Ahora llamamos a nuestra nueva función inteligente: 'get_slots_for_duration'
    // Le pasamos la fecha, la duración TOTAL de la cita y el intervalo.
    const { data: slots, error } = await supabase.rpc('get_slots_for_duration', {
      p_selected_date: selectedDateStr,
      p_service_duration_mins: totalServiceDuration,
      p_slot_interval_mins: slotInterval
    });

    if (error) {
      console.error('Error fetching slots:', error.message);
      setAvailableSlots([]);
    } else {
      // Como la base de datos ya hizo todo el trabajo difícil,
      // simplemente mostramos los resultados que nos dio.
      setAvailableSlots(slots || []);
    }
    setLoading(false);
  }, [totalServiceDuration, slotInterval]); // Dependencias de la función

  // useEffect se encarga de llamar a la función cuando cambia la fecha
  useEffect(() => {
    fetchAvailableSlots(date);
  }, [date, fetchAvailableSlots]);

  return (
    <div className="my-12">
      <h3 className="text-2xl sm:text-3xl font-serif text-center mb-6">2. Elige un Horario Disponible</h3>
      <div className="flex flex-col lg:flex-row gap-8 mt-8">
        <div className="flex-1">
          <Calendar 
            onChange={(newDate) => {
              setDate(newDate);
              onSlotSelect(null); // Deselecciona el horario si cambia el día
            }} 
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
                  const isSelected = selectedTimeSlot === slot.available_slot;
                  return (
                    <button 
                      key={slot.available_slot} 
                      onClick={() => onSlotSelect(slot.available_slot)}
                      className={`p-2 border-2 rounded-md text-center font-semibold transition-colors duration-200 ${ isSelected ? 'bg-brand-gold text-dark-primary border-brand-gold' : 'border-gray-300 dark:border-gray-600 text-text-dark dark:text-text-light hover:border-brand-gold hover:text-brand-gold'}`}
                    >
                      {slotTime}
                    </button>
                  )
                })
              ) : (
                <div className="col-span-full text-center text-text-soft dark:text-text-medium card-bg p-4 rounded-lg">
                    <p>No hay horarios disponibles con una duración de {totalServiceDuration} minutos para este día.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CalendarView;