// API Configuration for Python FastAPI Backend
// Use relative paths when served from same domain, or explicit URL for local dev
const API_URL = import.meta.env.VITE_API_URL || '';

console.log('API URL:', API_URL || '(relative paths)');

// Generic fetch wrapper with error handling
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    credentials: 'include', // Include cookies for authentication
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// Authentication API
export const authAPI = {
  login: (username: string, password: string) =>
    apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ 
        auth_method: 'credentials',
        username, 
        password 
      }),
    }),

  logout: () =>
    apiFetch('/api/auth/logout', {
      method: 'POST',
    }),

  getCurrentUser: () =>
    apiFetch('/api/auth/me'),

  register: (userData: any) =>
    apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
};

// Users API
export const usersAPI = {
  getAll: () => apiFetch('/api/users'),
  
  getById: (id: string) => apiFetch(`/api/users/${id}`),
  
  create: (userData: any) =>
    apiFetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  
  update: (id: string, userData: any) =>
    apiFetch(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),
  
  delete: (id: string) =>
    apiFetch(`/api/users/${id}`, {
      method: 'DELETE',
    }),
};

// Patients API
export const patientsAPI = {
  getAll: () => apiFetch('/api/patients'),
  
  getById: (id: string) => apiFetch(`/api/patients/${id}`),
  
  create: (patientData: any) =>
    apiFetch('/api/patients', {
      method: 'POST',
      body: JSON.stringify(patientData),
    }),
  
  update: (id: string, patientData: any) =>
    apiFetch(`/api/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patientData),
    }),
};

// Appointments API
export const appointmentsAPI = {
  getAll: () => apiFetch('/api/appointments'),
  
  getById: (id: string) => apiFetch(`/api/appointments/${id}`),
  
  create: (appointmentData: any) =>
    apiFetch('/api/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    }),
  
  update: (id: string, appointmentData: any) =>
    apiFetch(`/api/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(appointmentData),
    }),
};

// Departments API
export const departmentsAPI = {
  getAll: () => apiFetch('/api/departments'),
  
  getById: (id: string) => apiFetch(`/api/departments/${id}`),
  
  create: (departmentData: any) =>
    apiFetch('/api/departments', {
      method: 'POST',
      body: JSON.stringify(departmentData),
    }),
};

// Health Check
export const healthCheck = () => apiFetch('/api/health');

// Export API_URL for direct use if needed
export { API_URL };
