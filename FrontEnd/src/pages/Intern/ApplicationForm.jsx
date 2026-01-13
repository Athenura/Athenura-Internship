// InternshipForm.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import Athenura from "../../../public/Athenura.jpeg"

const ApplicationForm = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    mobile: "",
    email: "",
    dob: "",
    gender: "",
    state: "",
    city: "",
    address: "",
    pinCode: "",
    college: "",
    course: "",
    TpoName: "",
    TpoEmail: "",
    TpoNumber: "",
    educationLevel: "",
    domain: "",
    contactMethod: "",
    resumeUrl: "",
    duration: "",
    prevInternship: "",
    prevInternshipDesc: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [showResumeMsg, setShowResumeMsg] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setError("");
      setSuccess("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [error, success]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  useEffect(() => {
    axios.get("/api/application-status").then((res) => {
      setIsOpen(res.data.isApplicationOpen);
      setLoading(false);
    });
  }, []);


  const validateForm = () => {
    const requiredFields = [
      "fullName", "mobile", "email", "dob", "gender", "state", "city", "address",
      "pinCode", "college", "course", "educationLevel", "domain", "contactMethod",
      "resumeUrl", "duration", "prevInternship"
    ];
    const newErrors = {};

    requiredFields.forEach((field) => {
      if (!formData[field].trim()) {
        newErrors[field] = `${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required.`;
      }
    });

    if (formData.mobile && !/^\d{10}$/.test(formData.mobile)) {
      newErrors.mobile = "Mobile number must be 10 digits.";
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid.";
    }

    if (formData.pinCode && !/^\d{6}$/.test(formData.pinCode)) {
      newErrors.pinCode = "Pin code must be 6 digits.";
    }

    setError("");
    if (Object.keys(newErrors).length > 0) {
      setError(Object.values(newErrors).join(", "));
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('/api/createIntern', formData)
      // Response data is automatically parsed as JSON
      console.log(response.data); // Optional: Log the response for debugging
      setSuccess("Application submitted successfully!");
      setFormData({
        fullName: "",
        mobile: "",
        email: "",
        dob: "",
        gender: "",
        state: "",
        city: "",
        address: "",
        pinCode: "",
        college: "",
        TpoName: "",
        TpoEmail: "",
        TpoNumber: "",
        course: "",
        educationLevel: "",
        domain: "",
        contactMethod: "",
        resumeUrl: "",
        duration: "",
        prevInternship: "",
      }); // Reset form
    } catch (err) {
      // Axios throws on HTTP error status (4xx, 5xx)
      const errorMessage = err.response?.data?.message || err.message || "Failed to submit application. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#172A55] via-gray-900 to-[#172A55] text-center p-8">
        <img src={Athenura} alt="Athenura Logo" className="h-24 w-24 mb-6 rounded-full shadow-lg" />
        <h1 className="text-4xl font-bold text-blue-300 mb-4">Applications Closed</h1>
        <p className="text-gray-300 sm:text-lg text-sm sm:max-w-2xl w-full">
          Thank you for your interest! The internship application form is currently closed.
          <br />
          <span className="sm:text-sm text-s">We encourage you to apply in our next batch.</span>
        </p>

        <p className="text-gray-400 mt-2 text-sm">
          Please check back later or contact us at{" "}
          <a href="mailto:hr@athenura.in" className="text-blue-400 underline">
            hr@athenura.in
          </a>
        </p>
      </div>
    );
  }
  else {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#172A55] via-[#1a4562] to-[#172A55] sm:p-6 p-2">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-5xl bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl sm:p-8 p-3 space-y-8 border-t-8 border-[#2B9DB3]"
        >
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img
              src={Athenura}
              alt="Athenura Logo"
              className="h-18 w-auto rounded-full shadow-lg"

            />
          </div>

          {/* Title and Subtitle */}
          <div className="text-center space-y-2">
            <h1 className="sm:text-4xl text-2xl font-bold bg-gradient-to-r from-blue-300 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Application Form - Athenura
            </h1>
            <p className="text-gray-300 sm:text-sm text-xs leading-relaxed">
              Join our team - Fill out all required fields to submit your application. For more details: <a href="mailto:hr@athenura.in" className="underline text-blue-200 hover:text-blue-300 transition-colors">hr@athenura.in</a>, +91 9835051934
            </p>
          </div>

          {/* Personal Details */}
          <fieldset className="border border-white/30 p-6 rounded-xl bg-white/5">
            <legend className="text-2xl font-semibold text-blue-300 px-2">
              Personal Details
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div className="space-y-1">
                <label htmlFor="fullName" className="block text-sm font-medium text-white">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="fullName"
                  type="text"
                  name="fullName"
                  placeholder="Your full name"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="p-3 rounded-xl bg-white/10 border border-white/30 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 transition-all duration-300 placeholder:text-gray-400 text-white w-full"
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="mobile" className="block text-sm font-medium text-white">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="mobile"
                  type="tel"
                  name="mobile"
                  placeholder="10-digit mobile number"
                  value={formData.mobile}
                  onChange={handleChange}
                  className="p-3 rounded-xl bg-white/10 border border-white/30 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 transition-all duration-300 placeholder:text-gray-400 text-white w-full"
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="email" className="block text-sm font-medium text-white">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="Your email address"
                  value={formData.email}
                  onChange={handleChange}
                  className="p-3 rounded-xl bg-white/10 border border-white/30 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 transition-all duration-300 placeholder:text-gray-400 text-white w-full"
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="dob" className="block text-sm font-medium text-white">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  id="dob"
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className="p-3 rounded-xl bg-white/10 border border-white/30 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 transition-all duration-300 text-white w-full"
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label htmlFor="gender" className="block text-sm font-medium text-white">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="p-3 rounded-xl bg-white/10 border border-white/30 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 transition-all duration-300 text-white w-full"
                  required
                  disabled={loading}
                >
                  <option value="">Select Gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
          </fieldset>

          {/* Address Details */}
          <fieldset className="border border-white/30 p-6 rounded-xl bg-white/5">
            <legend className="text-2xl font-semibold text-blue-300 px-2">
              Address Details
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div className="space-y-1">
                <label htmlFor="state" className="block text-sm font-medium text-white">
                  State <span className="text-red-500">*</span>
                </label>
                <select
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="p-3 rounded-xl bg-white/10 border border-white/30 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 transition-all duration-300 text-white w-full"
                  required
                  disabled={loading}
                >
                  <option value="">Select State</option>
                  <option>Andhra Pradesh</option>
                  <option>Andaman and Nicobar Islands</option>
                  <option>Arunachal Pradesh</option>
                  <option>Assam</option>
                  <option>Bihar</option>
                  <option>Chandigarh</option>
                  <option>Chhattisgarh</option>
                  <option>Dadra and Nagar Haveli</option>
                  <option>Daman and Diu</option>
                  <option>Delhi</option>
                  <option>Lakshadweep</option>
                  <option>Puducherry</option>
                  <option>Goa</option>
                  <option>Gujarat</option>
                  <option>Haryana</option>
                  <option>Himachal Pradesh</option>
                  <option>Jammu and Kashmir</option>
                  <option>Jharkhand</option>
                  <option>Karnataka</option>
                  <option>Kerala</option>
                  <option>Madhya Pradesh</option>
                  <option>Maharashtra</option>
                  <option>Manipur</option>
                  <option>Meghalaya</option>
                  <option>Mizoram</option>
                  <option>Nagaland</option>
                  <option>Odisha</option>
                  <option>Punjab</option>
                  <option>Rajasthan</option>
                  <option>Sikkim</option>
                  <option>Tamil Nadu</option>
                  <option>Telangana</option>
                  <option>Tripura</option>
                  <option>Uttar Pradesh</option>
                  <option>Uttarakhand</option>
                  <option>West Bengal</option>
                </select>
              </div>
              <div className="space-y-1">
                <label htmlFor="city" className="block text-sm font-medium text-white">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  id="city"
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="p-3 rounded-xl bg-white/10 border border-white/30 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 transition-all duration-300 placeholder:text-gray-400 text-white w-full"
                  required
                  disabled={loading}
                  placeholder="Your city"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-white">
                  Full Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="address"
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="p-3 rounded-xl bg-white/10 border border-white/30 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 transition-all duration-300 placeholder:text-gray-400 text-white w-full"
                  required
                  disabled={loading}
                  placeholder="Your full address"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="pinCode" className="block text-sm font-medium text-white">
                  Pin Code <span className="text-red-500">*</span>
                </label>
                <input
                  id="pinCode"
                  type="text"
                  name="pinCode"
                  value={formData.pinCode}
                  onChange={handleChange}
                  className="p-3 rounded-xl bg-white/10 border border-white/30 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 transition-all duration-300 placeholder:text-gray-400 text-white w-full"
                  required
                  disabled={loading}
                  placeholder="6-digit pin code"
                />
              </div>
            </div>
          </fieldset>

          {/* Educational Details */}
          <fieldset className="border border-white/30 p-6 rounded-xl bg-white/5">
            <legend className="text-2xl font-semibold text-blue-300 px-2">
              Educational Details
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div className="space-y-1 sm:col-span-2">
                <label htmlFor="college" className="block text-sm font-medium text-white">
                  College/University Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="college"
                  type="text"
                  name="college"
                  value={formData.college}
                  onChange={handleChange}
                  className="p-3 rounded-xl bg-white/10 border border-white/30 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 transition-all duration-300 placeholder:text-gray-400 text-white w-full"
                  required
                  disabled={loading}
                  placeholder="Your college or university name"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="course" className="block text-sm font-medium text-white">
                  Course Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="course"
                  type="text"
                  name="course"
                  value={formData.course}
                  onChange={handleChange}
                  className="p-3 rounded-xl bg-white/10 border border-white/30 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 transition-all duration-300 placeholder:text-gray-400 text-white w-full"
                  required
                  disabled={loading}
                  placeholder="Your course name"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="educationLevel" className="block text-sm font-medium text-white">
                  Education Level <span className="text-red-500">*</span>
                </label>
                <select
                  id="educationLevel"
                  name="educationLevel"
                  value={formData.educationLevel}
                  onChange={handleChange}
                  className="p-3 rounded-xl bg-white/10 border border-white/30 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 transition-all duration-300 text-white w-full"
                  required
                  disabled={loading}

                >
                  <option value="">Select Education Level</option>
                  <option>High School</option>
                  <option>Intermediate</option>
                  <option>Undergraduate (Bachelor's)</option>
                  <option>Postgraduate (Master's)</option>
                  <option>Diploma</option>
                </select>
              </div>
            </div>
            {/* ✨ New TPO Fields */}
            <div className="space-y-1">
              <label htmlFor="TpoName" className="block text-sm font-medium text-white">
                TPO Name <span className="text-red-500"></span>
              </label>
              <input id="TpoName" name="TpoName" value={formData.TpoName} onChange={handleChange}
                className="p-3 rounded-xl bg-white/10 border border-white/30 focus:ring-2 focus:ring-blue-400/50 text-white w-full"
                placeholder="Training & Placement Officer Name" disabled={loading} />
            </div>

            <div className="space-y-1">
              <label htmlFor="TpoEmail" className="block text-sm font-medium text-white">
                TPO Email <span className="text-red-500"></span>
              </label>
              <input id="TpoEmail" name="TpoEmail" value={formData.TpoEmail} onChange={handleChange}
                type="email"
                className="p-3 rounded-xl bg-white/10 border border-white/30 focus:ring-2 focus:ring-blue-400/50 text-white w-full"
                placeholder="tpo@college.edu" disabled={loading} />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label htmlFor="TpoNumber" className="block text-sm font-medium text-white">
                TPO Contact Number <span className="text-red-500"></span>
              </label>
              <input id="TpoNumber" name="TpoNumber" value={formData.TpoNumber} onChange={handleChange}
                type="tel"
                className="p-3 rounded-xl bg-white/10 border border-white/30 focus:ring-2 focus:ring-blue-400/50 text-white w-full"
                placeholder="10-digit contact number" disabled={loading} />
            </div>

          </fieldset>

          {/* Internship Details */}
          <fieldset className="border border-white/30 p-6 rounded-xl bg-white/5">
            <legend className="text-2xl font-semibold text-blue-300 px-2">
              Internship Details
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div className="space-y-1">
                <label htmlFor="domain" className="block text-sm font-medium text-white">
                  Domain <span className="text-red-500">*</span>
                </label>
                <select
                  id="domain"
                  name="domain"
                  value={formData.domain}
                  onChange={handleChange}
                  className="p-3 rounded-xl bg-white/10 border border-white/30 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 transition-all duration-300 text-white w-full"
                  required
                  disabled={loading}
                >
                  <option value="">Select Domain</option>
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
              </div>
              <div className="space-y-1">
                <label htmlFor="contactMethod" className="block text-sm font-medium text-white">
                  Preferred Contact Method <span className="text-red-500">*</span>
                </label>
                <select
                  id="contactMethod"
                  name="contactMethod"
                  value={formData.contactMethod}
                  onChange={handleChange}
                  className="p-3 rounded-xl bg-white/10 border border-white/30 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 transition-all duration-300 text-white w-full"
                  required
                  disabled={loading}

                >
                  <option value="">Select Contact Method</option>
                  <option>Phone Call</option>
                  <option>WhatsApp Message</option>
                  <option>Both (Phone Call & WhatsApp Message)</option>
                </select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label htmlFor="resumeUrl" className="block text-sm font-medium text-white">
                  CV/Resume URL <span className="text-red-500">*</span>
                </label>
                <input
                  id="resumeUrl"
                  type="url"
                  name="resumeUrl"
                  value={formData.resumeUrl}
                  onChange={handleChange}
                  onFocus={() => setShowResumeMsg(true)}
                  onBlur={() => setShowResumeMsg(false)}
                  className="p-3 rounded-xl bg-white/10 border border-white/30 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 transition-all duration-300 placeholder:text-gray-400 text-white w-full"
                  required
                  disabled={loading}
                  placeholder="Link to your CV/Resume (Google Drive, Dropbox, etc.)"
                />
                {showResumeMsg && (
                  <p className="text-sm text-blue-300 mt-1 italic">
                    🔔 Please ensure your resume link is publicly accessible.
                    <span className="block text-xs text-gray-300">
                      (Private or restricted links cannot be reviewed.)
                    </span>
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <label htmlFor="duration" className="block text-sm font-medium text-white">
                  Duration <span className="text-red-500">*</span>
                </label>
                <select
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="p-3 rounded-xl bg-white/10 border border-white/30 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 transition-all duration-300 text-white w-full"
                  required
                  disabled={loading}
                >
                  <option value="">Select Duration</option>
                  <option>3 Months</option>
                  <option>4 Months</option>
                  <option>6 Months</option>
                  <option>8 Months</option>
                </select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="block text-sm font-medium text-white mb-2">
                  Previous Internship Experience <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-8 p-3 bg-white/5 rounded-xl">
                  <label className="flex items-center text-white cursor-pointer">
                    <input
                      type="radio"
                      name="prevInternship"
                      value="Yes"
                      checked={formData.prevInternship === "Yes"}
                      onChange={handleChange}
                      className="mr-2 text-blue-500 focus:ring-blue-400"
                      required
                      disabled={loading}
                    />
                    Yes
                  </label>
                  <label className="flex items-center text-white cursor-pointer">
                    <input
                      type="radio"
                      name="prevInternship"
                      value="No"
                      checked={formData.prevInternship === "No"}
                      onChange={handleChange}
                      className="mr-2 text-blue-500 focus:ring-blue-400"
                      disabled={loading}
                    />
                    No
                  </label>

                </div>
                {formData.prevInternship === "Yes" && (
                  <div className="mt-4 sm:col-span-2 transition-all duration-500 ease-in-out animate-fade-in">
                    <label
                      htmlFor="prevInternshipDesc"
                      className="block text-sm font-medium text-white"
                    >
                      Describe Your Previous Internship Experience
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="prevInternshipDesc"
                      name="prevInternshipDesc"
                      value={formData.prevInternshipDesc}
                      onChange={handleChange}
                      rows="4"
                      className="p-3 rounded-xl bg-white/10 border border-white/30 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 transition-all duration-300 placeholder:text-gray-400 text-white w-full"
                      placeholder="Write about your previous internship experience..."
                      required
                      disabled={loading}
                    />
                  </div>
                )}
              </div>
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#2AA5BC] to-[#2B9DB3] hover:opacity-90 text-white font-semibold py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Submitting...</span>
              </>
            ) : (
              <span>Submit Application</span>
            )}
          </button>
          {/* Success/Error Messages */}
          {success && (
            <div className="bg-green-500/20 border border-green-400 text-green-200 p-4 rounded-xl text-center animate-fade-in">
              {success}
            </div>
          )}
          {error && (
            <div className="bg-red-500/20 border border-red-400 text-red-200 p-4 rounded-xl text-center animate-fade-in">
              {error}
            </div>
          )}
        </form>



        <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        select option {
          background-color: rgba(255, 255, 255, 0.1);
          color: black;
        }
        select option:hover,
        select option:focus {
          background-color: rgba(59, 130, 246, 0.2);
          color: black;
        }
        select option:checked {
          background-color: rgba(59, 130, 246, 0.2);
          color: black;
        }
      `}</style>
      </div>
    );
  };
}

export default ApplicationForm;
