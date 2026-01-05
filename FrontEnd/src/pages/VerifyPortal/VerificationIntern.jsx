import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import graphura from '../../../public/Graphura.jpg';

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
    ctx.fillStyle = '#333';
    ctx.fillText(text, 10, isMobile ? 25 : 30);

    // Add some noise
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.2)`;
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

  // Format date to numeric format
  const formatDateToNumeric = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB');
    } catch (err) {
      return 'Invalid Date' + err;
    }
  };

  // Get overall performance rating
  const getOverallPerformance = (performance) => {
    if (!performance || !performance.monthlyPerformance) return 'Not Rated';

    const validMonths = performance.monthlyPerformance.filter(month => month.overallRating > 0);
    if (validMonths.length === 0) return 'Not Rated';

    const avgRating = validMonths.reduce((sum, month) => sum + month.overallRating, 0) / validMonths.length;

    if (avgRating >= 8.5) return 'Excellent';
    if (avgRating >= 7) return 'Good';
    if (avgRating >= 5) return 'Average';
    return 'Poor';
  };

  // Print report function with remarks
  const printReport = () => {
    const printWindow = window.open('', '_blank');

    // Get monthly performance data safely
    const monthlyPerformance = internData?.performance?.monthlyPerformance || [];
    const overallPerformance = getOverallPerformance(internData?.performance);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Graphura Intern Report - ${internData?.fullName || 'Unknown'}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #333;
            }
            .header { 
              text-align: center; 
              border-bottom: 2px solid #333; 
              padding-bottom: 20px; 
              margin-bottom: 30px;
            }
            .header h1 { 
              color: #2563eb; 
              margin: 0; 
              font-size: 28px;
            }
            .header p { 
              color: #666; 
              margin: 5px 0; 
              font-size: 14px;
            }
            .section { 
              margin-bottom: 30px; 
            }
            .section h2 { 
              color: #2563eb; 
              border-bottom: 1px solid #ddd; 
              padding-bottom: 5px; 
              margin-bottom: 15px;
              font-size: 20px;
            }
            .info-grid { 
              display: grid; 
              grid-template-columns: repeat(2, 1fr); 
              gap: 15px; 
            }
            .info-item { 
              margin-bottom: 10px; 
            }
            .info-label { 
              font-weight: bold; 
              color: #555; 
              font-size: 14px;
              margin-bottom: 2px;
            }
            .info-value { 
              color: #333; 
              font-size: 15px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 10px;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 10px; 
              text-align: left; 
              font-size: 13px;
            }
            th { 
              background-color: #f8fafc; 
              font-weight: bold; 
              color: #374151;
            }
            .stats-grid { 
              display: grid; 
              grid-template-columns: repeat(3, 1fr); 
              gap: 15px; 
              margin: 20px 0;
            }
            .stat-card { 
              background: #f8fafc; 
              padding: 15px; 
              border-radius: 8px; 
              text-align: center;
              border: 1px solid #e2e8f0;
            }
            .stat-value { 
              font-size: 24px; 
              font-weight: bold; 
              color: #2563eb; 
              margin: 5px 0;
            }
            .stat-label { 
              color: #64748b; 
              font-size: 13px;
            }
            .rating-badge {
              padding: 4px 8px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: bold;
            }
            .rating-excellent { background: #dcfce7; color: #166534; }
            .rating-good { background: #dbeafe; color: #1e40af; }
            .rating-average { background: #fef3c7; color: #92400e; }
            .rating-poor { background: #fee2e2; color: #991b1b; }
            .remarks-section {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 12px;
              margin-top: 8px;
            }
            .remarks-label {
              font-weight: bold;
              color: #374151;
              margin-bottom: 5px;
              font-size: 12px;
            }
            .remarks-content {
              color: #4b5563;
              font-size: 12px;
              line-height: 1.4;
            }
            .no-remarks {
              color: #9ca3af;
              font-style: italic;
              font-size: 12px;
            }
            .footer { 
              text-align: center; 
              margin-top: 40px; 
              color: #666; 
              font-size: 12px; 
              border-top: 1px solid #ddd; 
              padding-top: 20px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
            @media (max-width: 768px) {
              .info-grid { grid-template-columns: 1fr; }
              .stats-grid { grid-template-columns: 1fr; }
              table { font-size: 11px; }
              th, td { padding: 6px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Graphura India Private Limited</h1>
            <h3>Intern Verification Report</h3>
            <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>

          ${internData ? `
            <div class="section">
              <h2>Intern Details</h2>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Full Name</div>
                  <div class="info-value">${internData.fullName || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Email</div>
                  <div class="info-value">${internData.email || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Mobile</div>
                  <div class="info-value">${internData.mobile || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Joining Date</div>
                  <div class="info-value">${formatDateToNumeric(internData.joiningDate)}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Unique ID</div>
                  <div class="info-value">${internData.uniqueId || 'N/A'}</div>
                </div>
              </div>
            </div>

            <div class="section">
              <h2>Internship Details</h2>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Domain</div>
                  <div class="info-value">${internData.domain || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Duration</div>
                  <div class="info-value">${internData.duration || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Status</div>
                  <div class="info-value">${internData.status || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Performance Rating</div>
                  <div class="info-value">${overallPerformance}</div>
                </div>
              </div>
            </div>

            ${monthlyPerformance.length > 0 ? `
              <div class="section">
                <h2>Monthly Performance</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Tasks Completed</th>
                      <th>Completion %</th>
                      <th>Initiative</th>
                      <th>Communication</th>
                      <th>Behavior</th>
                      <th>Overall Rating</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${monthlyPerformance.map((month) => `
                      <tr>
                        <td>${month.monthLabel || 'N/A'}</td>
                        <td>${month.tasksCompleted || 0} / ${month.totalTasks || 0}</td>
                        <td>
                          <span class="rating-badge ${month.completionPercentage >= 80 ? 'rating-excellent' :
                          month.completionPercentage >= 60 ? 'rating-good' :
                          month.completionPercentage >= 40 ? 'rating-average' : 'rating-poor'
                        }">
                            ${month.completionPercentage || 0}%
                          </span>
                        </td>
                        <td>${month.ratings?.initiative || 0}/10</td>
                        <td>${month.ratings?.communication || 0}/10</td>
                        <td>${month.ratings?.behaviour || 0}/10</td>
                        <td>
                          <span class="rating-badge ${month.overallRating >= 8 ? 'rating-excellent' :
                          month.overallRating >= 6 ? 'rating-good' :
                          month.overallRating >= 4 ? 'rating-average' : 'rating-poor'
                        }">
                            ${month.overallRating || 0}/10
                          </span>
                        </td>
                        <td>
                          ${month.inchargeRemarks ? `
                            <div class="remarks-section">
                              <div class="remarks-content">${month.inchargeRemarks}</div>
                            </div>
                          ` : `
                            <div class="no-remarks">No remarks provided</div>
                          `}
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : ''}

            ${internData.certificateStatus === 'issued' ? `
              <div class="section">
                <h2>Certificate Information</h2>
                <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; border: 1px solid #bae6fd;">
                  <strong>Certificate Number:</strong> ${internData.certificateNumber || 'N/A'}<br>
                  <strong>Issued Date:</strong> ${formatDateToNumeric(internData.certificateIssuedAt)}<br>
                  <strong>Status:</strong> <span style="color: #059669; font-weight: bold;">Verified & Issued</span>
                </div>
              </div>
            ` : ''}
          ` : '<p>No data available</p>'}

          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Graphura India Private Limited</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  // Initialize CAPTCHA on component mount and when mobile state changes
  useEffect(() => {
    generateCaptcha();
  }, [isMobile]);

  // Safely get monthly performance data
  const monthlyPerformance = internData?.performance?.monthlyPerformance || [];
  const overallPerformance = getOverallPerformance(internData?.performance);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-4 md:py-8 px-3 md:px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-8 mb-4 md:mb-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 via-blue-50 to-white opacity-80"></div>
            <div className="relative z-10">
              <div className="flex flex-col items-center mb-4 md:mb-6">
                <img
                  src={graphura}
                  alt="Graphura Logo"
                  className="w-12 h-12 md:w-20 md:h-20 mb-2 md:mb-3 rounded-full shadow-md border border-gray-200"
                />
                <h1 className="text-xl md:text-4xl font-extrabold text-indigo-800 tracking-tight">
                  Graphura India Private Limited
                </h1>
                <p className="text-gray-600 italic text-xs md:text-base mt-1">Empowering Interns, Empowering Future</p>
              </div>
              <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-2 md:mb-3">
                Intern Verification Portal
              </h2>
              <p className="text-gray-600 text-sm md:text-lg">
                Verify your internship details and performance records with ease
              </p>
            </div>
          </div>
        </div>

        {/* Verification Form */}
        {!internData && (
          <div className="bg-white rounded-xl md:rounded-2xl lg:rounded-3xl shadow-lg md:shadow-xl lg:shadow-2xl p-4 sm:p-6 md:p-8 lg:p-10 mb-6 md:mb-8 border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 sm:h-1.5 md:h-2 bg-gradient-to-r from-blue-500 to-purple-600"></div>
            <div className="absolute -top-10 -right-10 sm:-top-12 sm:-right-12 md:-top-16 md:-right-16 lg:-top-20 lg:-right-20 w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 bg-blue-100 rounded-full opacity-30 sm:opacity-40 md:opacity-50"></div>
            <div className="absolute -bottom-10 -left-10 sm:-bottom-12 sm:-left-12 md:-bottom-16 md:-left-16 lg:-bottom-20 lg:-left-20 w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 bg-purple-100 rounded-full opacity-30 sm:opacity-40 md:opacity-50"></div>

            <div className="text-center mb-4 sm:mb-6 md:mb-8 relative z-10">
              <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 mx-auto mb-3 sm:mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center shadow-md sm:shadow-lg transform hover:scale-105 transition-transform duration-300">
                <span className="text-xl sm:text-2xl md:text-3xl text-white">🔍</span>
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 mb-2 sm:mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight">
                Verify Your Internship
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm md:text-base max-w-xs sm:max-w-sm md:max-w-md mx-auto leading-relaxed sm:leading-loose">
                Enter your details to access your personalized internship dashboard and performance insights
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
                    <span className={`text-xs transition-all duration-300 ${formData.uniqueId.length > 0 ? 'text-green-500 font-semibold' : 'text-gray-400'
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
                      className="w-full px-3 sm:px-4 md:px-5 lg:px-6 py-3 sm:py-3.5 md:py-4 lg:py-5 border border-gray-200 sm:border-2 rounded-lg sm:rounded-xl md:rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-2 sm:focus:ring-3 md:focus:ring-4 focus:ring-blue-100 transition-all duration-300 text-sm sm:text-base bg-white shadow-sm hover:shadow-md"
                      placeholder="Enter your unique identification code"
                    />
                    <div className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center">
                      {formData.uniqueId && (
                        <span className="text-green-500 text-sm sm:text-base">✓</span>
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
                      className="w-full px-3 sm:px-4 md:px-5 lg:px-6 py-3 sm:py-3.5 md:py-4 lg:py-5 border border-gray-200 sm:border-2 rounded-lg sm:rounded-xl md:rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-2 sm:focus:ring-3 md:focus:ring-4 focus:ring-blue-100 transition-all duration-300 text-sm sm:text-base bg-white shadow-sm hover:shadow-md appearance-none"
                    />
                  </div>
                  {formData.joiningDate && (
                    <div className="flex items-center text-xs sm:text-sm text-green-600 bg-green-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg animate-pulse">
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full mr-1.5 sm:mr-2"></span>
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
                      className="w-full px-3 sm:px-4 md:px-5 lg:px-6 py-3 sm:py-3.5 md:py-4 lg:py-5 border border-gray-200 sm:border-2 rounded-lg sm:rounded-xl md:rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-2 sm:focus:ring-3 md:focus:ring-4 focus:ring-blue-100 transition-all duration-300 text-sm sm:text-base bg-white shadow-sm hover:shadow-md"
                      placeholder="your.email@example.com"
                    />
                    <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2">
                      {formData.email && (
                        <span className={`text-base sm:text-lg ${/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
                          ? 'text-green-500 animate-bounce'
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

                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-3 sm:p-4 md:p-5 lg:p-6 rounded-lg sm:rounded-xl md:rounded-2xl border border-gray-200 sm:border-2 hover:border-blue-300 transition-all duration-300">
                    <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="relative">
                          <canvas
                            ref={canvasRef}
                            width={isMobile ? "120" : "140"}
                            height={isMobile ? "40" : "50"}
                            className="border border-gray-300 sm:border-2 rounded-md sm:rounded-lg shadow-sm sm:shadow-md bg-white"
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
                          className="flex items-center space-x-1 sm:space-x-2 bg-white px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg border border-gray-200 sm:border-2 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 shadow-sm hover:shadow-md text-xs sm:text-sm"
                        >
                          <span className="text-blue-600 text-sm sm:text-base">🔄</span>
                          <span className="font-semibold text-gray-700 whitespace-nowrap">Refresh</span>
                        </button>
                        <button
                          type="button"
                          onClick={speakCaptcha}
                          disabled={audioEnabled}
                          className={`flex items-center space-x-1 sm:space-x-2 bg-white px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg border border-gray-200 sm:border-2 transition-all duration-200 shadow-sm hover:shadow-md text-xs sm:text-sm ${audioEnabled
                            ? 'opacity-50 cursor-not-allowed border-gray-300'
                            : 'hover:border-green-500 hover:bg-green-50'
                            }`}
                        >
                          <span className={`text-sm sm:text-base ${audioEnabled ? 'text-gray-400' : 'text-green-600'
                            }`}>
                            {audioEnabled ? '🔇' : '🔊'}
                          </span>
                          <span className="font-semibold text-gray-700 whitespace-nowrap">
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
                        className="w-full px-3 sm:px-4 md:px-5 lg:px-6 py-2.5 sm:py-3 md:py-4 text-center border border-gray-300 sm:border-2 rounded-lg sm:rounded-xl md:rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-2 sm:focus:ring-3 md:focus:ring-4 focus:ring-blue-100 transition-all duration-300 text-sm sm:text-base md:text-lg font-mono tracking-widest bg-white shadow-inner"
                        placeholder="Type the code above"
                        style={{ letterSpacing: '0.2em' }}
                      />
                      {formData.captcha && (
                        <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2">
                          <span className={`text-base sm:text-lg ${formData.captcha === captchaText
                            ? 'text-green-500 animate-pulse'
                            : 'text-orange-500'
                            }`}>
                            {formData.captcha === captchaText ? '✓' : '!'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2 sm:mt-3 md:mt-4">
                      <div className="flex items-center space-x-1.5 sm:space-x-2">
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-gray-600 font-medium">Secure verification</span>
                      </div>
                      <div className="flex items-center space-x-0.5 sm:space-x-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-300 ${level <= 4 ? 'bg-green-400' : 'bg-gray-300'
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
                className="w-full group relative bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 sm:py-4 md:py-5 lg:py-6 px-4 sm:px-5 md:px-6 lg:px-8 rounded-lg sm:rounded-xl md:rounded-2xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 sm:focus:ring-3 md:focus:ring-4 focus:ring-blue-200 focus:ring-offset-1 sm:focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm sm:text-base md:text-lg lg:text-xl shadow-lg sm:shadow-xl md:shadow-2xl hover:shadow-2xl sm:hover:shadow-3xl transform hover:-translate-y-0.5 sm:hover:-translate-y-1"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-700 to-purple-700 rounded-lg sm:rounded-xl md:rounded-2xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
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
                      <span className="text-xs sm:text-sm md:text-base lg:text-lg">Verify Internship Details</span>
                      <span className="transform group-hover:translate-x-1 sm:group-hover:translate-x-2 transition-transform duration-300 text-base sm:text-lg md:text-xl">→</span>
                    </>
                  )}
                </span>
              </button>

              <div className="text-center pt-2 sm:pt-3 md:pt-4">
                <p className="text-xs text-gray-500 flex flex-col xs:flex-row xs:items-center justify-center space-y-1 xs:space-y-0 xs:space-x-2">
                  <span className="flex items-center justify-center xs:justify-start">
                    <span className="mr-1">💡</span>
                    Having trouble?
                  </span>
                  <span>
                    Contact our support team at{" "}
                    <a href="mailto:Hr@graphura.in" className="text-blue-600 hover:text-blue-800 underline font-semibold whitespace-nowrap">
                      Hr@graphura.in
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
            <div className="bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-xl p-4 md:p-8">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4 md:mb-6">
                <h2 className="text-xl md:text-3xl font-bold text-gray-900">Intern Details</h2>
                <button
                  onClick={printReport}
                  className="bg-green-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl hover:bg-green-700 transition-colors duration-200 font-semibold shadow-lg flex items-center justify-center space-x-2 text-sm md:text-base"
                >
                  <span>🖨️</span>
                  <span>Print Report</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                <div className="bg-blue-50 p-3 md:p-4 rounded-lg md:rounded-xl border border-blue-200">
                  <label className="text-xs md:text-sm font-medium text-blue-700">Full Name</label>
                  <p className="text-base md:text-lg font-semibold text-gray-900 mt-1 break-words">{internData.fullName}</p>
                </div>
                <div className="bg-blue-50 p-3 md:p-4 rounded-lg md:rounded-xl border border-blue-200">
                  <label className="text-xs md:text-sm font-medium text-blue-700">Email</label>
                  <p className="text-base md:text-lg font-semibold text-gray-900 mt-1 break-words">{internData.email}</p>
                </div>
                <div className="bg-blue-50 p-3 md:p-4 rounded-lg md:rounded-xl border border-blue-200">
                  <label className="text-xs md:text-sm font-medium text-blue-700">Mobile</label>
                  <p className="text-base md:text-lg font-semibold text-gray-900 mt-1">{internData.mobile}</p>
                </div>
                <div className="bg-blue-50 p-3 md:p-4 rounded-lg md:rounded-xl border border-blue-200">
                  <label className="text-xs md:text-sm font-medium text-blue-700">Joining Date</label>
                  <p className="text-base md:text-lg font-semibold text-gray-900 mt-1">{formatDateToNumeric(internData.joiningDate)}</p>
                </div>
                <div className="bg-blue-50 p-3 md:p-4 rounded-lg md:rounded-xl border border-blue-200">
                  <label className="text-xs md:text-sm font-medium text-blue-700">Unique ID</label>
                  <p className="text-base md:text-lg font-semibold text-gray-900 mt-1 break-words">{internData.uniqueId}</p>
                </div>
              </div>
            </div>

            {/* Internship Details Card */}
            <div className="bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-xl p-4 md:p-8">
              <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6">Internship Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                <div className="bg-green-50 p-3 md:p-4 rounded-lg md:rounded-xl border border-green-200">
                  <label className="text-xs md:text-sm font-medium text-green-700">Domain</label>
                  <p className="text-base md:text-lg font-semibold text-gray-900 mt-1">{internData.domain}</p>
                </div>
                <div className="bg-green-50 p-3 md:p-4 rounded-lg md:rounded-xl border border-green-200">
                  <label className="text-xs md:text-sm font-medium text-green-700">Duration</label>
                  <p className="text-base md:text-lg font-semibold text-gray-900 mt-1">{internData.duration}</p>
                </div>
                <div className="bg-green-50 p-3 md:p-4 rounded-lg md:rounded-xl border border-green-200">
                  <label className="text-xs md:text-sm font-medium text-green-700">Status</label>
                  <p className="text-base md:text-lg font-semibold text-gray-900 mt-1">{internData.status}</p>
                </div>
                <div className="bg-green-50 p-3 md:p-4 rounded-lg md:rounded-xl border border-green-200">
                  <label className="text-xs md:text-sm font-medium text-green-700">Performance</label>
                  <p className="text-base md:text-lg font-semibold text-gray-900 mt-1">{overallPerformance}</p>
                </div>
              </div>
            </div>

            {/* Meeting Statistics Card */}


            {/* Monthly Performance Table with Remarks */}
            {monthlyPerformance.length > 0 && (
              <div className="bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-xl p-4 md:p-8">
                <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6">Monthly Performance</h2>
                <div className="overflow-x-auto -mx-2 md:mx-0">
                  <div className="min-w-full inline-block align-middle">
                    <table className="min-w-full divide-y divide-gray-200 text-sm md:text-base">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 md:px-6 py-2 md:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Month</th>
                          <th className="px-3 md:px-6 py-2 md:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Tasks</th>
                          <th className="px-3 md:px-6 py-2 md:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Completion</th>
                          <th className="px-3 md:px-6 py-2 md:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Initiative</th>
                          <th className="px-3 md:px-6 py-2 md:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Communication</th>
                          <th className="px-3 md:px-6 py-2 md:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Behavior</th>
                          <th className="px-3 md:px-6 py-2 md:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Overall</th>
                          <th className="px-3 md:px-6 py-2 md:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {monthlyPerformance.map((month, index) => (
                          <tr key={index} className="hover:bg-gray-50 transition-colors">
                            <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm font-semibold text-gray-900">
                              {month.monthLabel || 'N/A'}
                            </td>
                            <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                              {month.tasksCompleted || 0}/{month.totalTasks || 0}
                            </td>
                            <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${(month.completionPercentage || 0) >= 80 ? 'bg-green-100 text-green-800' :
                                (month.completionPercentage || 0) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                {month.completionPercentage || 0}%
                              </span>
                            </td>
                            <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                              {month.ratings?.initiative || 0}/10
                            </td>
                            <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                              {month.ratings?.communication || 0}/10
                            </td>
                            <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                              {month.ratings?.behaviour || 0}/10
                            </td>
                            <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${(month.overallRating || 0) >= 8 ? 'bg-green-100 text-green-800' :
                                (month.overallRating || 0) >= 6 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                {month.overallRating || 0}/10
                              </span>
                            </td>
                            <td className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm">
                              {month.inchargeRemarks ? (
                                <div className="max-w-xs">
                                  <div 
                                    className={`cursor-pointer transition-colors ${expandedRemarks[index] ? 'text-blue-600' : 'text-gray-600'}`}
                                    onClick={() => toggleRemarks(index)}
                                  >
                                    <div className="font-medium mb-1 flex items-center">
                                      <span className="mr-1">💬</span>
                                      Incharge Remarks
                                      <span className="ml-1 text-xs">
                                        {expandedRemarks[index] ? '▲' : '▼'}
                                      </span>
                                    </div>
                                    {expandedRemarks[index] && (
                                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-1 text-gray-700 leading-relaxed">
                                        {month.inchargeRemarks}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-400 italic">No remarks</span>
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
              <div className="bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-xl p-4 md:p-8">
                <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6">Certificate Information</h2>
                <div className="bg-green-50 border border-green-200 rounded-lg md:rounded-xl p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
                    <div>
                      <h3 className="text-lg md:text-xl font-semibold text-green-800 mb-1 md:mb-2">✅ Certificate Issued</h3>
                      <p className="text-green-700 text-sm md:text-base">
                        <strong>Certificate Number:</strong> {internData.certificateNumber}
                      </p>
                      <p className="text-green-700 text-sm md:text-base">
                        <strong>Issued Date:</strong> {formatDateToNumeric(internData.certificateIssuedAt)}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-semibold bg-green-100 text-green-800 self-start md:self-auto">
                      Verified & Issued
                    </span>
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