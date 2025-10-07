import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';
import Spinner from '../Spinner';

const ManualBookingModal = ({ onClose, onBookingSuccess }) => {
  // Estados para el formulario
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [appointmentDate, setAppointmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [appointmentTime, setAppointmentTime] = useState('10:00');
  const [notes, setNotes] = useState('');

  // Estados para cargar datos
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Cargar clientes y servicios al abrir el modal
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: clientsData, error: clientsError } = await supabase.from('clients').select('id, full_name').order('full_name');
      const { data: servicesData, error: servicesError } = await supabase.from('services').select('*').eq('is_active', true).order('name');
      
      if (clientsError || servicesError) {
        toast.error('No se pudieron cargar los datos para agendar.');
        onClose();
      } else {
        setClients(clientsData);
        setServices(servicesData);
      }
      setLoading(false);
    };
    fetchData();
  }, [onClose]);

  // Lógica para seleccionar/deseleccionar servicios
  const handleServiceToggle = (service) => {
    setSelectedServices(prev => 
      prev.some(s => s.id === service.id) 
        ? prev.filter(s => s.id !== service.id) 
        : [...prev, service]
    );
  };

  // Calcular duración y precio total
  const totalDuration = useMemo(() => {
    if (selectedServices.length === 0) return 0;
    const singleDuration = selectedServices.reduce((acc, s) => acc + s.duration_minutes, 0);
    return singleDuration * numberOfPeople;
  }, [selectedServices, numberOfPeople]);

  const totalPrice = useMemo(() => {
    if (selectedServices.length === 0) return 0;
    const singlePrice = selectedServices.reduce((acc, s) => acc + s.price, 0);
    return singlePrice * numberOfPeople;
  }, [selectedServices, numberOfPeople]);


  // Lógica para guardar la cita
  const handleSaveAppointment = async (e) => {
    e.preventDefault();
    if (!selectedClientId) {
      toast.error('Debes seleccionar un cliente.');
      return;
    }
    if (selectedServices.length === 0) {
      toast.error('Debes seleccionar al menos un servicio.');
      return;
    }

    setSaving(true);
    
    // Combinar fecha y hora para obtener el start_time
    const [year, month, day] = appointmentDate.split('-');
    const [hours, minutes] = appointmentTime.split(':');
    const startTime = new Date(year, month - 1, day, hours, minutes);
    const endTime = new Date(startTime.getTime() + totalDuration * 60000);

    // --- NUEVO: VALIDACIÓN DE HORARIO ANTES DE GUARDAR ---
    // Buscamos si ya existe una cita que se cruce con el nuevo horario
    const { count, error: conflictError } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      // Un conflicto existe si una cita empieza ANTES de que la nuestra TERMINE...
      .lt('start_time', endTime.toISOString())
      // ...Y termina DESPUÉS de que la nuestra EMPIECE.
      .gt('end_time', startTime.toISOString());

    if (conflictError) {
      toast.error("Error al verificar el horario. Intenta de nuevo.");
      setSaving(false);
      return;
    }

    if (count > 0) {
      toast.error("El horario seleccionado ya está ocupado o se cruza con otra cita.");
      setSaving(false);
      return;
    }
    // --- FIN DE LA VALIDACIÓN ---

    // Crear la descripción para las notas
    const servicesDescription = selectedServices.map(s => s.name).join(', ');
    const finalNotes = `${numberOfPeople} persona(s): ${servicesDescription}. ${notes}`;

    const { error } = await supabase.from('appointments').insert({
      client_id: selectedClientId,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      notes: finalNotes,
    });

    if (error) {
      toast.error(`Error al agendar la cita: ${error.message}`);
    } else {
      toast.success('¡Cita agendada con éxito!');
      onBookingSuccess();
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="bg-dark-secondary p-8 rounded-lg w-full max-w-2xl shadow-xl border border-gray-700 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-serif text-brand-gold">Agendar Nueva Cita</h3>
          <button onClick={onClose} className="text-4xl text-text-medium hover:text-text-light">&times;</button>
        </div>

        {loading ? <Spinner /> : (
          <form onSubmit={handleSaveAppointment} className="overflow-y-auto space-y-6 pr-2">
            <div>
              <label htmlFor="client" className="block mb-2 font-medium text-text-medium">Cliente</label>
              <select id="client" value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} className="input-primary" required>
                <option value="" disabled>Selecciona un cliente...</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.full_name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block mb-2 font-medium text-text-medium">Servicios</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 bg-dark-primary rounded-md">
                {services.map(service => {
                  const isSelected = selectedServices.some(s => s.id === service.id);
                  return (
                    <button key={service.id} type="button" onClick={() => handleServiceToggle(service)} className={`p-2 text-sm rounded transition-colors text-left ${isSelected ? 'bg-brand-gold text-dark-primary font-bold' : 'bg-gray-700 hover:bg-gray-600'}`}>
                      {service.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="people" className="block mb-2 font-medium text-text-medium">Personas</label>
                <select id="people" value={numberOfPeople} onChange={e => setNumberOfPeople(Number(e.target.value))} className="input-primary">
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                </select>
              </div>
              <div>
                <label htmlFor="date" className="block mb-2 font-medium text-text-medium">Fecha</label>
                <input type="date" id="date" value={appointmentDate} onChange={e => setAppointmentDate(e.target.value)} className="input-primary" required />
              </div>
              <div>
                <label htmlFor="time" className="block mb-2 font-medium text-text-medium">Hora</label>
                <input type="time" id="time" value={appointmentTime} onChange={e => setAppointmentTime(e.target.value)} className="input-primary" required />
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block mb-2 font-medium text-text-medium">Notas Adicionales (opcional)</label>
              <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows="2" className="input-primary"></textarea>
            </div>

            {selectedServices.length > 0 && (
              <div className="p-4 rounded-md bg-dark-primary border border-gray-700 text-sm">
                <p><strong>Resumen:</strong></p>
                <p>Duración total estimada: <span className="font-bold">{totalDuration} min</span></p>
                <p>Precio total: <span className="font-bold text-brand-gold">${totalPrice.toFixed(2)}</span></p>
              </div>
            )}

            <div className="flex justify-end gap-4 pt-4 mt-auto">
              <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
              <button type="submit" disabled={saving} className="bg-brand-gold hover:opacity-90 py-2 px-4 rounded text-dark-primary font-bold disabled:bg-yellow-800 disabled:cursor-wait">
                {saving ? 'Guardando...' : 'Guardar Cita'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ManualBookingModal;