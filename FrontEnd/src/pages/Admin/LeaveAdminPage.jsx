import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    Search,
    Filter,
    Download,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    Calendar,
    User,
    Mail,
    Phone,
    Building,
    FileText,
    ChevronDown,
    ChevronUp,
    RefreshCw
} from "lucide-react";

const AdminLeavesPage = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [actionLoading, setActionLoading] = useState(null);
    const [expandedLeave, setExpandedLeave] = useState(null);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0
    });

    useEffect(() => {
        fetchAllLeaves();
    }, []);

    // Check for invalid data after leaves are fetched
    useEffect(() => {
        if (leaves.length > 0) {
            const invalidLeaves = leaves.filter(leave => !leave.internId);
            if (invalidLeaves.length > 0) {
                console.warn(`Found ${invalidLeaves.length} leaves with missing intern data.`);
            }
        }
    }, [leaves]);

    const fetchAllLeaves = async () => {
        try {
            setLoading(true);
            const response = await axios.get("/api/admin/leaves", {
                withCredentials: true,
            });

            if (response.data.success) {
                setLeaves(response.data.leaves);
                calculateStats(response.data.leaves);
            }
        } catch (error) {
            console.error("Error fetching leaves:", error);
            alert("Failed to fetch leaves data");
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (leavesData) => {
        const stats = {
            total: leavesData.length,
            pending: leavesData.filter(leave => leave.status === "Pending").length,
            approved: leavesData.filter(leave => leave.status === "Approved").length,
            rejected: leavesData.filter(leave => leave.status === "Rejected").length
        };
        setStats(stats);
    };

    const handleLeaveAction = async (leaveId, action) => {
        const leave = leaves.find(l => l._id === leaveId);
        
        // Safely get intern name with fallback
        const internName = leave?.internId?.fullName || 'Unknown Intern';
        
        const confirmMessage = action === 'approve'
            ? `Are you sure you want to APPROVE the leave request for ${internName}?`
            : `Are you sure you want to REJECT the leave request for ${internName}?`;

        if (!window.confirm(confirmMessage)) return;

        try {
            setActionLoading(leaveId);
            const response = await axios.post(
                `/api/admin/leaves/${leaveId}/${action}`,
                {},
                { withCredentials: true }
            );

            if (response.data.success) {
                // Update the leave status in local state
                setLeaves(prevLeaves =>
                    prevLeaves.map(leave =>
                        leave._id === leaveId
                            ? { ...leave, status: action === 'approve' ? 'Approved' : 'Rejected' }
                            : leave
                    )
                );

                // Recalculate stats
                const updatedLeaves = leaves.map(leave =>
                    leave._id === leaveId
                        ? { ...leave, status: action === 'approve' ? 'Approved' : 'Rejected' }
                        : leave
                );
                calculateStats(updatedLeaves);

                alert(response.data.message);
            }
        } catch (error) {
            console.error(`Error ${action}ing leave:`, error);
            alert(`Failed to ${action} leave`);
        } finally {
            setActionLoading(null);
        }
    };

    const toggleExpandLeave = (leaveId) => {
        setExpandedLeave(expandedLeave === leaveId ? null : leaveId);
    };

    const exportToCSV = () => {
        const headers = [
            'Intern Name',
            'Intern ID',
            'Email',
            'Domain',
            'Leave Type',
            'Start Date',
            'End Date',
            'Total Days',
            'Reason',
            'Status',
            'Applied Date'
        ];

        const csvData = filteredLeaves.map(leave => {
            const intern = leave.internId || {};
            return [
                intern.fullName || 'Unknown',
                leave.uniqueId || 'N/A',
                intern.email || 'N/A',
                intern.domain || 'N/A',
                leave.leaveType || 'Unknown',
                new Date(leave.startDate).toLocaleDateString(),
                new Date(leave.endDate).toLocaleDateString(),
                leave.totalDays || 0,
                `"${(leave.reason || '').replace(/"/g, '""')}"`,
                leave.status || 'Unknown',
                new Date(leave.createdAt).toLocaleDateString()
            ];
        });

        const csvContent = [
            headers.join(','),
            ...csvData.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `leaves-data-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
    };

    const filteredLeaves = leaves.filter(leave => {
        // Skip leaves with null internId
        if (!leave.internId) return false;
        
        // Safely get intern properties with fallbacks
        const internName = leave.internId.fullName || '';
        const uniqueId = leave.uniqueId || '';
        const internEmail = leave.internId.email || '';
        const internDomain = leave.internId.domain || '';

        const matchesSearch =
            internName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            uniqueId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            internEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
            internDomain.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = !statusFilter || leave.status === statusFilter;
        const matchesType = !typeFilter || leave.leaveType === typeFilter;

        const matchesDate = !dateFilter ||
            (leave.startDate && new Date(leave.startDate).toISOString().split('T')[0] === dateFilter);

        return matchesSearch && matchesStatus && matchesType && matchesDate;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case "Pending": return "bg-yellow-100 text-yellow-800 border border-yellow-200";
            case "Approved": return "bg-green-100 text-green-800 border border-green-200";
            case "Rejected": return "bg-red-100 text-red-800 border border-red-200";
            default: return "bg-gray-100 text-gray-800 border border-gray-200";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "Pending": return <Clock size={16} className="text-yellow-600" />;
            case "Approved": return <CheckCircle size={16} className="text-green-600" />;
            case "Rejected": return <XCircle size={16} className="text-red-600" />;
            default: return <Clock size={16} className="text-gray-600" />;
        }
    };

    const getLeaveTypeColor = (type) => {
        if (!type) return "bg-gray-50 text-gray-700 border border-gray-200";
        
        switch (type.toLowerCase()) {
            case "sick": return "bg-red-50 text-red-700 border border-red-200";
            case "casual": return "bg-blue-50 text-blue-700 border border-blue-200";
            case "emergency": return "bg-orange-50 text-orange-700 border border-orange-200";
            default: return "bg-gray-50 text-gray-700 border border-gray-200";
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">Loading leaves data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
                        <p className="text-gray-600 mt-1">Manage all intern leave requests</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchAllLeaves}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-semibold"
                        >
                            <RefreshCw size={18} />
                            Refresh
                        </button>
                        <button
                            onClick={exportToCSV}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-200 font-semibold"
                        >
                            <Download size={18} />
                            Export CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Leaves</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
                        </div>
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                            <FileText className="text-white" size={28} />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Pending</p>
                            <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending}</p>
                        </div>
                        <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Clock className="text-white" size={28} />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Approved</p>
                            <p className="text-3xl font-bold text-green-600 mt-2">{stats.approved}</p>
                        </div>
                        <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                            <CheckCircle className="text-white" size={28} />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Rejected</p>
                            <p className="text-3xl font-bold text-red-600 mt-2">{stats.rejected}</p>
                        </div>
                        <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                            <XCircle className="text-white" size={28} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                    {/* Search */}
                    <div className="lg:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Search
                        </label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by name, ID, email, or domain..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Status
                        </label>
                        <div className="relative">
                            <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 appearance-none bg-gray-50 focus:bg-white"
                            >
                                <option value="">All Status</option>
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </div>
                    </div>

                    {/* Type Filter */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Leave Type
                        </label>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                        >
                            <option value="">All Types</option>
                            <option value="Sick Leave">🏥 Sick Leave</option>
                            <option value="Personal Leave">👤 Personal Leave</option>
                            <option value="Family Emergency">👨‍👩‍👧‍👦 Family Emergency</option>
                            <option value="Vacation">🏖️ Vacation</option>
                            <option value="Medical Appointment">🩺 Medical Appointment</option>
                            <option value="Wedding">💒 Wedding</option>
                            <option value="Maternity/Paternity Leave">👶 Maternity/Paternity Leave</option>
                            <option value="Bereavement">😔 Bereavement</option>
                            <option value="Religious Observance">🛐 Religious Observance</option>
                            <option value="Other">📝 Other</option>
                        </select>
                    </div>
                    
                    {/* Date Filter */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                        />
                    </div>
                </div>

                {/* Active Filters Indicator */}
                {(searchTerm || statusFilter || typeFilter || dateFilter) && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Filter size={18} className="text-blue-600" />
                                <span className="text-sm font-semibold text-blue-800">
                                    Active filters:
                                    {searchTerm && ` Search: "${searchTerm}"`}
                                    {statusFilter && ` Status: ${statusFilter}`}
                                    {typeFilter && ` Type: ${typeFilter}`}
                                    {dateFilter && ` Date: ${dateFilter}`}
                                </span>
                            </div>
                            <button
                                onClick={() => {
                                    setSearchTerm("");
                                    setStatusFilter("");
                                    setTypeFilter("");
                                    setDateFilter("");
                                }}
                                className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
                            >
                                Clear All
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Leaves Table */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Intern & Leave Details
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Contact Info
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Leave Period
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredLeaves.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <FileText className="w-16 h-16 text-gray-300 mb-4" />
                                            <p className="text-gray-500 text-lg font-semibold">
                                                {leaves.length === 0 ? "No leave requests found." : "No leaves match your search criteria."}
                                            </p>
                                            <p className="text-gray-400 text-sm mt-2">
                                                {leaves.length === 0 ? "Leave requests will appear here when interns apply." : "Try adjusting your search or filters."}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredLeaves.map((leave) => {
                                    // Safely extract intern data with fallbacks
                                    const intern = leave.internId || {};
                                    const internName = intern.fullName || 'Unknown Intern';
                                    const internEmail = intern.email || 'No email';
                                    const internMobile = intern.mobile || 'No phone';
                                    const internDomain = intern.domain || 'No domain';

                                    return (
                                        <React.Fragment key={leave._id}>
                                            <tr className="hover:bg-gray-50 transition-colors duration-150 group cursor-pointer" onClick={() => toggleExpandLeave(leave._id)}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                                                            <User size={20} className="text-white" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-semibold text-gray-900 text-sm">{internName}</p>
                                                            <p className="text-xs text-gray-500 mt-1">ID: {leave.uniqueId || 'N/A'}</p>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getLeaveTypeColor(leave.leaveType)}`}>
                                                                    {leave.leaveType || 'Unknown Type'}
                                                                </span>
                                                                <span className="inline-flex px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold border border-blue-200">
                                                                    {internDomain}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center space-x-2 text-sm text-gray-700">
                                                            <Mail size={14} className="text-gray-400" />
                                                            <span className="font-medium">{internEmail}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-2 text-sm text-gray-700">
                                                            <Phone size={14} className="text-gray-400" />
                                                            <span className="font-medium">{internMobile}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center space-x-2 text-sm text-gray-700">
                                                            <Calendar size={14} className="text-gray-400" />
                                                            <span className="font-medium">
                                                                {leave.startDate ? new Date(leave.startDate).toLocaleDateString() : 'N/A'}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            to {leave.endDate ? new Date(leave.endDate).toLocaleDateString() : 'N/A'}
                                                        </div>
                                                        <div className="text-xs font-semibold text-blue-600">
                                                            {leave.totalDays || 0} day{leave.totalDays !== 1 ? 's' : ''}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {getStatusIcon(leave.status)}
                                                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(leave.status)}`}>
                                                            {leave.status || 'Unknown'}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Applied: {leave.createdAt ? new Date(leave.createdAt).toLocaleDateString() : 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {leave.status === "Pending" && (
                                                            <>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleLeaveAction(leave._id, 'approve');
                                                                    }}
                                                                    disabled={actionLoading === leave._id}
                                                                    className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-sm font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                                                                >
                                                                    {actionLoading === leave._id ? (
                                                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                                                    ) : (
                                                                        <CheckCircle size={14} />
                                                                    )}
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleLeaveAction(leave._id, 'reject');
                                                                    }}
                                                                    disabled={actionLoading === leave._id}
                                                                    className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg text-sm font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                                                                >
                                                                    {actionLoading === leave._id ? (
                                                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                                                    ) : (
                                                                        <XCircle size={14} />
                                                                    )}
                                                                    Reject
                                                                </button>
                                                            </>
                                                        )}
                                                        {leave.status !== "Pending" && (
                                                            <span className="text-xs text-gray-500 italic">
                                                                Processed
                                                            </span>
                                                        )}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleExpandLeave(leave._id);
                                                            }}
                                                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                                        >
                                                            {expandedLeave === leave._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Expanded Details */}
                                            {expandedLeave === leave._id && (
                                                <tr>
                                                    <td colSpan="5" className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                            {/* Leave Details */}
                                                            <div>
                                                                <h4 className="font-semibold text-gray-900 mb-3">Leave Details</h4>
                                                                <div className="space-y-2">
                                                                    <div className="flex justify-between">
                                                                        <span className="text-sm text-gray-600">Leave Type:</span>
                                                                        <span className="text-sm font-semibold">{leave.leaveType || 'Unknown'}</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-sm text-gray-600">Duration:</span>
                                                                        <span className="text-sm font-semibold">{leave.totalDays || 0} day{leave.totalDays !== 1 ? 's' : ''}</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-sm text-gray-600">Start Date:</span>
                                                                        <span className="text-sm font-semibold">{leave.startDate ? new Date(leave.startDate).toLocaleDateString() : 'N/A'}</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-sm text-gray-600">End Date:</span>
                                                                        <span className="text-sm font-semibold">{leave.endDate ? new Date(leave.endDate).toLocaleDateString() : 'N/A'}</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-sm text-gray-600">Applied On:</span>
                                                                        <span className="text-sm font-semibold">{leave.createdAt ? new Date(leave.createdAt).toLocaleDateString() : 'N/A'}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Reason */}
                                                            <div>
                                                                <h4 className="font-semibold text-gray-900 mb-3">Reason</h4>
                                                                <div className="bg-white p-4 rounded-xl border border-gray-200">
                                                                    <p className="text-sm text-gray-700 leading-relaxed">{leave.reason || 'No reason provided'}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Summary */}
                {filteredLeaves.length > 0 && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                        <p className="text-sm text-gray-700 font-semibold">
                            Showing {filteredLeaves.length} of {leaves.length} leave requests
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminLeavesPage;