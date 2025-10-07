import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';
import Spinner from '../Spinner';
import Calendar from 'react-calendar';

const BlockTimeModal = ({ onClose }) => {
  const [blockType, setBlockType] = useState('quick');
  const [loading, setLoading] = useState(false);
  const [quickSelectedDate, setQuickSelectedDate] = useState(new Date());
  const [dailySchedule, setDailySchedule] = useState([]);
  const [selectedSlotsToBlock, setSelectedSlotsToBlock] = useState([]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [blockFullDay, setBlockFullDay] = useState(false);

  const fetchDailySchedule = useCallback(async (date) => {
    setLoading(true);
    setSelectedSlotsToBlock([]);
    
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    const dateStrForRpc = startOfDay.toISOString().split('T')[0];
    
    const { data: setting } = await supabase.from('settings').select('value').eq('key', 'slot_interval_minutes').single();
    const interval = setting ? parseInt(setting.value, 10) : 60;

    const { data: slots, error: slotsError } = await supabase.rpc('get_available_slots', { p_selected_date: dateStrForRpc, p_slot_interval_mins: interval });
    
    const { data: appointments, error: apptError } = await supabase
        .from('appointments')
        .select('*, clients(full_name)')
        .gte('start_time', startOfDay.toISOString())
        .lt('end_time', endOfDay.toISOString())
        .order('start_time');

    if (slotsError || apptError) {
      toast.error("No se pudo cargar el horario del día.");
      setDailySchedule([]);
    } else {
      const combined = [...slots.map(s => ({ time: s.available_slot, type: 'free' })), ...appointments.map(a => ({ time: a.start_time, type: 'booked', data: a }))].sort((a, b) => new Date(a.time) - new Date(b.time));
      const uniqueSchedule = combined.filter((item, index, self) => index === self.findIndex((t) => (t.time === item.time)));
      setDailySchedule(uniqueSchedule);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (blockType === 'quick') {
      fetchDailySchedule(quickSelectedDate);
    }
  }, [blockType, quickSelectedDate, fetchDailySchedule]);

  const handleSlotToggle = (slotTime) => {
    setSelectedSlotsToBlock(prev => prev.includes(slotTime) ? prev.filter(s => s !== slotTime) : [...prev, slotTime]);
  };
  
  const handleCancelAppointment = async (apptId) => {
    if (window.confirm("¿Seguro que quieres cancelar esta cita?")) {
        await supabase.from('appointments').delete().eq('id', apptId);
        toast.success("Cita cancelada.");
        fetchDailySchedule(quickSelectedDate);
    }
  };

  const handleBlockSubmit = async () => {
    setLoading(true);
    let rpcError = null;
    let insertError = null;

    if (blockFullDay) {
        const { error } = await supabase.rpc('create_full_day_blocks', { p_start_date: startDate, p_end_date: endDate });
        rpcError = error;
    } else if (blockType === 'quick') {
        if (selectedSlotsToBlock.length === 0) { toast.error("Selecciona al menos un horario."); setLoading(false); return; }
        const { data: setting } = await supabase.from('settings').select('value').eq('key', 'slot_interval_minutes').single();
        const interval = setting ? parseInt(setting.value, 10) : 60;
        const inserts = selectedSlotsToBlock.map(slot => ({ start_time: new Date(slot), end_time: new Date(new Date(slot).getTime() + interval * 60000), is_personal_block: true, notes: 'Bloqueo Rápido' }));
        const { error } = await supabase.from('appointments').insert(inserts);
        insertError = error;
    } else {
        if (startTime >= endTime) { toast.error("La hora de fin debe ser posterior."); setLoading(false); return; }
        let inserts = [];
        let currentDate = new Date(startDate);
        let finalDate = new Date(endDate);
        
        while (currentDate <= finalDate) {
            const [startH, startM] = startTime.split(':');
            const [endH, endM] = endTime.split(':');
            
            const start = new Date(currentDate);
            start.setUTCHours(parseInt(startH), parseInt(startM), 0, 0);

            const end = new Date(currentDate);
            end.setUTCHours(parseInt(endH), parseInt(endM), 0, 0);

            inserts.push({ start_time: start.toISOString(), end_time: end.toISOString(), is_personal_block: true, notes: 'Bloqueo Personal' });
            
            currentDate.setDate(currentDate.getDate() + 1);
        }

        if (inserts.length > 0) {
            const { error } = await supabase.from('appointments').insert(inserts);
            insertError = error;
        }
    }
    if (rpcError || insertError) {
      toast.error(`Error: ${rpcError?.message || insertError?.message}`);
    } else {
      toast.success("¡Horarios bloqueados!");
      onClose();
    }
    setLoading(false);
  };

  const renderContent = () => {
    switch(blockType) {
      case 'quick':
        return (
          <div className="flex flex-col md:flex-row gap-8 h-full">
            <div className="md:w-1/3">
              <Calendar onChange={setQuickSelectedDate} value={quickSelectedDate} />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-serif mb-4">Agenda para el {quickSelectedDate.toLocaleDateString('es-ES', {day: 'numeric', month: 'long'})}</h3>
              {loading ? <Spinner /> : (
                <div className="space-y-2 max-h-[60vh] md:max-h-full overflow-y-auto pr-2">
                  {dailySchedule.length > 0 ? dailySchedule.map(({ time, type, data }) => (
                    type === 'free' ? (
                      <div key={time} className="flex items-center justify-between bg-dark-primary p-2 rounded">
                        <span className="text-text-medium">{new Date(time).toLocaleTimeString('es-ES', { hour: 'numeric', minute: '2-digit', hour12: true })} - Libre</span>
                        <button onClick={() => handleSlotToggle(time)} className={`px-3 py-1 text-sm font-bold rounded ${selectedSlotsToBlock.includes(time) ? 'bg-red-500 text-white' : 'bg-gray-600'}`}>
                          {selectedSlotsToBlock.includes(time) ? 'Quitar' : 'Bloquear'}
                        </button>
                      </div>
                    ) : (
                      <div key={data.id} className={`flex items-center justify-between p-2 rounded border-l-4 ${data.is_personal_block ? 'bg-red-900/20 border-red-500' : 'bg-brand-gold/10 border-brand-gold'}`}>
                        <div>
                          <p className="font-bold text-text-light">{new Date(time).toLocaleTimeString('es-ES', { hour: 'numeric', minute: '2-digit', hour12: true })} - {data.clients?.full_name || 'Bloqueo'}</p>
                          <p className="text-xs text-text-medium">{data.notes}</p>
                        </div>
                        <button onClick={() => handleCancelAppointment(data.id)} className="text-red-400 hover:underline text-sm font-semibold">Cancelar</button>
                      </div>
                    )
                  )) : <p className="text-text-medium">No hay actividad para este día.</p>}
                </div>
              )}
            </div>
          </div>
        );
      case 'range':
      case 'recurrent':
        return (
          <div className="max-w-xl mx-auto">
            <h3 className="text-xl font-serif mb-4">{blockType === 'range' ? 'Bloquear un rango de horas en un día' : 'Bloquear el mismo horario durante varios días'}</h3>
            <div className="space-y-4">
              {blockType === 'recurrent' && (
                <div className="flex gap-4">
                  <div className="flex-1"><label className="block mb-1 text-text-medium">Desde</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input-primary"/></div>
                  <div className="flex-1"><label className="block mb-1 text-text-medium">Hasta</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input-primary"/></div>
                </div>
              )}
              {blockType === 'range' && (
                <div><label className="block mb-1 text-text-medium">Día</label><input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setEndDate(e.target.value); }} className="input-primary"/></div>
              )}
              <div className="p-3 bg-dark-primary rounded-lg mt-4">
                <label className="flex items-center gap-3 font-semibold text-lg"><input type="checkbox" checked={blockFullDay} onChange={e => setBlockFullDay(e.target.checked)} className="h-5 w-5 rounded bg-gray-700"/>Bloquear todo el día</label>
              </div>
              {!blockFullDay && (
                <div className="flex gap-4 pt-4">
                  <div className="flex-1"><label className="block mb-1 text-text-medium">Desde las</label><input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="input-primary"/></div>
                  <div className="flex-1"><label className="block mb-1 text-text-medium">Hasta las</label><input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="input-primary"/></div>
                </div>
              )}
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    // <!-- Contenedor exterior para el fondo semitransparente y centrado -->
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      {/* <!-- Contenedor del modal con el contenido y el color de fondo oscuro --> */}
      <div className="bg-dark-secondary rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col p-6">
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 className="text-3xl font-serif text-brand-gold">Bloquear Tiempo</h2>
          <button onClick={onClose} className="text-4xl text-text-medium hover:text-text-light">&times;</button>
        </div>
        <div className="bg-dark-secondary rounded-lg p-4 flex flex-col sm:flex-row gap-2 mb-6 flex-shrink-0">
          <button onClick={() => setBlockType('quick')} className={`flex-1 p-3 font-bold rounded ${blockType === 'quick' ? 'bg-brand-gold text-dark-primary' : 'bg-gray-700'}`}>Gestor de Día</button>
          <button onClick={() => setBlockType('range')} className={`flex-1 p-3 font-bold rounded ${blockType === 'range' ? 'bg-brand-gold text-dark-primary' : 'bg-gray-700'}`}>Por Horas</button>
          <button onClick={() => setBlockType('recurrent')} className={`flex-1 p-3 font-bold rounded ${blockType === 'recurrent' ? 'bg-brand-gold text-dark-primary' : 'bg-gray-700'}`}>Por Días</button>
        </div>
        <div className="flex-grow bg-dark-secondary rounded-lg p-6 overflow-y-auto">
          {renderContent()}
        </div>
        <div className="mt-6 flex-shrink-0">
          <button onClick={handleBlockSubmit} disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-lg py-4 rounded disabled:bg-gray-500">
            {loading ? 'Bloqueando...' : 'Confirmar Bloqueo'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlockTimeModal;