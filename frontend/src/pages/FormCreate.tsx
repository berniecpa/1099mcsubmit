import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { recipientsApi, formsApi, Recipient, FormType } from '../lib/api';

export default function FormCreate() {
  const navigate = useNavigate();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentYear = new Date().getFullYear();

  const [formData, setFormData] = useState({
    recipientId: '',
    formType: 'NEC' as FormType,
    taxYear: currentYear - 1,
    // 1099-NEC
    nonemployeeCompensation: '',
    // 1099-MISC
    rents: '',
    royalties: '',
    otherIncome: '',
    federalIncomeTaxWithheld: '',
    medicalHealthcare: '',
    // 1099-K
    grossAmount: '',
    numberOfTransactions: ''
  });

  useEffect(() => {
    loadRecipients();
  }, []);

  const loadRecipients = async () => {
    try {
      const data = await recipientsApi.getAll();
      setRecipients(data);
    } catch (error) {
      console.error('Failed to load recipients:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Convert dollar amounts to numbers
      const parseAmount = (value: string) => (value ? parseFloat(value) : undefined);

      const submitData: any = {
        recipientId: formData.recipientId,
        formType: formData.formType,
        taxYear: formData.taxYear
      };

      // Add amounts based on form type
      if (formData.formType === 'NEC') {
        submitData.nonemployeeCompensation = parseAmount(formData.nonemployeeCompensation);
      } else if (formData.formType === 'MISC') {
        submitData.rents = parseAmount(formData.rents);
        submitData.royalties = parseAmount(formData.royalties);
        submitData.otherIncome = parseAmount(formData.otherIncome);
        submitData.federalIncomeTaxWithheld = parseAmount(formData.federalIncomeTaxWithheld);
        submitData.medicalHealthcare = parseAmount(formData.medicalHealthcare);
      } else if (formData.formType === 'K') {
        submitData.grossAmount = parseAmount(formData.grossAmount);
        submitData.numberOfTransactions = formData.numberOfTransactions
          ? parseInt(formData.numberOfTransactions)
          : undefined;
      }

      const form = await formsApi.create(submitData);
      navigate(`/forms/${form.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to create form');
    } finally {
      setLoading(false);
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create 1099 Form</h1>
        <p className="mt-1 text-sm text-gray-600">
          Enter the payment information for the selected recipient.
        </p>
      </div>

      {recipients.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800 mb-4">
            You need to add at least one recipient before creating a 1099 form.
          </p>
          <button
            onClick={() => navigate('/recipients/new')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Add Recipient
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 max-w-3xl">
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-3 sm:col-span-1">
                <label htmlFor="formType" className="block text-sm font-medium text-gray-700">
                  Form Type *
                </label>
                <select
                  name="formType"
                  id="formType"
                  required
                  value={formData.formType}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                >
                  <option value="NEC">1099-NEC (Non-Employee Compensation)</option>
                  <option value="MISC">1099-MISC (Miscellaneous Income)</option>
                  <option value="K">1099-K (Payment Card Transactions)</option>
                </select>
              </div>

              <div className="col-span-3 sm:col-span-1">
                <label htmlFor="taxYear" className="block text-sm font-medium text-gray-700">
                  Tax Year *
                </label>
                <select
                  name="taxYear"
                  id="taxYear"
                  required
                  value={formData.taxYear}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-3 sm:col-span-1">
                <label htmlFor="recipientId" className="block text-sm font-medium text-gray-700">
                  Recipient *
                </label>
                <select
                  name="recipientId"
                  id="recipientId"
                  required
                  value={formData.recipientId}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                >
                  <option value="">Select recipient</option>
                  {recipients.map((recipient) => (
                    <option key={recipient.id} value={recipient.id}>
                      {recipient.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 1099-NEC Fields */}
            {formData.formType === 'NEC' && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">1099-NEC Amounts</h3>
                <div>
                  <label htmlFor="nonemployeeCompensation" className="block text-sm font-medium text-gray-700">
                    Box 1: Non-employee Compensation *
                  </label>
                  <input
                    type="number"
                    name="nonemployeeCompensation"
                    id="nonemployeeCompensation"
                    required
                    min="0"
                    step="0.01"
                    value={formData.nonemployeeCompensation}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                  />
                </div>
              </div>
            )}

            {/* 1099-MISC Fields */}
            {formData.formType === 'MISC' && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">1099-MISC Amounts</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="rents" className="block text-sm font-medium text-gray-700">
                      Box 1: Rents
                    </label>
                    <input
                      type="number"
                      name="rents"
                      id="rents"
                      min="0"
                      step="0.01"
                      value={formData.rents}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>

                  <div>
                    <label htmlFor="royalties" className="block text-sm font-medium text-gray-700">
                      Box 2: Royalties
                    </label>
                    <input
                      type="number"
                      name="royalties"
                      id="royalties"
                      min="0"
                      step="0.01"
                      value={formData.royalties}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>

                  <div>
                    <label htmlFor="otherIncome" className="block text-sm font-medium text-gray-700">
                      Box 3: Other Income
                    </label>
                    <input
                      type="number"
                      name="otherIncome"
                      id="otherIncome"
                      min="0"
                      step="0.01"
                      value={formData.otherIncome}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>

                  <div>
                    <label htmlFor="federalIncomeTaxWithheld" className="block text-sm font-medium text-gray-700">
                      Box 4: Federal Income Tax Withheld
                    </label>
                    <input
                      type="number"
                      name="federalIncomeTaxWithheld"
                      id="federalIncomeTaxWithheld"
                      min="0"
                      step="0.01"
                      value={formData.federalIncomeTaxWithheld}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>

                  <div>
                    <label htmlFor="medicalHealthcare" className="block text-sm font-medium text-gray-700">
                      Box 6: Medical and Health Care Payments
                    </label>
                    <input
                      type="number"
                      name="medicalHealthcare"
                      id="medicalHealthcare"
                      min="0"
                      step="0.01"
                      value={formData.medicalHealthcare}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 1099-K Fields */}
            {formData.formType === 'K' && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">1099-K Amounts</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="grossAmount" className="block text-sm font-medium text-gray-700">
                      Box 1a: Gross Amount of Payment Card/Third Party Network Transactions *
                    </label>
                    <input
                      type="number"
                      name="grossAmount"
                      id="grossAmount"
                      required
                      min="0"
                      step="0.01"
                      value={formData.grossAmount}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>

                  <div>
                    <label htmlFor="numberOfTransactions" className="block text-sm font-medium text-gray-700">
                      Box 3: Number of Payment Transactions
                    </label>
                    <input
                      type="number"
                      name="numberOfTransactions"
                      id="numberOfTransactions"
                      min="0"
                      step="1"
                      value={formData.numberOfTransactions}
                      onChange={handleChange}
                      placeholder="0"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-end gap-x-4">
            <button
              type="button"
              onClick={() => navigate('/forms')}
              className="text-sm font-semibold leading-6 text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Draft'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
