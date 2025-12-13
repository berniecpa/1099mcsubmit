import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formsApi, Form1099 } from '../lib/api';

export default function Forms() {
  const [forms, setForms] = useState<Form1099[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState<number | undefined>();
  const [filterStatus, setFilterStatus] = useState<string>('');

  useEffect(() => {
    loadForms();
  }, [filterYear, filterStatus]);

  const loadForms = async () => {
    try {
      const filters: any = {};
      if (filterYear) filters.taxYear = filterYear;
      if (filterStatus) filters.status = filterStatus;

      const data = await formsApi.getAll(filters);
      setForms(data);
    } catch (error) {
      console.error('Failed to load forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (cents: number | undefined | null) => {
    if (!cents) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="px-4 sm:px-0">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">1099 Forms</h1>
          <p className="mt-2 text-sm text-gray-700">
            Create, manage, and submit 1099 forms to the IRS.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            to="/forms/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            Create Form
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700">
              Tax Year
            </label>
            <select
              id="year"
              value={filterYear || ''}
              onChange={(e) => setFilterYear(e.target.value ? parseInt(e.target.value) : undefined)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
            >
              <option value="">All Years</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING">Pending</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Forms Table */}
      <div className="mt-6 bg-white shadow rounded-lg">
        {loading ? (
          <div className="p-6">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : forms.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">
              {filterYear || filterStatus ? 'No forms match the selected filters.' : 'No forms yet. Create your first 1099 form.'}
            </p>
            <Link
              to="/forms/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Create Form
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Form Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tax Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {forms.map((form) => {
                  const amount =
                    form.nonemployeeCompensation ||
                    form.grossAmount ||
                    form.rents ||
                    form.royalties ||
                    0;

                  return (
                    <tr key={form.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {form.recipient?.name || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        1099-{form.formType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {form.taxYear}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatAmount(amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
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
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link to={`/forms/${form.id}`} className="text-blue-600 hover:text-blue-900">
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
