'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TestAuth() {
  const [authData, setAuthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check localStorage
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    setAuthData({
      hasUser: !!user,
      hasToken: !!token,
      tokenLength: token?.length || 0,
      userData: user ? JSON.parse(user) : null,
      tokenPreview: token ? `${token.substring(0, 30)}...` : 'No token'
    });
    
    setLoading(false);
  }, []);

  const handleTestDashboard = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('No token found in localStorage');
      return;
    }

    try {
      const response = await fetch('/api/dashboard/trainer', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('Dashboard API working! Check console for data.');
        console.log('Dashboard data:', data);
      } else {
        alert(`API Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`Fetch error: ${error}`);
    }
  };

  const handleRedirect = (path: string) => {
    router.push(path);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Test Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Auth Status</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
            {JSON.stringify(authData, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
          <div className="space-y-4">
            <button
              onClick={handleTestDashboard}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Test Dashboard API
            </button>
            
            <div className="flex gap-2">
              <button
                onClick={() => handleRedirect('/login')}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Go to Login
              </button>
              
              <button
                onClick={() => handleRedirect('/dashboard/trainer')}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Go to Trainer Dashboard
              </button>
              
              <button
                onClick={() => handleRedirect('/dashboard/client')}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                Go to Client Dashboard
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Login Test</h2>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Test credentials:</p>
            <p className="font-mono text-sm">Trainer: test-trainer@fitness.com / 123456</p>
            <p className="font-mono text-sm">Client: test-client@fitness.com / 123456</p>
          </div>
        </div>
      </div>
    </div>
  );
}