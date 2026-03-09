import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Athenura from "../../../public/AthenuraLogo.jpg";
import { Eye, FileText, Download, Upload, X, Mail, Send, Link, Calendar, Clock, Search } from "lucide-react";
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
  const [selectedDomain, setSelectedDomain] = useState("");

  // Email functionality states
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [selectedInterns, setSelectedInterns] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [emailForm, setEmailForm] = useState({
    subject: "Interview Invitation - Athenura Internship",
    meetingLink: "",
    meetingDate: "",
    meetingTime: "",
    meetingPlatform: "Google Meet",
    customMessage: "",
    hrName: storedUser?.fullName || "HR Team",
    hrEmail: storedUser?.email || "hr@athenura.com"
  });

  // Import functionality states
  const [importLoading, setImportLoading] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [importSummary, setImportSummary] = useState(null);

  // Add these with other email functionality states
  const [emailSearchTerm, setEmailSearchTerm] = useState("");
  const [emailDomainFilter, setEmailDomainFilter] = useState("");
  const [emailCollegeFilter, setEmailCollegeFilter] = useState("");
  const [emailDateFilter, setEmailDateFilter] = useState("");
  const [emailDateRange, setEmailDateRange] = useState({
    from: "",
    to: ""
  });
  const [showDateRange, setShowDateRange] = useState(false);

  const navigate = useNavigate();
  const printRef = useRef();
  const fileInputRef = useRef();

  useEffect(() => {
    const timer = setTimeout(() => fetchInterns(), 500);
    return () => clearTimeout(timer);
  }, [search, status, performance, selectedDomain]);

  const fetchInterns = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/hr/interns", {
        params: { search, status, performance, domain: selectedDomain },
        withCredentials: true,
      });
      setInterns(data.interns || []);
    } catch (err) {
      console.error("Error fetching interns:", err);
      setError("Failed to load interns");
    }
    setLoading(false);
  };

  const formatTimeToAMPM = (time) => {
    if (!time) return "";

    const [hours, minutes] = time.split(":");
    let h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";

    h = h % 12;
    h = h ? h : 12;

    return `${h}:${minutes} ${ampm}`;
  };
  // Email Functions
  const openEmailModal = () => {
    // Filter interns with Applied status
    const appliedInterns = interns.filter(intern => intern.status === "Applied");
    if (appliedInterns.length === 0) {
      setError("No interns with 'Applied' status found to send emails");
      setTimeout(() => setError(""), 3000);
      return;
    }
    setSelectedInterns(appliedInterns.map(intern => ({
      ...intern,
      selected: false
    })));
    setShowEmailModal(true);
  };

  const handleSelectAll = () => {
    setSelectAll(!selectAll);
    setSelectedInterns(prev =>
      prev.map(intern => ({ ...intern, selected: !selectAll }))
    );
  };

  const handleSelectIntern = (internId) => {
    setSelectedInterns(prev => {
      const updated = prev.map(intern =>
        intern._id === internId
          ? { ...intern, selected: !intern.selected }
          : intern
      );

      const allSelected = updated.every(intern => intern.selected);
      setSelectAll(allSelected);

      return updated;
    });
  };

  const handleEmailFormChange = (e) => {
    setEmailForm({
      ...emailForm,
      [e.target.name]: e.target.value
    });
  };


  const sendInterviewEmails = async () => {

    const selectedToEmail = selectedInterns.filter(i => i.selected);

    if (selectedToEmail.length === 0) {
      setError("Please select at least one intern");
      return;
    }

    if (!emailForm.meetingLink) {
      setError("Please enter a meeting link");
      setTimeout(() => setError(""), 3000);
      return;
    }

    // Validate meeting date
    if (!emailForm.meetingDate) {
      setError("Please select a meeting date");
      setTimeout(() => setError(""), 3000);
      return;
    }

    // Validate meeting time
    if (!emailForm.meetingTime) {
      setError("Please select a meeting time");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setEmailLoading(true);

    try {

      const payload = {
        interns: selectedToEmail.map(i => ({
          email: i.email,
          name: i.fullName,
          domain: i.domain,
          internId: i._id
        })),
        subject: emailForm.subject,
        meetingLink: emailForm.meetingLink,
        meetingDate: emailForm.meetingDate,
        meetingTime: emailForm.meetingTime,
        meetingPlatform: emailForm.meetingPlatform,
        customMessage: emailForm.customMessage,
        hrName: emailForm.hrName,
        hrEmail: emailForm.hrEmail
      };

      const response = await axios.post(
        "/api/hr/send-interview-email",
        payload,
        { withCredentials: true }
      );

      if (response.data.success) {

        for (const intern of selectedToEmail) {
          await axios.put(
            `/api/hr/interns/${intern._id}/status`,
            { status: "Mailed" },
            { withCredentials: true }
          );
        }

        setCopySuccess("Interview emails sent successfully!");
        fetchInterns();
        setShowEmailModal(false);
      }

    } catch (err) {
      setError("Failed to send emails", err);
    }

    setEmailLoading(false);
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
      'Unique ID': 'OPTIONAL123',
      'Joining Date': '2024-01-15'
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
      { wch: 15 }, { wch: 15 }
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


  // Filter interns for email modal
  const getFilteredEmailInterns = () => {
    let filtered = selectedInterns;

    // Search filter (name, email, domain, college)
    if (emailSearchTerm) {
      const searchLower = emailSearchTerm.toLowerCase();
      filtered = filtered.filter(intern =>
        intern.fullName?.toLowerCase().includes(searchLower) ||
        intern.email?.toLowerCase().includes(searchLower) ||
        intern.domain?.toLowerCase().includes(searchLower) ||
        intern.college?.toLowerCase().includes(searchLower)
      );
    }

    // Domain filter
    if (emailDomainFilter) {
      filtered = filtered.filter(intern =>
        intern.domain === emailDomainFilter
      );
    }

    // College filter
    if (emailCollegeFilter) {
      const collegeLower = emailCollegeFilter.toLowerCase();
      filtered = filtered.filter(intern =>
        intern.college?.toLowerCase().includes(collegeLower)
      );
    }

    // Date filter
    if (showDateRange && emailDateRange.from && emailDateRange.to) {
      const fromDate = new Date(emailDateRange.from);
      const toDate = new Date(emailDateRange.to);
      toDate.setHours(23, 59, 59, 999); // End of day

      filtered = filtered.filter(intern => {
        if (!intern.createdAt) return false;
        const internDate = new Date(intern.createdAt);
        return internDate >= fromDate && internDate <= toDate;
      });
    } else if (emailDateFilter) {
      const filterDate = new Date(emailDateFilter);
      filtered = filtered.filter(intern => {
        if (!intern.createdAt) return false;
        const internDate = new Date(intern.createdAt);
        return internDate.toDateString() === filterDate.toDateString();
      });
    }

    return filtered;
  };

  // Get unique domains for filter dropdown
  const getUniqueDomains = () => {
    const domains = [...new Set(selectedInterns.map(intern => intern.domain).filter(Boolean))];
    return domains.sort();
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
        'Full Name': intern.fullName || '',
        'Email': intern.email || '',
        'Mobile': intern.mobile || '',
        'Date of Birth': intern.dob || '',
        'Gender': intern.gender || '',
        'State': intern.state || '',
        'City': intern.city || '',
        'Address': intern.address || '',
        'Pin Code': intern.pinCode || '',
        'College': intern.college || '',
        'Course': intern.course || '',
        'Education Level': intern.educationLevel || '',
        'Domain': intern.domain || '',
        'Duration': intern.duration || '',
        'Previous Internship': intern.prevInternship || 'No',
        'Status': intern.status || '',
        'Performance': intern.performance || '',
        'Comment': intern.comment || '',
        'Contact Method': intern.contactMethod || '',
        'Resume URL': intern.resumeUrl || '',
        'TPO Name': intern.TpoName || '',
        'TPO Email': intern.TpoEmail || '',
        'TPO Number': intern.TpoNumber || '',
        'Applied Date': intern.createdAt ? new Date(intern.createdAt).toLocaleDateString() : '',
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      const colWidths = Array(excelData[0] ? Object.keys(excelData[0]).length : 0).fill({ wch: 15 });
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, "Selected Interns");
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
    // Business Rule 1: can only mark "Selected" if performance is Good or Excellent
    if (newStatus === "Selected" && !(currentPerformance === "Good" || currentPerformance === "Excellent")) {
      setError("⚠️ Cannot mark as Selected. Performance must be Good or Excellent first.");
      setTimeout(() => setError(""), 2000);
      return;
    }

    // Business Rule 2: can only mark "Rejected" if performance is Poor
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
      await fetchInterns();
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
      await fetchInterns();
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
      await fetchInterns();
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
              grid-template-columns: repeat(4, 1fr);
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
            .status-Mailed { background-color: #fef3c7; color: #92400e; }
            .status-Selected { background-color: #dcfce7; color: #166534; }
            .status-Rejected { background-color: #fee2e2; color: #991b1b; }
            .performance-Average { background-color: #fef3c7; color: #92400e; }
            .performance-Good { background-color: #dcfce7; color: #166534; }
            .performance-Excellent { background-color: #e0e7ff; color: #3730a3; }
            .performance-Poor { background-color: #fee2e2; color: #991b1b; }
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
      case "Mailed": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPerformanceColor = (performance) => {
    switch (performance) {
      case "Excellent": return "bg-purple-100 text-purple-800";
      case "Good": return "bg-green-100 text-green-800";
      case "Average": return "bg-yellow-100 text-yellow-800";
      case "Poor": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredInterns = showSelectedOnly
    ? interns.filter(intern => intern.status === "Selected")
    : interns;

  const selectedCount = interns.filter(intern => intern.status === "Selected").length;
  const appliedCount = interns.filter(intern => intern.status === "Applied").length;
  const mailedCount = interns.filter(intern => intern.status === "Mailed").length;

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
                  <p className="text-blue-400 font-bold sm:text-lg text-sm">👋 Hi {storedUser?.fullName}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {/* Send Interview Emails Button */}
              <button
                onClick={openEmailModal}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg no-print flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Send Interview Mails ({appliedCount})
              </button>

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
                  className={`px-6 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg no-print flex items-center gap-2 ${exportLoading ? 'opacity-50 cursor-not-allowed' : 'hover:from-purple-600 hover:to-purple-700'
                    }`}
                >
                  <Download className="w-4 h-4" />
                  Export Selected ({selectedCount})
                </button>
              )}

              <button
                onClick={handlePrint}
                className="px-6 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg no-print"
              >
                🖨️ Print Report
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

        {/* Success Message */}
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
              <div className="mt-6 grid grid-cols-2 md:grid-cols-8 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{interns.length}</div>
                  <div className="text-sm text-blue-800">Total Interns</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{appliedCount}</div>
                  <div className="text-sm text-yellow-800">Applied</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">{mailedCount}</div>
                  <div className="text-sm text-orange-800">Mailed</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{selectedCount}</div>
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
                <div className="bg-indigo-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-indigo-600">
                    {interns.filter(i => i.performance === 'Good').length}
                  </div>
                  <div className="text-sm text-indigo-800">Good</div>
                </div>
                <div
                  className="bg-teal-50 rounded-lg p-4 text-center cursor-pointer hover:bg-teal-100 transition-colors border-2 border-teal-200"
                  onClick={() => setShowEmailCopy(!showEmailCopy)}
                >
                  <div className="text-2xl font-bold text-teal-600">
                    📧
                  </div>
                  <div className="text-sm text-teal-800">Email Tools</div>
                </div>
              </div>
            )}

            {/* Email Tools Panel */}
            {showEmailCopy && selectedCount > 0 && (
              <div className="mt-4 bg-teal-50 rounded-xl p-4 border border-teal-200">
                <h3 className="text-lg font-semibold text-teal-800 mb-3 flex items-center gap-2">
                  📧 Email Selected Interns ({selectedCount})
                </h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={copySelectedEmails}
                    className="px-4 py-2 bg-white text-teal-700 border border-teal-300 rounded-lg hover:bg-teal-50 transition-colors font-medium flex items-center gap-2"
                  >
                    📋 Copy All Emails
                  </button>
                  <button
                    onClick={openEmailClient}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium flex items-center gap-2"
                  >
                    ✉️ Open Email Client
                  </button>
                  <div className="flex-1 bg-white rounded-lg px-3 py-2 border border-teal-200 text-sm text-gray-600 flex items-center">
                    <span className="truncate">{getSelectedInternsEmails()}</span>
                  </div>
                </div>
              </div>
            )}

            <h2 className="text-xl mt-4 font-semibold text-gray-800 mb-4">Filters & Search</h2>
            <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
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
                <option value="Mailed">Mailed</option>
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
                <option value="Poor">Poor</option>
              </select>

              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                <option value="">All Domains</option>
                <option value="Data Science & Analytics">Data Science & Analytics</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Social Media Management">Social Media Management</option>
                <option value="Graphic Design">Graphic Design</option>
                <option value="Digital Marketing">Digital Marketing</option>
                <option value="Video Editing">Video Editing</option>
                <option value="Full Stack Development">Full Stack Development</option>
                <option value="MERN Stack Development">MERN Stack Development</option>
                <option value="Content Writing">Content Writing</option>
                <option value="Content Creator">Content Creator</option>
                <option value="UI/UX Designing">UI/UX Designing</option>
                <option value="Front-end Developer">Front-end Developer</option>
                <option value="Back-end Developer">Back-end Developer</option>
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

              <button
                onClick={() => {
                  setSearch("");
                  setStatus("");
                  setPerformance("");
                  setSelectedDomain("");
                }}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium border border-gray-300"
              >
                Clear Filters
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
                    <th className="p-4 text-left font-semibold">Contact Info/Apply Date</th>
                    <th className="p-4 text-left font-semibold">Domain & Duration</th>
                    <th className="p-4 text-left font-semibold">College Info</th>
                    <th className="p-4 text-left font-semibold">Status</th>
                    <th className="p-4 text-left font-semibold">Performance</th>
                    <th className="p-4 text-left font-semibold">TPO Name</th>
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
                            <p className="text-xs font-bold">
                              Applied: {intern.createdAt ? new Date(intern.createdAt).toLocaleDateString() : "Not provided"}
                            </p>
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

                        {/* College */}
                        <td className="p-2 md:p-3">
                          <div className="min-h-[36px] flex items-center">
                            <div className="truncate-text-2-lines max-w-full">
                              <span className={`text-xs md:text-sm ${intern.college ? "text-gray-600" : "text-gray-400 italic"
                                } transition-colors duration-100`}>
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
                            <option value="Mailed">Mailed</option>
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
                            <option value="Poor">Poor</option>
                          </select>
                          {isLocked && (
                            <div className="text-xs text-yellow-600 mt-1 no-print">
                              🔒 Cannot update
                            </div>
                          )}
                        </td>

                        {/* TPO Name */}
                        <td className="p-4">
                          {intern.TpoName || "—"}
                        </td>

                        {/* Domain Update */}
                        <td className="p-3">
                          <div className="print-only">
                            <span>{intern.domain}</span>
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
                              className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium text-xs"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {intern.resumeUrl && (
                              <a
                                href={intern.resumeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 font-medium text-xs"
                                title="View Resume"
                              >
                                <FileText className="w-4 h-4" />
                              </a>
                            )}
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

      {/* Send Interview Emails Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 backdrop-blur-sm  bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Send Interview Emails</h2>
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  setSelectedInterns([]);
                  setSelectAll(false);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {/* Intern Selection Table */}
              {/* Intern Selection Table with Filters */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Select Interns to Email ({getFilteredEmailInterns().filter(i => i.selected).length} selected of {selectedInterns.length} total)
                </h3>

                {/* Filter Controls */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search by name, email, domain, college..."
                        value={emailSearchTerm}
                        onChange={(e) => setEmailSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    {/* Domain Filter Dropdown */}
                    <select
                      value={emailDomainFilter}
                      onChange={(e) => setEmailDomainFilter(e.target.value)}
                      className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                    >
                      <option value="">All Domains</option>
                      {getUniqueDomains().map(domain => (
                        <option key={domain} value={domain}>{domain}</option>
                      ))}
                    </select>

                    {/* College Filter Input */}
                    <input
                      type="text"
                      placeholder="Filter by college..."
                      value={emailCollegeFilter}
                      onChange={(e) => setEmailCollegeFilter(e.target.value)}
                      className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  {/* Date Filter Section */}
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setShowDateRange(!showDateRange)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${showDateRange
                        ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                      <Calendar className="w-4 h-4" />
                      {showDateRange ? 'Date Range' : 'Single Date'}
                    </button>

                    {!showDateRange ? (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <input
                          type="date"
                          value={emailDateFilter}
                          onChange={(e) => setEmailDateFilter(e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={emailDateRange.from}
                          onChange={(e) => setEmailDateRange({ ...emailDateRange, from: e.target.value })}
                          className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="From"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                          type="date"
                          value={emailDateRange.to}
                          onChange={(e) => setEmailDateRange({ ...emailDateRange, to: e.target.value })}
                          className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="To"
                        />
                      </div>
                    )}

                    {/* Clear Filters Button */}
                    {(emailSearchTerm || emailDomainFilter || emailCollegeFilter || emailDateFilter || emailDateRange.from || emailDateRange.to) && (
                      <button
                        onClick={() => {
                          setEmailSearchTerm("");
                          setEmailDomainFilter("");
                          setEmailCollegeFilter("");
                          setEmailDateFilter("");
                          setEmailDateRange({ from: "", to: "" });
                          setShowDateRange(false);
                        }}
                        className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>

                  {/* Filter Stats */}
                  <div className="text-sm text-gray-600">
                    Showing {getFilteredEmailInterns().length} of {selectedInterns.length} interns
                  </div>
                </div>

                {/* Intern Table */}
                <div className="border border-gray-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="p-3 text-left">
                          <input
                            type="checkbox"
                            checked={getFilteredEmailInterns().every(i => i.selected) && getFilteredEmailInterns().length > 0}
                            onChange={() => {
                              const filteredInterns = getFilteredEmailInterns();
                              const allSelected = filteredInterns.every(i => i.selected);

                              setSelectedInterns(prev =>
                                prev.map(intern => {
                                  if (filteredInterns.some(fi => fi._id === intern._id)) {
                                    return { ...intern, selected: !allSelected };
                                  }
                                  return intern;
                                })
                              );

                              setSelectAll(!allSelected);
                            }}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </th>
                        <th className="p-3 text-left font-semibold text-gray-700">Name</th>
                        <th className="p-3 text-left font-semibold text-gray-700">Email</th>
                        <th className="p-3 text-left font-semibold text-gray-700">Domain</th>
                        <th className="p-3 text-left font-semibold text-gray-700">College</th>
                        <th className="p-3 text-left font-semibold text-gray-700">Applied Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {getFilteredEmailInterns().map((intern) => (
                        <tr key={intern._id} className="hover:bg-gray-50">
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={intern.selected}
                              onChange={() => handleSelectIntern(intern._id)}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="p-3 font-medium">{intern.fullName}</td>
                          <td className="p-3 text-gray-600">{intern.email}</td>
                          <td className="p-3">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              {intern.domain || 'N/A'}
                            </span>
                          </td>
                          <td className="p-3 text-gray-600">{intern.college || '-'}</td>
                          <td className="p-3 text-gray-600">
                            {intern.createdAt
                              ? new Date(intern.createdAt).toLocaleDateString("en-IN", {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })
                              : "-"}
                          </td>
                        </tr>
                      ))}

                      {getFilteredEmailInterns().length === 0 && (
                        <tr>
                          <td colSpan="6" className="p-8 text-center text-gray-500">
                            No interns match your filters
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Email Form */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Email Details
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={emailForm.subject}
                    onChange={handleEmailFormChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meeting Link <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      name="meetingLink"
                      value={emailForm.meetingLink}
                      onChange={handleEmailFormChange}
                      placeholder="https://meet.google.com/xxx-xxxx-xxx"
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <select
                      name="meetingPlatform"
                      value={emailForm.meetingPlatform}
                      onChange={handleEmailFormChange}
                      className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                    >
                      <option value="Google Meet">Google Meet</option>
                      <option value="Zoom">Zoom</option>
                      <option value="Microsoft Teams">Microsoft Teams</option>
                      <option value="Skype">Skype</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meeting Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="meetingDate"
                      value={emailForm.meetingDate}
                      onChange={handleEmailFormChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meeting Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      name="meetingTime"
                      value={emailForm.meetingTime}
                      onChange={handleEmailFormChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Message (Optional)
                  </label>
                  <textarea
                    name="customMessage"
                    value={emailForm.customMessage}
                    onChange={handleEmailFormChange}
                    rows="4"
                    placeholder="Add any additional instructions or message for the candidates..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      HR Name
                    </label>
                    <input
                      type="text"
                      name="hrName"
                      value={emailForm.hrName}
                      onChange={handleEmailFormChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      HR Email
                    </label>
                    <input
                      type="email"
                      name="hrEmail"
                      value={emailForm.hrEmail}
                      onChange={handleEmailFormChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Email Preview */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Preview
                  </h4>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 text-sm">
                    <p><strong>Subject:</strong> {emailForm.subject}</p>
                    <hr className="my-2" />
                    <p>Dear [Intern Name],</p>
                    <br />
                    <p>Great news! We've reviewed your application for the internship program at <strong>Athenura</strong> and would love to move forward with an interview to get to know you better</p>
                    <br />
                    <p><strong>Interview Details:</strong></p>
                    <p>📅 <strong>Domain:</strong> {emailForm.domain || '[Domain]'}</p>
                    <p>📅 <strong>Date:</strong> {emailForm.meetingDate || '[Date not set]'}</p>
                    <p>
                      ⏰ <strong>Time:</strong>
                      {emailForm.meetingTime ? formatTimeToAMPM(emailForm.meetingTime) : '[Time not set]'}
                    </p>
                    <p>💻 <strong>Platform:</strong> {emailForm.meetingPlatform}</p>
                    <p>🔗 <strong>Meeting Link:</strong> {emailForm.meetingLink || '[Link not set]'}</p>
                    <br />
                    {emailForm.customMessage && (
                      <>
                        <p>{emailForm.customMessage}</p>
                        <br />
                      </>
                    )}
                    <br />
                    <p>Best regards,</p>
                    <p><strong>{emailForm.hrName}</strong></p>
                    <p>HR Team</p>
                    <p>Athenura</p>
                    <p>{emailForm.hrEmail}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={sendInterviewEmails}
                  disabled={emailLoading || selectedInterns.filter(i => i.selected).length === 0}
                  className={`flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${emailLoading || selectedInterns.filter(i => i.selected).length === 0
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-indigo-700'
                    }`}
                >
                  {emailLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending Emails...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send to {selectedInterns.filter(i => i.selected).length} Intern(s)
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowEmailModal(false);
                    setSelectedInterns([]);
                    setSelectAll(false);
                  }}
                  className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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