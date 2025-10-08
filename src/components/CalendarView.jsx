import React, { useState, useEffect, useCallback } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { supabase } from '../supabaseClient';
import Spinner from './Spinner';
import toast from 'react-hot-toast';

// El componente recibe la duración total que necesita buscar
function CalendarView({ totalServiceDuration, onSlotSelect, selectedTimeSlot }) {
  const [date, setDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  // Esta función se activa si cambia el día O la duración total necesaria
  const fetchAvailableSlots = useCallback(async (selectedDate, durationNeeded) => {
    if (!durationNeeded || durationNeeded === 0) {
      setAvailableSlots([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);

    const selectedDateStr = selectedDate.toISOString().split('T')[0];

    // Llamamos a la función en Supabase, pasándole la duración total que calculamos antes
    const { data: slots, error } = await supabase.rpc('get_available_slots_final', {
      p_selected_date: selectedDateStr,
      p_service_duration_mins: durationNeeded
    });

    if (error) {
      console.error('Error fetching slots:', error.message);
      toast.error("Hubo un problema al buscar horarios. Intenta de nuevo.");
      setAvailableSlots([]);
    } else {
      setAvailableSlots(slots || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAvailableSlots(date, totalServiceDuration);
  }, [date, totalServiceDuration, fetchAvailableSlots]);

  const handleDateChange = (newDate) => {
    setDate(newDate);
    onSlotSelect(null);
  };

  return (
    <div className="my-12">
      <h3 className="text-2xl sm:text-3xl font-serif text-center mb-6">2. Elige un Horario Disponible</h3>
      <div className="flex flex-col lg:flex-row gap-8 mt-8">
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
                    <p>No hay bloques de tiempo continuos disponibles para esta duración en este día.</p>
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