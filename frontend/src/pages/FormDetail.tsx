import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formsApi, Form1099 } from '../lib/api';

export default function FormDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form1099 | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadForm();
  }, [id]);

  const loadForm = async () => {
    if (!id) return;

    try {
      const data = await formsApi.getOne(id);
      setForm(data);
    } catch (error) {
      console.error('Failed to load form:', error);
      setError('Failed to load form');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!id || !form) return;

    if (!confirm('Are you sure you want to submit this form to the IRS? This action cannot be undone.')) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const updatedForm = await formsApi.submit(id);
      setForm(updatedForm);
      alert('Form submitted successfully!');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to submit form';
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !form) return;

    if (!confirm('Are you sure you want to delete this form?')) {
      return;
    }

    try {
      await formsApi.delete(id);
      navigate('/forms');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete form');
    }
  };

  const formatAmount = (cents: number | undefined | null) => {
    if (!cents) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="px-4 sm:px-0">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="px-4 sm:px-0">
        <p className="text-red-600">Form not found</p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-0">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">1099-{form.formType} Form</h1>
          <p className="mt-1 text-sm text-gray-600">Tax Year {form.taxYear}</p>
        </div>
        <div className="flex gap-2">
          {form.status === 'DRAFT' && (
            <>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit to IRS'}
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Status */}
      <div className="mb-6 bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Filing Status</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className="mt-1">
              <span
                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  form.status === 'ACCEPTED'
                    ? 'bg-green-100 text-green-800'
                    : form.status === 'SUBMITTED'
                    ? 'bg-blue-100 text-blue-800'
                    : form.status === 'REJECTED'
                    ? 'bg-red-100 text-red-800'
                    : form.status === 'PENDING'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {form.status}
              </span>
            </p>
          </div>
          {form.submittedAt && (
            <div>
              <p className="text-sm text-gray-500">Submitted</p>
              <p className="mt-1 text-sm text-gray-900">{formatDate(form.submittedAt)}</p>
            </div>
          )}
          {form.acceptedAt && (
            <div>
              <p className="text-sm text-gray-500">Accepted</p>
              <p className="mt-1 text-sm text-gray-900">{formatDate(form.acceptedAt)}</p>
            </div>
          )}
          {form.errorMessage && (
            <div className="col-span-2">
              <p className="text-sm text-gray-500">Error</p>
              <p className="mt-1 text-sm text-red-600">{form.errorMessage}</p>
            </div>
          )}
        </div>
      </div>

      {/* Recipient Information */}
      <div className="mb-6 bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recipient Information</h2>
        {form.recipient && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="mt-1 text-sm text-gray-900">{form.recipient.name}</p>
            </div>
            {form.recipient.businessName && (
              <div>
                <p className="text-sm text-gray-500">Business Name</p>
                <p className="mt-1 text-sm text-gray-900">{form.recipient.businessName}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">TIN</p>
              <p className="mt-1 text-sm text-gray-900">***-**-{form.recipient.tin.slice(-4)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="mt-1 text-sm text-gray-900">
                {form.recipient.address}
                <br />
                {form.recipient.city}, {form.recipient.state} {form.recipient.zipCode}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Payment Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h2>

        {form.formType === 'NEC' && (
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-gray-600">Box 1: Non-employee Compensation</span>
              <span className="text-sm font-medium text-gray-900">
                {formatAmount(form.nonemployeeCompensation)}
              </span>
            </div>
          </div>
        )}

        {form.formType === 'MISC' && (
          <div className="space-y-3">
            {form.rents && (
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-gray-600">Box 1: Rents</span>
                <span className="text-sm font-medium text-gray-900">{formatAmount(form.rents)}</span>
              </div>
            )}
            {form.royalties && (
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-gray-600">Box 2: Royalties</span>
                <span className="text-sm font-medium text-gray-900">{formatAmount(form.royalties)}</span>
              </div>
            )}
            {form.otherIncome && (
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-gray-600">Box 3: Other Income</span>
                <span className="text-sm font-medium text-gray-900">{formatAmount(form.otherIncome)}</span>
              </div>
            )}
            {form.federalIncomeTaxWithheld && (
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-gray-600">Box 4: Federal Income Tax Withheld</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatAmount(form.federalIncomeTaxWithheld)}
                </span>
              </div>
            )}
            {form.medicalHealthcare && (
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-gray-600">Box 6: Medical and Health Care Payments</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatAmount(form.medicalHealthcare)}
                </span>
              </div>
            )}
          </div>
        )}

        {form.formType === 'K' && (
          <div className="space-y-3">
            {form.grossAmount && (
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-gray-600">
                  Box 1a: Gross Amount of Payment Transactions
                </span>
                <span className="text-sm font-medium text-gray-900">{formatAmount(form.grossAmount)}</span>
              </div>
            )}
            {form.numberOfTransactions && (
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-gray-600">Box 3: Number of Transactions</span>
                <span className="text-sm font-medium text-gray-900">{form.numberOfTransactions}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
