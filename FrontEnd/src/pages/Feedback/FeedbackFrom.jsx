// components/FeedbackForm.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Briefcase,
  MessageCircle,
  Image,
  Search,
  AlertCircle,
  CheckCircle,
  X,
  Upload,
  Video,
  ArrowRight,
  ArrowLeft,
  Check,
  Lightbulb,
  Compass,
  MapPin,
  Building,
  Phone,
  Mail,
  Calendar,
  Clock,
  Laptop,
  Flag
} from 'lucide-react';

const FeedbackForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    uniqueId: '',
    fullName: '',
    managerName: '',
    mobileNumber: '',
    email: '',
    state: '',
    city: '',
    domain: '',
    duration: '',
    startMonth: '',
    endMonth: '',
    feedbackText: '',
    photo: null,
    video: null
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [internData, setInternData] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);

  const animatedTexts = [
    "Share Your Journey",
    "Inspire Others",
    "Build Your Legacy",
    "Shape The Future"
  ];

  // Blue-themed background text phrases
  const backgroundTexts = [
    { text: "ATHENURA", color: "text-blue-100" },
    { text: "FEEDBACK", color: "text-blue-100" },
    { text: "SUCCESS", color: "text-blue-100" },
    { text: "GROWTH", color: "text-blue-100" },
    { text: "LEARNING", color: "text-blue-100" },
    { text: "IMPACT", color: "text-blue-100" },
    { text: "INNOVATION", color: "text-blue-100" },
    { text: "EXCELLENCE", color: "text-blue-100" },
    { text: "ACHIEVE", color: "text-blue-100" },
    { text: "INSPIRE", color: "text-blue-100" },
    { text: "CREATE", color: "text-blue-100" },
    { text: "DREAM", color: "text-blue-100" }
  ];

  // Steps with Lucide icons
  const steps = [
    { number: 1, label: 'Intern Info', icon: User },
    { number: 2, label: 'Internship', icon: Briefcase },
    { number: 3, label: 'Feedback', icon: MessageCircle },
    { number: 4, label: 'Media', icon: Image }
  ];

  // Typing animation effect
  useEffect(() => {
    const currentText = animatedTexts[currentWordIndex];
    let timeout;

    if (typingText.length < currentText.length) {
      timeout = setTimeout(() => {
        setTypingText(currentText.slice(0, typingText.length + 1));
      }, 100);
    } else {
      timeout = setTimeout(() => {
        setTypingText('');
        setCurrentWordIndex((prev) => (prev + 1) % animatedTexts.length);
      }, 2000);
    }

    return () => clearTimeout(timeout);
  }, [typingText, currentWordIndex]);

  // Search intern by unique ID
  const searchInternByUniqueId = async (uniqueId) => {
    if (!uniqueId.trim()) {
      setSearchError('Please enter a Unique ID');
      return;
    }

    setSearchLoading(true);
    setSearchError('');

    try {
      const encodedId = encodeURIComponent(uniqueId);
      const response = await axios.get(`/api/interns/${encodedId}`);

      if (response.data.success && response.data.intern) {
        const intern = response.data.intern;
        setInternData(intern);

        // Auto-fill form data from API response
        setFormData(prev => ({
          ...prev,
          fullName: intern.fullName || '',
          managerName: intern.managerName || '',
          mobileNumber: intern.mobileNumber || '',
          email: intern.email || '',
          state: intern.state || '',
          city: intern.city || '',
          domain: intern.domain || '',
          duration: intern.duration || '',
          startMonth: intern.startMonth || '',
          endMonth: intern.endMonth || ''
        }));

        setSearchError('');
      } else {
        setSearchError(response.data.message || 'No completed intern found with this Unique ID');
        setInternData(null);
      }
    } catch (error) {
      console.error('Error searching intern:', error);
      if (error.response?.status === 404) {
        setSearchError('No completed intern found with this Unique ID');
      } else if (error.response?.data?.message) {
        setSearchError(error.response.data.message);
      } else {
        setSearchError('Error searching for intern. Please try again.');
      }
      setInternData(null);
    } finally {
      setSearchLoading(false);
    }
  };

  // Manual search function
  const handleManualSearch = () => {
    if (formData.uniqueId.trim()) {
      searchInternByUniqueId(formData.uniqueId);
    }
  };

  // Handle unique ID input with debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.uniqueId && formData.uniqueId.length >= 3) {
        searchInternByUniqueId(formData.uniqueId);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [formData.uniqueId]);

  // Handle text input changes (only for non-disabled fields)
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Only allow changes to uniqueId and feedbackText
    if (name === 'uniqueId' || name === 'feedbackText') {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Handle file uploads
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];

    if (!file) return;

    // File validation
    if (name === 'photo') {
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file (PNG, JPG, JPEG)');
        e.target.value = '';
        return;
      }
      if (file.size > 1 * 1024 * 1024) { // 1MB
        alert('Photo size should be less than 1MB');
        e.target.value = '';
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target.result);
      };
      reader.readAsDataURL(file);

    } else if (name === 'video') {
      if (!file.type.startsWith('video/')) {
        alert('Please select a valid video file (MP4, MOV, AVI)');
        e.target.value = '';
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB
        alert('Video size should be less than 10MB');
        e.target.value = '';
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setVideoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }

    setFormData(prev => ({
      ...prev,
      [name]: file
    }));
  };

  // Clear file previews
  const clearFilePreview = (type) => {
    if (type === 'photo') {
      setPhotoPreview(null);
      setFormData(prev => ({ ...prev, photo: null }));
      // Reset file input
      const fileInput = document.getElementById('photo');
      if (fileInput) fileInput.value = '';
    } else if (type === 'video') {
      setVideoPreview(null);
      setFormData(prev => ({ ...prev, video: null }));
      // Reset file input
      const fileInput = document.getElementById('video');
      if (fileInput) fileInput.value = '';
    }
  };

  // Navigation between steps
  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // Submit form data to API
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required files
    if (!formData.photo || !formData.video) {
      alert('Please upload both photo and video files');
      return;
    }

    // Show file size information
    const photoSizeKB = (formData.photo.size / 1024).toFixed(2);
    const videoSizeMB = (formData.video.size / 1024 / 1024).toFixed(2);

    console.log(`Uploading - Photo: ${photoSizeKB}KB, Video: ${videoSizeMB}MB`);

    setLoading(true);

    try {
      const submitData = new FormData();

      // Append all form data
      Object.keys(formData).forEach(key => {
        if (key === 'photo' || key === 'video') {
          if (formData[key]) {
            submitData.append(key, formData[key]);
          }
        } else {
          submitData.append(key, formData[key] || '');
        }
      });

      console.log('Submitting form data...');

      const response = await axios.post('/api/feedback', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000, // 60 seconds timeout for large files
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`Upload Progress: ${progress}%`);
        }
      });

      if (response.data.success) {
        setSubmitted(true);
      } else {
        throw new Error(response.data.message || 'Submission failed');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      let errorMessage = 'There was an error submitting your feedback. Please try again.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please check your file sizes and try again.';
      } else if (error.message.includes('Network Error')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Clear search results
  const clearSearch = () => {
    setInternData(null);
    setSearchError('');
    setFormData(prev => ({
      ...prev,
      uniqueId: '',
      fullName: '',
      managerName: '',
      mobileNumber: '',
      email: '',
      state: '',
      city: '',
      domain: '',
      duration: '',
      startMonth: '',
      endMonth: ''
    }));
  };

  // Blue Background Text Component
  const BackgroundText = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {backgroundTexts.map((item, index) => (
        <motion.div
          key={index}
          className={`absolute font-bold text-4xl lg:text-8xl whitespace-nowrap ${item.color} opacity-10 lg:opacity-15`}
          initial={{
            x: Math.random() * 100 - 50 + '%',
            y: Math.random() * 100 - 50 + '%',
            rotate: Math.random() * 20 - 10,
            scale: 0.8 + Math.random() * 0.4
          }}
          animate={{
            x: [null, Math.random() * 60 - 30 + '%'],
            y: [null, Math.random() * 60 - 30 + '%'],
            rotate: [null, Math.random() * 40 - 20],
            scale: [null, 0.7 + Math.random() * 0.6]
          }}
          transition={{
            duration: 25 + Math.random() * 20,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          }}
          style={{
            zIndex: 0,
            top: `${10 + Math.random() * 80}%`,
            left: `${Math.random() * 100}%`,
            filter: 'blur(0.5px)'
          }}
        >
          {item.text}
        </motion.div>
      ))}
    </div>
  );

  // Step 1: Intern Information
  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-4 lg:space-y-6 relative z-10"
    >
      <div className="text-center">
        <motion.h2
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="text-xl lg:text-2xl font-bold text-gray-800 bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent"
        >
          Intern Information
        </motion.h2>
        <p className="text-gray-600 mt-1 lg:mt-2 text-sm lg:text-base">Enter your Unique ID to auto-fill your details</p>
      </div>

      <div className="space-y-3 lg:space-y-4">
        {/* Unique ID Search Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <label htmlFor="uniqueId" className="block text-sm font-medium text-gray-700 mb-1">
            Unique ID *
          </label>
          <div className="flex flex-col xs:flex-row space-y-2 xs:space-y-0 xs:space-x-2">
            <div className="flex-1 relative">
              <input
                type="text"
                id="uniqueId"
                name="uniqueId"
                value={formData.uniqueId}
                onChange={handleInputChange}
                placeholder="Enter your unique ID to auto-fill details"
                className="w-full px-3 lg:px-4 py-2 lg:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-md bg-white backdrop-blur-sm text-sm lg:text-base"
                required
              />
              {searchLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleManualSearch}
              disabled={searchLoading || !formData.uniqueId}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 lg:py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center space-x-2 disabled:cursor-not-allowed backdrop-blur-sm text-sm lg:text-base"
            >
              <Search size={16} />
              <span>Search</span>
            </button>
          </div>

          {/* Search Status */}
          {searchError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-2 mt-2 text-blue-600 bg-blue-50 p-2 lg:p-3 rounded-lg backdrop-blur-sm text-sm"
            >
              <AlertCircle size={16} />
              <span>{searchError}</span>
            </motion.div>
          )}

          {internData && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 lg:mt-3 p-3 lg:p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg backdrop-blur-sm"
            >
              <div className="flex items-center justify-between mb-2 lg:mb-3">
                <div className="flex items-center space-x-2 text-blue-700">
                  <CheckCircle size={18} />
                  <span className="font-semibold text-sm lg:text-base">Intern details loaded successfully!</span>
                </div>
                <button
                  onClick={clearSearch}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                  title="Clear and search again"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs lg:text-sm text-blue-700">
                <div><span className="font-medium">Name:</span> {internData.fullName}</div>
                <div><span className="font-medium">Domain:</span> {internData.domain}</div>
                <div><span className="font-medium">Duration:</span> {internData.duration} months</div>
                <div><span className="font-medium">Status:</span>
                  <span className="ml-1 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    {internData.status}
                  </span>
                </div>
                <div><span className="font-medium">Start:</span> {internData.startMonth}</div>
                <div><span className="font-medium">End:</span> {internData.endMonth}</div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Personal Information Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 lg:p-4 rounded-lg border border-blue-200 backdrop-blur-sm"
        >
          <h3 className="text-base lg:text-lg font-semibold text-blue-800 mb-2 lg:mb-3 flex items-center space-x-2">
            <User size={18} />
            <span>Personal Information</span>
          </h3>

          <div className="grid grid-cols-1 gap-3 lg:gap-4">
            {[
              { id: 'fullName', label: 'Full Name *', value: formData.fullName, icon: User },
              { id: 'managerName', label: 'TPO Name *', value: formData.managerName, icon: Briefcase }
            ].map((field, index) => (
              <motion.div
                key={field.id}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-1 flex items-center space-x-2">
                  <field.icon size={16} />
                  <span>{field.label}</span>
                </label>
                <input
                  type="text"
                  id={field.id}
                  name={field.id}
                  value={field.value}
                  onChange={handleInputChange}
                  disabled={!!internData}
                  className="w-full px-3 lg:px-4 py-2 lg:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-md bg-white disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed text-sm lg:text-base"
                  required
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Contact Information Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 lg:p-4 rounded-lg border border-blue-200 backdrop-blur-sm"
        >
          <h3 className="text-base lg:text-lg font-semibold text-blue-800 mb-2 lg:mb-3 flex items-center space-x-2">
            <Mail size={18} />
            <span>Contact Information</span>
          </h3>

          <div className="grid grid-cols-1 gap-3 lg:gap-4">
            {[
              { id: 'mobileNumber', label: 'Mobile Number *', type: 'tel', value: formData.mobileNumber, icon: Phone },
              { id: 'email', label: 'Email Address *', type: 'email', value: formData.email, icon: Mail }
            ].map((field, index) => (
              <motion.div
                key={field.id}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 + index * 0.1 }}
              >
                <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-1 flex items-center space-x-2">
                  <field.icon size={16} />
                  <span>{field.label}</span>
                </label>
                <input
                  type={field.type}
                  id={field.id}
                  name={field.id}
                  value={field.value}
                  onChange={handleInputChange}
                  disabled={!!internData}
                  className="w-full px-3 lg:px-4 py-2 lg:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-md bg-white disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed text-sm lg:text-base"
                  required
                />
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 lg:gap-4 mt-3 lg:mt-4">
            {[
              { id: 'state', label: 'State *', value: formData.state, icon: MapPin },
              { id: 'city', label: 'City *', value: formData.city, icon: Building }
            ].map((field, index) => (
              <motion.div
                key={field.id}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 + index * 0.1 }}
              >
                <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-1 flex items-center space-x-2">
                  <field.icon size={16} />
                  <span>{field.label}</span>
                </label>
                <input
                  type="text"
                  id={field.id}
                  name={field.id}
                  value={field.value}
                  onChange={handleInputChange}
                  disabled={!!internData}
                  className="w-full px-3 lg:px-4 py-2 lg:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-md bg-white disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed text-sm lg:text-base"
                  required
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        className="flex justify-end pt-4 lg:pt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
      >
        <button
          type="button"
          onClick={nextStep}
          disabled={!formData.uniqueId || !formData.fullName || !formData.email}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 lg:px-8 py-2 lg:py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-xl disabled:shadow-md flex items-center space-x-2 disabled:cursor-not-allowed backdrop-blur-sm text-sm lg:text-base w-full xs:w-auto justify-center"
        >
          <span>Next</span>
          <motion.div
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ArrowRight size={16} />
          </motion.div>
        </button>
      </motion.div>
    </motion.div>
  );

  // Step 2: Internship Details
  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-4 lg:space-y-6 relative z-10"
    >
      <div className="text-center">
        <motion.h2
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="text-xl lg:text-2xl font-bold text-gray-800 bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent"
        >
          Internship Details
        </motion.h2>
        <p className="text-gray-600 mt-1 lg:mt-2 text-sm lg:text-base">Tell us about your internship experience</p>
      </div>

      <div className="space-y-3 lg:space-y-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 lg:p-4 rounded-lg border border-blue-200 backdrop-blur-sm"
        >
          <h3 className="text-base lg:text-lg font-semibold text-blue-800 mb-2 lg:mb-3 flex items-center space-x-2">
            <Briefcase size={18} />
            <span>Internship Information</span>
          </h3>

          {[
            [
              { id: 'domain', label: 'Domain/Field *', value: formData.domain, icon: Laptop },
              { id: 'duration', label: 'Duration (months) *', value: formData.duration, icon: Clock }
            ],
            [
              { id: 'startMonth', label: 'Start Month *', value: formData.startMonth, placeholder: 'e.g. January 2024', icon: Calendar },
              { id: 'endMonth', label: 'End Month *', value: formData.endMonth, placeholder: 'e.g. June 2024', icon: Flag }
            ]
          ].map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-1 gap-3 lg:gap-4 mb-3 lg:mb-4">
              {row.map((field, fieldIndex) => (
                <motion.div
                  key={field.id}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 + (rowIndex * 0.2) + (fieldIndex * 0.1) }}
                >
                  <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-1 flex items-center space-x-2">
                    <field.icon size={16} />
                    <span>{field.label}</span>
                  </label>
                  <input
                    type="text"
                    id={field.id}
                    name={field.id}
                    value={field.value}
                    placeholder={field.placeholder || ''}
                    onChange={handleInputChange}
                    disabled={!!internData}
                    className="w-full px-3 lg:px-4 py-2 lg:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-md bg-white disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed text-sm lg:text-base"
                    required
                  />
                </motion.div>
              ))}
            </div>
          ))}
        </motion.div>

        {/* Additional Info from Intern Data */}
        {internData && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 lg:p-4 rounded-lg border border-blue-200 backdrop-blur-sm"
          >
            <h3 className="text-base lg:text-lg font-semibold text-blue-800 mb-2 lg:mb-3 flex items-center space-x-2">
              <CheckCircle size={18} />
              <span>Internship Summary</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs lg:text-sm text-blue-700">
              <div><span className="font-medium">Duration:</span> {internData.duration} months</div>
              <div><span className="font-medium">Extended Days:</span> {internData.extendedDays || 0}</div>
              <div><span className="font-medium">Total Duration:</span> {(parseInt(internData.duration) || 0) + (parseInt(internData.extendedDays) || 0)} months</div>
              <div><span className="font-medium">Start Date:</span> {internData.startMonth}</div>
              <div><span className="font-medium">End Date:</span> {internData.endMonth}</div>
              <div><span className="font-medium">Status:</span>
                <span className="ml-1 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                  {internData.status}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <motion.div
        className="flex justify-between pt-4 lg:pt-6 space-x-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <button
          type="button"
          onClick={prevStep}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 lg:px-8 py-2 lg:py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2 backdrop-blur-sm text-sm lg:text-base flex-1 xs:flex-none justify-center"
        >
          <motion.div
            animate={{ x: [0, -5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ArrowLeft size={16} />
          </motion.div>
          <span>Back</span>
        </button>
        <button
          type="button"
          onClick={nextStep}
          disabled={!formData.domain || !formData.duration}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 lg:px-8 py-2 lg:py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-xl disabled:shadow-md flex items-center space-x-2 disabled:cursor-not-allowed backdrop-blur-sm text-sm lg:text-base flex-1 xs:flex-none justify-center"
        >
          <span>Next</span>
          <motion.div
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ArrowRight size={16} />
          </motion.div>
        </button>
      </motion.div>
    </motion.div>
  );

  // Step 3: Feedback (Only editable field)
  const renderStep3 = () => (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-4 lg:space-y-6 relative z-10"
    >
      <div className="text-center">
        <motion.h2
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="text-xl lg:text-2xl font-bold text-gray-800 bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent"
        >
          Share Feedback
        </motion.h2>
        <p className="text-gray-600 mt-1 lg:mt-2 text-sm lg:text-base">Tell us about your internship experience</p>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-3 lg:space-y-4"
      >
        <div>
          <label htmlFor="feedbackText" className="block text-sm font-medium text-gray-700 mb-1">
            Your Feedback *
          </label>
          <textarea
            id="feedbackText"
            name="feedbackText"
            rows="6"
            value={formData.feedbackText}
            onChange={handleInputChange}
            placeholder="Share your experience, what you learned, and any suggestions..."
            className="w-full px-3 lg:px-4 py-2 lg:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-md resize-vertical bg-white backdrop-blur-sm text-sm lg:text-base"
            required
          />
        </div>
        {formData.feedbackText.length > 0 && formData.feedbackText.length < 50 && (
          <p className="text-blue-500 text-sm mt-1">
            Feedback must be at least 50 characters.
          </p>
        )}
      </motion.div>

      <motion.div
        className="flex justify-between pt-4 lg:pt-6 space-x-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <button
          type="button"
          onClick={prevStep}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 lg:px-8 py-2 lg:py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2 backdrop-blur-sm text-sm lg:text-base flex-1 xs:flex-none justify-center"
        >
          <motion.div
            animate={{ x: [0, -5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ArrowLeft size={16} />
          </motion.div>
          <span>Back</span>
        </button>
        <button
          type="button"
          onClick={nextStep}
          disabled={formData.feedbackText.trim().length < 50}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 
             disabled:from-gray-400 disabled:to-gray-500 text-white px-6 lg:px-8 py-2 lg:py-3 
             rounded-lg font-medium transition-all duration-300 transform hover:scale-105 
             disabled:scale-100 shadow-lg hover:shadow-xl disabled:shadow-md flex items-center 
             space-x-2 disabled:cursor-not-allowed backdrop-blur-sm text-sm lg:text-base 
             flex-1 xs:flex-none justify-center"
        >
          <span>Next</span>
          <motion.div
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ArrowRight size={16} />
          </motion.div>
        </button>
      </motion.div>
    </motion.div>
  );

  // Step 4: Upload Media
  const renderStep4 = () => (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-4 lg:space-y-6 relative z-10"
    >
      <div className="text-center">
        <motion.h2
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="text-xl lg:text-2xl font-bold text-gray-800 bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent"
        >
          Upload Media
        </motion.h2>
        <p className="text-gray-600 mt-1 lg:mt-2 text-sm lg:text-base">Add your photo and feedback video</p>
      </div>

      <div className="space-y-4 lg:space-y-6">
        <div className="grid grid-cols-1 gap-4 lg:gap-6">
          {/* Photo Upload */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <label htmlFor="photo" className="block text-sm font-medium text-gray-700 mb-1">
              Intern Photo *
            </label>
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="file"
                  id="photo"
                  name="photo"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  required
                />
                <label
                  htmlFor="photo"
                  className="block border-2 border-dashed border-blue-300 rounded-lg p-4 lg:p-6 text-center transition-all duration-300 cursor-pointer bg-blue-50 backdrop-blur-sm hover:border-blue-400 hover:bg-blue-100"
                >
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Upload className="text-2xl lg:text-3xl text-blue-500 mb-2 lg:mb-3 mx-auto" size={24} />
                  </motion.div>
                  <p className="text-gray-600 font-medium text-sm lg:text-base">
                    {formData.photo ? formData.photo.name : 'Click to upload your photo'}
                  </p>
                  <p className="text-xs lg:text-sm text-blue-600 mt-1 lg:mt-2">PNG, JPG, JPEG - Max 1MB</p>
                </label>
              </div>

              {/* Photo Preview with Size Info */}
              {photoPreview && formData.photo && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative group"
                >
                  <div className="flex items-center justify-between p-2 bg-blue-50 rounded-t-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-blue-700 font-medium">Photo Preview</span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {(formData.photo.size / 1024).toFixed(2)} KB
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => clearFilePreview('photo')}
                      className="text-blue-500 hover:text-blue-700 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <img
                    src={photoPreview}
                    alt="Photo preview"
                    className="w-full h-40 lg:h-48 object-cover rounded-b-lg border-2 border-blue-200"
                  />
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Video Upload */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <label htmlFor="video" className="block text-sm font-medium text-gray-700 mb-1">
              Feedback Video *
            </label>
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="file"
                  id="video"
                  name="video"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="hidden"
                  required
                />
                <label
                  htmlFor="video"
                  className="block border-2 border-dashed border-blue-300 rounded-lg p-4 lg:p-6 text-center transition-all duration-300 cursor-pointer bg-blue-50 backdrop-blur-sm hover:border-blue-400 hover:bg-blue-100"
                >
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Video className="text-2xl lg:text-3xl text-blue-500 mb-2 lg:mb-3 mx-auto" size={24} />
                  </motion.div>
                  <p className="text-gray-600 font-medium text-sm lg:text-base">
                    {formData.video ? formData.video.name : 'Click to upload your video'}
                  </p>
                  <p className="text-xs lg:text-sm text-blue-600 mt-1 lg:mt-2">MP4, MOV - Max 10MB</p>
                </label>
              </div>

              {/* Video Preview with Size Info */}
              {videoPreview && formData.video && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative group"
                >
                  <div className="flex items-center justify-between p-2 bg-blue-50 rounded-t-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-blue-700 font-medium">Video Preview</span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {(formData.video.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => clearFilePreview('video')}
                      className="text-blue-500 hover:text-blue-700 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="relative w-full h-40 lg:h-48 bg-blue-900 rounded-b-lg border-2 border-blue-200">
                    <video
                      src={videoPreview}
                      className="w-full h-full object-contain"
                      controls
                    />
                    <div className="absolute bottom-2 left-2 bg-blue-800 bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                      Click play to preview
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>

        {/* File Status */}
        <div className="grid grid-cols-1 gap-3 lg:gap-4">
          {[
            {
              type: 'photo',
              file: formData.photo,
              preview: photoPreview,
              icon: Image
            },
            {
              type: 'video',
              file: formData.video,
              preview: videoPreview,
              icon: Video
            }
          ].map((fileInfo) => (
            <motion.div
              key={fileInfo.type}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`p-3 rounded-lg ${fileInfo.file
                ? 'bg-blue-50 border border-blue-200'
                : 'bg-blue-50 border border-blue-200'
                }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <fileInfo.icon size={18} className={
                    fileInfo.file ? 'text-blue-500' : 'text-blue-400'
                  } />
                  <div>
                    <span className="text-sm font-medium capitalize block text-blue-800">
                      {fileInfo.type} {fileInfo.file ? 'uploaded' : 'required'}
                    </span>
                    <span className="text-xs text-blue-600">
                      {fileInfo.type === 'photo' ? 'Max size: 1MB' : 'Max size: 10MB'}
                    </span>
                  </div>
                </div>
                {fileInfo.file && (
                  <span className="text-xs font-medium px-2 py-1 rounded bg-blue-100 text-blue-800">
                    {fileInfo.type === 'photo'
                      ? `${(fileInfo.file.size / 1024).toFixed(2)} KB`
                      : `${(fileInfo.file.size / 1024 / 1024).toFixed(2)} MB`
                    }
                  </span>
                )}
              </div>
              {fileInfo.file && (
                <p className="text-xs text-blue-600 mt-2 truncate">
                  {fileInfo.file.name}
                </p>
              )}
            </motion.div>
          ))}
        </div>

        {/* Upload Tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-3 lg:p-4 backdrop-blur-sm"
        >
          <div className="flex items-start space-x-3">
            <Lightbulb size={18} className="text-blue-500 mt-1" />
            <div>
              <h4 className="font-medium text-blue-800 text-sm lg:text-base">Upload Tips</h4>
              <ul className="text-xs lg:text-sm text-blue-700 mt-1 space-y-1">
                <li>• <strong>Photos:</strong> Maximum 1MB - Clear, well-lit headshot or professional photo</li>
                <li>• <strong>Videos:</strong> Maximum 10MB - 1-2 minute feedback video in landscape orientation</li>
                <li>• <strong>Formats:</strong> JPG/PNG for photos, MP4 for videos</li>
                <li>• Ensure stable internet connection before uploading</li>
                <li>• Check file sizes before uploading to avoid delays</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Current Upload Stats */}
        {(formData.photo || formData.video) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-3 lg:p-4 backdrop-blur-sm"
          >
            <h4 className="font-medium text-blue-800 text-sm lg:text-base mb-2">Upload Summary</h4>
            <div className="grid grid-cols-1 gap-2 text-xs lg:text-sm text-blue-700">
              {formData.photo && (
                <div className="flex justify-between">
                  <span>Photo Size:</span>
                  <span className="font-medium">{(formData.photo.size / 1024).toFixed(2)} KB</span>
                </div>
              )}
              {formData.video && (
                <div className="flex justify-between">
                  <span>Video Size:</span>
                  <span className="font-medium">{(formData.video.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              )}
              <div className="flex justify-between border-t border-blue-200 pt-2">
                <span>Total Size:</span>
                <span className="font-medium">
                  {(((formData.photo?.size || 0) + (formData.video?.size || 0)) / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <motion.div
        className="flex justify-between pt-4 lg:pt-6 space-x-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <button
          type="button"
          onClick={prevStep}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 lg:px-8 py-2 lg:py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2 backdrop-blur-sm text-sm lg:text-base flex-1 xs:flex-none justify-center"
        >
          <motion.div
            animate={{ x: [0, -5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ArrowLeft size={16} />
          </motion.div>
          <span>Back</span>
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !formData.photo || !formData.video}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 lg:px-8 py-2 lg:py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-xl disabled:shadow-md flex items-center space-x-2 disabled:cursor-not-allowed backdrop-blur-sm text-sm lg:text-base flex-1 xs:flex-none justify-center"
        >
          {loading ? (
            <>
              <motion.div
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              ></motion.div>
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <span>Submit Feedback</span>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Check size={16} />
              </motion.div>
            </>
          )}
        </button>
      </motion.div>
    </motion.div>
  );

  // Success message after submission
  const renderSuccess = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-6 lg:py-8 relative z-10"
    >
      <motion.div
        className="w-16 h-16 lg:w-20 lg:h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 lg:mb-6 backdrop-blur-sm"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: "spring" }}
        >
          <CheckCircle size={32} className="text-blue-500" />
        </motion.div>
      </motion.div>
      <motion.h2
        className="text-2xl lg:text-3xl font-bold text-gray-800 mb-3 lg:mb-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        Thank You!
      </motion.h2>
      <motion.p
        className="text-gray-600 mb-6 lg:mb-8 text-base lg:text-lg"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        Your feedback has been submitted successfully.
      </motion.p>
      <motion.button
        type="button"
        onClick={() => {
          setSubmitted(false);
          setCurrentStep(1);
          setFormData({
            uniqueId: '',
            fullName: '',
            managerName: '',
            mobileNumber: '',
            email: '',
            state: '',
            city: '',
            domain: '',
            duration: '',
            startMonth: '',
            endMonth: '',
            feedbackText: '',
            photo: null,
            video: null
          });
          setInternData(null);
          setSearchError('');
          setPhotoPreview(null);
          setVideoPreview(null);
        }}
        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 lg:px-8 py-2 lg:py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg backdrop-blur-sm text-sm lg:text-base w-full xs:w-auto"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1 }}
      >
        Submit Another Feedback
      </motion.button>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 py-4 lg:py-8 px-3 lg:px-4 relative overflow-hidden">
      {/* Blue Background Text */}
      <BackgroundText />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="bg-white rounded-2xl lg:rounded-3xl shadow-xl lg:shadow-2xl overflow-hidden relative backdrop-blur-sm bg-white/95">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white p-4 lg:p-8 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
              {[...Array(15)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 lg:w-2 lg:h-2 bg-blue-200 rounded-full opacity-20"
                  initial={{
                    x: Math.random() * 100 + '%',
                    y: Math.random() * 100 + '%',
                    scale: 0
                  }}
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 0.3, 0]
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2
                  }}
                />
              ))}
            </div>

            <div className="relative z-10">
              <motion.img
                src="/White.png"
                alt="Athenura Logo"
                className="w-48 lg:w-64 mx-auto mb-2"
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
              />
              <motion.p
                className="text-blue-200 text-center mb-1 lg:mb-2 text-sm lg:text-lg"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Intern Feedback Portal
              </motion.p>

              {/* Animated Typing Text */}
              <motion.div
                className="text-center h-6 lg:h-8 mb-4 lg:mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <span className="text-lg lg:text-xl font-semibold text-blue-200">
                  {typingText}
                  <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="ml-1"
                  >
                    |
                  </motion.span>
                </span>
              </motion.div>

              {/* Progress Indicator */}
              <div className="max-w-2xl mx-auto">
                <div className="flex justify-between relative mb-2 lg:mb-3">
                  {/* Progress line */}
                  <div className="absolute top-3 lg:top-4 left-0 right-0 h-1 lg:h-2 bg-blue-400 rounded-full -z-10"></div>
                  <motion.div
                    className="absolute top-3 lg:top-4 left-0 h-1 lg:h-2 bg-white rounded-full -z-10"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  ></motion.div>

                  {/* Step indicators */}
                  {steps.map((step) => {
                    const IconComponent = step.icon;
                    return (
                      <div key={step.number} className="flex flex-col items-center">
                        <motion.div
                          className={`w-8 h-8 lg:w-12 lg:h-12 rounded-full flex items-center justify-center text-xs lg:text-sm font-semibold transition-all duration-300 ${currentStep >= step.number
                            ? 'bg-white text-blue-600 shadow-lg lg:shadow-2xl scale-110'
                            : 'bg-blue-400 text-white'
                            }`}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {currentStep > step.number ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring" }}
                            >
                              <Check size={14} />
                            </motion.div>
                          ) : (
                            <IconComponent size={14} />
                          )}
                        </motion.div>
                        <span className="text-xs mt-1 lg:mt-2 text-blue-200 font-medium hidden xs:block">
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-4 lg:p-8 relative">
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {renderSuccess()}
                </motion.div>
              ) : (
                <motion.form
                  key={`step-${currentStep}`}
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {currentStep === 1 && renderStep1()}
                  {currentStep === 2 && renderStep2()}
                  {currentStep === 3 && renderStep3()}
                  {currentStep === 4 && renderStep4()}
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackForm;