import axios from 'axios';
import { auth } from './firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface SubscriptionUsage {
  tier: string;
  status: string;
  formsUsed: number;
  formsLimit: number;
  formsRemaining: number;
  resetDate: string | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  formsPerYear: number;
  features: string[];
}

export const subscriptionApi = {
  getUsage: async (): Promise<SubscriptionUsage> => {
    const response = await api.get('/subscription/usage');
    return response.data;
  },

  getPlans: async (): Promise<PricingPlan[]> => {
    const response = await api.get('/subscription/plans');
    return response.data;
  },

  createCheckout: async (tier: string): Promise<{ sessionId: string; url: string }> => {
    const response = await api.post('/subscription/checkout', { tier });
    return response.data;
  },

  createPortalSession: async (): Promise<{ url: string }> => {
    const response = await api.post('/subscription/portal');
    return response.data;
  }
};
