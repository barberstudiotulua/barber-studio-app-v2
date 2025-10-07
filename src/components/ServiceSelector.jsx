import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Spinner from './Spinner';

const CheckIcon = () => (
    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
);

function ServiceSelector({ onSelectionChange, selectedServices, numberOfPeople, onPeopleChange }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchServices() {
      setLoading(true);
      const { data, error } = await supabase.from('services').select('*').eq('is_active', true).order('name');
      if (error) console.error('Error fetching services:', error);
      else setServices(data);
      setLoading(false);
    }
    fetchServices();
  }, []);

  const handleServiceToggle = (service) => {
    const isSelected = selectedServices.some(s => s.id === service.id);
    if (isSelected) {
      onSelectionChange(selectedServices.filter(s => s.id !== service.id));
    } else {
      onSelectionChange([...selectedServices, service]);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="my-8">
      <h3 className="text-3xl font-serif text-center mb-6">1. Elige tus Servicios y el número de personas</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => {
          const isSelected = selectedServices.some(s => s.id === service.id);
          return (
            <div
              key={service.id}
              onClick={() => handleServiceToggle(service)}
              className={`p-6 border-2 rounded-lg text-left transition-all duration-300 shadow-lg cursor-pointer relative card-bg ${
                isSelected
                  ? 'border-gold scale-105 shadow-gold/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gold'
              }`}
            >
              {isSelected && <div className="absolute top-2 right-2"><CheckIcon /></div>}
              <div className="flex justify-between items-start">
                <h4 className="text-xl font-bold font-serif pr-8">{service.name}</h4>
                <p className="text-xl font-bold text-gold">${service.price}</p>
              </div>
              <p className="text-text-soft dark:text-text-medium mt-1">{service.duration_minutes} min</p>
              <p className="mt-3">{service.description}</p>
            </div>
          );
        })}
      </div>
      
      {selectedServices.length > 0 && (
        <div className="mt-10 text-center">
            <label htmlFor="people" className="block text-xl font-serif mb-3">Número de personas</label>
            <select
                id="people"
                value={numberOfPeople}
                onChange={(e) => onPeopleChange(Number(e.target.value))}
                className="p-3 input-primary max-w-xs mx-auto"
            >
                <option value={1}>1 persona</option>
                <option value={2}>2 personas</option>
                <option value={3}>3 personas</option>
            </select>
        </div>
      )}
    </div>
  );
}

export default ServiceSelector;