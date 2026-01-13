# 🌟 Intern Management System (IMS)

> A full-featured, role-based **MERN stack enterprise platform** designed to manage the **complete internship lifecycle** — from onboarding and attendance to performance evaluation, certifications, offer letters, and internship extensions — with real-time email communication, secure cloud storage, and scalable architecture.

---

## 🧩 Project Overview

The **Intern Management System (IMS)** is a centralized, production-ready web application built for organizations that manage interns at scale.

It brings together **Admins, HRs, Incharges, Review Teams, and Interns** into a single ecosystem, ensuring:
- Transparency for interns
- Operational efficiency for departments
- Secure and auditable workflows for administrators

IMS automates **attendance tracking, leave approvals, performance feedback, document generation, certification, email notifications, internship verification, and extension handling**, eliminating manual dependency and human errors.

---

## 🚀 Core Modules & Functionalities

---

## 🔐 Authentication & Role-Based Authorization
- Secure authentication for:
  - **Admin**
  - **HR**
  - **Incharge**
  - **Review Team**
  - **Intern**
- **Incharge registration protected by secret key**
- Intern login enabled **only after verification**
- Forgot password with **email OTP & secure reset**
- **JWT-based role authorization** across APIs
- Protected routes based on department & role

---

## 🧭 Incharge Dashboard  
> Department-level operational control

- View interns **department-wise**
- Manage **Active / Inactive interns**
- ✅ **Attendance Management**
  - Daily attendance marking
  - Present / Absent tracking
  - Attendance history per intern
- ✅ **Leave Management System**
  - View intern leave requests
  - **Approve / Reject leaves**
  - Auto-notify interns via email with decision status
- ✅ **Internship Extension**
  - Extend internship end date for valid cases
  - Maintains audit history of extensions
- Strict access control → **No Admin or HR privileges**

---

## 🧾 HR Dashboard  
> Performance evaluation & application review

- Manage intern **application lifecycle**
  - `Applied` → `Selected` → `Rejected`
- Evaluate intern **performance level**
  - `Average`, `Good`, `Excellent`
- Add detailed **HR remarks & feedback**
- Performance marked as **Good / Excellent** forwarded to Admin
- 🔒 Intern records become **locked** after offer generation

---

## 🧠 Review Team Dashboard  
> Feedback verification & certification approval

- View intern **performance feedback**
- Verify and approve:
  - Intern reviews
  - Feedback authenticity
- ✅ **Certificate Approval System**
  - Approve internship certificate requests
  - Certificate generated only after verification
- Certificate data synced with Admin & Intern view

---

## 🛠️ Admin Dashboard  
> Full system authority & lifecycle control

- ✅ Complete **CRUD on intern data**
- Manage **HR, Incharge, and Review Team accounts**
- Assign & update **department access**
- ✅ Generate **Offer Letters (PDF)**
- ✅ Generate **Internship Certificates (PDF)**
- 📧 Offer letter & certificate **automatically emailed**
- Assign:
  - ✅ **Unique Intern ID** (always globally unique)
  - ✅ **Official Joining Date**
- View platform-wide statistics & logs
- System-level governance & control

---

## 🕒 Attendance System
- Fully managed by **Incharge**
- Daily attendance marking
- Auto-linked with intern profile
- Used in:
  - Performance evaluation
  - Verification portal
  - Certification approval

---

## 🪪 Leave Management System
- Leave requests submitted by intern
- Reviewed by **Incharge**
- ✅ Approve / ❌ Reject leaves
- 📩 **Real-time email notification**
- Auto-filter expired leave data
- Leave history permanently stored

---

## ✅ Internship Verification Portal (Intern Side)
- Intern can verify:
  - Internship status
  - Assigned **unique ID**
  - Joining date & duration
  - Attendance records
  - Leave approvals
  - Performance feedback
  - Offer letter & certificate availability
- ✅ Transparency-first design
- ✅ Real-time updates after approval or extension

---

## 📄 Offer Letter & Certificate System
- Auto-generate **PDF Offer Letters**
- Auto-generate **Internship Certificates**
- Certificate issued **only after review team approval**
- 📧 PDFs automatically sent to intern email
- Documents locked after generation to prevent misuse

---

## 📧 Automated Email & Notification Engine
- Real-time email notifications for:
  - Leave approval / rejection
  - Offer letter generation
  - Certificate issuance
  - Internship extension
  - Verification updates
- Uses **professional Athenura-style HTML email templates**
- Secure & reliable email delivery

---

## ☁️ Cloudinary Integration
- All documents & uploads stored securely using **Cloudinary**
- Benefits:
  - ✅ Optimized delivery
  - ✅ Secure access control
  - ✅ High availability
- Used for:
  - Certificates
  - Offer letters
  - Profile assets

---

## 🔒 Advanced Security Architecture
- ✅ Password hashing using **bcrypt**
- ✅ JWT authentication & refresh handling
- ✅ Role & department-based access control
- ✅ Email verification system
- ✅ Record locking after official document generation
- ✅ Secure cloud file storage

---

## 🏗️ Technology Stack

| Layer             | Technology |
|------------------|------------|
| Frontend         | React.js + Tailwind CSS |
| Backend          | Node.js + Express.js |
| Database         | MongoDB |
| Authentication   | JWT + bcrypt |
| Cloud Storage    | Cloudinary |
| Email Service    | Nodemailer |
| PDF Engine       | pdfkit / jsPDF |
| Scheduler        | node-cron |

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/yourusername/intern-management-system.git
```

---

### 2️⃣ Navigate to Project Directory
```bash
cd IMS_team_project
```

---

### 3️⃣ Backend Setup
```bash
cd BackEnd
npm install
```

---

### 4️⃣ Frontend Setup
```bash
cd ../FrontEnd
npm install
```

---

## ▶️ Run the Application

### 🔹 Start Backend Server
```bash
cd BackEnd
npm run dev
```

> ✅ Make sure `nodemon` is installed (or listed in devDependencies)

---

### 🔹 Start Frontend Application
```bash
cd FrontEnd
npm run dev
```

> ✅ For Vite-based React projects  
> If using **Create React App**, use:
```bash
npm start
```

---

## ⚠️ Common Fix for `npm run dev` Error

If backend fails to start, ensure your **package.json** contains:

```json
"scripts": {
  "dev": "nodemon server.js",
  "start": "node server.js"
}
```

Or install nodemon globally:
```bash
npm install -g nodemon
```

---

## ✅ Environment Variables Required (.env)
```env
PORT=5000
MONGO_URI=your_mongo_connection
JWT_SECRET=your_secret_key
EMAIL_USER=your_email
EMAIL_PASS=your_password
CLOUDINARY_CLOUD_NAME=xxxx
CLOUDINARY_API_KEY=xxxx
CLOUDINARY_API_SECRET=xxxx
```

---

✔️ Now both **frontend & backend** will run smoothly  
✔️ README looks **professional and error-free**

---



## 👨‍💼 Roles & Permissions Overview
Role	Access Scope
Admin	Full system control
HR	Performance & application review
Incharge	Attendance, leaves, extensions
Review Team	Feedback & certificate approval
Intern	Verification, documents, progress

## 🧠 Future Enhancements
📊 Advanced analytics dashboard

🔔 In-app notification system

💬 Internal messaging between roles

🤖 AI-based performance insights

## 👨‍💻 Developer
Sameer Singh
🚀 MERN Stack Developer
💡 Designed with real-world workflows, enterprise security, and scalability in mind.

🪪 License
This project is licensed under the MIT License.

 ✨ “A complete digital ecosystem for secure and transparent intern management.” ✨ 