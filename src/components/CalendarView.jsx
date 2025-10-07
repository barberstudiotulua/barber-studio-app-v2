import React, { useState, useEffect, useCallback } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { supabase } from '../supabaseClient';
import Spinner from './Spinner';
import toast from 'react-hot-toast';

function CalendarView({ numberOfPeople, onSlotSelect, selectedTimeSlot }) {
  const [date, setDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const fetchAndFilterSlots = useCallback(async (selectedDate, peopleCount) => {
    setLoading(true);

    const selectedDateStr = selectedDate.toISOString().split('T')[0];

    // 1. Obtenemos la duración de la cita que TÚ configuraste en el panel.
    const { data: setting, error: settingError } = await supabase.from('settings').select('value').eq('key', 'slot_interval_minutes').single();
    if (settingError) {
      toast.error("No se pudo leer la duración de la cita.");
      setLoading(false);
      return;
    }
    const currentDuration = setting ? parseInt(setting.value, 10) : 60;
    
    // 2. Pedimos a la base de datos TODOS los bloques individuales disponibles.
    const { data: slots, error } = await supabase.rpc('get_available_slots_final', {
      p_selected_date: selectedDateStr
    });
    
    if (error) {
      toast.error("Hubo un problema al buscar horarios.");
      setAvailableSlots([]);
    } else {
        // 3. Filtramos los bloques si se necesita más de uno.
        if (peopleCount > 1 && slots && slots.length > 0) {
            const filteredSlots = [];
            for (let i = 0; i <= slots.length - peopleCount; i++) {
                let isBlockContinuous = true;
                const firstSlotTime = new Date(slots[i].available_slot).getTime();
                for (let j = 1; j < peopleCount; j++) {
                    const nextSlotTime = new Date(slots[i + j].available_slot).getTime();
                    
                    // === ESTA ES LA LÍNEA QUE CORREGÍ ===
                    // Antes decía "60 * 60 * 1000", ahora usa la duración correcta de tu panel.
                    if (nextSlotTime - firstSlotTime !== (currentDuration * 60 * 1000 * j)) {
                        isBlockContinuous = false;
                        break;
                    }
                }
                if (isBlockContinuous) {
                    filteredSlots.push(slots[i]);
                }
            }
            setAvailableSlots(filteredSlots);
        } else {
            setAvailableSlots(slots || []);
        }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAndFilterSlots(date, numberOfPeople);
  }, [date, numberOfPeople, fetchAndFilterSlots]);

  const handleDateChange = (newDate) => {
    setDate(newDate);
    onSlotSelect(null);
  };

  return (
    <div className="my-12">
      <h3 className="text-2xl sm:text-3xl font-serif text-center mb-6">2. Elige un Horario Disponible</h3>
      <div className="flex flex-col lg:flex-row gap-8 mt-8">
        <div className="flex-1">
          <Calendar onChange={handleDateChange} value={date} minDate={new Date()} />
        </div>
        <div className="flex-1">
          <h4 className="text-xl font-serif mb-4 text-center lg:text-left">
            Horarios para {date.toLocaleString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
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
                    <p>No hay bloques de tiempo continuos disponibles para {numberOfPeople} persona(s) en este día.</p>
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