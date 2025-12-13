import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { recipientsApi, Recipient } from '../lib/api';

export default function Recipients() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecipients();
  }, []);

  const loadRecipients = async () => {
    try {
      const data = await recipientsApi.getAll();
      setRecipients(data);
    } catch (error) {
      console.error('Failed to load recipients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recipient?')) {
      return;
    }

    try {
      await recipientsApi.delete(id);
      setRecipients(recipients.filter((r) => r.id !== id));
    } catch (error) {
      console.error('Failed to delete recipient:', error);
      alert('Failed to delete recipient');
    }
  };

  const maskTIN = (tin: string) => {
    return `***-**-${tin.slice(-4)}`;
  };

  return (
    <div className="px-4 sm:px-0">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Recipients</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your contractors and vendors who will receive 1099 forms.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            to="/recipients/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            Add Recipient
          </Link>
        </div>
      </div>

      <div className="mt-8 bg-white shadow rounded-lg">
        {loading ? (
          <div className="p-6">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : recipients.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No recipients yet. Add your first recipient to get started.</p>
            <Link
              to="/recipients/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Add Recipient
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    TIN
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recipients.map((recipient) => (
                  <tr key={recipient.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{recipient.name}</div>
                      {recipient.businessName && (
                        <div className="text-sm text-gray-500">{recipient.businessName}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{maskTIN(recipient.tin)}</div>
                      <div className="text-sm text-gray-500">{recipient.tinType}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{recipient.address}</div>
                      <div className="text-sm text-gray-500">
                        {recipient.city}, {recipient.state} {recipient.zipCode}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {recipient.email && <div className="text-sm text-gray-900">{recipient.email}</div>}
                      {recipient.phone && <div className="text-sm text-gray-500">{recipient.phone}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/recipients/${recipient.id}/edit`}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(recipient.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
