import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import AppointmentsView from '../components/admin/AppointmentsView';
import ServicesView from '../components/admin/ServicesView';
import ScheduleView from '../components/admin/ScheduleView';
import ClientsView from '../components/admin/ClientsView';
import AdminsView from '../components/admin/AdminsView'; // <-- 1. IMPORTAR LA NUEVA VISTA
import ThemeToggleButton from '../components/ThemeToggleButton';

function AdminPanel() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('citas');

    const handleLogout = async () => { 
        await supabase.auth.signOut();
        navigate('/admin/login'); 
    };
    
    // <-- 2. AÑADIR EL CASO PARA LA NUEVA VISTA
    const renderContent = () => {
        switch(activeTab) {
            case 'citas': return <AppointmentsView />;
            case 'servicios': return <ServicesView />;
            case 'horarios': return <ScheduleView />;
            case 'clientes': return <ClientsView />;
            case 'administradores': return <AdminsView />; // <-- AÑADIDO
            default: return <AppointmentsView />;
        }
    };
    const getButtonClass = (tabName) => activeTab === tabName ? "tab-button-active" : "tab-button";

    return (
        <div className="min-h-screen bg-light-primary dark:bg-dark-primary font-sans transition-colors duration-300">
            <header className="bg-light-secondary dark:bg-dark-secondary shadow-lg p-4 flex justify-between items-center border-b-2 border-brand-gold">
                <h1 className="text-xl md:text-2xl font-bold font-serif">Panel de Admin</h1>
                <div className="flex items-center gap-2 md:gap-4">
                    <ThemeToggleButton />
                    <button onClick={() => navigate('/')} className="btn-secondary text-sm md:text-base">Ver Web</button>
                    <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 text-sm md:px-4 md:text-base rounded transition-colors">Salir</button>
                </div>
            </header>
            <div className="w-full bg-light-secondary dark:bg-dark-secondary border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                <nav className="p-4 flex">
                    {/* <-- 3. AÑADIR EL BOTÓN DE LA NUEVA PESTAÑA */}
                    {['citas', 'servicios', 'horarios', 'clientes', 'administradores'].map(tab => 
                        <button key={tab} onClick={() => setActiveTab(tab)} className={getButtonClass(tab)}>
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    )}
                </nav>
            </div>
            <main className="p-4 md:p-8">{renderContent()}</main>
        </div>
    );
}
export default AdminPanel;