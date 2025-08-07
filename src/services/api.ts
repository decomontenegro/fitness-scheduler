// API Service - Centralized API calls with authentication
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

class ApiService {
  private getAuthToken(): string | null {
    // Try to get token from localStorage
    const token = localStorage.getItem('token');
    
    // Also check cookies as fallback
    if (!token) {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'auth-token' || name === 'access-token') {
          return value;
        }
      }
    }
    
    return token;
  }

  private async request<T = any>(
    url: string, 
    options: RequestOptions = {}
  ): Promise<T> {
    const { skipAuth = false, headers = {}, ...restOptions } = options;
    
    const token = this.getAuthToken();
    
    const finalHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      ...headers,
    };
    
    // Add Authorization header if token exists and not skipped
    if (token && !skipAuth) {
      finalHeaders['Authorization'] = `Bearer ${token}`;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        ...restOptions,
        headers: finalHeaders,
        credentials: 'include', // Include cookies
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          // Clear auth data and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          throw new Error('Sessão expirada. Por favor, faça login novamente.');
        }
        
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error: any) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    });
  }

  async register(data: any) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    });
  }

  async logout() {
    return this.request('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ logoutAll: false }),
    });
  }

  // Dashboard endpoints
  async getDashboard(role: 'trainer' | 'client') {
    return this.request(`/api/dashboard/${role}`);
  }

  // Appointments endpoints
  async getAppointments(params?: Record<string, any>) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`/api/appointments${queryString}`);
  }

  async createAppointment(data: any) {
    return this.request('/api/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAppointment(id: string, data: any) {
    return this.request(`/api/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async cancelAppointment(id: string) {
    return this.request(`/api/appointments/${id}/cancel`, {
      method: 'POST',
    });
  }

  async checkAppointmentConflict(data: any) {
    return this.request('/api/appointments/check', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Trainers endpoints
  async getTrainers() {
    return this.request('/api/trainers');
  }

  async getTrainer(id: string) {
    return this.request(`/api/trainers/${id}`);
  }

  async getTrainerServices(id: string) {
    return this.request(`/api/trainers/${id}/services`);
  }

  async getTrainerAvailability(id: string, date: string) {
    return this.request(`/api/trainers/${id}/availability?date=${date}`);
  }

  // Clients endpoints
  async getClients() {
    return this.request('/api/clients');
  }

  async getClient(id: string) {
    return this.request(`/api/clients/${id}`);
  }

  // Services endpoints
  async getServices() {
    return this.request('/api/services');
  }

  async createService(data: any) {
    return this.request('/api/services', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateService(id: string, data: any) {
    return this.request(`/api/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteService(id: string) {
    return this.request(`/api/services/${id}`, {
      method: 'DELETE',
    });
  }

  // Analytics endpoints
  async getAnalytics(role: 'trainer' | 'client', period: string = '7d') {
    return this.request(`/api/analytics/${role}?period=${period}`);
  }

  // Notifications endpoints
  async getNotifications() {
    return this.request('/api/notifications');
  }

  async markNotificationAsRead(id: string) {
    return this.request(`/api/notifications/${id}/read`, {
      method: 'POST',
    });
  }

  // Messages endpoints
  async getMessages() {
    return this.request('/api/messages');
  }

  async sendMessage(data: any) {
    return this.request('/api/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Profile endpoints
  async updateProfile(data: any) {
    return this.request('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('avatar', file);
    
    return this.request('/api/profile/avatar', {
      method: 'POST',
      body: formData,
      headers: {}, // Remove Content-Type to let browser set it
    });
  }

  // Payments endpoints
  async createCheckoutSession(data: any) {
    return this.request('/api/payments/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPaymentHistory() {
    return this.request('/api/payments/history');
  }

  // Reviews endpoints
  async getReviews(trainerId?: string) {
    const queryString = trainerId ? `?trainerId=${trainerId}` : '';
    return this.request(`/api/reviews${queryString}`);
  }

  async createReview(data: any) {
    return this.request('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

// Export singleton instance
const api = new ApiService();
export default api;

// Export for use in hooks
export { api };