import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Athenura from '../../../public/Athenura.jpeg';

const InternVerificationPortal = () => {
  const [formData, setFormData] = useState({
    uniqueId: '',
    joiningDate: '',
    email: '',
    captcha: ''
  });
  const [internData, setInternData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [captchaText, setCaptchaText] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [expandedRemarks, setExpandedRemarks] = useState({});

  const canvasRef = useRef(null);

  // Check if mobile on component mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Generate CAPTCHA
  const generateCaptcha = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Generate random text
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let text = '';
    for (let i = 0; i < 6; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    setCaptchaText(text);

    // Adjust font size for mobile
    const fontSize = isMobile ? 24 : 30;
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = '#1e3a8a';
    ctx.fillText(text, 10, isMobile ? 25 : 30);

    // Add some noise
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = `rgba(30, 58, 138, 0.1)`;
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.captcha !== captchaText) {
      setError('Invalid CAPTCHA code');
      setLoading(false);
      generateCaptcha();
      return;
    }

    try {
      const response = await axios.post('/api/intern/verify', formData);
      setInternData(response.data.responseData);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
      generateCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const speakCaptcha = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const speech = new SpeechSynthesisUtterance();
      const characters = captchaText.split('');
      const spokenCharacters = characters.map(char => {
        if (/[a-z]/.test(char)) {
          return `small ${char}`;
        } else if (/[A-Z]/.test(char)) {
          return `capital ${char}`;
        } else if (/[0-9]/.test(char)) {
          return `${char}`;
        } else {
          return `symbol ${char}`;
        }
      });

      const spokenText = `Captcha code: ${spokenCharacters.join('... ')}`;

      speech.text = spokenText;
      speech.rate = 0.7;
      speech.pitch = 0.9;
      speech.volume = 1;

      setAudioEnabled(true);

      speech.onend = () => {
        setAudioEnabled(false);
      };

      speech.onerror = () => {
        setAudioEnabled(false);
        setError('Failed to play audio. Please try again.');
      };

      window.addEventListener('beforeunload', () => {
        window.speechSynthesis.cancel();
      });

      window.speechSynthesis.speak(speech);
    } else {
      setError('Audio CAPTCHA not supported in your browser. Please use the visual CAPTCHA.');
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Toggle remarks expansion
  const toggleRemarks = (monthIndex) => {
    setExpandedRemarks(prev => ({
      ...prev,
      [monthIndex]: !prev[monthIndex]
    }));
  };

  // Format date to professional format
  const formatDateToProfessional = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (err) {
      return 'Invalid Date', err;
    }
  };

  // Format date to short numeric format
  // const formatDateToNumeric = (dateString) => {
  //   if (!dateString) return 'N/A';
  //   try {
  //     const date = new Date(dateString);
  //     return date.toLocaleDateString('en-GB');
  //   } catch (err) {
  //     return 'Invalid Date';
  //   }
  // };

  // Get overall performance rating with color
  const getOverallPerformance = (performance) => {
    if (!performance || !performance.monthlyPerformance) return { text: 'Not Rated', color: 'text-gray-600', bg: 'bg-gray-100' };

    const validMonths = performance.monthlyPerformance.filter(month => month.overallRating > 0);
    if (validMonths.length === 0) return { text: 'Not Rated', color: 'text-gray-600', bg: 'bg-gray-100' };

    const avgRating = validMonths.reduce((sum, month) => sum + month.overallRating, 0) / validMonths.length;

    if (avgRating >= 8.5) return { text: 'Excellent', color: 'text-green-600', bg: 'bg-green-50' };
    if (avgRating >= 7) return { text: 'Good', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (avgRating >= 5) return { text: 'Average', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { text: 'Needs Improvement', color: 'text-red-600', bg: 'bg-red-50' };
  };

  // Get rating badge class
  const getRatingBadgeClass = (rating) => {
    if (rating >= 8) return 'bg-gradient-to-r from-green-100 to-green-50 text-green-800 border border-green-200';
    if (rating >= 6) return 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border border-blue-200';
    if (rating >= 4) return 'bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800 border border-yellow-200';
    return 'bg-gradient-to-r from-red-100 to-red-50 text-red-800 border border-red-200';
  };

  // Get percentage badge class
  const getPercentageBadgeClass = (percentage) => {
    if (percentage >= 80) return 'bg-gradient-to-r from-green-100 to-green-50 text-green-800 border border-green-200';
    if (percentage >= 60) return 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border border-blue-200';
    if (percentage >= 40) return 'bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800 border border-yellow-200';
    return 'bg-gradient-to-r from-red-100 to-red-50 text-red-800 border border-red-200';
  };

  // Print professional report
  const printReport = () => {
    const printWindow = window.open('', '_blank');

    // Get performance data
    const monthlyPerformance = internData?.performance?.monthlyPerformance || [];
    const overallPerformance = getOverallPerformance(internData?.performance);

    // Calculate statistics
    // const totalTasks = monthlyPerformance.reduce((sum, month) => sum + (month.totalTasks || 0), 0);
    // const completedTasks = monthlyPerformance.reduce((sum, month) => sum + (month.tasksCompleted || 0), 0);
    // const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0;
    const avgOverallRating = monthlyPerformance.length > 0
      ? (monthlyPerformance.reduce((sum, month) => sum + (month.overallRating || 0), 0) / monthlyPerformance.length).toFixed(1)
      : 0;

    printWindow.document.write(`
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@700;800&display=swap');
        
        :root {
          --primary-navy: #0f172a;
          --accent-blue: #2563eb;
          --border-color: #e2e8f0;
          --text-main: #334155;
          --bg-light: #f8fafc;
        }

        body { 
          font-family: 'Inter', sans-serif; 
          margin: 0;
          padding: 0;
          color: var(--text-main);
          background: #f1f5f9;
        }

        /* Paper Sheet Effect */
        .page {
          width: 230mm;
          min-height: 297mm;
          padding: 20mm;
          margin: 10mm auto;
          background: white;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
          position: relative;
          box-sizing: border-box;
        }

        /* Professional Border */
        .page-border {
          position: absolute;
          top: 10mm;
          left: 10mm;
          right: 10mm;
          bottom: 10mm;
          border: 1px solid #cbd5e1;
          pointer-events: none;
        }

        /* Confidential Watermark */
.watermark {
  position: absolute;
  margin-top: 50%;
  margin-left: 28%;
  inset: 0;
  background-image: url("/watermark.png");
  background-repeat: no-repeat;
  background-position: center;
  background-size: 450px;
  opacity: 0.1;
  pointer-events: none;
  z-index: 0;
}




        header {
          position: relative;
          z-index: 1;
          border-bottom: 4px solid var(--primary-navy);
          padding-bottom: 20px;
          margin-bottom: 30px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }

        .brand-section h1 {
          font-family: 'Playfair Display', serif;
          font-size: 38px;
          color: var(--primary-navy);
          margin: 0;
          letter-spacing: -1px;
        }

        .report-type {
          background: var(--primary-navy);
          color: white;
          font-size: 15px;
          text-transform: uppercase;
          letter-spacing: 2px;
          display: inline-block;
          margin-top: 5px;
        }

        /* Section Styling */
        .section-header {
          display: flex;
          align-items: center;
          margin: 25px 0 15px;
        }

        .section-header h2 {
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: var(--accent-blue);
          margin: 0;
          white-space: nowrap;
        }

        .header-line {
          flex-grow: 1;
          height: 1px;
          background: var(--border-color);
          margin-left: 15px;
        }

        /* Data Grid */
        .data-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1px;
          background: var(--border-color);
          border: 1px solid var(--border-color);
        }

        .data-cell {
          background: white;
          padding: 15px;
        }

        .label {
          font-size: 10px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .value {
          font-size: 15px;
          font-weight: 500;
          color: var(--primary-navy);
        }

        /* Executive Summary Box */
        .summary-box {
          background: var(--bg-light);
          border-left: 5px solid var(--primary-navy);
          padding: 20px;
          margin: 20px 0;
        }

        /* Table Styling */
        .perf-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }

        .perf-table th {
          background: #f1f5f9;
          text-align: left;
          padding: 12px;
          border-bottom: 2px solid var(--primary-navy);
        }

        .perf-table td {
          padding: 4px;
          border-bottom: 1px solid var(--border-color);
        }

        /* Signatures Area */
        .signature-wrapper {
          margin-top: 30px;
          display: flex;
          justify-content: flex-end;
          page-break-inside: avoid;
        }

        .sig-block {
          width: 200px;
          text-align: center;
        }

        .sig-space {
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-bottom: 1px solid var(--primary-navy);
          margin-bottom: 10px;
          position: relative;
        }

        .sig-img {
          max-height: 110px;
          margin-top: 20px;
          mix-blend-mode: multiply;
        }

        .official-stamp {
          position: absolute;
          right: -20px;
          top: -20px;
          width: 80px;
          opacity: 0.6;
        }

        @media print {
          body { background: white; }
          .page { margin: 0; box-shadow: none; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="page-border"></div>
        <img src="/AthenuraFab.png" alt="Watermark" class="watermark" />
        <header>
          <div class="brand-section">
            <h1 style="font-size: 48px; font-weight: bold; color: var(--accent-blue);">ATHENURA</h1>
            <div class="report-type">Performance Evaluation Report</div>
          </div>
          <div style="text-align: right; font-size: 12px; color: #64748b;">
            <strong>Unique ID:</strong> ${internData?.uniqueId || 'ATH-2024-001'}<br>
            <strong>Date:</strong> ${new Date().toLocaleDateString()}
          </div>
        </header>

        <div class="section-header">
          <h2>Candidate Particulars</h2>
          <div class="header-line"></div>
        </div>

        <div class="data-grid">
          <div class="data-cell"><div class="label">Full Name</div><div class="value">${internData?.fullName}</div></div>
          <div class="data-cell"><div class="label">Unique ID</div><div class="value">${internData?.uniqueId}</div></div>
          <div class="data-cell"><div class="label">Department</div><div class="value">${internData?.domain}</div></div>
          <div class="data-cell"><div class="label">Tenure</div><div class="value">${internData?.duration}</div></div>
        </div>

        <div class="section-header">
          <h2>Executive Performance Summary</h2>
          <div class="header-line"></div>
        </div>

        <div class="summary-box">
          <div style="display: flex; justify-content: space-between;">
            <div style="width: 70%;">
              <div class="label">Supervisor's Assessment</div>
              <p style="margin: 5px 0; font-size: 14px;">
                Intern has demonstrated <strong>${overallPerformance.text}</strong> capabilities. 
                During the assessment period, the candidate showed significant proficiency in ${internData?.domain}.
              </p>
            </div>
            <div style="text-align: center;">
              <div class="label">Aggregate Score</div>
              <div style="font-size: 32px; font-weight: 800; color: var(--accent-blue);">${avgOverallRating}/10</div>
            </div>
          </div>
        </div>

        <div class="section-header">
          <h2>Metric Breakdown</h2>
          <div class="header-line"></div>
        </div>

        <table class="perf-table">
          <thead>
            <tr>
              <th>Evaluation Period</th>
              <th>Task Completion</th>
              <th>Technical Proficiency</th>
              <th>Soft Skills</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            ${monthlyPerformance.map(m => `
              <tr>
                <td><strong>${m.monthLabel}</strong></td>
                <td>${m.completionPercentage}%</td>
                <td>${m.ratings?.initiative}/10</td>
                <td>${m.ratings?.communication}/10</td>
                <td><strong>${m.overallRating}/10</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

<div class="signature-wrapper">
  <div class="sig-block">
    <div class="sig-space">
      <img src="/sign.png" alt="Supervisor Signature" class="sig-img" />
    </div>
    <div class="value">Co. Founder</div>
  </div>
</div>

</div>

      <script>
        window.onload = () => {
          setTimeout(() => { window.print(); window.close(); }, 500);
        };
      </script>
    </body>
  </html>
`);

    printWindow.document.close();
  };

  // Initialize CAPTCHA on component mount and when mobile state changes
  useEffect(() => {
    generateCaptcha();
  }, [isMobile]);

  // Safely get monthly performance data
  const monthlyPerformance = internData?.performance?.monthlyPerformance || [];
  const overallPerformance = getOverallPerformance(internData?.performance);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-50 py-4 md:py-8 px-3 md:px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-8 mb-4 md:mb-6 relative overflow-hidden border border-blue-200">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-indigo-50 to-white opacity-80"></div>
            <div className="relative z-10">
              <div className="flex flex-col items-center mb-4 md:mb-6">
                <img
                  src={Athenura}
                  alt="Athenura Logo"
                  className="w-12 h-12 md:w-20 md:h-20 mb-2 md:mb-3 rounded-full shadow-md border-2 border-blue-200"
                />
                <h1 className="text-xl md:text-4xl font-extrabold text-blue-900 tracking-tight">
                  Athenura
                </h1>
                <p className="text-blue-600 italic text-xs md:text-base mt-1">Empowering Interns, Building Futures</p>
              </div>
              <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-2 md:mb-3">
                Intern Verification Portal
              </h2>
              <p className="text-blue-700 text-sm md:text-lg">
                Verify your internship details and access professional performance reports
              </p>
            </div>
          </div>
        </div>

        {/* Verification Form */}
        {!internData && (
          <div className="bg-white rounded-xl md:rounded-2xl lg:rounded-3xl shadow-lg md:shadow-xl lg:shadow-2xl p-4 sm:p-6 md:p-8 lg:p-10 mb-6 md:mb-8 border border-blue-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 sm:h-1.5 md:h-2 bg-gradient-to-r from-blue-600 to-blue-800"></div>
            <div className="absolute -top-10 -right-10 sm:-top-12 sm:-right-12 md:-top-16 md:-right-16 lg:-top-20 lg:-right-20 w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 bg-blue-100 rounded-full opacity-30 sm:opacity-40 md:opacity-50"></div>
            <div className="absolute -bottom-10 -left-10 sm:-bottom-12 sm:-left-12 md:-bottom-16 md:-left-16 lg:-bottom-20 lg:-left-20 w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 bg-indigo-100 rounded-full opacity-30 sm:opacity-40 md:opacity-50"></div>

            <div className="text-center mb-4 sm:mb-6 md:mb-8 relative z-10">
              <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 mx-auto mb-3 sm:mb-4 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center shadow-md sm:shadow-lg transform hover:scale-105 transition-transform duration-300">
                <span className="text-xl sm:text-2xl md:text-3xl text-white">🔎</span>
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 mb-2 sm:mb-3 bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent leading-tight">
                Verify Your Internship
              </h2>
              <p className="text-blue-700 text-xs sm:text-sm md:text-base max-w-xs sm:max-w-sm md:max-w-md mx-auto leading-relaxed sm:leading-loose">
                Enter your details to access your personalized internship dashboard and professional reports
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-8 relative z-10">
              <div className="grid grid-cols-1 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
                {/* Unique ID Field */}
                <div className="space-y-2 sm:space-y-3 group">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 group-focus-within:text-blue-600 transition-colors duration-200">
                      <span className="flex items-center">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full mr-1.5 sm:mr-2"></span>
                        Unique ID *
                      </span>
                    </label>
                    <span className={`text-xs transition-all duration-300 ${formData.uniqueId.length > 0 ? 'text-blue-500 font-semibold' : 'text-gray-400'
                      }`}>
                      {formData.uniqueId.length}/20
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      name="uniqueId"
                      value={formData.uniqueId}
                      onChange={handleChange}
                      maxLength="20"
                      required
                      className="w-full px-3 sm:px-4 md:px-5 lg:px-6 py-3 sm:py-3.5 md:py-4 lg:py-5 border border-blue-200 sm:border-2 rounded-lg sm:rounded-xl md:rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-2 sm:focus:ring-3 md:focus:ring-4 focus:ring-blue-100 transition-all duration-300 text-sm sm:text-base bg-white shadow-sm hover:shadow-md"
                      placeholder="Enter your unique identification code"
                    />
                    <div className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center">
                      {formData.uniqueId && (
                        <span className="text-blue-500 text-sm sm:text-base">✓</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Joining Date Field */}
                <div className="space-y-2 sm:space-y-3 group">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 group-focus-within:text-blue-600 transition-colors duration-200">
                    <span className="flex items-center">
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full mr-1.5 sm:mr-2"></span>
                      Joining Date *
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="joiningDate"
                      value={formData.joiningDate}
                      onChange={handleChange}
                      required
                      className="w-full px-3 sm:px-4 md:px-5 lg:px-6 py-3 sm:py-3.5 md:py-4 lg:py-5 border border-blue-200 sm:border-2 rounded-lg sm:rounded-xl md:rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-2 sm:focus:ring-3 md:focus:ring-4 focus:ring-blue-100 transition-all duration-300 text-sm sm:text-base bg-white shadow-sm hover:shadow-md appearance-none"
                    />
                  </div>
                  {formData.joiningDate && (
                    <div className="flex items-center text-xs sm:text-sm text-blue-600 bg-blue-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg animate-pulse">
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full mr-1.5 sm:mr-2"></span>
                      Selected: <strong className="ml-1 text-xs sm:text-sm">{new Date(formData.joiningDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}</strong>
                    </div>
                  )}
                </div>

                {/* Email Field */}
                <div className="space-y-2 sm:space-y-3 group">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 group-focus-within:text-blue-600 transition-colors duration-200">
                    <span className="flex items-center">
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full mr-1.5 sm:mr-2"></span>
                      Email Address *
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-3 sm:px-4 md:px-5 lg:px-6 py-3 sm:py-3.5 md:py-4 lg:py-5 border border-blue-200 sm:border-2 rounded-lg sm:rounded-xl md:rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-2 sm:focus:ring-3 md:focus:ring-4 focus:ring-blue-100 transition-all duration-300 text-sm sm:text-base bg-white shadow-sm hover:shadow-md"
                      placeholder="your.email@example.com"
                    />
                    <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2">
                      {formData.email && (
                        <span className={`text-base sm:text-lg ${/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
                          ? 'text-blue-500 animate-bounce'
                          : 'text-red-500 animate-pulse'
                          }`}>
                          {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) ? '✓' : '✗'}
                        </span>
                      )}
                    </div>
                  </div>
                  {formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
                    <div className="flex items-center text-xs sm:text-sm text-red-600 bg-red-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg">
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full mr-1.5 sm:mr-2"></span>
                      Please enter a valid email address
                    </div>
                  )}
                </div>

                {/* Enhanced CAPTCHA Section */}
                <div className="space-y-3 sm:space-y-4 group">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 group-focus-within:text-blue-600 transition-colors duration-200">
                    <span className="flex items-center">
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full mr-1.5 sm:mr-2"></span>
                      Security Verification *
                    </span>
                  </label>

                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 sm:p-4 md:p-5 lg:p-6 rounded-lg sm:rounded-xl md:rounded-2xl border border-blue-200 sm:border-2 hover:border-blue-300 transition-all duration-300">
                    <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="relative">
                          <canvas
                            ref={canvasRef}
                            width={isMobile ? "120" : "140"}
                            height={isMobile ? "40" : "50"}
                            className="border border-blue-300 sm:border-2 rounded-md sm:rounded-lg shadow-sm sm:shadow-md bg-white"
                          />
                          <div className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 md:-top-2 md:-right-2 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-[8px] sm:text-xs">🔒</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-2 sm:space-x-3 mt-2 xs:mt-0">
                        <button
                          type="button"
                          onClick={generateCaptcha}
                          className="flex items-center space-x-1 sm:space-x-2 bg-white px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg border border-blue-200 sm:border-2 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 shadow-sm hover:shadow-md text-xs sm:text-sm"
                        >
                          <span className="text-blue-600 text-sm sm:text-base">🔄</span>
                          <span className="font-semibold text-blue-700 whitespace-nowrap">Refresh</span>
                        </button>
                        <button
                          type="button"
                          onClick={speakCaptcha}
                          disabled={audioEnabled}
                          className={`flex items-center space-x-1 sm:space-x-2 bg-white px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg border border-blue-200 sm:border-2 transition-all duration-200 shadow-sm hover:shadow-md text-xs sm:text-sm ${audioEnabled
                            ? 'opacity-50 cursor-not-allowed border-gray-300'
                            : 'hover:border-blue-500 hover:bg-blue-50'
                            }`}
                        >
                          <span className={`text-sm sm:text-base ${audioEnabled ? 'text-gray-400' : 'text-blue-600'
                            }`}>
                            {audioEnabled ? '🔇' : '🔊'}
                          </span>
                          <span className="font-semibold text-blue-700 whitespace-nowrap">
                            {audioEnabled ? 'Playing...' : 'Audio'}
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        name="captcha"
                        value={formData.captcha}
                        onChange={handleChange}
                        required
                        className="w-full px-3 sm:px-4 md:px-5 lg:px-6 py-2.5 sm:py-3 md:py-4 text-center border border-blue-300 sm:border-2 rounded-lg sm:rounded-xl md:rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-2 sm:focus:ring-3 md:focus:ring-4 focus:ring-blue-100 transition-all duration-300 text-sm sm:text-base md:text-lg font-mono tracking-widest bg-white shadow-inner"
                        placeholder="Type the code above"
                        style={{ letterSpacing: '0.2em' }}
                      />
                      {formData.captcha && (
                        <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2">
                          <span className={`text-base sm:text-lg ${formData.captcha === captchaText
                            ? 'text-blue-500 animate-pulse'
                            : 'text-orange-500'
                            }`}>
                            {formData.captcha === captchaText ? '✓' : '!'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2 sm:mt-3 md:mt-4">
                      <div className="flex items-center space-x-1.5 sm:space-x-2">
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-blue-600 font-medium">Secure verification</span>
                      </div>
                      <div className="flex items-center space-x-0.5 sm:space-x-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-300 ${level <= 4 ? 'bg-blue-400' : 'bg-blue-200'
                              } ${level <= 3 ? 'animate-pulse' : ''}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border-l-2 sm:border-l-4 border-red-500 text-red-700 p-3 sm:p-4 md:p-5 lg:p-6 rounded-lg sm:rounded-xl flex items-start animate-shake">
                  <span className="text-lg sm:text-xl mr-2 sm:mr-3 flex-shrink-0">⚠️</span>
                  <div className="flex-1">
                    <p className="font-semibold text-xs sm:text-sm md:text-base">Verification Failed</p>
                    <p className="text-xs sm:text-sm mt-0.5 sm:mt-1 opacity-90">{error}</p>
                  </div>
                  <button
                    onClick={() => setError('')}
                    className="text-red-500 hover:text-red-700 text-base sm:text-lg font-bold ml-1 sm:ml-2"
                  >
                    ✕
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full group relative bg-gradient-to-r from-blue-600 to-blue-800 text-white py-3 sm:py-4 md:py-5 lg:py-6 px-4 sm:px-5 md:px-6 lg:px-8 rounded-lg sm:rounded-xl md:rounded-2xl hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 sm:focus:ring-3 md:focus:ring-4 focus:ring-blue-200 focus:ring-offset-1 sm:focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm sm:text-base md:text-lg lg:text-xl shadow-lg sm:shadow-xl md:shadow-2xl hover:shadow-2xl sm:hover:shadow-3xl transform hover:-translate-y-0.5 sm:hover:-translate-y-1"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-700 to-blue-900 rounded-lg sm:rounded-xl md:rounded-2xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-30 sm:opacity-40 group-hover:animate-shine"></div>
                <span className="relative z-10 flex items-center justify-center space-x-2 sm:space-x-3">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 border-b-2 border-white"></div>
                      <span className="animate-pulse text-xs sm:text-sm md:text-base">Verifying Your Details...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-base sm:text-lg md:text-xl">🔍</span>
                      <span className="text-xs sm:text-sm md:text-base lg:text-lg">Verify & Generate Report</span>
                      <span className="transform group-hover:translate-x-1 sm:group-hover:translate-x-2 transition-transform duration-300 text-base sm:text-lg md:text-xl">→</span>
                    </>
                  )}
                </span>
              </button>

              <div className="text-center pt-2 sm:pt-3 md:pt-4">
                <p className="text-xs text-blue-600 flex flex-col xs:flex-row xs:items-center justify-center space-y-1 xs:space-y-0 xs:space-x-2">
                  <span className="flex items-center justify-center xs:justify-start">
                    <span className="mr-1">💡</span>
                    Need assistance?
                  </span>
                  <span>
                    Contact HR at{" "}
                    <a href="mailto:hr.athenura@gmail.com" className="text-blue-700 hover:text-blue-900 underline font-semibold whitespace-nowrap">
                      hr.athenura@gmail.com
                    </a>
                  </span>
                </p>
              </div>
            </form>
          </div>
        )}

        {/* Intern Details Display */}
        {internData && (
          <div className="space-y-4 md:space-y-6">
            {/* Intern Details Card */}
            <div className="bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-xl p-4 md:p-8 border border-blue-200">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4 md:mb-6">
                <div>
                  <h2 className="text-xl md:text-3xl font-bold text-blue-900">Intern Details</h2>
                  <p className="text-blue-600 text-sm md:text-base mt-1">Complete professional profile</p>
                </div>
                <button
                  onClick={printReport}
                  className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl hover:from-blue-700 hover:to-blue-900 transition-all duration-200 font-semibold shadow-lg flex items-center justify-center space-x-2 text-sm md:text-base transform hover:-translate-y-0.5"
                >
                  <span>📄</span>
                  <span>Print Professional Report</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 md:p-4 rounded-lg md:rounded-xl border border-blue-200">
                  <label className="text-xs md:text-sm font-medium text-blue-700 uppercase tracking-wider">Full Name</label>
                  <p className="text-base md:text-lg font-semibold text-blue-900 mt-1 break-words">{internData.fullName}</p>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 md:p-4 rounded-lg md:rounded-xl border border-blue-200">
                  <label className="text-xs md:text-sm font-medium text-blue-700 uppercase tracking-wider">Email</label>
                  <p className="text-base md:text-lg font-semibold text-blue-900 mt-1 break-words">{internData.email}</p>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 md:p-4 rounded-lg md:rounded-xl border border-blue-200">
                  <label className="text-xs md:text-sm font-medium text-blue-700 uppercase tracking-wider">Mobile</label>
                  <p className="text-base md:text-lg font-semibold text-blue-900 mt-1">{internData.mobile}</p>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 md:p-4 rounded-lg md:rounded-xl border border-blue-200">
                  <label className="text-xs md:text-sm font-medium text-blue-700 uppercase tracking-wider">Joining Date</label>
                  <p className="text-base md:text-lg font-semibold text-blue-900 mt-1">{formatDateToProfessional(internData.joiningDate)}</p>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 md:p-4 rounded-lg md:rounded-xl border border-blue-200">
                  <label className="text-xs md:text-sm font-medium text-blue-700 uppercase tracking-wider">Unique ID</label>
                  <p className="text-base md:text-lg font-semibold text-blue-900 mt-1 break-all">{internData.uniqueId}</p>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 md:p-4 rounded-lg md:rounded-xl border border-blue-200">
                  <label className="text-xs md:text-sm font-medium text-blue-700 uppercase tracking-wider">Status</label>
                  <p className="text-base md:text-lg font-semibold text-blue-900 mt-1">{internData.status}</p>
                </div>
              </div>
            </div>

            {/* Internship Details Card */}
            <div className="bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-xl p-4 md:p-8 border border-blue-200">
              <h2 className="text-xl md:text-3xl font-bold text-blue-900 mb-4 md:mb-6">Internship Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 md:p-4 rounded-lg md:rounded-xl border border-blue-200">
                  <label className="text-xs md:text-sm font-medium text-blue-700 uppercase tracking-wider">Domain</label>
                  <p className="text-base md:text-lg font-semibold text-blue-900 mt-1">{internData.domain}</p>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 md:p-4 rounded-lg md:rounded-xl border border-blue-200">
                  <label className="text-xs md:text-sm font-medium text-blue-700 uppercase tracking-wider">Duration</label>
                  <p className="text-base md:text-lg font-semibold text-blue-900 mt-1">{internData.duration}</p>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 md:p-4 rounded-lg md:rounded-xl border border-blue-200">
                  <label className="text-xs md:text-sm font-medium text-blue-700 uppercase tracking-wider">Status</label>
                  <p className="text-base md:text-lg font-semibold text-blue-900 mt-1">{internData.status}</p>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 md:p-4 rounded-lg md:rounded-xl border border-blue-200">
                  <label className="text-xs md:text-sm font-medium text-blue-700 uppercase tracking-wider">Performance</label>
                  <p className={`text-base md:text-lg font-semibold mt-1 ${overallPerformance.color}`}>
                    {overallPerformance.text}
                  </p>
                </div>
              </div>
            </div>

            {/* Monthly Performance Table with Remarks */}
            {monthlyPerformance.length > 0 && (
              <div className="bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-xl p-4 md:p-8 border border-blue-200">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4 md:mb-6">
                  <div>
                    <h2 className="text-xl md:text-3xl font-bold text-blue-900">Monthly Performance Analysis</h2>
                    <p className="text-blue-600 text-sm md:text-base mt-1">Detailed monthly assessment breakdown</p>
                  </div>
                </div>
                <div className="overflow-x-auto -mx-2 md:mx-0">
                  <div className="min-w-full inline-block align-middle">
                    <table className="min-w-full divide-y divide-blue-200 text-sm md:text-base">
                      <thead className="bg-gradient-to-r from-blue-600 to-blue-800">
                        <tr>
                          <th className="px-3 md:px-6 py-2 md:py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Month</th>
                          <th className="px-3 md:px-6 py-2 md:py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Tasks</th>
                          <th className="px-3 md:px-6 py-2 md:py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Completion</th>
                          <th className="px-3 md:px-6 py-2 md:py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Initiative</th>
                          <th className="px-3 md:px-6 py-2 md:py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Communication</th>
                          <th className="px-3 md:px-6 py-2 md:py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Professionalism</th>
                          <th className="px-3 md:px-6 py-2 md:py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Overall</th>
                          <th className="px-3 md:px-6 py-2 md:py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Supervisor Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-blue-100">
                        {monthlyPerformance.map((month, index) => (
                          <tr key={index} className="hover:bg-blue-50 transition-colors">
                            <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm font-semibold text-blue-900">
                              {month.monthLabel || 'N/A'}
                            </td>
                            <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-blue-900">
                              {month.tasksCompleted || 0}/{month.totalTasks || 0}
                            </td>
                            <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap">
                              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getPercentageBadgeClass(month.completionPercentage || 0)}`}>
                                {month.completionPercentage || 0}%
                              </span>
                            </td>
                            <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-blue-900">
                              {month.ratings?.initiative || 0}/10
                            </td>
                            <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-blue-900">
                              {month.ratings?.communication || 0}/10
                            </td>
                            <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-blue-900">
                              {month.ratings?.behaviour || 0}/10
                            </td>
                            <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap">
                              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getRatingBadgeClass(month.overallRating || 0)}`}>
                                {month.overallRating || 0}/10
                              </span>
                            </td>
                            <td className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm">
                              {month.inchargeRemarks ? (
                                <div className="max-w-xs">
                                  <div
                                    className={`cursor-pointer transition-colors ${expandedRemarks[index] ? 'text-blue-600' : 'text-blue-700'}`}
                                    onClick={() => toggleRemarks(index)}
                                  >
                                    <div className="font-medium mb-1 flex items-center">
                                      Supervisor Remarks
                                      <span className="ml-1 text-xs">
                                        {expandedRemarks[index] ? '▲' : '▼'}
                                      </span>
                                    </div>
                                    {expandedRemarks[index] && (
                                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-1 text-blue-700 leading-relaxed text-sm">
                                        {month.inchargeRemarks}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-blue-400 italic">No remarks provided</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Certificate Information */}
            {internData.certificateStatus === 'issued' && (
              <div className="bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-xl p-4 md:p-8 border border-blue-200">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4 md:mb-6">
                  <div>
                    <h2 className="text-xl md:text-3xl font-bold text-blue-900">Certificate Verification</h2>
                    <p className="text-blue-600 text-sm md:text-base mt-1">Official certification details</p>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-semibold bg-gradient-to-r from-green-100 to-green-50 text-green-800 border border-green-200 self-start md:self-auto">
                    ✅ Verified & Issued
                  </span>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg md:rounded-xl p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
                    <div>
                      <h3 className="text-lg md:text-xl font-semibold text-blue-800 mb-1 md:mb-2"> Certificate of Completion</h3>
                      <p className="text-blue-700 text-sm md:text-base">
                        <strong>Certificate Number:</strong> <span className="font-mono">{internData.certificateNumber}</span>
                      </p>
                      <p className="text-blue-700 text-sm md:text-base">
                        <strong>Issued Date:</strong> {formatDateToProfessional(internData.certificateIssuedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InternVerificationPortal;