import React, { useState } from 'react';
import axios from 'axios';

const LeaveApplicationForm = () => {
  // Form state
  const [formData, setFormData] = useState({
    internId: '',
    leaveType: '',
    startDate: '',
    endDate: '',
    totalDays: 0,
    reason: '',
    status: 'Pending'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNotice, setShowNotice] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState('');
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });

  // Available leave reasons with icons
  const leaveReasons = [
    { value: 'Sick Leave', description: 'For health-related issues' },
    { value: 'Family Emergency', description: 'Urgent family matters' },
    { value: 'Vacation', description: 'Planned time off for relaxation' },
    { value: 'Medical Appointment', description: 'Doctor or medical appointments' },
    { value: 'Wedding', description: 'Personal or family wedding' },
    { value: 'Maternity/Paternity Leave', description: 'Childbirth or adoption' },
    { value: 'Bereavement', description: 'Loss of family member' },
    { value: 'Religious Observance', description: 'Religious holidays or events' },
    { value: 'Other', description: 'Other reasons not listed' }
  ];

  // Calculate total days between start and end date
  const calculateTotalDays = (start, end) => {
    if (!start || !end) return 0;

    const startDate = new Date(start);
    const endDate = new Date(end);
    const timeDiff = endDate.getTime() - startDate.getTime();
    const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

    return dayDiff > 0 ? dayDiff : 0;
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => {
      const updatedData = {
        ...prev,
        [name]: value
      };

      // Recalculate total days if start or end date changes
      if (name === 'startDate' || name === 'endDate') {
        updatedData.totalDays = calculateTotalDays(
          name === 'startDate' ? value : prev.startDate,
          name === 'endDate' ? value : prev.endDate
        );

        // Check for 48-hour notice requirement
        if (updatedData.startDate) {
          const startDate = new Date(updatedData.startDate);
          const now = new Date();
          const hoursDiff = (startDate - now) / (1000 * 60 * 60);

          if (hoursDiff < 48 && hoursDiff > 0) {
            setShowNotice(true);
            setNoticeMessage('⚠️ You are applying for leave with less than 48 hours notice. Please ensure this is an emergency situation.');
          } else {
            setShowNotice(false);
          }
        }
      }

      return updatedData;
    });

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Clear submit status when user makes changes
    if (submitStatus.message) {
      setSubmitStatus({ type: '', message: '' });
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.internId.trim()) newErrors.internId = 'Intern ID is required';
    if (!formData.leaveType) newErrors.leaveType = 'Please select a leave type';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    if (formData.totalDays <= 0) newErrors.totalDays = 'End date must be after start date';
    if (!formData.reason.trim()) newErrors.reason = 'Please provide a reason for your leave';
    if (formData.reason.trim().length < 10) newErrors.reason = 'Reason should be at least 10 characters long';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle backend errors
  const handleBackendError = (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      switch (status) {
        case 400:
          if (data.error === "All fields are required") {
            setSubmitStatus({
              type: 'error',
              message: '❌ Please fill in all required fields'
            });
          } else if (data.error === "Invalid date format") {
            setSubmitStatus({
              type: 'error',
              message: '❌ Invalid date format. Please check your dates.'
            });
          } else if (data.error === "End date must be after start date") {
            setSubmitStatus({
              type: 'error',
              message: '❌ End date must be after start date'
            });
          } else if (data.error === "You already have a leave request in this date range") {
            setSubmitStatus({
              type: 'error',
              message: '❌ You already have a pending or approved leave request for these dates'
            });
          } else {
            setSubmitStatus({
              type: 'error',
              message: `❌ ${data.error || 'Validation error'}`
            });
          }
          break;

        case 404:
          setSubmitStatus({
            type: 'error',
            message: '❌ Intern ID not found. Please check your Intern ID.'
          });
          break;

        case 500:
          setSubmitStatus({
            type: 'error',
            message: '❌ Server error. Please try again later.'
          });
          break;

        default:
          setSubmitStatus({
            type: 'error',
            message: `❌ Unexpected error: ${data.error || 'Please try again'}`
          });
      }
    } else if (error.request) {
      // Network error
      setSubmitStatus({
        type: 'error',
        message: '❌ Network error. Please check your connection and try again.'
      });
    } else {
      // Other errors
      setSubmitStatus({
        type: 'error',
        message: `❌ Application error: ${error.message}`
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setSubmitStatus({
        type: 'error',
        message: '❌ Please fix the errors above before submitting.'
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: '', message: '' });

    try {
      const response = await axios.post('/api/intern/leaves', formData);

      if (response.status === 201) {
        // Show success message with confetti effect
        document.body.classList.add('celebrate');
        setTimeout(() => document.body.classList.remove('celebrate'), 2000);

        setSubmitStatus({
          type: 'success',
          message: '🎉 Leave application submitted successfully!'
        });

        // Reset form
        setFormData({
          internId: '',
          leaveType: '',
          startDate: '',
          endDate: '',
          totalDays: 0,
          reason: '',
          status: 'Pending'
        });
        setShowNotice(false);
        setErrors({});
      }
    } catch (error) {
      console.error('Error submitting leave application:', error);
      handleBackendError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear status message
  const clearStatus = () => {
    setSubmitStatus({ type: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 py-4 sm:py-8 px-3 sm:px-4">
      {/* Animated Background Elements - Hidden on mobile for performance */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 hidden sm:block">
        <div className="absolute top-10 left-10 w-16 h-16 sm:w-20 sm:h-20 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-8 sm:right-20 w-12 h-12 sm:w-16 sm:h-16 bg-sky-200 rounded-full opacity-30 animate-bounce"></div>
        <div className="absolute bottom-20 left-1/4 w-16 h-16 sm:w-24 sm:h-24 bg-cyan-200 rounded-full opacity-25 animate-ping"></div>
      </div>

      <div className="max-w-2xl lg:max-w-4xl mx-auto bg-white/90 sm:bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl shadow-blue-200/30 sm:shadow-blue-200/50 overflow-hidden relative z-10 border border-white/40 sm:border-white/60">
        {/* Header with Gradient */}
        <div className="bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 p-4 sm:p-6 lg:p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-white/10 rounded-full -translate-y-8 sm:-translate-y-12 lg:-translate-y-16 translate-x-8 sm:translate-x-12 lg:translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-white/10 rounded-full translate-y-8 sm:translate-y-10 lg:translate-y-12 -translate-x-8 sm:-translate-x-10 lg:-translate-x-12"></div>

          <div className="flex items-center justify-between relative z-10">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-4">
                {/* Logo */}
                <img
                  src="/White.png"
                  alt="Athenura Logo"
                  className="w-26 sm:w-32 lg:w-42 object-contain"
                />

                {/* Text Content */}
                <div className="flex flex-col">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent leading-tight">
                    Leave Application
                  </h1>
                  <p className="text-blue-100 text-sm sm:text-base lg:text-lg font-medium">
                    Leave Application Portal
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/20 p-2 sm:p-3 rounded-xl sm:rounded-2xl backdrop-blur-sm flex-shrink-0 ml-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Submit Status Message */}
        {submitStatus.message && (
          <div
            className={`mx-4 sm:mx-6 mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all duration-300 transform ${submitStatus.type === 'success'
                ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-green-300 text-green-800'
                : 'bg-gradient-to-r from-red-100 to-pink-100 border-red-300 text-red-800'
              } ${submitStatus.type === 'error' ? 'animate-shake' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center flex-1">
                <div className={`flex-shrink-0 mr-3 ${submitStatus.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                  {submitStatus.type === 'success' ? (
                    <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <p className="text-sm sm:text-base font-medium leading-relaxed flex-1">
                  {submitStatus.message}
                </p>
              </div>
              <button
                onClick={clearStatus}
                className={`flex-shrink-0 ml-2 p-1 rounded-full hover:bg-opacity-20 transition-colors ${submitStatus.type === 'success'
                    ? 'hover:bg-green-500 text-green-600'
                    : 'hover:bg-red-500 text-red-600'
                  }`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Notice Section */}
        {showNotice && (
          <div className="bg-gradient-to-r from-amber-400 to-orange-400 text-white p-3 sm:p-4 mx-4 sm:mx-6 mt-4 sm:mt-6 rounded-lg sm:rounded-xl shadow-lg transform transition-all duration-300">
            <div className="flex items-start sm:items-center">
              <div className="flex-shrink-0 pt-0.5 sm:pt-0">
                <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm sm:text-base font-medium leading-relaxed">{noticeMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
          {/* Intern ID */}
          <div className="group">
            <label htmlFor="internId" className="block text-sm sm:text-base font-semibold text-blue-700 mb-2 transition-colors group-focus-within:text-blue-600">
              <span className="hidden sm:inline">👤</span> Intern ID <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="internId"
              name="internId"
              value={formData.internId}
              onChange={handleChange}
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 rounded-lg sm:rounded-xl focus:ring-2 transition-all duration-300 ${errors.internId
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-200'
                  : 'border-blue-200 focus:border-blue-400 focus:ring-blue-200'
                } bg-white/60 sm:bg-white/50 backdrop-blur-sm`}
              placeholder="Enter your unique intern ID"
            />
            {errors.internId && (
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-rose-600 flex items-center">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-rose-500 rounded-full mr-1.5 sm:mr-2 flex-shrink-0"></span>
                {errors.internId}
              </p>
            )}
          </div>

          {/* Leave Type */}
          <div className="group">
            <label htmlFor="leaveType" className="block text-sm sm:text-base font-semibold text-blue-700 mb-2 transition-colors group-focus-within:text-blue-600">
              <span className="hidden sm:inline">📋</span> Leave Type <span className="text-rose-500">*</span>
            </label>
            <select
              id="leaveType"
              name="leaveType"
              value={formData.leaveType}
              onChange={handleChange}
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 rounded-lg sm:rounded-xl focus:ring-4 transition-all duration-300 appearance-none bg-white/60 sm:bg-white/50 backdrop-blur-sm ${errors.leaveType
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-200'
                  : 'border-blue-200 focus:border-blue-400 focus:ring-blue-200'
                }`}
            >
              <option value="" className="text-gray-400 text-sm sm:text-base">Select your leave type...</option>
              {leaveReasons.map((reason, index) => (
                <option key={index} value={reason.value} className="text-sm sm:text-base">
                   {reason.value}
                </option>
              ))}
            </select>
            {formData.leaveType && (
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-blue-600 leading-relaxed">
                {leaveReasons.find(r => r.value === formData.leaveType)?.description}
              </p>
            )}
            {errors.leaveType && (
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-rose-600 flex items-center">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-rose-500 rounded-full mr-1.5 sm:mr-2 flex-shrink-0"></span>
                {errors.leaveType}
              </p>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="group">
              <label htmlFor="startDate" className="block text-sm sm:text-base font-semibold text-blue-700 mb-2 transition-colors group-focus-within:text-blue-600">
                <span className="hidden sm:inline">📅</span> Start Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 rounded-lg sm:rounded-xl focus:ring-4 transition-all duration-300 ${errors.startDate
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-200'
                    : 'border-blue-200 focus:border-blue-400 focus:ring-blue-200'
                  } bg-white/60 sm:bg-white/50 backdrop-blur-sm`}
              />
              {errors.startDate && (
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-rose-600 flex items-center">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-rose-500 rounded-full mr-1.5 sm:mr-2 flex-shrink-0"></span>
                  {errors.startDate}
                </p>
              )}
            </div>

            <div className="group">
              <label htmlFor="endDate" className="block text-sm sm:text-base font-semibold text-blue-700 mb-2 transition-colors group-focus-within:text-blue-600">
                <span className="hidden sm:inline">📅</span> End Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 rounded-lg sm:rounded-xl focus:ring-4 transition-all duration-300 ${errors.endDate
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-200'
                    : 'border-blue-200 focus:border-blue-400 focus:ring-blue-200'
                  } bg-white/60 sm:bg-white/50 backdrop-blur-sm`}
              />
              {errors.endDate && (
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-rose-600 flex items-center">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-rose-500 rounded-full mr-1.5 sm:mr-2 flex-shrink-0"></span>
                  {errors.endDate}
                </p>
              )}
            </div>
          </div>

          {/* Total Days Display */}
          <div className="bg-gradient-to-r from-blue-100 to-sky-100 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-blue-700 font-semibold text-sm sm:text-base">
                <span className="hidden sm:inline">📊</span> Total Leave Days
              </span>
              <span className={`text-xl sm:text-2xl font-bold ${formData.totalDays > 0 ? 'text-sky-600' : 'text-gray-400'}`}>
                {formData.totalDays || 0} <span className="text-sm sm:text-base">{formData.totalDays === 1 ? 'day' : 'days'}</span>
              </span>
            </div>
            {errors.totalDays && (
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-rose-600 flex items-center">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-rose-500 rounded-full mr-1.5 sm:mr-2 flex-shrink-0"></span>
                {errors.totalDays}
              </p>
            )}
          </div>

          {/* Reason */}
          <div className="group">
            <label htmlFor="reason" className="block text-sm sm:text-base font-semibold text-blue-700 mb-2 transition-colors group-focus-within:text-blue-600">
              <span className="hidden sm:inline">💬</span> Reason for Leave <span className="text-rose-500">*</span>
              <span className="text-xs text-gray-500 font-normal ml-1 sm:ml-2 block sm:inline">(Minimum 10 characters)</span>
            </label>
            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              rows={3}
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 rounded-lg sm:rounded-xl focus:ring-4 transition-all duration-300 resize-none ${errors.reason
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-200'
                  : 'border-blue-200 focus:border-blue-400 focus:ring-blue-200'
                } bg-white/60 sm:bg-white/50 backdrop-blur-sm`}
              placeholder="Please provide a detailed explanation for your leave request..."
            ></textarea>
            <div className="flex justify-between items-center mt-1 sm:mt-2">
              {errors.reason ? (
                <p className="text-xs sm:text-sm text-rose-600 flex items-center flex-1">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-rose-500 rounded-full mr-1.5 sm:mr-2 flex-shrink-0"></span>
                  {errors.reason}
                </p>
              ) : (
                <p className="text-xs sm:text-sm text-blue-600">
                  {formData.reason.length >= 10 ? '✅ Good description!' : 'Keep typing...'}
                </p>
              )}
              <span className={`text-xs sm:text-sm ${formData.reason.length < 10 ? 'text-gray-500' : 'text-green-600'} flex-shrink-0 ml-2`}>
                {formData.reason.length}/10
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 sm:pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white font-bold rounded-lg sm:rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-blue-500/35 flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base ${isSubmitting ? 'opacity-80 cursor-not-allowed' : ''
                }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent"></div>
                  <span>Submitting Your Request...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Submit Leave Application</span>
                </>
              )}
            </button>
          </div>

          {/* Policy Notice */}
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 rounded-xl sm:rounded-2xl p-2 sm:p-6 mt-4 sm:mt-6">
            <div className="flex items-start">
              <div className="ml-3 sm:ml-4 flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-blue-800">📋 Leave Policy Guidelines</h3>
                <div className="mt-1 sm:mt-2 text-xs sm:text-sm text-blue-700 space-y-1.5 sm:space-y-2">
                  <p className="flex items-start sm:items-center">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-sky-400 rounded-full mr-1.5 sm:mr-2 mt-1 sm:mt-0 flex-shrink-0"></span>
                    Apply for leave at least <strong className="mx-1">24 hours</strong> in advance
                  </p>
                  <p className="flex items-start sm:items-center">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-rose-400 rounded-full mr-1.5 sm:mr-2 mt-1 sm:mt-0 flex-shrink-0"></span>
                    Emergency leaves require <strong className="mx-1">immediate supervisor approval</strong>
                  </p>
                  <p className="flex items-start sm:items-center">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full mr-1.5 sm:mr-2 mt-1 sm:mt-0 flex-shrink-0"></span>
                    Provide sufficient details for <strong className="mx-1">quick processing</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Add some custom styles for confetti effect */}
      <style jsx>{`
        .celebrate {
          animation: celebrate 0.5s ease-in-out;
        }
        
        @keyframes celebrate {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        /* Improve mobile form experience */
        @media (max-width: 640px) {
          input, select, textarea {
            font-size: 16px !important; /* Prevents zoom on iOS */
          }
          
          /* Better touch targets */
          button, input, select, textarea {
            min-height: 44px;
          }
        }
      `}</style>
    </div>
  );
};

export default LeaveApplicationForm;