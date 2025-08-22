'use client';

import { useState, useEffect } from 'react';

export default function BookingTestPage() {
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('Test component mounted');
    fetchTrainers();
  }, []);

  useEffect(() => {
    console.log('Trainers updated in test:', trainers.length);
  }, [trainers]);

  const fetchTrainers = async () => {
    console.log('Fetching trainers in test...');
    setLoading(true);
    
    try {
      const response = await fetch('/api/trainers');
      const data = await response.json();
      console.log('API response in test:', data);
      
      if (data.success && data.trainers) {
        console.log('Setting trainers in test:', data.trainers.length);
        setTrainers(data.trainers);
      }
    } catch (error) {
      console.error('Error in test:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Booking Test Page</h1>
      
      <div className="bg-yellow-100 p-4 rounded mb-4">
        <p>Loading: {String(loading)}</p>
        <p>Trainers count: {trainers.length}</p>
        <p>First trainer: {trainers[0]?.name || 'none'}</p>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : trainers.length === 0 ? (
        <p>No trainers</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {trainers.map(trainer => (
            <div key={trainer.id} className="border p-4 rounded">
              <h3 className="font-bold">{trainer.name}</h3>
              <p>R$ {trainer.hourlyRate}</p>
            </div>
          ))}
        </div>
      )}

      <button 
        onClick={fetchTrainers}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Refetch Trainers
      </button>
    </div>
  );
}