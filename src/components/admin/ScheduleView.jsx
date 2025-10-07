import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';
import Spinner from '../Spinner';
import BlockTimeModal from './BlockTimeModal';

const daysOfWeek = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function ScheduleView() {
  const [schedules, setSchedules] = useState([]);
  const [slotInterval, setSlotInterval] = useState('60');
  const [loading, setLoading] = useState(true);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);

  useEffect(() => { fetchData(); }, []);
  async function fetchData() {
    setLoading(true);
    const p1 = supabase.from('work_schedules').select('*').order('day_of_week');
    const p2 = supabase.from('settings').select('value').eq('key', 'slot_interval_minutes').single();
    const [{ data: scheduleData, error: scheduleError }, { data: settingsData, error: settingsError }] = await Promise.all([p1, p2]);
    if (scheduleError || settingsError) toast.error("Error al cargar.");
    else { setSchedules(scheduleData); setSlotInterval(settingsData.value); }
    setLoading(false);
  }
  const handleScheduleChange = (dayIndex, field, value) => { const newSchedules = [...schedules]; newSchedules[dayIndex][field] = value; setSchedules(newSchedules); };
  const handleSaveChanges = async () => {
    const scheduleUpdates = schedules.map(sch => supabase.from('work_schedules').update({ start_time: sch.start_time, end_time: sch.end_time, is_work_day: sch.is_work_day }).eq('day_of_week', sch.day_of_week));
    const settingsUpdate = supabase.from('settings').update({ value: slotInterval }).eq('key', 'slot_interval_minutes');
    toast.promise(Promise.all([...scheduleUpdates, settingsUpdate]), { loading: 'Guardando...', success: '¡Guardado!', error: 'Error.' });
  };

  return (
    <>
      <div className="p-4 bg-light-bg rounded-lg shadow-xl">
        <h2 className="text-3xl font-serif mb-6">Configuración de Agenda</h2>
        {loading ? <Spinner /> : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div><h3 className="text-2xl font-serif mb-4">Duración por Cita</h3><div className="p-4 bg-dark-bg rounded-lg"><select id="slotInterval" value={slotInterval} onChange={e => setSlotInterval(e.target.value)} className="w-full p-2 bg-gray-700 rounded-md border-2 border-gray-600 focus:ring-brand-gold focus:border-brand-gold"><option value="15">15 min</option><option value="20">20 min</option><option value="30">30 min</option><option value="45">45 min</option><option value="60">60 min</option></select></div></div>
              <div><h3 className="text-2xl font-serif mb-4">Horario Semanal</h3><div className="space-y-4">{schedules.map((schedule, index) => (<div key={schedule.day_of_week} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-3 bg-dark-bg rounded-lg"><label className="flex items-center gap-3 font-semibold"><input type="checkbox" checked={schedule.is_work_day} onChange={e => handleScheduleChange(index, 'is_work_day', e.target.checked)} className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-brand-gold focus:ring-brand-gold"/>{daysOfWeek[schedule.day_of_week]}</label><input type="time" value={schedule.start_time || ''} onChange={e => handleScheduleChange(index, 'start_time', e.target.value)} disabled={!schedule.is_work_day} className="input-primary disabled:opacity-50"/><input type="time" value={schedule.end_time || ''} onChange={e => handleScheduleChange(index, 'end_time', e.target.value)} disabled={!schedule.is_work_day} className="input-primary disabled:opacity-50"/></div>))}</div></div>
              <button onClick={handleSaveChanges} className="w-full mt-2 bg-brand-gold text-dark-bg font-bold py-3 px-4 rounded hover:opacity-90 transition-transform hover:scale-105">Guardar Configuración</button>
            </div>
            <div><h3 className="text-2xl font-serif mb-4">Tiempo Personal</h3><div className="p-6 bg-dark-bg rounded-lg text-center"><p className="text-medium-text mb-4">Crea bloqueos para almuerzos, descansos o imprevistos.</p><button onClick={() => setIsBlockModalOpen(true)} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded transition-transform hover:scale-105">Bloquear Horarios</button></div></div>
          </div>
        )}
      </div>
      {isBlockModalOpen && <BlockTimeModal onClose={() => setIsBlockModalOpen(false)} />}
    </>
  );
}
export default ScheduleView;