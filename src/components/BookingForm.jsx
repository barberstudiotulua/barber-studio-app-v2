import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

function BookingForm({ selectedServices, totalPrice, totalDuration, numberOfPeople, timeSlot, onBookingSuccess, onClose }) {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const capitalizeName = (name) => {
    if (!name) return '';
    return name.replace(/\b(\w)/g, s => s.toUpperCase());
  };
  
  const handleFullNameChange = (e) => {
    setFullName(capitalizeName(e.target.value));
  };
  
  const handlePhoneNumberChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^[0-9\b]+$/.test(value)) {
      setPhoneNumber(value);
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !phoneNumber.trim()) {
      toast.error('Por favor, completa tu nombre y número de teléfono.');
      return;
    }
    setLoading(true);

    // Creamos una variable para guardar el ID del cliente
    let bookingClientId = null;

    const bookingPromise = new Promise(async (resolve, reject) => {
      try {
        let { data: client } = await supabase.from('clients').select('id').eq('phone_number', phoneNumber).single();
        if (!client) {
          const { data: newClient, error } = await supabase.from('clients').insert({ full_name: fullName, phone_number: phoneNumber }).select('id').single();
          if (error) throw error;
          client = newClient;
        }

        // Guardamos el ID del cliente aquí
        bookingClientId = client.id;

        const startTime = new Date(timeSlot);
        const endTime = new Date(startTime.getTime() + totalDuration * 60000);
        
        const servicesDescription = selectedServices.map(s => s.name).join(', ');
        const notes = `${numberOfPeople} persona(s): ${servicesDescription}`;
        
        const { error } = await supabase.from('appointments').insert({
            client_id: client.id,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            notes: notes,
            status: 'Pendiente' // Aseguramos que el estado por defecto se guarde
        });
        if (error) throw error;
        resolve();
      } catch (error) {
        console.error('Booking Error:', error);
        reject(error);
      }
    });

    toast.promise(bookingPromise, {
      loading: 'Agendando tu cita...',
      success: '¡Cita confirmada! Te esperamos.',
      error: 'Hubo un error al agendar. Intenta de nuevo.'
    })
    // --- ESTE ES EL ÚNICO CAMBIO IMPORTANTE ---
    // Al tener éxito, llamamos a onBookingSuccess y le pasamos el ID del cliente
    .then(() => onBookingSuccess(bookingClientId))
    .catch(() => setLoading(false));
  };

  const startTimeFormatted = new Date(timeSlot).toLocaleString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit', hour12: true });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="card-bg p-6 sm:p-8 rounded-lg w-full max-w-lg shadow-xl relative animate-fade-in-up">
        <button
            onClick={onClose}
            className="absolute top-3 right-3 text-4xl text-text-soft dark:text-text-medium hover:text-text-dark dark:hover:text-text-light transition-colors"
            aria-label="Cerrar modal"
        >
            &times;
        </button>

        <h3 className="text-2xl sm:text-3xl font-serif text-center mb-6">3. Confirma tus Datos</h3>
        
        <div className="mb-6 p-4 border border-brand-gold rounded-md bg-light-primary dark:bg-dark-primary">
            <p><span className="font-semibold text-text-soft dark:text-text-medium">Servicios:</span> {selectedServices.map(s => s.name).join(', ')}</p>
            <p><span className="font-semibold text-text-soft dark:text-text-medium">Fecha:</span> {startTimeFormatted}</p>
            <p className="font-bold text-lg mt-2"><span className="font-semibold text-text-soft dark:text-text-medium">Precio Total:</span> <span className="text-brand-gold">${totalPrice.toFixed(2)}</span></p>
        </div>
        
        <form onSubmit={handleBooking}>
          <div className="mb-4">
            <label htmlFor="fullName" className="block mb-2 font-medium text-text-soft dark:text-text-medium">Nombre Completo</label>
            <input 
              type="text" 
              id="fullName" 
              value={fullName} 
              onChange={handleFullNameChange}
              className="input-primary" 
              placeholder="Tu nombre y apellido" 
              required 
            />
          </div>
          <div className="mb-6">
            <label htmlFor="phoneNumber" className="block mb-2 font-medium text-text-soft dark:text-text-medium">Número de Teléfono</label>
            <input 
              type="tel"
              inputMode="numeric"
              id="phoneNumber" 
              value={phoneNumber} 
              onChange={handlePhoneNumberChange}
              className="input-primary" 
              placeholder="Ej: 3001234567" 
              required 
              maxLength="15"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Confirmando...' : 'Confirmar Cita'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default BookingForm;