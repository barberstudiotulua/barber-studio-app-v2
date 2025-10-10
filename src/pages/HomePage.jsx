import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import ServiceSelector from '../components/ServiceSelector';
import CalendarView from '../components/CalendarView';
import BookingForm from '../components/BookingForm';
import { supabase } from '../supabaseClient';
import Spinner from '../components/Spinner';
import HistoryModal from '../components/HistoryModal';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function HomePage() {
  const [selectedServices, setSelectedServices] = useState([]);
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [slotInterval, setSlotInterval] = useState(60);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [lastBookingClientId, setLastBookingClientId] = useState(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  
  // --- NUEVO ESTADO PARA CONTROLAR EL BOTÓN FINAL ---
  const [subscriptionDone, setSubscriptionDone] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      setLoadingSettings(true);
      const { data: setting, error } = await supabase.from('settings').select('value').eq('key', 'slot_interval_minutes').single();
      if (error) toast.error("No se pudo cargar la configuración de la agenda.");
      else if (setting) setSlotInterval(parseInt(setting.value, 10));
      setLoadingSettings(false);
    }
    fetchSettings();
  }, []);

  const handleSelectionChange = (services) => { setSelectedTimeSlot(null); setSelectedServices(services); };
  const handleSlotSelect = (slot) => { if (selectedTimeSlot === slot) { setSelectedTimeSlot(null); setIsBookingModalOpen(false); } else { setSelectedTimeSlot(slot); setIsBookingModalOpen(true); } };
  const handleCloseModal = () => { setIsBookingModalOpen(false); setSelectedTimeSlot(null); };
  
  const handleBookingSuccess = (clientId) => {
    setBookingSuccess(true);
    setLastBookingClientId(clientId);
    setSelectedServices([]);
    setSelectedTimeSlot(null);
    setNumberOfPeople(1);
    setIsBookingModalOpen(false);
    setSubscriptionDone(false); // Reiniciamos el estado del botón
  };

  const resetFlow = () => {
    setBookingSuccess(false);
    setLastBookingClientId(null);
  };

  const handleSubscribe = async () => {
    if (subscriptionDone) {
      resetFlow();
      return;
    }
    
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast.error('Tu navegador no es compatible con notificaciones.');
      return;
    }
    
    setIsSubscribing(true);
    const toastId = toast.loading('Activando recordatorios...');

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const { error } = await supabase
        .from('subscriptions')
        .insert({
          client_id: lastBookingClientId,
          endpoint: subscription.endpoint,
          p256dh: subscription.toJSON().keys.p256dh,
          auth: subscription.toJSON().keys.auth,
        });

      if (error && error.code !== '23505') {
        throw error;
      }
      
      toast.success('¡Listo! Te recordaremos tu cita.', { id: toastId });
      setSubscriptionDone(true); // Marcamos que la suscripción fue exitosa
    } catch (err) {
      console.error('Error al suscribir:', err);
      toast.error('No se pudo activar. Asegúrate de dar permiso en la ventana del navegador.', { id: toastId });
    } finally {
      setIsSubscribing(false);
    }
  };
  
  const totalAppointmentDuration = useMemo(() => slotInterval * numberOfPeople, [slotInterval, numberOfPeople]);
  const totalPrice = useMemo(() => selectedServices.reduce((sum, s) => sum + s.price, 0) * numberOfPeople, [selectedServices, numberOfPeople]);

  return (
    <>
      <Header />
      <main className="container mx-auto p-4 sm:p-6 md:p-8">
        {bookingSuccess ? (
          <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 280px)'}}>
            <div className="text-center card-bg p-6 sm:p-8 rounded-lg shadow-xl max-w-lg">
              <h2 className="text-3xl sm:text-4xl font-serif text-brand-gold mb-4">¡Cita Confirmada!</h2>
              <p className="text-base sm:text-lg mb-8">Hemos agendado tu cita con éxito. ¡Te esperamos en Barber Studio!</p>
              
              {/* --- NUEVA LÓGICA DEL BOTÓN --- */}
              <div className="mt-8">
                <button 
                  onClick={handleSubscribe} 
                  disabled={isSubscribing} 
                  className={`btn-primary ${subscriptionDone ? 'bg-green-600' : ''}`}
                >
                  {isSubscribing ? 'Activando...' : (subscriptionDone ? '¡Todo listo!' : 'Recuérdame la cita')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <button onClick={() => setIsHistoryModalOpen(true)} className="block text-center mx-auto mb-10 text-brand-gold font-semibold hover:underline">
              ¿Ya tienes una cita? Consulta aquí
            </button>
            <div className="w-full flex justify-center mb-10">
              <ol className="flex items-center space-x-2 md:space-x-4 text-sm font-medium text-center">
                <li className={`flex items-center transition-colors ${selectedServices.length > 0 ? 'text-brand-gold' : 'text-text-soft dark:text-text-medium'}`}><span className={`flex items-center justify-center w-6 h-6 me-2 text-xs border rounded-full shrink-0 transition-colors ${selectedServices.length > 0 ? 'border-brand-gold' : 'border-gray-500'}`}>1</span>Servicios</li>
                <li className={`flex items-center transition-colors ${selectedTimeSlot ? 'text-brand-gold' : 'text-text-soft dark:text-text-medium'}`}><svg className="w-3 h-3 mx-2 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 12 10"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m7 9 4-4-4-4M1 9l4-4-4-4"/></svg><span className={`flex items-center justify-center w-6 h-6 me-2 text-xs border rounded-full shrink-0 transition-colors ${selectedTimeSlot ? 'border-brand-gold' : 'border-gray-500'}`}>2</span>Horario</li>
                <li className="flex items-center text-text-soft dark:text-text-medium"><svg className="w-3 h-3 mx-2 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 12 10"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m7 9 4-4-4-4M1 9l4-4-4-4"/></svg><span className="flex items-center justify-center w-6 h-6 me-2 text-xs border border-gray-500 rounded-full shrink-0">3</span>Confirmar</li>
              </ol>
            </div>
            {selectedServices.length === 0 && <div className="text-center my-8"><h2 className="text-3xl sm:text-4xl md:text-5xl mb-4">Agenda tu Cita</h2><p className="text-text-soft dark:text-text-medium text-lg">Elige uno o más servicios para comenzar.</p></div>}
            <ServiceSelector onSelectionChange={handleSelectionChange} selectedServices={selectedServices} numberOfPeople={numberOfPeople} onPeopleChange={setNumberOfPeople} />
            {!loadingSettings && selectedServices.length > 0 && (<><div className="text-center my-8 p-4 card-bg rounded-lg"><h3 className="text-xl sm:text-2xl font-serif text-brand-gold">Resumen de tu Cita</h3><p className="text-lg">Total Personas: <span className="font-bold">{numberOfPeople}</span></p><p className="text-lg">Precio Total: <span className="font-bold text-brand-gold">${totalPrice.toFixed(2)}</span></p></div><CalendarView totalServiceDuration={totalAppointmentDuration} onSlotSelect={handleSlotSelect} selectedTimeSlot={selectedTimeSlot} /></>)}
            {isBookingModalOpen && selectedTimeSlot && (<BookingForm selectedServices={selectedServices} totalPrice={totalPrice} totalDuration={totalAppointmentDuration} numberOfPeople={numberOfPeople} timeSlot={selectedTimeSlot} onBookingSuccess={handleBookingSuccess} onClose={handleCloseModal} />)}
          </div>
        )}
      </main>
      
      <button onClick={() => setIsHistoryModalOpen(true)} className="fixed bottom-6 left-6 z-50 bg-brand-gold text-dark-primary font-bold py-3 px-6 rounded-full shadow-lg hover:opacity-90 transition-all transform hover:scale-105 animate-fade-in-up" aria-label="Consultar mis citas" title="Consultar mis citas">Consulta tus citas aquí</button>
      {isHistoryModalOpen && <HistoryModal onClose={() => setIsHistoryModalOpen(false)} />}
    </>
  );
}

export default HomePage;