'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function TestPage() {
  const [logs, setLogs] = useState<Array<{time: string, message: string, type: 'info' | 'success' | 'error'}>>([]);
  const [state, setState] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { time, message, type }]);
  };

  const updateState = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const cookies = document.cookie;
    
    setState({
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 30) + '...' : null,
      hasUser: !!user,
      userEmail: user ? JSON.parse(user).email : null,
      userRole: user ? JSON.parse(user).role : null,
      hasCookie: cookies.includes('auth-token') || cookies.includes('access-token'),
    });
  };

  useEffect(() => {
    updateState();
    addLog('Test system initialized', 'info');
    const interval = setInterval(updateState, 2000);
    return () => clearInterval(interval);
  }, []);

  const testAPI = async () => {
    addLog('Testing API health...');
    try {
      const response = await fetch('/api/health');
      if (response.ok) {
        addLog('✅ API is healthy', 'success');
      } else {
        addLog(`❌ API returned error: ${response.status}`, 'error');
      }
    } catch (error: any) {
      addLog(`❌ Failed to connect to API: ${error.message}`, 'error');
    }
  };

  const testLogin = async () => {
    setLoading(true);
    addLog('Testing login with test-trainer@fitness.com...');
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test-trainer@fitness.com',
          password: '123456'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        addLog('✅ Login successful!', 'success');
        addLog(`User: ${data.user.name} (${data.user.role})`, 'info');
        
        const token = data.accessToken || data.token;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        addLog('✅ Data saved to localStorage', 'success');
        updateState();
      } else {
        addLog(`❌ Login failed: ${data.error}`, 'error');
      }
    } catch (error: any) {
      addLog(`❌ Request failed: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const doFullLogin = async (role: 'trainer' | 'client') => {
    setLoading(true);
    addLog(`Starting full login flow for ${role}...`);
    
    const credentials = {
      trainer: { email: 'test-trainer@fitness.com', password: '123456' },
      client: { email: 'test-client@fitness.com', password: '123456' }
    };
    
    try {
      addLog('Step 1: Sending login request...');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials[role])
      });
      
      const data = await response.json();
      
      if (data.success) {
        addLog('✅ Login successful!', 'success');
        
        const token = data.accessToken || data.token;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        addLog('✅ Data saved. Redirecting in 2 seconds...', 'success');
        updateState();
        
        setTimeout(() => {
          const dashboardUrl = data.user.role === 'TRAINER' 
            ? '/dashboard/trainer' 
            : '/dashboard/client';
          window.location.href = dashboardUrl;
        }, 2000);
      } else {
        addLog(`❌ Login failed: ${data.error}`, 'error');
      }
    } catch (error: any) {
      addLog(`❌ Request failed: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    addLog('Clearing all data...');
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(";").forEach(c => { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    addLog('✅ All data cleared', 'success');
    updateState();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🧪 Sistema de Teste - Fitness Scheduler</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>🎮 Ações de Teste</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Testes Básicos</h3>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={testAPI} disabled={loading} size="sm">
                    Test API
                  </Button>
                  <Button onClick={testLogin} disabled={loading} size="sm">
                    Test Login
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold">Login Completo</h3>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    onClick={() => doFullLogin('trainer')} 
                    disabled={loading}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Login como Trainer
                  </Button>
                  <Button 
                    onClick={() => doFullLogin('client')} 
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Login como Cliente
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold">Manutenção</h3>
                <Button 
                  onClick={clearAll} 
                  disabled={loading}
                  variant="destructive"
                >
                  Limpar Todos os Dados
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Current State */}
          <Card>
            <CardHeader>
              <CardTitle>📊 Estado Atual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Token:</span>
                  <span className={state.hasToken ? 'text-green-600' : 'text-red-600'}>
                    {state.hasToken ? '✅ Presente' : '❌ Ausente'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium">Usuário:</span>
                  <span className={state.hasUser ? 'text-green-600' : 'text-red-600'}>
                    {state.hasUser ? `✅ ${state.userEmail}` : '❌ Ausente'}
                  </span>
                </div>
                
                {state.userRole && (
                  <div className="flex justify-between">
                    <span className="font-medium">Role:</span>
                    <span className="text-blue-600">{state.userRole}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="font-medium">Cookie Auth:</span>
                  <span className={state.hasCookie ? 'text-green-600' : 'text-red-600'}>
                    {state.hasCookie ? '✅ Presente' : '❌ Ausente'}
                  </span>
                </div>
                
                {state.tokenPreview && (
                  <div className="mt-4 p-2 bg-gray-100 dark:bg-gray-800 rounded">
                    <span className="text-xs font-mono">{state.tokenPreview}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Logs */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>📝 Console de Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-white p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm">
              {logs.map((log, index) => (
                <div 
                  key={index} 
                  className={`mb-1 ${
                    log.type === 'error' ? 'text-red-400' : 
                    log.type === 'success' ? 'text-green-400' : 
                    'text-blue-400'
                  }`}
                >
                  [{log.time}] {log.message}
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-gray-500">Aguardando logs...</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>📖 Instruções</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Credenciais de Teste:</strong></p>
              <ul className="list-disc list-inside ml-4">
                <li>Trainer: test-trainer@fitness.com / 123456</li>
                <li>Cliente: test-client@fitness.com / 123456</li>
              </ul>
              
              <p className="mt-4"><strong>Como usar:</strong></p>
              <ol className="list-decimal list-inside ml-4">
                <li>Clique em "Test API" para verificar se o servidor está respondendo</li>
                <li>Use "Login como Trainer" ou "Login como Cliente" para fazer login completo</li>
                <li>O sistema redirecionará automaticamente após login bem-sucedido</li>
                <li>Use "Limpar Todos os Dados" se precisar resetar</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}