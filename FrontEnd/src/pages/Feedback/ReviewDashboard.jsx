import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
    Download, 
    Search, 
    Filter,
    Video,
    Image,
    LogOut,
    Calendar,
    User,
    Play,
    CheckCircle,
    X,
    Loader,
    FileText,
    Trash2,
    AlertTriangle
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const ReviewTeamDashboard = () => {
    const navigate = useNavigate();
    const [feedbacks, setFeedbacks] = useState([]);
    const [filteredFeedbacks, setFilteredFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exportLoading, setExportLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDomain, setSelectedDomain] = useState("");
    const [selectedMonth, setSelectedMonth] = useState("");
    const [selectedFeedbacks, setSelectedFeedbacks] = useState(new Set());
    const [exportOptions, setExportOptions] = useState({
        includeVideos: true,
        includePhotos: true,
        includeText: true,
        includeCertificate: true,
        format: "excel"
    });
    const [previewMedia, setPreviewMedia] = useState({
        type: "",
        url: "",
        show: false,
        loading: false
    });
    const [mediaErrors, setMediaErrors] = useState(new Set());
    const [updatingStatus, setUpdatingStatus] = useState(new Set());
    const [deletingFeedbacks, setDeletingFeedbacks] = useState(new Set());
    const [deleteConfirm, setDeleteConfirm] = useState({
        show: false,
        feedback: null,
        multiple: false,
        count: 0
    });

    const domains = [
        "Sales & Marketing", "Data Science & Analytics", "Email and Outreaching",'Content Writing',
        "Human Resources", "Social Media Management", "Graphic Design",
        "Digital Marketing", "Video Editing", "Content Creator", "Full Stack Development",
        "UI/UX Designing", "Front-end Developer", "Back-end Developer","MERN Stack Development"
    ];

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    useEffect(() => {
        fetchFeedbacks();
    }, []);

    useEffect(() => {
        filterFeedbacks();
    }, [feedbacks, searchTerm, selectedDomain, selectedMonth]);

    const fetchFeedbacks = async () => {
        try {
            const token = localStorage.getItem("reviewTeamToken");
            const response = await axios.get("/api/review-team/feedbacks", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFeedbacks(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching feedbacks:", error);
            alert("Failed to load feedbacks. Please try again.");
            setLoading(false);
        }
    };

    const filterFeedbacks = () => {
        let filtered = feedbacks;

        if (searchTerm) {
            filtered = filtered.filter(feedback =>
                feedback.internDetails?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                feedback.internDetails?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                feedback.uniqueId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                feedback.internshipInfo?.domain?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                feedback.internshipInfo?.certificateNumber?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (selectedDomain) {
            filtered = filtered.filter(feedback =>
                feedback.internshipInfo?.domain === selectedDomain
            );
        }

        if (selectedMonth) {
            filtered = filtered.filter(feedback => {
                const submittedMonth = new Date(feedback.submittedAt).toLocaleString('default', { month: 'long' });
                return submittedMonth === selectedMonth;
            });
        }

        setFilteredFeedbacks(filtered);
    };

    const handleSelectFeedback = (feedbackId) => {
        const newSelected = new Set(selectedFeedbacks);
        if (newSelected.has(feedbackId)) {
            newSelected.delete(feedbackId);
        } else {
            newSelected.add(feedbackId);
        }
        setSelectedFeedbacks(newSelected);
    };

    const selectAllFeedbacks = () => {
        if (selectedFeedbacks.size === filteredFeedbacks.length) {
            setSelectedFeedbacks(new Set());
        } else {
            setSelectedFeedbacks(new Set(filteredFeedbacks.map(f => f._id)));
        }
    };

    // Delete single feedback
    const handleDeleteFeedback = (feedback) => {
        setDeleteConfirm({
            show: true,
            feedback: feedback,
            multiple: false,
            count: 1
        });
    };

    // Delete multiple feedbacks
    const handleDeleteMultiple = () => {
        if (selectedFeedbacks.size === 0) {
            alert("Please select at least one feedback to delete");
            return;
        }

        setDeleteConfirm({
            show: true,
            feedback: null,
            multiple: true,
            count: selectedFeedbacks.size
        });
    };

    // Confirm and execute deletion
    const confirmDelete = async () => {
        const feedbacksToDelete = deleteConfirm.multiple 
            ? Array.from(selectedFeedbacks) 
            : [deleteConfirm.feedback._id];

        setDeletingFeedbacks(prev => new Set([...prev, ...feedbacksToDelete]));

        try {
            const token = localStorage.getItem("reviewTeamToken");
            
            // Use Promise.all to delete multiple feedbacks
            const deletePromises = feedbacksToDelete.map(feedbackId =>
                axios.delete(`/api/review-team/feedbacks/${feedbackId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            );

            await Promise.all(deletePromises);

            // Remove deleted feedbacks from state
            setFeedbacks(prev => 
                prev.filter(feedback => !feedbacksToDelete.includes(feedback._id))
            );

            // Clear selection
            if (deleteConfirm.multiple) {
                setSelectedFeedbacks(new Set());
            }

            // Show success message
            alert(`✅ Successfully deleted ${feedbacksToDelete.length} feedback${feedbacksToDelete.length > 1 ? 's' : ''}`);

        } catch (error) {
            console.error("Error deleting feedbacks:", error);
            alert("Failed to delete feedbacks. Please try again.");
        } finally {
            setDeletingFeedbacks(prev => {
                const newSet = new Set(prev);
                feedbacksToDelete.forEach(id => newSet.delete(id));
                return newSet;
            });
            setDeleteConfirm({ show: false, feedback: null, multiple: false, count: 0 });
        }
    };

    // Cancel deletion
    const cancelDelete = () => {
        setDeleteConfirm({ show: false, feedback: null, multiple: false, count: 0 });
    };

    const handleExport = async () => {
        if (selectedFeedbacks.size === 0) {
            alert("Please select at least one feedback to export");
            return;
        }

        setExportLoading(true);
        try {
            const token = localStorage.getItem("reviewTeamToken");
            const response = await axios.post(
                "/api/review-team/export-feedbacks",
                {
                    feedbackIds: Array.from(selectedFeedbacks),
                    options: exportOptions
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob'
                }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `intern-feedbacks-${new Date().toISOString().split('T')[0]}.${exportOptions.format === 'excel' ? 'xlsx' : 'csv'}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            document.getElementById('exportModal').close();

        } catch (error) {
            console.error("Export failed:", error);
            alert("Export failed. Please try again.");
        } finally {
            setExportLoading(false);
        }
    };

    const updateCertificateStatus = async (feedbackId, newStatus) => {
        if (!feedbackId || !newStatus) {
            console.error("Missing feedbackId or newStatus");
            alert("Error: Missing required information");
            return;
        }

        setUpdatingStatus(prev => new Set(prev).add(feedbackId));

        try {
            const token = localStorage.getItem("reviewTeamToken");
            if (!token) {
                throw new Error("No authentication token found");
            }

            console.log("Updating status for:", feedbackId, "to:", newStatus);

            const response = await axios.put(
                `/api/review-team/feedbacks/${feedbackId}/certificate`,
                { 
                    certificateStatus: newStatus
                },
                {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const updatedFeedback = response.data.feedback;

            window.location.reload();
            
            setFeedbacks(prevFeedbacks => 
                prevFeedbacks.map(feedback => 
                    feedback._id === feedbackId 
                        ? { ...feedback, certificateStatus: updatedFeedback.certificateStatus }
                        : feedback
                )
            );

            console.log("✅ Status updated successfully:", updatedFeedback.certificateStatus);
            alert(`✅ Certificate status updated to ${newStatus}`);

        } catch (error) {
            console.error("Error updating certificate status:", error);
            
            let errorMessage = "Failed to update certificate status. ";
            
            if (error.response) {
                errorMessage += `Server error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`;
                console.error("Server response:", error.response.data);
            } else if (error.request) {
                errorMessage += "No response from server. Please check your connection.";
            } else {
                errorMessage += error.message;
            }
            
            alert(errorMessage);
            
            setFeedbacks(prevFeedbacks => 
                prevFeedbacks.map(feedback => 
                    feedback._id === feedbackId 
                        ? { ...feedback }
                        : feedback
                )
            );
        } finally {
            setUpdatingStatus(prev => {
                const newSet = new Set(prev);
                newSet.delete(feedbackId);
                return newSet;
            });
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("reviewTeamToken");
        localStorage.removeItem("reviewTeamMember");
        navigate("/review-team-login");
    };

    const openMediaPreview = async (type, url) => {
        if (!url) {
            alert(`No ${type} available for this feedback`);
            return;
        }
        setPreviewMedia({ type, url, show: true, loading: true });
        setMediaErrors(prev => {
            const newErrors = new Set(prev);
            newErrors.delete(url);
            return newErrors;
        });
    };

    const closeMediaPreview = () => {
        setPreviewMedia({ type: "", url: "", show: false, loading: false });
    };

    const handleMediaError = (url) => {
        setMediaErrors(prev => new Set(prev).add(url));
        setPreviewMedia(prev => ({ ...prev, loading: false }));
    };

    const handleMediaLoad = () => {
        setPreviewMedia(prev => ({ ...prev, loading: false }));
    };

    const optimizeCloudinaryUrl = (url, options = {}) => {
        if (!url || !url.includes('cloudinary')) return url;
        
        const baseUrl = url.split('/upload/')[0];
        const publicId = url.split('/upload/')[1];
        
        const transformations = [];
        
        if (options.width) transformations.push(`w_${options.width}`);
        if (options.height) transformations.push(`h_${options.height}`);
        if (options.quality) transformations.push(`q_${options.quality}`);
        if (options.format) transformations.push(`f_${options.format}`);
        
        if (transformations.length === 0) {
            transformations.push('q_auto', 'f_auto');
        }
        
        return `${baseUrl}/upload/${transformations.join(',')}/${publicId}`;
    };

    const getTimeAgo = (date) => {
        if (!date) return 'Unknown';
        const now = new Date();
        const diffInHours = Math.floor((now - new Date(date)) / (1000 * 60 * 60));
        
        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;
        if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
        return new Date(date).toLocaleDateString();
    };

    const StatusBadge = ({ status, feedbackId, onStatusUpdate }) => {
        const statusColors = {
            pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
            issued: "bg-green-100 text-green-800 border-green-200",
            rejected: "bg-red-100 text-red-800 border-red-200"
        };

        const statusOptions = ["pending", "issued", "rejected"];
        const isUpdating = updatingStatus.has(feedbackId);
        // const isDisabled = status === "issued";
        const isDisabled = false;

        return (
            <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 text-xs font-medium rounded-full border ${statusColors[status]}`}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
                <div className="relative">
                    <select
                        value={status}
                        onChange={(e) => onStatusUpdate(feedbackId, e.target.value)}
                        disabled={isDisabled || isUpdating}
                        className="text-xs border border-gray-300 rounded-lg px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
                    >
                        {statusOptions.map(option => (
                            <option key={option} value={option}>
                                {option.charAt(0).toUpperCase() + option.slice(1)}
                            </option>
                        ))}
                    </select>
                    {isUpdating && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded">
                            <Loader size={12} className="animate-spin text-blue-600" />
                        </div>
                    )}
                    {isDisabled && !isUpdating && (
                        <div className="absolute inset-0 flex items-center justify-center bg-green-50 bg-opacity-50 rounded cursor-not-allowed">
                            <CheckCircle size={12} className="text-green-600" />
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">Loading intern feedbacks...</p>
                    <p className="text-gray-400 text-sm mt-2">Please wait while we fetch the latest data</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-xl">
                                <User className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">
                                    Review Team Dashboard
                                </h1>
                                <p className="text-sm text-gray-500">
                                    {feedbacks.length} feedbacks available
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full hidden sm:block">
                                {filteredFeedbacks.length} shown
                            </span>
                            <button
                                onClick={handleLogout}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition duration-200 font-medium"
                            >
                                <LogOut size={16} className="mr-2" />
                                <span className="hidden sm:block">Sign Out</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-2xl shadow-sm border p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Feedbacks</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{feedbacks.length}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <Calendar className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Selected</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{selectedFeedbacks.size}</p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-xl">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Domains</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {new Set(feedbacks.map(f => f.internshipInfo?.domain)).size}
                                </p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-xl">
                                <Filter className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">This Month</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {feedbacks.filter(f => {
                                        const date = new Date(f.submittedAt);
                                        const now = new Date();
                                        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                                    }).length}
                                </p>
                            </div>
                            <div className="p-3 bg-orange-100 rounded-xl">
                                <Download className="h-6 w-6 text-orange-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-sm border p-4 md:p-6 mb-8">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                        {/* Search */}
                        <div className="lg:col-span-2">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name, email, certificate no..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                                />
                            </div>
                        </div>

                        {/* Domain Filter */}
                        <div>
                            <select
                                value={selectedDomain}
                                onChange={(e) => setSelectedDomain(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                            >
                                <option value="">All Domains</option>
                                {domains.map(domain => (
                                    <option key={domain} value={domain}>{domain}</option>
                                ))}
                            </select>
                        </div>

                        {/* Month Filter */}
                        <div>
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                            >
                                <option value="">All Months</option>
                                {months.map(month => (
                                    <option key={month} value={month}>{month}</option>
                                ))}
                            </select>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => document.getElementById('exportModal').showModal()}
                                className="flex-1 flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition duration-200 font-semibold shadow-lg hover:shadow-xl"
                            >
                                <Download size={18} className="mr-2" />
                                <span className="hidden sm:block">Export</span>
                            </button>
                            {selectedFeedbacks.size > 0 && (
                                <button
                                    onClick={handleDeleteMultiple}
                                    className="flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition duration-200 font-semibold shadow-lg hover:shadow-xl min-w-[60px]"
                                    title={`Delete ${selectedFeedbacks.size} selected`}
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Feedback List */}
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-sm border overflow-hidden">
                    {/* Selection Header */}
                    <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 bg-white/50">
                        <div className="flex items-center space-x-4">
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedFeedbacks.size === filteredFeedbacks.length && filteredFeedbacks.length > 0}
                                    onChange={selectAllFeedbacks}
                                    className="h-5 w-5 text-blue-600 rounded-lg focus:ring-blue-500 border-gray-300"
                                />
                                <span className="text-sm font-medium text-gray-700">
                                    Select all ({filteredFeedbacks.length})
                                </span>
                            </label>
                            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                {selectedFeedbacks.size} selected
                            </span>
                        </div>
                        <div className="flex items-center space-x-3">
                            {selectedFeedbacks.size > 0 && (
                                <>
                                    <button
                                        onClick={() => document.getElementById('exportModal').showModal()}
                                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition duration-200 font-semibold shadow-lg text-sm"
                                    >
                                        <Download size={16} className="mr-2" />
                                        Export {selectedFeedbacks.size}
                                    </button>
                                    <button
                                        onClick={handleDeleteMultiple}
                                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition duration-200 font-semibold shadow-lg text-sm"
                                    >
                                        <Trash2 size={16} className="mr-2" />
                                        Delete {selectedFeedbacks.size}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Feedback Items */}
                    <div className="divide-y divide-gray-100">
                        {filteredFeedbacks.length === 0 ? (
                            <div className="p-8 md:p-12 text-center">
                                <div className="max-w-md mx-auto">
                                    <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No feedbacks found</h3>
                                    <p className="text-gray-500">
                                        {feedbacks.length === 0 
                                            ? "No feedbacks have been submitted yet." 
                                            : "Try adjusting your search or filters to find what you're looking for."
                                        }
                                    </p>
                                </div>
                            </div>
                        ) : (
                            filteredFeedbacks.map((feedback) => (
                                <div 
                                    key={feedback._id} 
                                    className={`p-4 md:p-6 transition duration-200 hover:bg-blue-50/50 ${
                                        selectedFeedbacks.has(feedback._id) ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                                    } ${deletingFeedbacks.has(feedback._id) ? 'opacity-50' : ''}`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start space-x-3 md:space-x-4 flex-1">
                                            <label className="flex items-start mt-1">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedFeedbacks.has(feedback._id)}
                                                    onChange={() => handleSelectFeedback(feedback._id)}
                                                    className="h-5 w-5 text-blue-600 rounded-lg focus:ring-blue-500 border-gray-300 mt-1"
                                                    disabled={deletingFeedbacks.has(feedback._id)}
                                                />
                                            </label>
                                            
                                            <div className="flex-1 min-w-0">
                                                {/* Header */}
                                                <div className="flex flex-col md:flex-row md:items-start justify-between mb-3 gap-2">
                                                    <div className="flex items-center flex-wrap gap-2">
                                                        <h3 className="text-lg md:text-xl font-semibold text-gray-900 truncate">
                                                            {feedback.internDetails?.fullName || 'N/A'}
                                                        </h3>
                                                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-medium">
                                                            {feedback.uniqueId || 'N/A'}
                                                        </span>
                                                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full font-medium">
                                                            {feedback.internshipInfo?.domain || 'N/A'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <div className="text-sm text-gray-500 flex items-center space-x-2">
                                                            <Calendar size={14} />
                                                            <span>{getTimeAgo(feedback.submittedAt)}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteFeedback(feedback)}
                                                            disabled={deletingFeedbacks.has(feedback._id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            title="Delete feedback"
                                                        >
                                                            {deletingFeedbacks.has(feedback._id) ? (
                                                                <Loader size={16} className="animate-spin" />
                                                            ) : (
                                                                <Trash2 size={16} />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Contact Info */}
                                                <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-sm text-gray-600 mb-3">
                                                    <span className="flex items-center space-x-1">
                                                        <span>📧</span>
                                                        <span className="truncate">{feedback.internDetails?.email || 'N/A'}</span>
                                                    </span>
                                                    <span className="flex items-center space-x-1">
                                                        <span>📱</span>
                                                        <span>{feedback.internDetails?.mobile || 'N/A'}</span>
                                                    </span>
                                                </div>

                                                {/* Certificate Info */}
                                                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-4 border border-blue-100">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                        <div className="flex items-center space-x-3">
                                                            <FileText className="h-5 w-5 text-blue-600" />
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-700">Certificate Number</div>
                                                                <div className="text-lg font-bold text-gray-900 font-mono">
                                                                    {feedback.internshipInfo?.certificateNumber || 'Not Available'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <StatusBadge 
                                                            status={feedback.certificateStatus || 'pending'}
                                                            feedbackId={feedback._id}
                                                            onStatusUpdate={updateCertificateStatus}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Internship Details */}
                                                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                                                        <div>
                                                            <span className="font-medium text-gray-700">Duration:</span>
                                                            <span className="text-gray-600 ml-2">{feedback.internshipInfo?.duration || 'N/A'}</span>
                                                        </div>
                                                        <div>
                                                            <span className="font-medium text-gray-700">Start:</span>
                                                            <span className="text-gray-600 ml-2">{feedback.internshipInfo?.startMonth || 'N/A'}</span>
                                                        </div>
                                                        <div>
                                                            <span className="font-medium text-gray-700">End:</span>
                                                            <span className="text-gray-600 ml-2">{feedback.internshipInfo?.endMonth || 'N/A'}</span>
                                                        </div>
                                                        <div>
                                                            <span className="font-medium text-gray-700">DOB:</span>
                                                            <span className="text-gray-600 ml-2">{feedback.internDetails?.dob || 'N/A'}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Feedback Text */}
                                                <div className="mb-4">
                                                    <p className="text-sm text-gray-700 bg-white rounded-lg p-4 border">
                                                        <strong className="text-gray-900">Feedback:</strong>{' '}
                                                        {feedback.feedbackText || 'No feedback provided'}
                                                    </p>
                                                </div>

                                                {/* Media Actions */}
                                                <div className="flex flex-wrap gap-3">
                                                    {feedback.media?.photoUrl && (
                                                        <button
                                                            onClick={() => openMediaPreview('photo', feedback.media.photoUrl)}
                                                            onMouseEnter={() => {
                                                                const img = new Image();
                                                                img.src = optimizeCloudinaryUrl(feedback.media.photoUrl, { quality: 30, width: 300 });
                                                            }}
                                                            className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition duration-200 text-sm font-medium text-gray-700"
                                                        >
                                                            <Image size={16} className="mr-2" />
                                                            View Photo
                                                        </button>
                                                    )}
                                                    {feedback.media?.videoUrl && (
                                                        <button
                                                            onClick={() => openMediaPreview('video', feedback.media.videoUrl)}
                                                            className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition duration-200 text-sm font-medium text-gray-700"
                                                        >
                                                            <Video size={16} className="mr-2" />
                                                            Play Video
                                                            <Play size={14} className="ml-2" />
                                                        </button>
                                                    )}
                                                    {!feedback.media?.photoUrl && !feedback.media?.videoUrl && (
                                                        <span className="text-sm text-gray-500 italic">No media files available</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>

            {/* Export Options Modal */}
            <dialog id="exportModal" className="modal modal-bottom sm:modal-middle">
                <div className="modal-box bg-white max-w-md mx-4">
                    <h3 className="font-bold text-lg mb-6 text-gray-900">Export Options</h3>
                    
                    <div className="space-y-6">
                        {/* Format Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">Export Format</label>
                            <div className="grid grid-cols-2 gap-3">
                                {['excel', 'csv'].map((format) => (
                                    <label
                                        key={format}
                                        className={`flex items-center justify-center p-3 border-2 rounded-xl cursor-pointer transition duration-200 ${
                                            exportOptions.format === format
                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                : 'border-gray-300 bg-gray-50 text-gray-700 hover:border-gray-400'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="format"
                                            value={format}
                                            checked={exportOptions.format === format}
                                            onChange={(e) => setExportOptions({...exportOptions, format: e.target.value})}
                                            className="sr-only"
                                        />
                                        <span className="font-medium">{format.toUpperCase()}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Content Options */}
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Include in Export</label>
                            {[
                                { key: 'includeText', label: 'Text Data & Feedback', description: 'Intern details and feedback text' },
                                { key: 'includePhotos', label: 'Photo Links', description: 'Cloudinary photo URLs' },
                                { key: 'includeVideos', label: 'Video Links', description: 'Cloudinary video URLs' },
                                { key: 'includeCertificate', label: 'Certificate Info', description: 'Certificate numbers' }
                            ].map((option) => (
                                <label key={option.key} className="flex items-start space-x-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={exportOptions[option.key]}
                                        onChange={(e) => setExportOptions({...exportOptions, [option.key]: e.target.checked})}
                                        className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300 mt-1"
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900 group-hover:text-blue-600 transition duration-200">
                                            {option.label}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {option.description}
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="modal-action mt-8 flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => document.getElementById('exportModal').close()}
                            className="px-6 py-2 text-gray-700 hover:text-gray-900 font-medium transition duration-200 order-2 sm:order-1"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleExport}
                            disabled={exportLoading || selectedFeedbacks.size === 0}
                            className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 font-semibold flex items-center justify-center order-1 sm:order-2"
                        >
                            {exportLoading ? (
                                <>
                                    <Loader size={16} className="mr-2 animate-spin" />
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <Download size={16} className="mr-2" />
                                    Export {selectedFeedbacks.size} Items
                                </>
                            )}
                        </button>
                    </div>
                </div>
                
                {/* Backdrop */}
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>

            {/* Delete Confirmation Modal */}
            {deleteConfirm.show && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden">
                        <div className="p-6 md:p-8">
                            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
                                <AlertTriangle className="h-8 w-8 text-red-600" />
                            </div>
                            
                            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                                Confirm Deletion
                            </h3>
                            
                            <p className="text-gray-600 text-center mb-6">
                                {deleteConfirm.multiple ? (
                                    `Are you sure you want to delete ${deleteConfirm.count} selected feedback${deleteConfirm.count > 1 ? 's' : ''}? This action cannot be undone.`
                                ) : (
                                    `Are you sure you want to delete feedback from ${deleteConfirm.feedback.internDetails?.fullName || 'this intern'}? This action cannot be undone.`
                                )}
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={cancelDelete}
                                    className="flex-1 px-6 py-3 text-gray-700 hover:text-gray-900 font-medium border border-gray-300 rounded-xl hover:bg-gray-50 transition duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition duration-200 font-semibold flex items-center justify-center"
                                >
                                    <Trash2 size={18} className="mr-2" />
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Media Preview Modal */}
            {previewMedia.show && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-4xl max-h-[90vh] w-full overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                {previewMedia.type === 'photo' ? (
                                    <Image size={20} className="mr-2" />
                                ) : (
                                    <Video size={20} className="mr-2" />
                                )}
                                {previewMedia.type === 'photo' ? 'Photo Preview' : 'Video Preview'}
                            </h3>
                            <button
                                onClick={closeMediaPreview}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition duration-200"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Media Content */}
                        <div className="flex items-center justify-center p-4 md:p-8 max-h-[70vh] overflow-auto">
                            {previewMedia.loading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white">
                                    <div className="text-center">
                                        <Loader size={32} className="animate-spin text-blue-600 mx-auto mb-2" />
                                        <p className="text-gray-600">Loading {previewMedia.type}...</p>
                                    </div>
                                </div>
                            )}
                            
                            {mediaErrors.has(previewMedia.url) ? (
                                <div className="text-center text-gray-500">
                                    <p className="text-lg font-medium mb-2">Unable to load media</p>
                                    <p className="text-sm mb-4">The {previewMedia.type} may have been moved or deleted</p>
                                    <button
                                        onClick={closeMediaPreview}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition duration-200"
                                    >
                                        Close
                                    </button>
                                </div>
                            ) : previewMedia.type === 'photo' ? (
                                <img
                                    src={optimizeCloudinaryUrl(previewMedia.url, { quality: 80 })}
                                    alt="Intern feedback photo"
                                    onLoad={handleMediaLoad}
                                    onError={() => handleMediaError(previewMedia.url)}
                                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                                />
                            ) : (
                                <video
                                    src={previewMedia.url}
                                    controls
                                    onLoadedData={handleMediaLoad}
                                    onError={() => handleMediaError(previewMedia.url)}
                                    className="max-w-full max-h-full rounded-lg shadow-lg"
                                >
                                    Your browser does not support the video tag.
                                </video>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReviewTeamDashboard;