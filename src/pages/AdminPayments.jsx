import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../utils/supabase'; // Assuming existing setup

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    const { data } = await fetch('/api/payments/admin').then(r => r.json());
    setPayments(data);
  };

  const handleVerify = async (id, status) => {
    await fetch(`/api/payments/admin/${id}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    toast.success(`Payment ${status}`);
    fetchPayments();
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Payment Requests</h2>
      <table className="w-full bg-white shadow rounded">
        <thead>
          <tr>
            <th className="p-3 text-left">User</th>
            <th className="p-3 text-left">UTR</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {payments.map(p => (
            <tr key={p.id} className="border-t">
              <td className="p-3">{p.user_id}</td>
              <td className="p-3">{p.utr}</td>
              <td className="p-3">{p.status}</td>
              <td className="p-3 flex gap-2">
                {p.status === 'pending' && (
                  <>
                    <button onClick={() => handleVerify(p.id, 'approved')} className="bg-green-500 text-white px-2 py-1 rounded">Approve</button>
                    <button onClick={() => handleVerify(p.id, 'rejected')} className="bg-red-500 text-white px-2 py-1 rounded">Reject</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminPayments;
