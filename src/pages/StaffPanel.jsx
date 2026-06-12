import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../utils/supabase';
import { 
    Search, Filter, CheckCircle, XCircle, Clock, 
    CreditCard, Users, DollarSign, Eye, X, Image as ImageIcon
} from 'lucide-react';

const StaffPanel = () => {
    const [payments, setPayments] = useState([]);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        todayRevenue: 0,
        activeSubscribers: 0,
        pendingRequests: 0
    });
    
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    
    // Modal state
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [notes, setNotes] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    useEffect(() => {
        fetchData();
        
        // Polling for real-time updates (can also use Supabase realtime but this is simpler given backend route)
        const interval = setInterval(fetchData, 15000); 
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const [payRes, statsRes] = await Promise.all([
                fetch('/api/payments/copanel', {
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                }),
                fetch('/api/payments/copanel/stats', {
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                })
            ]);

            const payData = await payRes.json();
            const statsData = await statsRes.json();

            if (payData.success) {
                setPayments(payData.data);
            }
            if (statsData.success) {
                setStats(statsData.stats);
            }
        } catch (error) {
            console.error('Error fetching copanel data:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (status) => {
        if (!selectedPayment) return;
        
        if (status === 'rejected' && !rejectionReason) {
            toast.error('Please provide a reason for rejection');
            return;
        }

        setIsVerifying(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`/api/payments/copanel/${selectedPayment.id}/verify`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ 
                    status, 
                    rejection_reason: rejectionReason,
                    notes 
                })
            });

            const result = await res.json();
            if (result.success) {
                toast.success(`Payment ${status} successfully!`);
                setSelectedPayment(null);
                setNotes('');
                setRejectionReason('');
                fetchData();
            } else {
                toast.error(result.error || 'Failed to update payment');
            }
        } catch (error) {
            toast.error('Network error while updating payment');
        } finally {
            setIsVerifying(false);
        }
    };

    const filteredPayments = payments.filter(p => {
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
            (p.username && p.username.toLowerCase().includes(searchLower)) ||
            (p.email && p.email.toLowerCase().includes(searchLower)) ||
            (p.utr && p.utr.toLowerCase().includes(searchLower)) ||
            (p.user_id && p.user_id.toLowerCase().includes(searchLower));
        
        return matchesStatus && matchesSearch;
    });

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
    };

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Co-Panel Dashboard</h1>
                        <p className="text-gray-400">Manage subscriptions, view revenue, and approve payments.</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-surface/50 border border-white/5 p-6 rounded-xl flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Total Revenue</p>
                            <h3 className="text-2xl font-bold text-white mt-1">{formatCurrency(stats.totalRevenue)}</h3>
                        </div>
                        <div className="p-3 bg-green-500/20 rounded-full">
                            <DollarSign className="w-6 h-6 text-green-400" />
                        </div>
                    </div>
                    <div className="bg-surface/50 border border-white/5 p-6 rounded-xl flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Today's Revenue</p>
                            <h3 className="text-2xl font-bold text-white mt-1">{formatCurrency(stats.todayRevenue)}</h3>
                        </div>
                        <div className="p-3 bg-blue-500/20 rounded-full">
                            <CreditCard className="w-6 h-6 text-blue-400" />
                        </div>
                    </div>
                    <div className="bg-surface/50 border border-white/5 p-6 rounded-xl flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Active Subscribers</p>
                            <h3 className="text-2xl font-bold text-white mt-1">{stats.activeSubscribers}</h3>
                        </div>
                        <div className="p-3 bg-purple-500/20 rounded-full">
                            <Users className="w-6 h-6 text-purple-400" />
                        </div>
                    </div>
                    <div className="bg-surface/50 border border-white/5 p-6 rounded-xl flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Pending Requests</p>
                            <h3 className="text-2xl font-bold text-white mt-1">{stats.pendingRequests}</h3>
                        </div>
                        <div className="p-3 bg-orange-500/20 rounded-full">
                            <Clock className="w-6 h-6 text-orange-400" />
                        </div>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-surface/50 border border-white/5 p-4 rounded-xl flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input 
                            type="text"
                            placeholder="Search by User, Email, or UTR..."
                            className="w-full bg-surface border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-primary outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Filter className="text-gray-400 w-5 h-5" />
                        <select 
                            className="bg-surface border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary outline-none"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-surface/50 border border-white/5 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-300">
                            <thead className="bg-surface text-gray-400">
                                <tr>
                                    <th className="px-6 py-4 font-medium">User Details</th>
                                    <th className="px-6 py-4 font-medium">Plan & Amount</th>
                                    <th className="px-6 py-4 font-medium">Transaction info</th>
                                    <th className="px-6 py-4 font-medium">Date & Time</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center">Loading submissions...</td>
                                    </tr>
                                ) : filteredPayments.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center">No submissions found matching criteria.</td>
                                    </tr>
                                ) : (
                                    filteredPayments.map(p => (
                                        <tr key={p.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-white">{p.username}</div>
                                                <div className="text-xs text-gray-400">{p.email}</div>
                                                <div className="text-[10px] text-gray-500 truncate w-32" title={p.user_id}>ID: {p.user_id}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="inline-block px-2 py-1 bg-primary/20 text-primary text-xs rounded-full mb-1">
                                                    {p.plan_name}
                                                </div>
                                                <div className="font-medium text-white">{formatCurrency(p.amount)}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-white">UTR: {p.utr}</div>
                                                <div className="text-xs text-gray-400">Method: {p.payment_method || 'UPI'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>{new Date(p.created_at).toLocaleDateString()}</div>
                                                <div className="text-xs text-gray-400">{new Date(p.created_at).toLocaleTimeString()}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {p.status === 'pending' && <span className="flex items-center text-orange-400"><Clock className="w-4 h-4 mr-1"/> Pending</span>}
                                                {p.status === 'approved' && <span className="flex items-center text-green-400"><CheckCircle className="w-4 h-4 mr-1"/> Approved</span>}
                                                {p.status === 'rejected' && <span className="flex items-center text-red-400"><XCircle className="w-4 h-4 mr-1"/> Rejected</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button 
                                                    onClick={() => {
                                                        setSelectedPayment(p);
                                                        setNotes(p.notes || '');
                                                    }}
                                                    className="p-2 bg-surface hover:bg-white/10 text-white rounded-lg transition-colors border border-white/10"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* Verification Modal */}
            <AnimatePresence>
                {selectedPayment && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-surface border border-white/10 p-6 rounded-xl w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[90vh]"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-white">Review Payment</h2>
                                <button onClick={() => setSelectedPayment(null)} className="text-gray-400 hover:text-white">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Details Column */}
                                <div className="space-y-4">
                                    <div className="bg-background p-4 rounded-lg border border-white/5 space-y-3">
                                        <h3 className="font-medium text-white border-b border-white/10 pb-2">User Information</h3>
                                        <div className="grid grid-cols-3 gap-2 text-sm">
                                            <span className="text-gray-400">Name:</span>
                                            <span className="col-span-2 text-white">{selectedPayment.username}</span>
                                            <span className="text-gray-400">Email:</span>
                                            <span className="col-span-2 text-white">{selectedPayment.email}</span>
                                            <span className="text-gray-400">ID:</span>
                                            <span className="col-span-2 text-gray-300 text-xs break-all">{selectedPayment.user_id}</span>
                                        </div>
                                    </div>

                                    <div className="bg-background p-4 rounded-lg border border-white/5 space-y-3">
                                        <h3 className="font-medium text-white border-b border-white/10 pb-2">Payment Details</h3>
                                        <div className="grid grid-cols-3 gap-2 text-sm">
                                            <span className="text-gray-400">Plan:</span>
                                            <span className="col-span-2 text-primary font-medium">{selectedPayment.plan_name}</span>
                                            <span className="text-gray-400">Amount:</span>
                                            <span className="col-span-2 text-white">{formatCurrency(selectedPayment.amount)}</span>
                                            <span className="text-gray-400">UTR:</span>
                                            <span className="col-span-2 text-white font-mono">{selectedPayment.utr}</span>
                                            <span className="text-gray-400">Method:</span>
                                            <span className="col-span-2 text-white">{selectedPayment.payment_method || 'UPI'}</span>
                                            <span className="text-gray-400">Date:</span>
                                            <span className="col-span-2 text-white">{new Date(selectedPayment.created_at).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Screenshot & Actions Column */}
                                <div className="space-y-4 flex flex-col h-full">
                                    <div className="bg-background p-4 rounded-lg border border-white/5 flex-grow flex flex-col">
                                        <h3 className="font-medium text-white border-b border-white/10 pb-2 mb-3">Screenshot</h3>
                                        <div className="flex-grow flex items-center justify-center bg-surface/50 rounded-lg overflow-hidden border border-white/5 min-h-[200px]">
                                            {selectedPayment.screenshot_url ? (
                                                <img 
                                                    src={selectedPayment.screenshot_url} 
                                                    alt="Payment Screenshot" 
                                                    className="max-w-full max-h-full object-contain cursor-pointer"
                                                    onClick={() => window.open(selectedPayment.screenshot_url, '_blank')}
                                                    title="Click to open original"
                                                />
                                            ) : (
                                                <div className="text-gray-500 flex flex-col items-center">
                                                    <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                                                    <p className="text-sm">No screenshot provided</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Staff Notes & Actions */}
                            <div className="mt-6 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400">Staff Notes (Visible to staff only)</label>
                                    <textarea 
                                        className="w-full bg-background border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary outline-none min-h-[80px]"
                                        placeholder="Add internal notes about this payment..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        readOnly={selectedPayment.status !== 'pending' && selectedPayment.status !== 'rejected'} // Allow updating notes later maybe, but let's keep it simple
                                    ></textarea>
                                </div>

                                {selectedPayment.status === 'pending' && (
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400">Rejection Reason (If rejecting)</label>
                                        <input 
                                            type="text"
                                            className="w-full bg-background border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-red-500 outline-none"
                                            placeholder="Enter reason for rejection..."
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                        />
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                                    <button 
                                        onClick={() => setSelectedPayment(null)}
                                        className="px-6 py-2 rounded-lg bg-surface border border-white/10 text-white hover:bg-white/5 transition-colors"
                                    >
                                        Close
                                    </button>
                                    
                                    {selectedPayment.status === 'pending' && (
                                        <>
                                            <button 
                                                onClick={() => handleVerify('rejected')}
                                                disabled={isVerifying}
                                                className="px-6 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/20 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                                            >
                                                {isVerifying ? 'Processing...' : 'Reject'}
                                            </button>
                                            <button 
                                                onClick={() => handleVerify('approved')}
                                                disabled={isVerifying}
                                                className="px-6 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50"
                                            >
                                                {isVerifying ? 'Processing...' : 'Approve & Activate'}
                                            </button>
                                        </>
                                    )}
                                    {selectedPayment.status !== 'pending' && (
                                         <button 
                                            onClick={async () => {
                                                // Optional: Just update notes for an already processed payment
                                                setIsVerifying(true);
                                                const { data: { session } } = await supabase.auth.getSession();
                                                await fetch(`/api/payments/copanel/${selectedPayment.id}/verify`, {
                                                    method: 'POST',
                                                    headers: { 
                                                        'Content-Type': 'application/json',
                                                        'Authorization': `Bearer ${session.access_token}`
                                                    },
                                                    body: JSON.stringify({ status: selectedPayment.status, notes })
                                                });
                                                toast.success("Notes updated");
                                                setIsVerifying(false);
                                                fetchData();
                                                setSelectedPayment(null);
                                            }}
                                            disabled={isVerifying}
                                            className="px-6 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                                         >
                                            {isVerifying ? 'Saving...' : 'Save Notes'}
                                         </button>
                                    )}
                                </div>
                            </div>

                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StaffPanel;