import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { supabase } from '../../supabaseClient';
import Spinner from '../Spinner';

function RescheduleModal({ appointment, onClose, onSave }) {
  const [newDate, setNewDate] = useState(new Date(appointment.start_time));
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slotInterval, setSlotInterval] = useState(60); // Asumimos 60 por defecto

  // Efecto para cargar los horarios disponibles cuando cambia la fecha
  useEffect(() => {
    async function fetchSettingsAndSlots() {
      setLoadingSlots(true);
      setSelectedSlot(null); // Limpiamos la selección anterior
      
      const { data: setting } = await supabase.from('settings').select('value').eq('key', 'slot_interval_minutes').single();
      const currentInterval = setting ? parseInt(setting.value, 10) : 60;
      setSlotInterval(currentInterval);

      const selectedDateStr = newDate.toISOString().split('T')[0];
      const { data, error } = await supabase.rpc('get_available_slots', {
        p_selected_date: selectedDateStr,
        p_slot_interval_mins: currentInterval
      });

      if (error) {
        console.error("Error fetching slots for reschedule:", error);
        setAvailableSlots([]);
      } else {
        // Añadimos el horario original de la cita, por si queremos moverla solo unos minutos en el mismo día
        const originalSlot = { available_slot: appointment.start_time };
        const combinedSlots = [...data, originalSlot].sort((a, b) => new Date(a.available_slot) - new Date(b.available_slot));
        // Quitamos duplicados
        const uniqueSlots = Array.from(new Set(combinedSlots.map(s => s.available_slot))).map(time => ({ available_slot: time }));
        setAvailableSlots(uniqueSlots);
      }
      setLoadingSlots(false);
    }
    fetchSettingsAndSlots();
  }, [newDate, appointment.start_time]);

  const handleSave = () => {
    if (!selectedSlot) {
      alert("Por favor, selecciona un nuevo horario.");
      return;
    }
    onSave(new Date(selectedSlot));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="bg-light-bg p-8 rounded-lg w-full max-w-3xl shadow-xl border border-gray-700">
        <h3 className="text-2xl font-serif mb-6">Reprogramar Cita para <span className="text-brand-gold">{appointment.clients?.full_name}</span></h3>
        <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
                <Calendar onChange={setNewDate} value={newDate} minDate={new Date()} />
            </div>
            <div className="flex-1">
                <h4 className="text-xl font-serif mb-4">Horarios Disponibles</h4>
                {loadingSlots ? <Spinner /> : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-64 overflow-y-auto pr-2">
                    {availableSlots.length > 0 ? (
                      availableSlots.map(slot => {
                        const slotTime = new Date(slot.available_slot).toLocaleTimeString('es-ES', { hour: 'numeric', minute: '2-digit', hour12: true });
                        const isSelected = selectedSlot === slot.available_slot;
                        return (
                          <button
                            key={slot.available_slot}
                            onClick={() => setSelectedSlot(slot.available_slot)}
                            className={`p-2 border-2 rounded-md text-center font-semibold transition-colors duration-200 ${isSelected ? 'bg-brand-gold text-dark-bg border-brand-gold' : 'border-gray-600 text-light-text hover:border-brand-gold hover:text-brand-gold'}`}
                          >
                            {slotTime}
                          </button>
                        );
                      })
                    ) : (
                      <p className="col-span-full text-medium-text">No hay horarios libres este día.</p>
                    )}
                  </div>
                )}
            </div>
        </div>
        <div className="flex justify-end gap-4 mt-8 border-t border-gray-700 pt-6">
          <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700 py-2 px-4 rounded text-white font-bold transition-colors">Cancelar</button>
          <button type="button" onClick={handleSave} disabled={!selectedSlot || loadingSlots} className="bg-brand-gold hover:opacity-90 py-2 px-4 rounded text-dark-bg font-bold transition-opacity disabled:bg-yellow-800 disabled:cursor-not-allowed">
            Guardar Nuevo Horario
          </button>
        </div>
      </div>
    </div>
  );
}

export default RescheduleModal;