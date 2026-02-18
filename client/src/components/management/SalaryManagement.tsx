import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import { Staff } from '../../types';

interface SalaryRow extends Staff {
  lastPayment?: {
    amount: number;
    paidAt: string;
  } | null;
}

const SalaryManagement: React.FC = () => {
  const [rows, setRows] = useState<SalaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingSalary, setEditingSalary] = useState<Record<string, string>>({});
  const [paymentModal, setPaymentModal] = useState<{
    open: boolean;
    userId?: string;
    name?: string;
    amount?: string;
    paidAt?: string;
    notes?: string;
  }>({ open: false });

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const data = await apiService.getSalaryOverview();
      const staff = (data.staff || []).map((s: any) => ({
        ...s,
        id: s.id || s._id
      }));
      setRows(staff);
      setError('');
    } catch (err) {
      setError('Failed to load salary data');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleSalarySave = async (userId: string) => {
    try {
      const salaryValue = Number(editingSalary[userId]);
      await apiService.setSalary(userId, salaryValue);
      setEditingSalary((prev) => ({ ...prev, [userId]: '' }));
      await fetchOverview();
    } catch (err) {
      setError('Failed to update salary');
    }
  };

  const openPaymentModal = (row: SalaryRow) => {
    setPaymentModal({
      open: true,
      userId: row.id,
      name: row.name,
      amount: row.salary ? String(row.salary) : '',
      paidAt: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  const closePaymentModal = () => {
    setPaymentModal({ open: false });
  };

  const handleRecordPayment = async () => {
    if (!paymentModal.userId) return;
    try {
      await apiService.recordSalaryPayment(paymentModal.userId, {
        amount: paymentModal.amount ? Number(paymentModal.amount) : undefined,
        paidAt: paymentModal.paidAt,
        notes: paymentModal.notes
      });
      closePaymentModal();
      await fetchOverview();
    } catch (err) {
      setError('Failed to record payment');
    }
  };

  return (
    <div className="bg-white/80 rounded-2xl border border-gray-200/60 shadow-sm backdrop-blur">
      <div className="p-6 border-b border-gray-200/60">
        <h2 className="text-2xl font-bold text-gray-900">Salary Management</h2>
        <p className="text-gray-600 mt-1">Set monthly salaries and record payments</p>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading salary data...</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No service providers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Salary</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Paid</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{row.name}</div>
                      <div className="text-sm text-gray-500">{row.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.department || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="0"
                          value={editingSalary[row.id] ?? (row.salary ?? 0)}
                          onChange={(e) => setEditingSalary((prev) => ({ ...prev, [row.id]: e.target.value }))}
                          className="w-28 px-2 py-1 border border-gray-300 rounded-md text-sm"
                        />
                        <button
                          onClick={() => handleSalarySave(row.id)}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700"
                        >
                          Save
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.lastPayment ? (
                        <div>
                          <div>${row.lastPayment.amount.toFixed(2)}</div>
                          <div className="text-xs text-gray-500">{new Date(row.lastPayment.paidAt).toLocaleDateString()}</div>
                        </div>
                      ) : (
                        <span className="text-gray-500">Not paid yet</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => openPaymentModal(row)}
                        className="px-3 py-1 bg-emerald-600 text-white text-xs rounded-md hover:bg-emerald-700"
                      >
                        Record Payment
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {paymentModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Record Payment - {paymentModal.name}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  min="0"
                  value={paymentModal.amount || ''}
                  onChange={(e) => setPaymentModal((prev) => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paid Date</label>
                <input
                  type="date"
                  value={paymentModal.paidAt || ''}
                  onChange={(e) => setPaymentModal((prev) => ({ ...prev, paidAt: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea
                  value={paymentModal.notes || ''}
                  onChange={(e) => setPaymentModal((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={closePaymentModal}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordPayment}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryManagement;
