import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import Athenura from "../../../public/AthenuraLogo.jpg";

const InternDetail = ({ role }) => {
  const { id } = useParams();
  const [intern, setIntern] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState("");
  const [generatingOffer, setGeneratingOffer] = useState(false);
  const [hrComment, setHrComment] = useState("");
  const [hrCommentStage, setHrCommentStage] = useState("Resume Shortlisted");
  const [editingJoiningDate, setEditingJoiningDate] = useState(false);
  const [joiningDate, setJoiningDate] = useState("");
  const [editingDuration, setEditingDuration] = useState(false);
  const [duration, setDuration] = useState("");
  const [inchargeComments, setInchargeComments] = useState([]);
  const [hrComments, setHrComments] = useState([]);
  const [showInchargeComments, setShowInchargeComments] = useState(false);
  const [showHrComments, setShowHrComments] = useState(false);
  const navigate = useNavigate();

  const isAdmin = role === "Admin";
  const isHR = role === "HR";

  const hrStages = ['Resume Shortlisted', 'Interviewing', 'Telephonic', 'Emailing', 'Selected'];

  useEffect(() => {
    fetchIntern();
    if (isAdmin) {
      fetchInchargeComments();
      fetchHrComments();
    } else if (isHR) {
      fetchHrComments();
    }
  }, [id]);

  useEffect(() => {
    if (intern) {
      if (intern.comment) {
        setHrComment(intern.comment);
      }
      if (intern.joiningDate) {
        setJoiningDate(intern.joiningDate);
      }
      if (intern.duration) {
        setDuration(intern.duration);
      }
    }
  }, [intern]);

  const fetchIntern = async () => {
    setLoading(true);
    setError("");
    try {
      const endpoint = isAdmin ? `/api/admin/interns/${id}` : `/api/hr/interns/${id}`;
      const { data } = await axios.get(endpoint, {
        withCredentials: true,
      });
      setIntern(data);
    } catch (err) {
      console.error("Error fetching intern:", err);
      setError("Failed to load intern details");
    }
    setLoading(false);
  };

  const fetchInchargeComments = async () => {
    try {
      const response = await axios.get(`/api/admin/interns/${id}/incharge-comments`, {
        withCredentials: true,
      });
      setInchargeComments(response.data.comments || []);
    } catch (err) {
      console.error("Error fetching incharge comments:", err);
    }
  };

  const fetchHrComments = async () => {
    try {
      const endpoint = isAdmin
        ? `/api/admin/interns/${id}/hr-comments`
        : `/api/hr/interns/${id}/hr-comments`;

      const response = await axios.get(endpoint, {
        withCredentials: true,
      });
      setHrComments(response.data.hrComments || []);
    } catch (err) {
      console.error("Error fetching HR comments:", err);
    }
  };

  const handleDeleteInchargeComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await axios.delete(
        `/api/admin/interns/${id}/incharge-comments/${commentId}`,
        { withCredentials: true }
      );

      setInchargeComments(prev => prev.filter(comment => comment._id !== commentId));
      setUpdateSuccess("Comment deleted successfully!");
      setTimeout(() => setUpdateSuccess(""), 3000);
    } catch (err) {
      console.error("Error deleting incharge comment:", err);
      setError("Failed to delete comment");
    }
  };

  const handleAddHrComment = async () => {
    if (!isHR || !hrComment.trim()) return;

    setUpdating(true);
    try {
      await axios.post(
        `/api/hr/interns/${id}/hr-comments`,
        {
          text: hrComment,
          stage: hrCommentStage
        },
        { withCredentials: true }
      );

      setHrComment("");
      setHrCommentStage("Resume Shortlisted");
      setUpdateSuccess("HR comment added successfully!");
      setTimeout(() => setUpdateSuccess(""), 3000);

      // Refresh comments
      fetchHrComments();
    } catch (err) {
      console.error("Error adding HR comment:", err);
      setError(err.response?.data?.message || "Failed to add comment");
    }
    setUpdating(false);
  };

  const handleDeleteHrComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      const endpoint = isHR
        ? `/api/hr/interns/${id}/hr-comments/${commentId}`
        : `/api/admin/interns/${id}/hr-comments/${commentId}`;

      await axios.delete(endpoint, { withCredentials: true });

      setHrComments(prev => prev.filter(comment => comment._id !== commentId));
      setUpdateSuccess("HR comment deleted successfully!");
      setTimeout(() => setUpdateSuccess(""), 3000);
    } catch (err) {
      console.error("Error deleting HR comment:", err);
      setError(err.response?.data?.message || "Failed to delete comment");
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!isAdmin) return;

    if (["Active", "Inactive", "Completed"].includes(newStatus) && !intern.uniqueId) {
      setError("Cannot set status to Active/Inactive/Completed without generating Unique ID first. Please generate offer letter to create Unique ID.");
      setTimeout(() => setError(""), 5000);
      return;
    }

    setUpdating(true);
    try {
      await axios.put(
        `/api/admin/interns/${id}/status`,
        { status: newStatus },
        { withCredentials: true }
      );

      setIntern(prev => ({ ...prev, status: newStatus }));
      setUpdateSuccess("Status updated successfully!");
      setTimeout(() => setUpdateSuccess(""), 3000);
    } catch (err) {
      console.error("Error updating status:", err);
      setError(err.response?.data?.message || "Failed to update status");
    }
    setUpdating(false);
  };

  const handlePerformanceUpdate = async (newPerformance) => {
    if (!isAdmin) return;

    setUpdating(true);
    try {
      await axios.put(
        `/api/admin/interns/${id}/performance`,
        { performance: newPerformance },
        { withCredentials: true }
      );

      setIntern(prev => ({ ...prev, performance: newPerformance }));
      setUpdateSuccess("Performance updated successfully!");
      setTimeout(() => setUpdateSuccess(""), 3000);
    } catch (err) {
      console.error("Error updating performance:", err);
      setError("Failed to update performance");
    }
    setUpdating(false);
  };

  const handleDomainUpdate = async (newDomain) => {
    if (!isAdmin) return;

    setUpdating(true);
    try {
      await axios.put(
        `/api/admin/interns/${id}/domain`,
        { domain: newDomain },
        { withCredentials: true }
      );

      setIntern(prev => ({ ...prev, domain: newDomain }));
      setUpdateSuccess("Domain updated successfully!");
      setTimeout(() => setUpdateSuccess(""), 3000);
    } catch (err) {
      console.error("Error updating domain:", err);
      setError("Failed to update domain");
    }
    setUpdating(false);
  };

  const handleDurationUpdate = async () => {
    if (!isAdmin) return;

    setUpdating(true);
    try {
      await axios.put(
        `/api/admin/interns/${id}/duration`,
        { duration: duration },
        { withCredentials: true }
      );

      setIntern(prev => ({ ...prev, duration: duration }));
      setEditingDuration(false);
      setUpdateSuccess("Duration updated successfully!");
      setTimeout(() => setUpdateSuccess(""), 3000);
    } catch (err) {
      console.error("Error updating duration:", err);
      setError("Failed to update duration");
    }
    setUpdating(false);
  };

  const handleJoiningDateUpdate = async () => {
    if (!isAdmin) return;

    setUpdating(true);
    try {
      await axios.put(
        `/api/admin/interns/${id}/joining-date`,
        { joiningDate: joiningDate },
        { withCredentials: true }
      );

      setIntern(prev => ({ ...prev, joiningDate: joiningDate }));
      setEditingJoiningDate(false);
      setUpdateSuccess("Joining date updated successfully!");
      setTimeout(() => setUpdateSuccess(""), 3000);
    } catch (err) {
      console.error("Error updating joining date:", err);
      setError("Failed to update joining date");
    }
    setUpdating(false);
  };


  const generateOfferLetter = async () => {
    if (!isAdmin) return;

    if (!joiningDate) {
      setError("Please set a joining date before generating offer letter");
      setTimeout(() => setError(""), 5000);
      return;
    }

    if (!duration) {
      setError("Please set a duration before generating offer letter");
      setTimeout(() => setError(""), 5000);
      return;
    }

    setGeneratingOffer(true);
    try {
      const response = await axios.post(
        `/api/admin/interns/${id}/generate-offer-letter`,
        {
          joiningDate: joiningDate,
          duration: duration
        },
        {
          withCredentials: true,
          responseType: 'blob'
        }
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `offer-letter-${intern.fullName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      await fetchIntern();

      setUpdateSuccess("Offer letter generated successfully! Unique ID has been created.");
      setTimeout(() => setUpdateSuccess(""), 4000);
    } catch (err) {
      console.error("Error generating offer letter:", err);
      setError(err.response?.data?.message || "Failed to generate offer letter");
    }
    setGeneratingOffer(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Selected": return "bg-green-100 text-green-800 border-green-200";
      case "Rejected": return "bg-red-100 text-red-800 border-red-200";
      case "Applied": return "bg-blue-100 text-blue-800 border-blue-200";
      case "Active": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Inactive": return "bg-orange-100 text-orange-800 border-orange-200";
      case "Completed": return "bg-purple-100 text-purple-800 border-purple-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPerformanceColor = (performance) => {
    switch (performance) {
      case "Excellent": return "bg-purple-100 text-purple-800 border-purple-200";
      case "Good": return "bg-green-100 text-green-800 border-green-200";
      case "Average": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Selected": return "✅";
      case "Rejected": return "❌";
      case "Applied": return "⏳";
      case "Active": return "🟢";
      case "Inactive": return "🟡";
      case "Completed": return "🟣";
      default: return "📄";
    }
  };

  const getPerformanceIcon = (performance) => {
    switch (performance) {
      case "Excellent": return "⭐";
      case "Good": return "👍";
      case "Average": return "📊";
      default: return "➖";
    }
  };

  const canChangeToWorkStatus = (status) => {
    return ["Active", "Inactive", "Completed"].includes(status) && !intern.uniqueId;
  };

  const getHrCommentCount = () => {
    return hrComments.length;
  };

  const getInchargeCommentCount = () => {
    return inchargeComments.length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading intern details...</p>
        </div>
      </div>
    );
  }

  if (error && !intern) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Details</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={fetchIntern}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate(`/${role}-Dashboard`)}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!intern) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-gray-400 text-6xl mb-4">👤</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Intern Not Found</h2>
          <p className="text-gray-600 mb-6">The requested intern details could not be found.</p>
          <button
            onClick={() => navigate(`/${role}-Dashboard`)}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const personalDetails = [
    { label: "Full Name", value: intern.fullName, icon: "👤" },
    { label: "Email", value: intern.email, icon: "📧", isLink: true, href: `mailto:${intern.email}` },
    { label: "Mobile", value: intern.mobile, icon: "📱" },
    { label: "Unique ID", value: intern.uniqueId, icon: "🆔" },
  ];

  const educationDetails = [
    { label: "College", value: intern.college, icon: "🎓" },
    { label: "Course", value: intern.course, icon: "📚" },
  ];

  const internshipDetails = [
    { label: "Domain", value: intern.domain, icon: "💼" },
    { label: "Duration", value: intern.duration, icon: "⏱️" },
    { label: "Resume", value: "View Resume", icon: "📄", isLink: true, href: intern.resumeUrl },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl mb-6 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <img
                src={Athenura}
                alt="Athenura Logo"
                className="h-12 sm:h-16 rounded-lg"
              />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Intern Details</h1>
                <p className="text-gray-600 text-sm sm:text-base">
                  {isAdmin ? "Admin - Full Management Access" : "HR - View Only Access"}
                </p>
                {intern.uniqueId && (
                  <p className="text-sm text-green-600 font-medium mt-1">
                    Unique ID: {intern.uniqueId}
                  </p>
                )}
                {isAdmin && (
                  <div className="flex gap-4 mt-1">
                    {getHrCommentCount() > 0 && (
                      <p className="text-sm text-purple-600 font-medium">
                        {getHrCommentCount()} HR comment{getHrCommentCount() !== 1 ? 's' : ''}
                      </p>
                    )}
                    {getInchargeCommentCount() > 0 && (
                      <p className="text-sm text-blue-600 font-medium">
                        {getInchargeCommentCount()} incharge comment{getInchargeCommentCount() !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => navigate(`/${role}-Dashboard`)}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg flex items-center gap-2"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Success Message */}
        {updateSuccess && (
          <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative animate-fade-in">
            <span className="block sm:inline">{updateSuccess}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative animate-fade-in">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Status Cards */}
          <div className="lg:col-span-1 space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                📊 Application Status
              </h3>
              {isAdmin ? (
                <div className="space-y-3">
                  <select
                    value={intern.status}
                    onChange={(e) => handleStatusUpdate(e.target.value)}
                    disabled={updating}
                    className={`w-full border-2 rounded-xl p-3 text-center font-bold capitalize cursor-pointer transition-all ${getStatusColor(intern.status)} focus:ring-2 focus:ring-indigo-500 ${canChangeToWorkStatus(intern.status) ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                  >
                    <option value="Applied">Applied</option>
                    <option value="Selected">Selected</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Completed">Completed</option>
                  </select>
                  {canChangeToWorkStatus(intern.status) && (
                    <p className="text-xs text-red-600 text-center">
                      Generate offer letter first to create Unique ID and enable Active/Inactive/Completed status
                    </p>
                  )}
                  <div className="text-center text-sm text-gray-600">
                    {intern.status === 'Applied' && 'Application under review'}
                    {intern.status === 'Selected' && 'Candidate selected'}
                    {intern.status === 'Rejected' && 'Application rejected'}
                    {intern.status === 'Active' && 'Candidate Now Working'}
                    {intern.status === 'Inactive' && 'Candidate Now Terminated'}
                    {intern.status === 'Completed' && 'Candidate Successfully Completed Internship'}
                  </div>
                </div>
              ) : (
                <div className={`border-2 rounded-xl p-4 text-center ${getStatusColor(intern.status)}`}>
                  <div className="text-3xl mb-2">{getStatusIcon(intern.status)}</div>
                  <div className="text-xl font-bold capitalize">{intern.status}</div>
                  <div className="text-sm opacity-75 mt-1">
                    {intern.status === 'Applied' && 'Application under review'}
                    {intern.status === 'Selected' && 'Candidate selected'}
                    {intern.status === 'Rejected' && 'Application rejected'}
                    {intern.status === 'Active' && 'Candidate Now Working'}
                    {intern.status === 'Inactive' && 'Candidate Now Terminated'}
                    {intern.status === 'Completed' && 'Candidate Successfully Completed Internship'}
                  </div>
                </div>
              )}
            </div>

            {/* Unique ID Card - Admin Only */}
            {isAdmin && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  🆔 Unique ID
                </h3>
                {intern.uniqueId ? (
                  <div className={`border-2 rounded-xl p-4 text-center bg-green-50 border-green-200`}>
                    <div className="text-3xl mb-2">✅</div>
                    <div className="text-xl font-bold font-mono">{intern.uniqueId}</div>
                    <div className="text-sm opacity-75 mt-1">Generated with Offer Letter</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className={`border-2 rounded-xl p-4 text-center bg-yellow-50 border-yellow-200`}>
                      <div className="text-3xl mb-2">⚠️</div>
                      <div className="text-lg font-bold text-yellow-800">Not Generated</div>
                      <div className="text-sm opacity-75 mt-1">Will be created with offer letter</div>
                    </div>
                    <div className="text-xs text-gray-600 text-center p-2 bg-gray-50 rounded-lg">
                      Unique ID will be automatically generated when you create the offer letter
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Performance Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                ⭐ Performance
              </h3>
              {isAdmin ? (
                <div className="space-y-3">
                  <select
                    value={intern.performance}
                    onChange={(e) => handlePerformanceUpdate(e.target.value)}
                    disabled={updating}
                    className={`w-full border-2 rounded-xl p-3 text-center font-bold capitalize cursor-pointer transition-all ${getPerformanceColor(intern.performance)} focus:ring-2 focus:ring-indigo-500`}
                  >
                    <option value="Poor">Poor</option>
                    <option value="Good">Good</option>
                    <option value="Excellent">Excellent</option>
                  </select>
                  <div className="text-center text-sm text-gray-600">
                    {intern.performance === 'Excellent' && 'Outstanding performance'}
                    {intern.performance === 'Good' && 'Good performance'}
                    {intern.performance === 'Average' && 'Satisfactory performance'}
                  </div>
                </div>
              ) : (
                <div className={`border-2 rounded-xl p-4 text-center ${getPerformanceColor(intern.performance)}`}>
                  <div className="text-3xl mb-2">{getPerformanceIcon(intern.performance)}</div>
                  <div className="text-xl font-bold capitalize">{intern.performance}</div>
                  <div className="text-sm opacity-75 mt-1">
                    {intern.performance === 'Excellent' && 'Outstanding performance'}
                    {intern.performance === 'Good' && 'Good performance'}
                    {intern.performance === 'Average' && 'Satisfactory performance'}
                  </div>
                </div>
              )}
            </div>

            {/* Duration Card - Admin Only */}
            {isAdmin && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  ⏱️ Internship Duration
                </h3>
                {!editingDuration ? (
                  <div className="space-y-3">
                    <div className={`border-2 rounded-xl p-4 text-center ${duration ? "bg-blue-50 border-blue-200" : "bg-yellow-50 border-yellow-200"}`}>
                      <div className="text-3xl mb-2">⏱️</div>
                      <div className="text-xl font-bold">
                        {duration || "Not Set"}
                      </div>
                      <div className="text-sm opacity-75 mt-1">
                        {duration ? "Duration set" : "Required for offer letter"}
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingDuration(true)}
                      className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      ✏️ {duration ? "Edit Duration" : "Set Duration"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full border-2 border-gray-300 rounded-xl p-3 text-center font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Duration</option>
                      <option value="3 months">3 Months</option>
                      <option value="4 months">4 Months</option>
                      <option value="6 months">6 Months</option>
                      <option value="8 months">8 Months</option>
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingDuration(false);
                          setDuration(intern.duration || "");
                        }}
                        className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDurationUpdate}
                        disabled={updating || !duration}
                        className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {updating ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Saving...
                          </>
                        ) : (
                          "Save Duration"
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Extended Days Card - Admin Only */}
            {isAdmin && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  📅 Extended Days
                </h3>
                <div className={`border-2 rounded-xl p-4 text-center ${intern.extendedDays > 0 ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                  }`}>
                  <div className="text-3xl mb-2">⏱️</div>
                  <div className="text-xl font-bold">
                    {intern.extendedDays || 0} days
                  </div>
                  <div className="text-sm opacity-75 mt-1">
                    {intern.extendedDays > 0 ? "Internship extended" : "No extension"}
                  </div>
                </div>
              </div>
            )}
            {/* Joining Date Card - Admin Only */}
            {isAdmin && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  📅 Joining Date
                </h3>
                {!editingJoiningDate ? (
                  <div className="space-y-3">
                    <div className={`border-2 rounded-xl p-4 text-center ${joiningDate ? "bg-blue-50 border-blue-200" : "bg-yellow-50 border-yellow-200"}`}>
                      <div className="text-3xl mb-2">📅</div>
                      <div className="text-xl font-bold">
                        {joiningDate ? new Date(joiningDate).toLocaleDateString() : "Not Set"}
                      </div>
                      <div className="text-sm opacity-75 mt-1">
                        {joiningDate ? "Joining date set" : "Required for offer letter"}
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingJoiningDate(true)}
                      className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      ✏️ {joiningDate ? "Edit Date" : "Set Date"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="date"
                      value={joiningDate}
                      onChange={(e) => setJoiningDate(e.target.value)}
                      className="w-full border-2 border-gray-300 rounded-xl p-3 text-center font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingJoiningDate(false);
                          setJoiningDate(intern.joiningDate || "");
                        }}
                        className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleJoiningDateUpdate}
                        disabled={updating || !joiningDate}
                        className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {updating ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Saving...
                          </>
                        ) : (
                          "Save Date"
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* HR Comments Quick View - Admin Only */}
            {isAdmin && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  💼 HR Comments
                </h3>
                <div className="space-y-3">
                  <div className={`border-2 rounded-xl p-4 text-center ${getHrCommentCount() > 0 ? "bg-purple-50 border-purple-200" : "bg-gray-50 border-gray-200"}`}>
                    <div className="text-3xl mb-2">💼</div>
                    <div className="text-xl font-bold">
                      {getHrCommentCount()} Comment{getHrCommentCount() !== 1 ? 's' : ''}
                    </div>
                    <div className="text-sm opacity-75 mt-1">
                      {getHrCommentCount() > 0 ? "From HR team" : "No HR comments yet"}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowHrComments(true)}
                    className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    💼 View HR Comments
                  </button>
                </div>
              </div>
            )}

            {/* Incharge Comments Quick View - Admin Only */}
            {isAdmin && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  💬 Incharge Comments
                </h3>
                <div className="space-y-3">
                  <div className={`border-2 rounded-xl p-4 text-center ${getInchargeCommentCount() > 0 ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"}`}>
                    <div className="text-3xl mb-2">👥</div>
                    <div className="text-xl font-bold">
                      {getInchargeCommentCount()} Comment{getInchargeCommentCount() !== 1 ? 's' : ''}
                    </div>
                    <div className="text-sm opacity-75 mt-1">
                      {getInchargeCommentCount() > 0 ? "From intern incharges" : "No comments yet"}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowInchargeComments(true)}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    💬 View Incharge Comments
                  </button>
                </div>
              </div>
            )}

            {/* Admin Only - Offer Letter */}
            {isAdmin && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  📝 Admin Actions
                </h3>
                <button
                  onClick={generateOfferLetter}
                  disabled={generatingOffer || intern.status !== "Selected" || !joiningDate || !duration}
                  className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${intern.status === "Selected" && joiningDate && duration
                    ? "bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    } ${generatingOffer ? "opacity-50" : ""}`}
                >
                  {generatingOffer ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Generating...
                    </>
                  ) : (
                    "📄 Generate Offer Letter"
                  )}
                </button>
                {!joiningDate && (
                  <p className="text-sm text-yellow-600 mt-2 text-center">
                    Please set joining date first
                  </p>
                )}
                {!duration && (
                  <p className="text-sm text-yellow-600 mt-2 text-center">
                    Please set duration first
                  </p>
                )}
                {intern.status !== "Selected" && (
                  <p className="text-sm text-gray-600 mt-2 text-center">
                    Available only for selected interns
                  </p>
                )}
                {intern.uniqueId && (
                  <p className="text-sm text-green-600 mt-2 text-center">
                    Unique ID generated: {intern.uniqueId}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              {/* Personal Details */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                  👤 Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {personalDetails.map(({ label, value, icon, isLink, href }) => (
                    <div key={label} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{icon}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-600">{label}</div>
                          {isLink ? (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800 font-medium break-all transition-colors"
                            >
                              {value}
                            </a>
                          ) : (
                            <div className={`text-gray-800 font-medium ${!value ? 'text-gray-400' : ''}`}>
                              {value || "Not provided"}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Education Details */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                  🎓 Education Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {educationDetails.map(({ label, value, icon }) => (
                    <div key={label} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{icon}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-600">{label}</div>
                          <div className={`text-gray-800 font-medium ${!value ? 'text-gray-400' : ''}`}>
                            {value || "Not provided"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Internship Details */}
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                  💼 Internship Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {internshipDetails.map(({ label, value, icon, isLink, href }) => (
                    <div key={label} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{icon}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-600">{label}</div>
                          {isLink ? (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800 font-medium break-all transition-colors inline-flex items-center gap-1"
                            >
                              {value} ↗
                            </a>
                          ) : label === "Domain" && isAdmin ? (
                            <select
                              value={value}
                              onChange={(e) => handleDomainUpdate(e.target.value)}
                              disabled={updating}
                              className="text-gray-800 font-medium bg-transparent border-0 focus:ring-2 focus:ring-indigo-500 rounded px-2 py-1 cursor-pointer"
                            >
                              <option>Sales & Marketing</option>
                              <option>Data Science & Analytics</option>
                              <option>Human Resources</option>
                              <option>Social Media Management</option>
                              <option>Graphic Design</option>
                              <option>Digital Marketing</option>
                              <option>Video Editing</option>
                              <option>Full Stack Development</option>
                              <option>MERN Stack Development</option>
                              <option>Email and Outreaching</option>
                              <option>Content Writing</option>
                              <option>Content Creator</option>
                              <option>UI/UX Designing</option>
                              <option>Front-end Developer</option>
                              <option>Back-end Developer</option>
                            </select>
                          ) : label === "Duration" && isAdmin ? (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-800 font-medium">{value || "Not specified"}</span>
                              <button
                                onClick={() => setEditingDuration(true)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                ✏️ Edit
                              </button>
                            </div>
                          ) : (
                            <div className={`text-gray-800 font-medium ${!value ? 'text-gray-400' : ''}`}>
                              {value || "Not specified"}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {isHR && intern.prevInternshipDesc && (
                    <div className="bg-gray-100 p-3 rounded-lg mt-3">
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">
                        Previous Internship Description:
                      </h4>
                      <br />
                      <p className="text-gray-800 text-sm whitespace-pre-line">
                        {intern.prevInternshipDesc}
                      </p>
                    </div>
                  )}

                  {isAdmin && intern.updatedByHR && (
                    <div className="mt-2 text-sm text-blue-600">
                      Last updated by HR: <span className="font-medium text-gray-800">{intern.updatedByHR.fullName}</span> ({intern.updatedByHR.email})
                    </div>
                  )}

                </div>
              </div>
            </div>


            {/* Certificate Details */}
            { isAdmin &&
            <div className="bg-white rounded-2xl shadow-xl p-6 mt-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                🎓 Certificate Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🔢</span>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Certificate Number</div>
                      <div className={`text-gray-800 font-medium ${!intern.certificateNumber ? 'text-gray-400' : ''}`}>
                        {intern.certificateNumber || "Not issued"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">📅</span>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Issued Date</div>
                      <div className={`text-gray-800 font-medium ${!intern.certificateIssuedAt ? 'text-gray-400' : ''}`}>
                        {intern.certificateIssuedAt
                          ? new Date(intern.certificateIssuedAt).toLocaleDateString()
                          : "Not issued"
                        }
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">📊</span>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Status</div>
                      <div className={`font-medium capitalize ${intern.certificateStatus === "issued"
                          ? "text-green-600"
                          : "text-yellow-600"
                        }`}>
                        {intern.certificateStatus || "pending"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">⏱️</span>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Internship Duration</div>
                      <div className="text-gray-800 font-medium">
                        {intern.duration || "Not specified"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {intern.certificateStatus === "issued" && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <span>✅</span>
                    <span className="text-sm font-medium">
                      Certificate successfully issued to {intern.fullName}
                    </span>
                  </div>
                </div>
              )}
            </div>
            }


            {/* HR Comment Section - HR Can Add Comments */}
            {isHR && (
              <div className="bg-white rounded-2xl shadow-xl p-6 mt-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                  💼 Add HR Comment
                  <span className="text-sm text-purple-600 bg-purple-100 px-2 py-1 rounded-full ml-2">
                    HR Only
                  </span>
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stage
                    </label>
                    <select
                      value={hrCommentStage}
                      onChange={(e) => setHrCommentStage(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      {hrStages.map(stage => (
                        <option key={stage} value={stage}>{stage}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comment
                    </label>
                    <textarea
                      value={hrComment}
                      onChange={(e) => setHrComment(e.target.value)}
                      placeholder="Add your comments about this intern's progress..."
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      rows="4"
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-gray-500">
                        {hrComment.length}/500 characters
                      </span>
                      <button
                        onClick={handleAddHrComment}
                        disabled={updating || !hrComment.trim()}
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
                      >
                        {updating ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Adding...
                          </>
                        ) : (
                          "Add Comment"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* HR Comments Display - For HR to see their own comments */}
            {isHR && hrComments.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-6 mt-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                  💼 Your HR Comments
                </h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {hrComments.map((comment) => (
                    <HrCommentCard
                      key={comment._id}
                      comment={comment}
                      onDelete={handleDeleteHrComment}
                      isHR={isHR}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* HR Comments Display - For Admin to see all HR comments */}
            {isAdmin && hrComments.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-6 mt-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                  💼 HR Comments
                  <span className="text-sm text-purple-600 bg-purple-100 px-2 py-1 rounded-full ml-2">
                    Admin View
                  </span>
                </h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {hrComments.map((comment) => (
                    <HrCommentCard
                      key={comment._id}
                      comment={comment}
                      onDelete={isAdmin ? handleDeleteHrComment : null}
                      isHR={false}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Incharge Comments Section - Admin Only */}
            {isAdmin && inchargeComments.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-6 mt-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                  👥 Incharge Comments
                </h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {inchargeComments.map((comment) => (
                    <InchargeCommentCard
                      key={comment._id}
                      comment={comment}
                      internId={intern._id}
                      onDelete={handleDeleteInchargeComment}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <a
              href={`mailto:${intern.email}`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
            >
              📧 Send Email
            </a>
            <a
              href={intern.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
            >
              📄 View Resume
            </a>
            {isAdmin && (
              <>
                <button
                  onClick={generateOfferLetter}
                  disabled={generatingOffer || intern.status !== "Selected" || !joiningDate || !duration}
                  className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${intern.status === "Selected" && joiningDate && duration
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "bg-gray-400 text-gray-600 cursor-not-allowed"
                    }`}
                >
                  {generatingOffer ? "⏳ Generating..." : "📝 Offer Letter"}
                </button>
                {getHrCommentCount() > 0 && (
                  <button
                    onClick={() => setShowHrComments(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center gap-2"
                  >
                    💼 HR Comments ({getHrCommentCount()})
                  </button>
                )}
                {getInchargeCommentCount() > 0 && (
                  <button
                    onClick={() => setShowInchargeComments(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                  >
                    💬 Incharge Comments ({getInchargeCommentCount()})
                  </button>
                )}
              </>
            )}
            <button
              onClick={() => navigate(`/${role}-Dashboard`)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium flex items-center gap-2"
            >
              ← Back to List
            </button>
          </div>
        </div>
      </div>

      {/* HR Comments Modal */}
      {showHrComments && isAdmin && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">HR Comments</h3>
                <p className="text-sm text-gray-600 mt-1">{intern.fullName} - {intern.domain}</p>
              </div>
              <button
                onClick={() => setShowHrComments(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
              <div className="space-y-4">
                {hrComments.map((comment) => (
                  <HrCommentCard
                    key={comment._id}
                    comment={comment}
                    onDelete={null}
                    isHR={false}
                    isModal={true}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Incharge Comments Modal */}
      {showInchargeComments && isAdmin && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Incharge Comments</h3>
                <p className="text-sm text-gray-600 mt-1">{intern.fullName} - {intern.domain}</p>
              </div>
              <button
                onClick={() => setShowInchargeComments(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
              <div className="space-y-4">
                {inchargeComments.map((comment) => (
                  <InchargeCommentCard
                    key={comment._id}
                    comment={comment}
                    internId={intern._id}
                    onDelete={handleDeleteInchargeComment}
                    isModal={true}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// HR Comment Card Component
const HrCommentCard = ({ comment, onDelete, isHR, isModal = false }) => {
  const [hrUserDetails, setHrUserDetails] = useState(null);
  const [loadingHrUser, setLoadingHrUser] = useState(false);

  useEffect(() => {
    if (comment.commentedBy && typeof comment.commentedBy === 'object') {
      setHrUserDetails(comment.commentedBy);
    } else if (comment.commentedBy) {
      fetchHrUserDetails();
    }
  }, [comment.commentedBy]);

  const fetchHrUserDetails = async () => {
    try {
      setLoadingHrUser(true);
      const response = await axios.get(`/api/admin/users/${comment.commentedBy}`, {
        withCredentials: true,
      });
      setHrUserDetails(response.data.user);
    } catch (err) {
      console.error('Error fetching HR user details:', err);
    } finally {
      setLoadingHrUser(false);
    }
  };

  const getHrUserInitials = (name) => {
    if (!name) return 'HR';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getHrUserName = () => {
    if (hrUserDetails) {
      return hrUserDetails.fullName;
    }
    return 'Loading...';
  };

  const getHrUserEmail = () => {
    if (hrUserDetails) {
      return hrUserDetails.email;
    }
    return '';
  };

  const getStageColor = (stage) => {
    switch (stage) {
      case 'Selected': return 'bg-green-100 text-green-800';
      case 'Interviewing': return 'bg-blue-100 text-blue-800';
      case 'Telephonic': return 'bg-purple-100 text-purple-800';
      case 'Emailing': return 'bg-yellow-100 text-yellow-800';
      case 'Resume Shortlisted': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`bg-gray-50 rounded-lg p-4 border border-gray-200 ${isModal ? 'border-2 border-purple-200' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {getHrUserInitials(getHrUserName())}
          </div>
          <div>
            <h5 className="font-medium text-gray-900 text-sm">
              {loadingHrUser ? 'Loading...' : getHrUserName()}
            </h5>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-1 rounded-full ${getStageColor(comment.stage)}`}>
                {comment.stage}
              </span>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span>📅</span>
                {new Date(comment.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
            {hrUserDetails && (
              <div className="text-xs text-gray-400 mt-1">
                {getHrUserEmail()}
              </div>
            )}
          </div>
        </div>

        {isHR && onDelete && (
          <button
            onClick={() => onDelete(comment._id)}
            className="text-red-500 hover:text-red-700 transition-colors p-1 rounded hover:bg-red-50"
            title="Delete comment"
          >
            🗑️
          </button>
        )}
      </div>

      <p className="text-gray-700 text-sm">{comment.text}</p>
    </div>
  );
};

// Incharge Comment Card Component
const InchargeCommentCard = ({ comment, onDelete, isModal = false }) => {
  const [inchargeDetails, setInchargeDetails] = useState(null);
  const [loadingIncharge, setLoadingIncharge] = useState(false);

  useEffect(() => {
    if (comment.commentedBy) {
      fetchInchargeDetails();
    }
  }, [comment.commentedBy]);

  const fetchInchargeDetails = async () => {
    try {
      setLoadingIncharge(true);
      const response = await axios.get(`/api/admin/intern-head/${comment.commentedBy}`, {
        withCredentials: true,
      });
      setInchargeDetails(response.data.incharge);
    } catch (err) {
      console.error('Error fetching incharge details:', err);
    } finally {
      setLoadingIncharge(false);
    }
  };

  const getInchargeInitials = (name) => {
    if (!name) return 'IC';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getInchargeName = () => {
    if (inchargeDetails) {
      return inchargeDetails.fullName;
    }
    return 'Loading...';
  };

  const getInchargeEmail = () => {
    if (inchargeDetails) {
      return inchargeDetails.email;
    }
    return '';
  };

  return (
    <div className={`bg-gray-50 rounded-lg p-4 border border-gray-200 ${isModal ? 'border-2 border-blue-200' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {getInchargeInitials(getInchargeName())}
          </div>
          <div>
            <h5 className="font-medium text-gray-900 text-sm">
              {loadingIncharge ? 'Loading...' : getInchargeName()}
            </h5>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span>📅</span>
              {new Date(comment.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            {inchargeDetails && (
              <div className="text-xs text-gray-400 mt-1">
                {getInchargeEmail()}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => onDelete(comment._id)}
          className="text-red-500 hover:text-red-700 transition-colors p-1 rounded hover:bg-red-50"
          title="Delete comment"
        >
          🗑️
        </button>
      </div>

      <p className="text-gray-700 text-sm">{comment.text}</p>
    </div>
  );
};

export default InternDetail;