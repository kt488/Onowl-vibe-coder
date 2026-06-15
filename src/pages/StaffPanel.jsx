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
        
        // Polling for real-time updates
        const interval = setInterval(fetchData, 15000); 
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setLoading(false);
                toast.error('You must be logged in as Staff/Admin to view this page.');
                return;
            }

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

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i) => ({
            opacity: 1,
            y: 0,
            transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" }
        })
    };

    return (
        <div className="min-h-screen bg-background relative overflow-hidden text-gray-100">
            {/* Glassmorphism Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
                
                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Co-Panel Dashboard</h1>
                        <p className="text-gray-400 mt-2 text-sm sm:text-base">Manage subscriptions, view revenue, and approve payments.</p>
                    </div>
                </motion.div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {[
                        { title: "Total Revenue", value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: "text-green-400", bg: "bg-green-500/20" },
                        { title: "Today's Revenue", value: formatCurrency(stats.todayRevenue), icon: CreditCard, color: "text-blue-400", bg: "bg-blue-500/20" },
                        { title: "Active Subscribers", value: stats.activeSubscribers, icon: Users, color: "text-purple-400", bg: "bg-purple-500/20" },
                        { title: "Pending Requests", value: stats.pendingRequests, icon: Clock, color: "text-orange-400", bg: "bg-orange-500/20" }
                    ].map((stat, i) => (
                        <motion.div 
                            custom={i}
                            initial="hidden"
                            animate="visible"
                            variants={cardVariants}
                            whileHover={{ y: -5, scale: 1.02 }}
                            key={i} 
                            className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-white/10 transition-all duration-300"
                        >
                            <div>
                                <p className="text-gray-400 text-sm font-medium">{stat.title}</p>
                                <h3 className="text-2xl sm:text-3xl font-bold text-white mt-2 tracking-tight">{stat.value}</h3>
                            </div>
                            <div className={`p-4 rounded-xl ${stat.bg} shadow-inner`}>
                                <stat.icon className={`w-7 h-7 ${stat.color}`} />
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Filters and Search */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row gap-4 justify-between items-center shadow-lg"
                >
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
                        <input 
                            type="text"
                            placeholder="Search by User, Email, or UTR..."
                            className="w-full bg-black/20 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-gray-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto relative">
                        <Filter className="absolute left-4 text-gray-400 w-5 h-5 pointer-events-none" />
                        <select 
                            className="w-full md:w-auto bg-black/20 border border-white/10 rounded-xl pl-12 pr-10 py-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all appearance-none cursor-pointer"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                        {/* Custom dropdown arrow */}
                        <div className="absolute right-4 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </motion.div>

                {/* Data Table */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-300 whitespace-nowrap">
                            <thead className="bg-black/40 text-gray-400 backdrop-blur-md">
                                <tr>
                                    <th className="px-6 py-5 font-semibold tracking-wider uppercase text-xs">User Details</th>
                                    <th className="px-6 py-5 font-semibold tracking-wider uppercase text-xs">Plan & Amount</th>
                                    <th className="px-6 py-5 font-semibold tracking-wider uppercase text-xs">Transaction info</th>
                                    <th className="px-6 py-5 font-semibold tracking-wider uppercase text-xs">Date & Time</th>
                                    <th className="px-6 py-5 font-semibold tracking-wider uppercase text-xs">Status</th>
                                    <th className="px-6 py-5 font-semibold tracking-wider uppercase text-xs text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                <AnimatePresence>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                                                <div className="flex flex-col items-center justify-center space-y-3">
                                                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                    <p>Loading submissions...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredPayments.length === 0 ? (
                                        <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                            <td colSpan="6" className="px-6 py-12 text-center text-gray-400 bg-black/20">
                                                No submissions found matching criteria.
                                            </td>
                                        </motion.tr>
                                    ) : (
                                        filteredPayments.map(p => (
                                            <motion.tr 
                                                layout
                                                initial={{ opacity: 0, backgroundColor: "rgba(255,255,255,0)" }} 
                                                animate={{ opacity: 1, backgroundColor: "rgba(255,255,255,0)" }} 
                                                exit={{ opacity: 0 }}
                                                whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                                                key={p.id} 
                                                className="transition-colors border-l-2 border-transparent hover:border-primary"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-white mb-0.5">{p.username}</div>
                                                    <div className="text-xs text-gray-400 mb-0.5">{p.email}</div>
                                                    <div className="text-[10px] text-gray-500 truncate w-32 font-mono" title={p.user_id}>ID: {p.user_id}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="inline-block px-3 py-1 bg-primary/20 text-primary border border-primary/30 font-semibold text-xs rounded-full mb-2">
                                                        {p.plan_name}
                                                    </div>
                                                    <div className="font-bold text-white text-base">{formatCurrency(p.amount)}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-gray-300 font-mono text-xs mb-1 bg-black/30 p-1.5 rounded border border-white/5 w-fit">
                                                        UTR: {p.utr}
                                                    </div>
                                                    <div className="text-xs text-gray-400 flex items-center gap-1">
                                                        <CreditCard className="w-3 h-3"/> {p.payment_method || 'UPI'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-gray-300 mb-0.5">{new Date(p.created_at).toLocaleDateString()}</div>
                                                    <div className="text-xs text-gray-500">{new Date(p.created_at).toLocaleTimeString()}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {p.status === 'pending' && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20"><Clock className="w-3.5 h-3.5 mr-1.5"/> Pending</span>}
                                                    {p.status === 'approved' && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20"><CheckCircle className="w-3.5 h-3.5 mr-1.5"/> Approved</span>}
                                                    {p.status === 'rejected' && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20"><XCircle className="w-3.5 h-3.5 mr-1.5"/> Rejected</span>}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <motion.button 
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => {
                                                            setSelectedPayment(p);
                                                            setNotes(p.notes || '');
                                                        }}
                                                        className="p-2.5 bg-black/40 hover:bg-primary/20 hover:text-primary text-gray-300 rounded-xl transition-all shadow-sm border border-white/10"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </motion.button>
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>

            {/* Verification Modal */}
            <AnimatePresence>
                {selectedPayment && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="bg-[#121214]/90 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 rounded-3xl w-full max-w-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-y-auto max-h-[90vh]"
                        >
                            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                    Review Payment
                                    {selectedPayment.status === 'pending' && <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400 border border-orange-500/20">Action Required</span>}
                                </h2>
                                <button onClick={() => setSelectedPayment(null)} className="text-gray-400 hover:text-white hover:rotate-90 transition-all bg-white/5 p-2 rounded-full">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                                {/* Details Column */}
                                <div className="space-y-6">
                                    <div className="bg-black/30 p-5 rounded-2xl border border-white/5 space-y-4 shadow-inner">
                                        <h3 className="font-semibold text-gray-200 text-sm uppercase tracking-wider">User Information</h3>
                                        <div className="space-y-3">
                                            <div className="flex flex-col">
                                                <span className="text-gray-500 text-xs mb-1">Name</span>
                                                <span className="text-white font-medium">{selectedPayment.username}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-gray-500 text-xs mb-1">Email</span>
                                                <span className="text-white font-medium break-all">{selectedPayment.email}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-gray-500 text-xs mb-1">User ID</span>
                                                <span className="text-gray-400 font-mono text-xs break-all bg-black/50 p-2 rounded-lg border border-white/5">{selectedPayment.user_id}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-black/30 p-5 rounded-2xl border border-white/5 space-y-4 shadow-inner">
                                        <h3 className="font-semibold text-gray-200 text-sm uppercase tracking-wider">Payment Details</h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center bg-primary/10 p-3 rounded-xl border border-primary/20">
                                                <span className="text-gray-400 text-sm">Plan:</span>
                                                <span className="text-primary font-bold">{selectedPayment.plan_name}</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                                                <span className="text-gray-400 text-sm">Amount:</span>
                                                <span className="text-white font-bold">{formatCurrency(selectedPayment.amount)}</span>
                                            </div>
                                            <div className="flex flex-col bg-white/5 p-3 rounded-xl">
                                                <span className="text-gray-500 text-xs mb-1">UTR Number</span>
                                                <span className="text-white font-mono tracking-wider">{selectedPayment.utr}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 mt-2">
                                                <div>
                                                    <span className="text-gray-500 text-xs block mb-1">Method</span>
                                                    <span className="text-gray-300 text-sm">{selectedPayment.payment_method || 'UPI'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500 text-xs block mb-1">Date</span>
                                                    <span className="text-gray-300 text-sm">{new Date(selectedPayment.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Screenshot & Actions Column */}
                                <div className="space-y-6 flex flex-col h-full">
                                    <div className="bg-black/30 p-5 rounded-2xl border border-white/5 flex-grow flex flex-col shadow-inner">
                                        <h3 className="font-semibold text-gray-200 text-sm uppercase tracking-wider mb-4">Proof of Payment</h3>
                                        <div className="flex-grow flex items-center justify-center bg-[#09090b] rounded-xl overflow-hidden border border-white/10 min-h-[250px] relative group">
                                            {selectedPayment.screenshot_url ? (
                                                <>
                                                    <img 
                                                        src={selectedPayment.screenshot_url} 
                                                        alt="Payment Screenshot" 
                                                        className="w-full h-full object-contain cursor-zoom-in transition-transform duration-500 group-hover:scale-105"
                                                        onClick={() => window.open(selectedPayment.screenshot_url, '_blank')}
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                                        <span className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-medium">Click to enlarge</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-gray-500 flex flex-col items-center">
                                                    <ImageIcon className="w-12 h-12 mb-3 opacity-20" />
                                                    <p className="text-sm font-medium">No screenshot uploaded</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Staff Notes & Actions */}
                            <div className="mt-8 space-y-5 bg-white/5 p-6 rounded-2xl border border-white/10">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Internal Notes <span className="text-gray-500 font-normal">(Staff only)</span></label>
                                    <textarea 
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:ring-2 focus:ring-primary outline-none min-h-[100px] placeholder:text-gray-600 transition-all"
                                        placeholder="Add private notes about this transaction..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    ></textarea>
                                </div>

                                <AnimatePresence>
                                    {selectedPayment.status === 'pending' && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-2 overflow-hidden"
                                        >
                                            <label className="text-sm font-medium text-gray-300 mt-4 block">Rejection Reason <span className="text-red-400 font-normal">*Required if rejecting</span></label>
                                            <input 
                                                type="text"
                                                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:ring-2 focus:ring-red-500 outline-none placeholder:text-gray-600 transition-all"
                                                placeholder="e.g., Invalid UTR, Amount mismatch..."
                                                value={rejectionReason}
                                                onChange={(e) => setRejectionReason(e.target.value)}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-white/10 mt-6">
                                    <button 
                                        onClick={() => setSelectedPayment(null)}
                                        className="px-6 py-3 rounded-xl bg-transparent border border-white/20 text-white hover:bg-white/10 font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    
                                    {selectedPayment.status === 'pending' ? (
                                        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                                            <button 
                                                onClick={() => handleVerify('rejected')}
                                                disabled={isVerifying}
                                                className="px-6 py-3 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white font-medium transition-all disabled:opacity-50 flex-1 sm:flex-none"
                                            >
                                                {isVerifying ? 'Processing...' : 'Reject Payment'}
                                            </button>
                                            <button 
                                                onClick={() => handleVerify('approved')}
                                                disabled={isVerifying}
                                                className="px-6 py-3 rounded-xl bg-primary text-white hover:bg-primary/90 font-medium shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all disabled:opacity-50 flex-1 sm:flex-none"
                                            >
                                                {isVerifying ? 'Processing...' : 'Approve & Activate'}
                                            </button>
                                        </div>
                                    ) : (
                                         <button 
                                            onClick={async () => {
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
                                            className="px-8 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 font-medium transition-colors disabled:opacity-50"
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