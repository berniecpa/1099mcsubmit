import axios from 'axios';
import { auth } from './firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add Firebase token to requests
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Types
export interface User {
  id: string;
  email: string;
  business?: Business;
}

export interface Business {
  id: string;
  businessName: string;
  ein: string;
  tradeName?: string;
  contactName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface Recipient {
  id: string;
  name: string;
  businessName?: string;
  tin: string;
  tinType: 'SSN' | 'EIN';
  address: string;
  city: string;
  state: string;
  zipCode: string;
  email?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export type FormType = 'NEC' | 'MISC' | 'K';
export type FilingStatus = 'DRAFT' | 'PENDING' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED';

export interface Form1099 {
  id: string;
  formType: FormType;
  taxYear: number;
  status: FilingStatus;
  recipient?: Recipient;
  // Amounts in cents
  nonemployeeCompensation?: number;
  rents?: number;
  royalties?: number;
  otherIncome?: number;
  federalIncomeTaxWithheld?: number;
  medicalHealthcare?: number;
  grossAmount?: number;
  numberOfTransactions?: number;
  errorMessage?: string;
  submittedAt?: string;
  acceptedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Auth API
export const authApi = {
  register: async (data: {
    email: string;
    password: string;
    businessName: string;
    ein: string;
    contactName: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    tradeName?: string;
  }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  }
};

// Business API
export const businessApi = {
  getProfile: async (): Promise<Business> => {
    const response = await api.get('/business/profile');
    return response.data;
  },

  updateProfile: async (data: Partial<Business>): Promise<Business> => {
    const response = await api.put('/business/profile', data);
    return response.data;
  }
};

// Recipients API
export const recipientsApi = {
  getAll: async (): Promise<Recipient[]> => {
    const response = await api.get('/recipients');
    return response.data;
  },

  getOne: async (id: string): Promise<Recipient> => {
    const response = await api.get(`/recipients/${id}`);
    return response.data;
  },

  create: async (data: Omit<Recipient, 'id' | 'createdAt' | 'updatedAt'>): Promise<Recipient> => {
    const response = await api.post('/recipients', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Recipient>): Promise<Recipient> => {
    const response = await api.put(`/recipients/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/recipients/${id}`);
  }
};

// Forms API
export const formsApi = {
  getAll: async (filters?: { taxYear?: number; status?: FilingStatus }): Promise<Form1099[]> => {
    const response = await api.get('/forms1099', { params: filters });
    return response.data;
  },

  getOne: async (id: string): Promise<Form1099> => {
    const response = await api.get(`/forms1099/${id}`);
    return response.data;
  },

  create: async (data: {
    recipientId: string;
    formType: FormType;
    taxYear: number;
    [key: string]: any;
  }): Promise<Form1099> => {
    const response = await api.post('/forms1099', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Form1099>): Promise<Form1099> => {
    const response = await api.put(`/forms1099/${id}`, data);
    return response.data;
  },

  submit: async (id: string): Promise<Form1099> => {
    const response = await api.post(`/forms1099/${id}/submit`);
    return response.data;
  },

  getStatus: async (id: string): Promise<any> => {
    const response = await api.get(`/forms1099/${id}/status`);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/forms1099/${id}`);
  }
};

export default api;
