// InternshipForm.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import Athenura from "../../../public/Athenura.jpeg";

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

  // Theme Constants
  const theme = {
    primary: "#1E90A8",
    primaryLight: "#E8F8FA",
    textDark: "#111827",
    textGray: "#4B5563",
    bg: "#F8FBFC",
    white: "#FFFFFF",
    border: "#E5E7EB",
  };

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
      console.log(response.data);
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
        prevInternshipDesc: "",
      }); 
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to submit application. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-8" style={{ backgroundColor: theme.bg }}>
        <img src={Athenura} alt="Athenura Logo" className="h-24 w-24 mb-6 rounded-full shadow-lg" />
        <h1 className="text-4xl font-bold mb-4" style={{ color: theme.textDark }}>Applications Closed</h1>
        <p className="sm:text-lg text-sm sm:max-w-2xl w-full" style={{ color: theme.textGray }}>
          Thank you for your interest! The internship application form is currently closed.
          <br />
          <span className="sm:text-sm text-xs">We encourage you to apply in our next batch.</span>
        </p>

        <p className="mt-4 text-sm" style={{ color: theme.textGray }}>
          Please check back later or contact us at{" "}
          <a href="mailto:hr@athenura.in" className="underline hover:text-teal-600" style={{ color: theme.primary }}>
            hr@athenura.in
          </a>
        </p>
      </div>
    );
  }
  else {
    return (
      <div className="min-h-screen flex items-center justify-center sm:p-6 p-2 relative overflow-hidden" style={{ backgroundColor: theme.bg }}>
        
        {/* Background Decor */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full opacity-5 blur-[120px]" style={{ backgroundColor: theme.primary }}></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-5 blur-[120px]" style={{ backgroundColor: theme.primary }}></div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-5xl bg-white rounded-3xl shadow-xl sm:p-10 p-5 space-y-8 relative z-10 border border-gray-100"
        >
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img
              src={Athenura}
              alt="Athenura Logo"
              className="h-20 w-auto rounded-full shadow-md"
            />
          </div>

          {/* Title and Subtitle */}
          <div className="text-center space-y-3">
            <h1 className="sm:text-4xl text-2xl font-bold" style={{ color: theme.textDark }}>
              Join <span style={{ color: theme.primary }}>Athenura</span>
            </h1>
            <p className="sm:text-sm text-xs leading-relaxed max-w-2xl mx-auto" style={{ color: theme.textGray }}>
              Fill out all required fields to submit your application. <br/>
              For help: <a href="mailto:hr@athenura.in" className="hover:underline transition-colors" style={{ color: theme.primary }}>hr@athenura.in</a>
            </p>
          </div>

          {/* Personal Details */}
          <fieldset className="border p-6 rounded-2xl bg-gray-50/50" style={{ borderColor: theme.border }}>
            <legend className="text-xl font-bold px-4 flex items-center gap-2" style={{ color: theme.primary }}>
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
               Personal Details
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
              <div className="space-y-1">
                <label htmlFor="fullName" className="block text-sm font-semibold" style={{ color: theme.textDark }}>
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="fullName"
                  type="text"
                  name="fullName"
                  placeholder="Your full name"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="p-3 rounded-xl bg-white border focus:outline-none focus:ring-2 transition-all duration-300 w-full"
                  style={{ borderColor: theme.border, '--tw-ring-color': theme.primary }}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="mobile" className="block text-sm font-semibold" style={{ color: theme.textDark }}>
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="mobile"
                  type="tel"
                  name="mobile"
                  placeholder="10-digit mobile number"
                  value={formData.mobile}
                  onChange={handleChange}
                  className="p-3 rounded-xl bg-white border focus:outline-none focus:ring-2 transition-all duration-300 w-full"
                  style={{ borderColor: theme.border, '--tw-ring-color': theme.primary }}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="email" className="block text-sm font-semibold" style={{ color: theme.textDark }}>
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="Your email address"
                  value={formData.email}
                  onChange={handleChange}
                  className="p-3 rounded-xl bg-white border focus:outline-none focus:ring-2 transition-all duration-300 w-full"
                  style={{ borderColor: theme.border, '--tw-ring-color': theme.primary }}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="dob" className="block text-sm font-semibold" style={{ color: theme.textDark }}>
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  id="dob"
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className="p-3 rounded-xl bg-white border focus:outline-none focus:ring-2 transition-all duration-300 w-full"
                  style={{ borderColor: theme.border, '--tw-ring-color': theme.primary }}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label htmlFor="gender" className="block text-sm font-semibold" style={{ color: theme.textDark }}>
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="p-3 rounded-xl bg-white border focus:outline-none focus:ring-2 transition-all duration-300 w-full"
                  style={{ borderColor: theme.border, '--tw-ring-color': theme.primary }}
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
          <fieldset className="border p-6 rounded-2xl bg-gray-50/50" style={{ borderColor: theme.border }}>
            <legend className="text-xl font-bold px-4 flex items-center gap-2" style={{ color: theme.primary }}>
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
               Address Details
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
              <div className="space-y-1">
                <label htmlFor="state" className="block text-sm font-semibold" style={{ color: theme.textDark }}>
                  State <span className="text-red-500">*</span>
                </label>
                <select
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="p-3 rounded-xl bg-white border focus:outline-none focus:ring-2 transition-all duration-300 w-full"
                  style={{ borderColor: theme.border, '--tw-ring-color': theme.primary }}
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
                <label htmlFor="city" className="block text-sm font-semibold" style={{ color: theme.textDark }}>
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  id="city"
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="p-3 rounded-xl bg-white border focus:outline-none focus:ring-2 transition-all duration-300 w-full"
                  style={{ borderColor: theme.border, '--tw-ring-color': theme.primary }}
                  required
                  disabled={loading}
                  placeholder="Your city"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label htmlFor="address" className="block text-sm font-semibold" style={{ color: theme.textDark }}>
                  Full Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="address"
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="p-3 rounded-xl bg-white border focus:outline-none focus:ring-2 transition-all duration-300 w-full"
                  style={{ borderColor: theme.border, '--tw-ring-color': theme.primary }}
                  required
                  disabled={loading}
                  placeholder="Your full address"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="pinCode" className="block text-sm font-semibold" style={{ color: theme.textDark }}>
                  Pin Code <span className="text-red-500">*</span>
                </label>
                <input
                  id="pinCode"
                  type="text"
                  name="pinCode"
                  value={formData.pinCode}
                  onChange={handleChange}
                  className="p-3 rounded-xl bg-white border focus:outline-none focus:ring-2 transition-all duration-300 w-full"
                  style={{ borderColor: theme.border, '--tw-ring-color': theme.primary }}
                  required
                  disabled={loading}
                  placeholder="6-digit pin code"
                />
              </div>
            </div>
          </fieldset>

          {/* Educational Details */}
          <fieldset className="border p-6 rounded-2xl bg-gray-50/50" style={{ borderColor: theme.border }}>
            <legend className="text-xl font-bold px-4 flex items-center gap-2" style={{ color: theme.primary }}>
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>
               Educational Details
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
              <div className="space-y-1 sm:col-span-2">
                <label htmlFor="college" className="block text-sm font-semibold" style={{ color: theme.textDark }}>
                  College/University Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="college"
                  type="text"
                  name="college"
                  value={formData.college}
                  onChange={handleChange}
                  className="p-3 rounded-xl bg-white border focus:outline-none focus:ring-2 transition-all duration-300 w-full"
                  style={{ borderColor: theme.border, '--tw-ring-color': theme.primary }}
                  required
                  disabled={loading}
                  placeholder="Your college or university name"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="course" className="block text-sm font-semibold" style={{ color: theme.textDark }}>
                  Course Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="course"
                  type="text"
                  name="course"
                  value={formData.course}
                  onChange={handleChange}
                  className="p-3 rounded-xl bg-white border focus:outline-none focus:ring-2 transition-all duration-300 w-full"
                  style={{ borderColor: theme.border, '--tw-ring-color': theme.primary }}
                  required
                  disabled={loading}
                  placeholder="Your course name"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="educationLevel" className="block text-sm font-semibold" style={{ color: theme.textDark }}>
                  Education Level <span className="text-red-500">*</span>
                </label>
                <select
                  id="educationLevel"
                  name="educationLevel"
                  value={formData.educationLevel}
                  onChange={handleChange}
                  className="p-3 rounded-xl bg-white border focus:outline-none focus:ring-2 transition-all duration-300 w-full"
                  style={{ borderColor: theme.border, '--tw-ring-color': theme.primary }}
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
            
            {/* TPO Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5 pt-5 border-t border-dashed border-gray-200">
                <div className="space-y-1">
                <label htmlFor="TpoName" className="block text-sm font-semibold" style={{ color: theme.textDark }}>
                    TPO Name
                </label>
                <input id="TpoName" name="TpoName" value={formData.TpoName} onChange={handleChange}
                    className="p-3 rounded-xl bg-white border focus:outline-none focus:ring-2 w-full"
                    style={{ borderColor: theme.border, '--tw-ring-color': theme.primary }}
                    placeholder="Training & Placement Officer Name" disabled={loading} />
                </div>

                <div className="space-y-1">
                <label htmlFor="TpoEmail" className="block text-sm font-semibold" style={{ color: theme.textDark }}>
                    TPO Email
                </label>
                <input id="TpoEmail" name="TpoEmail" value={formData.TpoEmail} onChange={handleChange}
                    type="email"
                    className="p-3 rounded-xl bg-white border focus:outline-none focus:ring-2 w-full"
                    style={{ borderColor: theme.border, '--tw-ring-color': theme.primary }}
                    placeholder="tpo@college.edu" disabled={loading} />
                </div>

                <div className="space-y-1 sm:col-span-2">
                <label htmlFor="TpoNumber" className="block text-sm font-semibold" style={{ color: theme.textDark }}>
                    TPO Contact Number
                </label>
                <input id="TpoNumber" name="TpoNumber" value={formData.TpoNumber} onChange={handleChange}
                    type="tel"
                    className="p-3 rounded-xl bg-white border focus:outline-none focus:ring-2 w-full"
                    style={{ borderColor: theme.border, '--tw-ring-color': theme.primary }}
                    placeholder="10-digit contact number" disabled={loading} />
                </div>
            </div>
          </fieldset>

          {/* Internship Details */}
          <fieldset className="border p-6 rounded-2xl bg-gray-50/50" style={{ borderColor: theme.border }}>
            <legend className="text-xl font-bold px-4 flex items-center gap-2" style={{ color: theme.primary }}>
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
               Internship Details
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
              <div className="space-y-1">
                <label htmlFor="domain" className="block text-sm font-semibold" style={{ color: theme.textDark }}>
                  Domain <span className="text-red-500">*</span>
                </label>
                <select
                  id="domain"
                  name="domain"
                  value={formData.domain}
                  onChange={handleChange}
                  className="p-3 rounded-xl bg-white border focus:outline-none focus:ring-2 transition-all duration-300 w-full"
                  style={{ borderColor: theme.border, '--tw-ring-color': theme.primary }}
                  required
                  disabled={loading}
                >
                  <option value="">Select Domain</option>
                  {/* <option>Sales & Marketing</option> */}
                  <option>Data Science & Analytics</option>
                  <option>Human Resources</option>
                  <option>Social Media Management</option>
                  <option>Graphic Design</option>
                  <option>Digital Marketing</option>
                  <option>Video Editing</option>
                  <option>Full Stack Development</option>
                  <option>MERN Stack Development</option>
                  {/* <option>Email and Outreaching</option> */}
                  <option>Content Writing</option>
                  <option>Content Creator</option>
                  <option>UI/UX Designing</option>
                  <option>Front-end Developer</option>
                  <option>Back-end Developer</option>
                </select>
              </div>
              <div className="space-y-1">
                <label htmlFor="contactMethod" className="block text-sm font-semibold" style={{ color: theme.textDark }}>
                  Preferred Contact Method <span className="text-red-500">*</span>
                </label>
                <select
                  id="contactMethod"
                  name="contactMethod"
                  value={formData.contactMethod}
                  onChange={handleChange}
                  className="p-3 rounded-xl bg-white border focus:outline-none focus:ring-2 transition-all duration-300 w-full"
                  style={{ borderColor: theme.border, '--tw-ring-color': theme.primary }}
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
                <label htmlFor="resumeUrl" className="block text-sm font-semibold" style={{ color: theme.textDark }}>
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
                  className="p-3 rounded-xl bg-white border focus:outline-none focus:ring-2 transition-all duration-300 w-full"
                  style={{ borderColor: theme.border, '--tw-ring-color': theme.primary }}
                  required
                  disabled={loading}
                  placeholder="Link to your CV/Resume (Google Drive, Dropbox, etc.)"
                />
                {showResumeMsg && (
                  <p className="text-xs mt-1 italic flex items-center gap-1" style={{ color: theme.primary }}>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Ensure link is publicly accessible (viewable by anyone).
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <label htmlFor="duration" className="block text-sm font-semibold" style={{ color: theme.textDark }}>
                  Duration <span className="text-red-500">*</span>
                </label>
                <select
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="p-3 rounded-xl bg-white border focus:outline-none focus:ring-2 transition-all duration-300 w-full"
                  style={{ borderColor: theme.border, '--tw-ring-color': theme.primary }}
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
                <label className="block text-sm font-semibold mb-2" style={{ color: theme.textDark }}>
                  Previous Internship Experience <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-8 p-3 bg-white border rounded-xl" style={{ borderColor: theme.border }}>
                  <label className="flex items-center cursor-pointer" style={{ color: theme.textGray }}>
                    <input
                      type="radio"
                      name="prevInternship"
                      value="Yes"
                      checked={formData.prevInternship === "Yes"}
                      onChange={handleChange}
                      className="mr-2 text-teal-600 focus:ring-teal-500"
                      required
                      disabled={loading}
                    />
                    Yes
                  </label>
                  <label className="flex items-center cursor-pointer" style={{ color: theme.textGray }}>
                    <input
                      type="radio"
                      name="prevInternship"
                      value="No"
                      checked={formData.prevInternship === "No"}
                      onChange={handleChange}
                      className="mr-2 text-teal-600 focus:ring-teal-500"
                      disabled={loading}
                    />
                    No
                  </label>
                </div>
                {formData.prevInternship === "Yes" && (
                  <div className="mt-4 transition-all duration-500 ease-in-out animate-fade-in">
                    <label
                      htmlFor="prevInternshipDesc"
                      className="block text-sm font-semibold mb-1"
                      style={{ color: theme.textDark }}
                    >
                      Describe Your Experience <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="prevInternshipDesc"
                      name="prevInternshipDesc"
                      value={formData.prevInternshipDesc}
                      onChange={handleChange}
                      rows="4"
                      className="p-3 rounded-xl bg-white border focus:outline-none focus:ring-2 transition-all duration-300 w-full"
                      style={{ borderColor: theme.border, '--tw-ring-color': theme.primary }}
                      placeholder="Tell us about your previous internship..."
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
            className="w-full text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
            style={{ backgroundColor: theme.primary }}
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
            <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl text-center animate-fade-in flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              {success}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-center animate-fade-in flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
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
        input:focus, select:focus, textarea:focus {
           --tw-ring-color: #1E90A8 !important;
        }
      `}</style>
      </div>
    );
  }
}

export default ApplicationForm;