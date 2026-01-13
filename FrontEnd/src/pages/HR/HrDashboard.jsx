import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Athenura from "../../../public/AthenuraLogo.jpg";
import { Eye, FileText, Download, Upload, X } from "lucide-react";
import * as XLSX from "xlsx";

const HRDashboard = () => {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const [interns, setInterns] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [performance, setPerformance] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(null);
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [showEmailCopy, setShowEmailCopy] = useState(false);
  const [copySuccess, setCopySuccess] = useState("");
  const [exportLoading, setExportLoading] = useState(false);

  // Import functionality states
  const [importLoading, setImportLoading] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [importSummary, setImportSummary] = useState(null);
  const navigate = useNavigate();
  const printRef = useRef();
  const fileInputRef = useRef();

  useEffect(() => {
    const timer = setTimeout(() => fetchInterns(), 500);
    return () => clearTimeout(timer);
  }, [search, status, performance]);

  const fetchInterns = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/hr/interns", {
        params: { search, status, performance },
        withCredentials: true,
      });
      setInterns(data.interns || []);
    } catch (err) {
      console.error("Error fetching interns:", err);
      setError("Failed to load interns");
    }
    setLoading(false);
  };

  // Import Functions
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/)) {
      setError("Please select a valid Excel file (.xlsx, .xls, .csv)");
      setTimeout(() => setError(""), 5000);
      return;
    }

    setImportFile(file);
    setImportLoading(true);

    try {
      const data = await readExcelFile(file);
      setPreviewData(data);
    } catch (error) {
      setError("Failed to read Excel file: " + error.message);
      setTimeout(() => setError(""), 5000);
      setImportFile(null);
    }
    setImportLoading(false);
  };

  const readExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          if (jsonData.length === 0) {
            reject(new Error("No data found in the Excel file"));
            return;
          }

          // Map Excel columns to intern fields
          const mappedData = jsonData.map((row) => ({
            fullName: row['Full Name'] || row['fullName'] || row['Name'] || '',
            email: (row['Email'] || row['email'] || '').toLowerCase().trim(),
            mobile: String(row['Mobile'] || row['mobile'] || row['Phone'] || row['phone'] || '').trim(),
            dob: row['Date of Birth'] || row['dob'] || row['DOB'] || '',
            gender: row['Gender'] || row['gender'] || '',
            state: row['State'] || row['state'] || '',
            city: row['City'] || row['city'] || '',
            address: row['Address'] || row['address'] || '',
            pinCode: String(row['Pin Code'] || row['pinCode'] || row['pincode'] || ''),
            college: row['College'] || row['college'] || '',
            course: row['Course'] || row['course'] || '',
            educationLevel: row['Education Level'] || row['educationLevel'] || row['Education'] || '',
            domain: row['Domain'] || row['domain'] || '',
            contactMethod: row['Contact Method'] || row['contactMethod'] || 'Email',
            resumeUrl: row['Resume URL'] || row['resumeUrl'] || row['Resume'] || '',
            duration: row['Duration'] || row['duration'] || '',
            prevInternship: (row['Previous Internship'] || row['prevInternship'] || 'No').charAt(0).toUpperCase() + (row['Previous Internship'] || row['prevInternship'] || 'No').slice(1).toLowerCase(),
            TpoName: row['TPO Name'] || row['tpoName'] || row['TPO'] || '',
            TpoEmail: (row['TPO Email'] || row['tpoEmail'] || '').toLowerCase().trim(),
            TpoNumber: String(row['TPO Number'] || row['tpoNumber'] || ''),
            // Optional fields
            uniqueId: row['Unique ID'] || row['uniqueId'] || row['UniqueId'] || '',
            joiningDate: row['Joining Date'] || row['joiningDate'] || row['JoiningDate'] || '',
            status: 'Applied',
            performance: 'Average'
          }));

          resolve(mappedData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  const downloadTemplate = () => {
    const templateData = [{
      'Full Name': 'John Doe',
      'Email': 'john.doe@example.com',
      'Mobile': '1234567890',
      'Date of Birth': '2000-01-01',
      'Gender': 'Male',
      'State': 'California',
      'City': 'Los Angeles',
      'Address': '123 Main St',
      'Pin Code': '90001',
      'College': 'ABC University',
      'Course': 'Computer Science',
      'Education Level': 'Graduate',
      'Domain': 'Front-end Developer',
      'Contact Method': 'Email',
      'Resume URL': 'https://example.com/resume.pdf',
      'Duration': '3 months',
      'Previous Internship': 'No',
      'TPO Name': 'Dr. Smith',
      'TPO Email': 'smith@college.edu',
      'TPO Number': '9876543210',
      'Unique ID': 'OPTIONAL123', // Optional field
      'Joining Date': '2024-01-15' // Optional field
    }];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);

    // Set column widths
    const colWidths = [
      { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 15 },
      { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 20 },
      { wch: 10 }, { wch: 25 }, { wch: 20 }, { wch: 15 },
      { wch: 20 }, { wch: 15 }, { wch: 30 }, { wch: 10 },
      { wch: 5 }, { wch: 15 }, { wch: 20 }, { wch: 15 },
      { wch: 15 }, { wch: 15 } // Added for Unique ID and Joining Date
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "intern_import_template.xlsx");
  };

  const handleImport = async () => {
    if (!previewData.length) return;

    setImportLoading(true);
    try {
      const { data } = await axios.post(
        "/api/hr/import-interns",
        { interns: previewData },
        { withCredentials: true }
      );

      setImportSummary(data.summary);

      if (data.summary.success > 0) {
        setCopySuccess(`✅ Successfully imported ${data.summary.success} interns! ${data.summary.duplicates > 0 ? `(${data.summary.duplicates} duplicates skipped)` : ''}`);
        setTimeout(() => setCopySuccess(""), 15000);

        // Refresh the interns list
        await fetchInterns();

        // Close modal after successful import
        setTimeout(() => {
          setShowImportModal(false);
          setImportFile(null);
          setPreviewData([]);
          setImportSummary(null);
        }, 3000);
      } else {
        setError(`❌ No interns imported. ${data.summary.duplicates > 0 ? `All ${data.summary.duplicates} records were duplicates.` : 'Please check your data.'}`);
        setTimeout(() => setError(""), 15000);
      }
    } catch (err) {
      console.error("Import error:", err);
      setError("Failed to import interns: " + (err.response?.data?.message || err.message));
      setTimeout(() => setError(""), 15000);
    }
    setImportLoading(false);
  };

  // Export to Excel function using XLSX
  const exportToExcel = () => {
    setExportLoading(true);
    try {
      const dataToExport = filteredInterns.length > 0 ? filteredInterns : interns;

      if (dataToExport.length === 0) {
        setError("No data to export");
        setTimeout(() => setError(""), 3000);
        setExportLoading(false);
        return;
      }

      // Prepare data for Excel
      const excelData = dataToExport.map(intern => ({
        'Full Name': intern.fullName || '',
        'Email': intern.email || '',
        'Mobile': intern.mobile || '',
        'Domain': intern.domain || '',
        'Duration': intern.duration || '',
        'College': intern.college || '',
        'Status': intern.status || '',
        'Performance': intern.performance || '',
        'Unique ID': intern.uniqueId || '',
        'Joining Date': intern.joiningDate || '',
        'Applied Date': intern.createdAt ? new Date(intern.createdAt).toLocaleDateString() : '',
        'Resume URL': intern.resumeUrl || '',
        'Locked Status': intern.uniqueId ? 'Yes' : 'No',
        'Date of Birth': intern.dob || '',
        'Gender': intern.gender || '',
        'State': intern.state || '',
        'City': intern.city || '',
        'Address': intern.address || '',
        'Pin Code': intern.pinCode || '',
        'Course': intern.course || '',
        'Education Level': intern.educationLevel || '',
        'Contact Method': intern.contactMethod || '',
        'Previous Internship': intern.prevInternship || 'No',
        'TPO Name': intern.TpoName || '-',
        'TPO Email': intern.TpoEmail || '-',
        'TPO Number': intern.TpoNumber || '-',
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const colWidths = [
        { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 20 },
        { wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 12 },
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 30 },
        { wch: 12 }, { wch: 15 }, { wch: 10 }, { wch: 15 },
        { wch: 15 }, { wch: 20 }, { wch: 10 }, { wch: 20 },
        { wch: 15 }, { wch: 15 }, { wch: 5 }, { wch: 15 },
        { wch: 20 }, { wch: 15 }
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Interns Data");

      // Generate Excel file and download
      const fileName = `interns_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      setCopySuccess(`✅ Exported ${dataToExport.length} interns to Excel!`);
      setTimeout(() => setCopySuccess(""), 3000);

    } catch (err) {
      console.error("Error exporting data:", err);
      setError("Failed to export data");
      setTimeout(() => setError(""), 3000);
    }
    setExportLoading(false);
  };

  // Export only selected interns
  const exportSelectedToExcel = () => {
    setExportLoading(true);
    try {
      const selectedInterns = interns.filter(intern => intern.status === "Selected");

      if (selectedInterns.length === 0) {
        setError("No selected interns to export");
        setTimeout(() => setError(""), 3000);
        setExportLoading(false);
        return;
      }

      // Prepare data for Excel
      const excelData = selectedInterns.map(intern => ({
        // 🔹 Basic Info
        'Full Name': intern.fullName || '',
        'Email': intern.email || '',
        'Mobile': intern.mobile || '',
        'Date of Birth': intern.dob || '',
        'Gender': intern.gender || '',

        // 🔹 Location Info
        'State': intern.state || '',
        'City': intern.city || '',
        'Address': intern.address || '',
        'Pin Code': intern.pinCode || '',

        // 🔹 Education Details
        'College': intern.college || '',
        'Course': intern.course || '',
        'Education Level': intern.educationLevel || '',

        // 🔹 Internship Details
        'Domain': intern.domain || '',
        'Duration': intern.duration || '',
        'Previous Internship': intern.prevInternship || 'No',

        // 🔹 Status & Performance
        'Status': intern.status || '',
        'Performance': intern.performance || '',
        'Comment': intern.comment || '',

        // 🔹 Contact / Communication
        'Contact Method': intern.contactMethod || '',
        'Resume URL': intern.resumeUrl || '',

        // 🔹 TPO / College Incharge
        'TPO Name': intern.TpoName || '',
        'TPO Email': intern.TpoEmail || '',
        'TPO Number': intern.TpoNumber || '',

        'Applied Date': intern.createdAt
          ? new Date(intern.createdAt).toLocaleDateString()
          : '',
      }));


      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const colWidths = [
        { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 20 },
        { wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 12 },
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
        { wch: 30 }, { wch: 12 }
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Selected Interns");

      // Generate Excel file and download
      const fileName = `selected_interns_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      setCopySuccess(`✅ Exported ${selectedInterns.length} selected interns to Excel!`);
      setTimeout(() => setCopySuccess(""), 3000);

    } catch (err) {
      console.error("Error exporting selected data:", err);
      setError("Failed to export selected interns");
      setTimeout(() => setError(""), 3000);
    }
    setExportLoading(false);
  };

  const handleStatusUpdate = async (internId, newStatus, currentPerformance) => {
    // ✅ Business Rule 1: can only mark "Selected" if performance is Good or Excellent
    if (newStatus === "Selected" && !(currentPerformance === "Good" || currentPerformance === "Excellent")) {
      setError("⚠️ Cannot mark as Selected. Performance must be Good or Excellent first.");
      setTimeout(() => setError(""), 2000);
      return;
    }

    // ✅ Business Rule 2: can only mark "Rejected" if performance is Poor
    if (newStatus === "Rejected" && currentPerformance !== "Poor") {
      setError("⚠️ Cannot mark as Rejected. Performance must be marked as Poor first.");
      setTimeout(() => setError(""), 2000);
      return;
    }

    setUpdating(internId);
    try {
      await axios.put(
        `/api/hr/interns/${internId}/status`,
        { status: newStatus },
        { withCredentials: true }
      );
      await fetchInterns(); // Refresh the list
    } catch (err) {
      console.error("Error updating status:", err);
      setError("Failed to update status");
    }
    setUpdating(null);
  };

  const handlePerformanceUpdate = async (internId, newPerformance) => {
    setUpdating(internId);
    try {
      await axios.put(
        `/api/hr/interns/${internId}/performance`,
        { performance: newPerformance },
        { withCredentials: true }
      );
      await fetchInterns(); // Refresh the list
    } catch (err) {
      console.error("Error updating performance:", err);
      setError("Failed to update performance");
    }
    setUpdating(null);
  };

  const handleDomainUpdate = async (internId, newDomain) => {
    setUpdating(internId);
    try {
      await axios.put(
        `/api/hr/interns/${internId}/domain`,
        { domain: newDomain },
        { withCredentials: true }
      );
      await fetchInterns(); // Refresh the list
    } catch (err) {
      console.error("Error updating domain:", err);
      setError("Failed to update domain");
    }
    setUpdating(null);
  };

  const handleLogout = async () => {
    try {
      await axios.post("/api/logout", {}, { withCredentials: true });
      localStorage.removeItem('user');
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    // Create print-friendly content
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>HR Dashboard - Interns Report</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px;
              color: #333;
            }
            .print-header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .print-header h1 {
              margin: 0 0 10px 0;
              color: #1f2937;
            }
            .print-header p {
              margin: 0;
              color: #6b7280;
            }
            .print-stats {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
              margin-bottom: 30px;
            }
            .stat-card {
              padding: 15px;
              border-radius: 8px;
              text-align: center;
              border: 1px solid #e5e7eb;
            }
            .stat-number {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .stat-label {
              font-size: 14px;
              color: #6b7280;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background-color: #4f46e5;
              color: white;
              padding: 12px;
              text-align: left;
              font-weight: bold;
            }
            td {
              padding: 12px;
              border-bottom: 1px solid #e5e7eb;
            }
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
            .status-badge, .performance-badge {
              padding: 4px 8px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: bold;
            }
            .status-Applied { background-color: #dbeafe; color: #1e40af; }
            .status-Selected { background-color: #dcfce7; color: #166534; }
            .status-Rejected { background-color: #fee2e2; color: #991b1b; }
            .performance-Average { background-color: #fef3c7; color: #92400e; }
            .performance-Good { background-color: #dcfce7; color: #166534; }
            .performance-Excellent { background-color: #e0e7ff; color: #3730a3; }
            .performance-Poor { background-color: #fee2e2; color: #991b1b; } // Add this line
            .unique-id {
              background-color: #f3e8ff;
              color: #7c3aed;
              padding: 4px 8px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: bold;
              font-family: monospace;
            }
            .locked-badge {
              background-color: #fef3c7;
              color: #92400e;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 10px;
              margin-left: 4px;
            }
            .print-footer {
              margin-top: 30px;
              text-align: center;
              color: #6b7280;
              font-size: 12px;
              border-top: 1px solid #e5e7eb;
              padding-top: 20px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>Athenura - HR Dashboard Report</h1>
            <p>Intern Applications and Performance Report</p>
            <p>Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>
          
          ${printContent.innerHTML}
          
          <div class="print-footer">
            <p>Confidential - For Internal Use Only</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    // Wait for content to load before printing
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const getSelectedInternsEmails = () => {
    const selectedInterns = showSelectedOnly
      ? interns.filter(intern => intern.status === "Selected")
      : interns.filter(intern => intern.status === "Selected");

    return selectedInterns
      .map(intern => intern.email)
      .filter(email => email)
      .join("; ");
  };

  const copySelectedEmails = async () => {
    const emails = getSelectedInternsEmails();
    if (!emails) {
      setCopySuccess("No selected interns found to copy emails");
      setTimeout(() => setCopySuccess(""), 3000);
      return;
    }

    try {
      await navigator.clipboard.writeText(emails);
      setCopySuccess("✅ Emails copied to clipboard!");
      setTimeout(() => setCopySuccess(""), 3000);
    } catch (err) {
      console.error("Failed to copy emails:", err);
      setCopySuccess("❌ Failed to copy emails");
      setTimeout(() => setCopySuccess(""), 3000);
    }
  };

  const openEmailClient = () => {
    const emails = getSelectedInternsEmails();
    if (!emails) {
      setCopySuccess("No selected interns found to email");
      setTimeout(() => setCopySuccess(""), 3000);
      return;
    }
    window.location.href = `mailto:${emails}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Selected": return "bg-green-100 text-green-800";
      case "Rejected": return "bg-red-100 text-red-800";
      case "Applied": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPerformanceColor = (performance) => {
    switch (performance) {
      case "Excellent": return "bg-purple-100 text-purple-800";
      case "Good": return "bg-green-100 text-green-800";
      case "Average": return "bg-yellow-100 text-yellow-800";
      case "Poor": return "bg-red-100 text-red-800"; // Add this line
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredInterns = showSelectedOnly
    ? interns.filter(intern => intern.status === "Selected")
    : interns;

  const selectedCount = interns.filter(intern => intern.status === "Selected").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl mb-6 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <img src={Athenura} alt="Athenura Logo" className="sm:h-12 h-8 mr-5" />
                <div>
                  <h1 className="sm:text-2xl ml-2 text-s font-bold text-gray-800">HR Dashboard</h1>
                  <p className="text-blue-400 font-bold sm:text-lg text-sm">👋 Hi  {storedUser?.fullName}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {/* Import Button */}
              <button
                onClick={() => setShowImportModal(true)}
                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg no-print flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Import Excel
              </button>

              {/* Export All Button */}
              <button
                onClick={exportToExcel}
                disabled={exportLoading || (filteredInterns.length === 0 && interns.length === 0)}
                className={`px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg no-print flex items-center gap-2 ${exportLoading || (filteredInterns.length === 0 && interns.length === 0)
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:from-green-600 hover:to-green-700'
                  }`}
              >
                {exportLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Export Excel
                  </>
                )}
              </button>

              {/* Export Selected Button */}
              {selectedCount > 0 && (
                <button
                  onClick={exportSelectedToExcel}
                  disabled={exportLoading}
                  className={`px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg no-print flex items-center gap-2 ${exportLoading ? 'opacity-50 cursor-not-allowed' : 'hover:from-blue-600 hover:to-blue-700'
                    }`}
                >
                  <Download className="w-4 h-4" />
                  Export Selected ({selectedCount})
                </button>
              )}

              <button
                onClick={handlePrint}
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg no-print"
              >
                📄 Print Report
              </button>
              <button
                onClick={handleLogout}
                className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg no-print"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative animate-fade-in">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* Email Copy Success Message */}
        {copySuccess && (
          <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative animate-fade-in">
            <span className="block sm:inline">{copySuccess}</span>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white shadow-xl rounded-2xl p-6" ref={printRef}>
          {/* Filters Section */}
          <div className="mb-8 no-print">
            {interns.length > 0 && (
              <div className="mt-6 grid grid-cols-2 md:grid-cols-7 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{interns.length}</div>
                  <div className="text-sm text-blue-800">Total Interns</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {selectedCount}
                  </div>
                  <div className="text-sm text-green-800">Selected</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {interns.filter(i => i.status === 'Rejected').length}
                  </div>
                  <div className="text-sm text-red-800">Rejected</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {interns.filter(i => i.performance === 'Excellent').length}
                  </div>
                  <div className="text-sm text-purple-800">Excellent</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {interns.filter(i => i.performance === 'Good').length}
                  </div>
                  <div className="text-sm text-orange-800">Good</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {interns.filter(i => i.status === 'Applied').length}
                  </div>
                  <div className="text-sm text-yellow-800">Pending</div>
                </div>
                <div
                  className="bg-indigo-50 rounded-lg p-4 text-center cursor-pointer hover:bg-indigo-100 transition-colors border-2 border-indigo-200"
                  onClick={() => setShowEmailCopy(!showEmailCopy)}
                >
                  <div className="text-2xl font-bold text-indigo-600">
                    📧
                  </div>
                  <div className="text-sm text-indigo-800">Email Tools</div>
                </div>
              </div>
            )}
            {/* Email Tools Panel */}
            {showEmailCopy && selectedCount > 0 && (
              <div className="mt-4 bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                <h3 className="text-lg font-semibold text-indigo-800 mb-3 flex items-center gap-2">
                  📧 Email Selected Interns ({selectedCount})
                </h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={copySelectedEmails}
                    className="px-4 py-2 bg-white text-indigo-700 border border-indigo-300 rounded-lg hover:bg-indigo-50 transition-colors font-medium flex items-center gap-2"
                  >
                    📋 Copy All Emails
                  </button>
                  <button
                    onClick={openEmailClient}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2"
                  >
                    ✉️ Open Email Client
                  </button>
                  <div className="flex-1 bg-white rounded-lg px-3 py-2 border border-indigo-200 text-sm text-gray-600 flex items-center">
                    <span className="truncate">{getSelectedInternsEmails()}</span>
                  </div>
                </div>
              </div>
            )}

            <h2 className="text-xl mt-4 font-semibold text-gray-800 mb-4">Filters & Search</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="🔍 Search by name, email, or domain..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                <option value="">All Status</option>
                <option value="Applied">Applied</option>
                <option value="Selected">Selected</option>
                <option value="Rejected">Rejected</option>
              </select>

              <select
                value={performance}
                onChange={(e) => setPerformance(e.target.value)}
                className="border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                <option value="">All Performance</option>
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Average">Average</option>
                <option value="Poor">Poor</option> {/* Add this line */}
              </select>

              <button
                onClick={() => setShowSelectedOnly(!showSelectedOnly)}
                className={`border rounded-xl px-4 py-3 font-medium transition-all duration-200 ${showSelectedOnly
                  ? 'bg-green-100 text-green-800 border-green-300'
                  : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  }`}
              >
                {showSelectedOnly ? '✅ Showing Selected' : '👥 Show All'}
              </button>
            </div>

            {/* Selected Only Notice */}
            {showSelectedOnly && (
              <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✅</span>
                  <span className="text-green-800 font-medium">
                    Showing only selected interns ({filteredInterns.length})
                  </span>
                </div>
                <button
                  onClick={() => setShowSelectedOnly(false)}
                  className="text-green-600 hover:text-green-800 font-medium text-sm"
                >
                  Show All
                </button>
              </div>
            )}
          </div>

          {/* Intern Table */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchInterns}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 no-print"
              >
                Retry
              </button>
            </div>
          ) : filteredInterns.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                  <tr>
                    <th className="p-4 text-left font-semibold">Intern Details</th>
                    <th className="p-4 text-left font-semibold">Contact Info/apply Date</th>
                    <th className="p-4 text-left font-semibold">Domain & Duration</th>
                    <th className="p-4 text-left font-semibold">College Info</th>
                    <th className="p-4 text-left font-semibold">Status</th>
                    <th className="p-4 text-left font-semibold">Performance</th>
                    <th className="p-4 text-left font-semibold">Domain</th>
                    <th className="p-4 text-left font-semibold no-print">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInterns.map((intern) => {
                    const hasUniqueId = !!intern.uniqueId;
                    const isLocked = hasUniqueId;

                    return (
                      <tr
                        key={intern._id}
                        className={`hover:bg-indigo-50 transition-colors duration-150 ${isLocked ? 'bg-yellow-50' : ''
                          }`}
                      >
                        {/* Name & Email */}
                        <td className="p-4">
                          <div>
                            <div className="font-semibold text-gray-800 flex items-center gap-2">
                              {intern.fullName}
                              {isLocked && (
                                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">
                                  🔒 Locked
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">{intern.email}</div>
                            {intern.uniqueId && (
                              <div className="text-xs text-purple-600 font-mono mt-1">
                                ID: {intern.uniqueId}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Mobile Number */}
                        <td className="p-4">
                          <div className="text-gray-700 text-sm">
                            📞 {intern.mobile || "Not provided"}
                            <p className="text-xs font-bold">Applied : {intern.updatedAt ? new Date(intern.updatedAt).toLocaleDateString() : "Not provided"}</p>
                            {intern.joiningDate && (
                              <p className="text-xs text-green-600 font-bold mt-1">
                                Joining: {new Date(intern.joiningDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Domain & Duration */}
                        <td className="p-4">
                          <div className="space-y-1">
                            <span className="inline-block bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">
                              {intern.domain || "Not specified"}
                            </span>
                            <div className="text-sm text-gray-600">
                              ⏱️ {intern.duration || "Not specified"}
                            </div>
                          </div>
                        </td>

                        <td className="p-2 md:p-3">
                          <div className="min-h-[36px] flex items-center">
                            <div className="truncate-text-2-lines max-w-full">
                              <span className={`
                                 text-xs md:text-sm
                                   ${intern.college ? "text-gray-600" : "text-gray-400 italic"}
                                   transition-colors duration-100
                                 `}>
                                {intern.college || "—"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Status with Update */}
                        <td className="p-4">
                          <div className="print-only">
                            <span className={`status-badge status-${intern.status}`}>
                              {intern.status}
                            </span>
                          </div>
                          <select
                            value={intern.status}
                            onChange={(e) => handleStatusUpdate(intern._id, e.target.value, intern.performance)}
                            disabled={updating === intern._id || isLocked}
                            className={`${getStatusColor(intern.status)} px-3 py-1 rounded-full text-sm font-medium border-0 focus:ring-2 focus:ring-indigo-500 cursor-pointer no-print ${isLocked ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                          >
                            <option value="Applied">Applied</option>
                            <option value="Selected">Selected</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                          {isLocked && (
                            <div className="text-xs text-yellow-600 mt-1 no-print">
                              🔒 Cannot update
                            </div>
                          )}
                        </td>

                        {/* Performance with Update */}
                        {/* Performance with Update */}
                        <td className="p-4">
                          <div className="print-only">
                            <span className={`performance-badge performance-${intern.performance}`}>
                              {intern.performance}
                            </span>
                          </div>
                          <select
                            value={intern.performance}
                            onChange={(e) => handlePerformanceUpdate(intern._id, e.target.value, hasUniqueId)}
                            disabled={updating === intern._id || isLocked}
                            className={`${getPerformanceColor(intern.performance)} px-3 py-1 rounded-full text-sm font-medium border-0 focus:ring-2 focus:ring-indigo-500 cursor-pointer no-print ${isLocked ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                          >
                            <option value="Average">Average</option>
                            <option value="Good">Good</option>
                            <option value="Excellent">Excellent</option>
                            <option value="Poor">Poor</option> {/* Add this line */}
                          </select>
                          {isLocked && (
                            <div className="text-xs text-yellow-600 mt-1 no-print">
                              🔒 Cannot update
                            </div>
                          )}
                        </td>

                        {/* Domain Update */}
                        <td className="p-3">
                          <div className="print-only">
                            <span>
                              {intern.domain}
                            </span>
                          </div>
                          <select
                            value={intern.domain}
                            onChange={(e) => handleDomainUpdate(intern._id, e.target.value, hasUniqueId)}
                            disabled={updating === intern._id || isLocked}
                            className={`px-3 py-1 rounded-full text-sm font-medium border-0 focus:ring-2 focus:ring-indigo-500 cursor-pointer no-print ${isLocked ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
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
                          {isLocked && (
                            <div className="text-xs text-yellow-600 mt-1 no-print">
                              🔒 Cannot update
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-4 no-print">
                          <div className="flex gap-2">
                            <button
                              onClick={() => navigate(`/HR-Dashboard/intern/${intern._id}`)}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium text-xs"
                            >
                              <Eye />
                            </button>

                            <a
                              href={intern.resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                            >
                              <FileText className="w-5 h-5" />
                              Resume
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">
                {showSelectedOnly ? "✅" : "👥"}
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {showSelectedOnly ? "No selected interns found" : "No interns found"}
              </h3>
              <p className="text-gray-500">
                {showSelectedOnly
                  ? "There are no interns with 'Selected' status"
                  : "Try adjusting your search or filters"
                }
              </p>
              {showSelectedOnly && (
                <button
                  onClick={() => setShowSelectedOnly(false)}
                  className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  Show All Interns
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Import Interns Modal */}
      {showImportModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Import Interns from Excel</h2>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setPreviewData([]);
                  setImportSummary(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {!importFile ? (
                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-indigo-400 transition-colors">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="text-4xl mb-4">📊</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Upload Excel File
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Supported formats: .xlsx, .xls, .csv
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    Choose File
                  </button>

                  {/* Template Download */}
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Download Template</h4>
                    <p className="text-sm text-blue-600 mb-3">
                      Use this template to ensure proper formatting. Unique ID and Joining Date are optional fields.
                    </p>
                    <button
                      onClick={downloadTemplate}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      📥 Download Template
                    </button>
                  </div>
                </div>
              ) : previewData.length > 0 ? (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Preview Data ({previewData.length} records)
                    </h3>
                    <button
                      onClick={() => {
                        setImportFile(null);
                        setPreviewData([]);
                        setImportSummary(null);
                      }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm font-medium"
                    >
                      Change File
                    </button>
                  </div>

                  {/* Preview Table */}
                  <div className="overflow-x-auto border border-gray-200 rounded-lg mb-4">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-3 text-left font-semibold text-gray-700">Full Name</th>
                          <th className="p-3 text-left font-semibold text-gray-700">Email</th>
                          <th className="p-3 text-left font-semibold text-gray-700">Mobile</th>
                          <th className="p-3 text-left font-semibold text-gray-700">Domain</th>
                          <th className="p-3 text-left font-semibold text-gray-700">Unique ID</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {previewData.slice(0, 5).map((intern, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="p-3">{intern.fullName}</td>
                            <td className="p-3">{intern.email}</td>
                            <td className="p-3">{intern.mobile}</td>
                            <td className="p-3">{intern.domain}</td>
                            <td className="p-3">{intern.uniqueId || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {previewData.length > 5 && (
                      <div className="p-3 bg-gray-50 text-center text-gray-600">
                        ... and {previewData.length - 5} more records
                      </div>
                    )}
                  </div>

                  {/* Import Summary */}
                  {importSummary && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">Import Summary</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Total:</span> {importSummary.total}
                        </div>
                        <div>
                          <span className="font-medium">Success:</span> {importSummary.success}
                        </div>
                        <div>
                          <span className="font-medium">Failed:</span> {importSummary.failed}
                        </div>
                        <div>
                          <span className="font-medium">Duplicates:</span> {importSummary.duplicates}
                        </div>
                      </div>
                      {importSummary.errors && importSummary.errors.length > 0 && (
                        <div className="mt-3">
                          <h5 className="font-medium text-red-700 mb-1">Errors:</h5>
                          <ul className="text-sm text-red-600 list-disc list-inside">
                            {importSummary.errors.slice(0, 3).map((error, idx) => (
                              <li key={idx}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleImport}
                      disabled={importLoading}
                      className={`flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium transition-colors ${importLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'
                        }`}
                    >
                      {importLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Importing...
                        </>
                      ) : (
                        `Import ${previewData.length} Interns`
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowImportModal(false);
                        setImportFile(null);
                        setPreviewData([]);
                        setImportSummary(null);
                      }}
                      className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <p>Processing file...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRDashboard;