import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { subscriptionApi, PricingPlan } from '../lib/subscriptionApi';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function Pricing() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const data = await subscriptionApi.getPlans();
      setPlans(data);
    } catch (error) {
      console.error('Failed to load plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (tierId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (tierId === 'FREE') {
      return; // Already on free plan
    }

    setSubscribing(tierId);

    try {
      const { url } = await subscriptionApi.createCheckout(tierId);
      window.location.href = url;
    } catch (error) {
      console.error('Failed to create checkout:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setSubscribing(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Choose the plan that fits your business needs
          </p>
        </div>

        {loading ? (
          <div className="mt-12 text-center">
            <p className="text-gray-500">Loading plans...</p>
          </div>
        ) : (
          <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`border rounded-lg shadow-sm divide-y divide-gray-200 ${
                  plan.id === 'PROFESSIONAL'
                    ? 'border-blue-500 border-2'
                    : 'border-gray-200'
                }`}
              >
                <div className="p-6">
                  {plan.id === 'PROFESSIONAL' && (
                    <span className="inline-flex px-4 py-1 rounded-full text-sm font-semibold tracking-wide uppercase bg-blue-100 text-blue-600">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mt-2">
                    {plan.name}
                  </h3>
                  <p className="mt-4">
                    <span className="text-4xl font-extrabold text-gray-900">
                      ${plan.price}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-base font-medium text-gray-500">/month</span>
                    )}
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    {plan.formsPerYear === Infinity
                      ? 'Unlimited forms'
                      : `${plan.formsPerYear} forms per year`}
                  </p>
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={subscribing === plan.id}
                    className={`mt-8 block w-full rounded-md py-2 text-sm font-semibold text-center ${
                      plan.id === 'PROFESSIONAL'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : plan.id === 'FREE'
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
                    } disabled:opacity-50`}
                  >
                    {subscribing === plan.id
                      ? 'Loading...'
                      : plan.id === 'FREE'
                      ? 'Get Started'
                      : 'Subscribe'}
                  </button>
                </div>
                <div className="pt-6 pb-8 px-6">
                  <h4 className="text-sm font-medium text-gray-900 tracking-wide uppercase">
                    What's included
                  </h4>
                  <ul className="mt-6 space-y-4">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex space-x-3">
                        <svg
                          className="flex-shrink-0 h-5 w-5 text-green-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-sm text-gray-500">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            All plans include secure IRS e-filing via TaxBandits API
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Questions? <a href="mailto:support@1099mcsubmit.com" className="text-blue-600 hover:text-blue-500">Contact us</a>
          </p>
        </div>
      </div>
    </div>
  );
}
