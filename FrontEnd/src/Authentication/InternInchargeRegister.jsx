import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import Athenura from "../../public/loginPNG.webp"

const TeamMemberRegister = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        mobile: "",
        department: "", // Single department for Intern Incharge
        gender: "",
        address: "",
        city: "",
        state: "",
        pinCode: "",
        Secret_Key: "", // Secret Key field
        role: "InternIncharge" // Default role
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const departments = [
        "Sales & Marketing",
        "Data Science & Analytics",
        "Human Resources",
        "Social Media Management",
        "Graphic Design",
        "Digital Marketing",
        "Video Editing",
        "Full Stack Development",
        "MERN Stack Development",
        "Email and Outreaching",
        "Content Creator",
        "Content Writing",
        "UI/UX Designing",
        "Front-end Developer",
        "Back-end Developer"
    ];

    const roles = [
        { value: "InternIncharge", label: "Intern Incharge" },
        { value: "ReviewTeam", label: "Review Team Member" }
    ];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError("");
    };

    const validateForm = () => {
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return false;
        }
        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters long");
            return false;
        }
        if (!formData.mobile.match(/^[0-9]{10}$/)) {
            setError("Please enter a valid 10-digit mobile number");
            return false;
        }
        if (formData.pinCode && !formData.pinCode.match(/^[1-9][0-9]{5}$/)) {
            setError("Please enter a valid 6-digit pin code");
            return false;
        }
        
        // Department validation only for Intern Incharge
        if (formData.role === "InternIncharge" && !formData.department) {
            setError("Please select a department");
            return false;
        }
        
        if (!formData.Secret_Key) {
            setError("Secret Key is required");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (!validateForm()) {
            setLoading(false);
            return;
        }

        try {
            let submitData;
            let endpoint;

            if (formData.role === "InternIncharge") {
                // Intern Incharge registration
                endpoint = "/api/intern-incharge/register";
                submitData = {
                    ...formData,
                    department: [formData.department] // Convert to array for backend
                };
            } else {
                // Review Team registration
                endpoint = "/api/review-team/register";
                // Remove department for Review Team
                const { ...reviewTeamData } = formData;
                submitData = reviewTeamData;
            }

            const response = await axios.post(
                endpoint,
                submitData,
                {
                    headers: { "Content-Type": "application/json" },
                }
            );

            if (response.status === 201) {
                setSuccess(true);
                setTimeout(() => {
                    // Redirect to appropriate login based on role
                    const loginPath = formData.role === "InternIncharge" 
                        ? "/intern-incharge-login" 
                        : "/review-team-login";
                    navigate(loginPath);
                }, 2000);
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Registration failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex sm:flex-row flex-col items-center justify-around bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-8">

            <img
                src={Athenura}
                alt="Login Illustration"
                className="w-1/3 h-full object-cover rounded-3xl shadow-lg"
            />

            <div className="bg-white/80 backdrop-blur-lg shadow-xl rounded-3xl p-6 sm:p-8 w-full max-w-2xl">
                <div className="text-center mb-8">
                    <h2 className="text-3xl sm:text-4xl font-bold text-indigo-700 mb-2">
                        Register as Team Member
                    </h2>
                    <p className="text-gray-600 text-sm">
                        Create your account to manage interns or review applications
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm">
                        Registration successful! Redirecting to login...
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Role Selection */}
                        <div className="md:col-span-2">
                            <label className="block text-gray-700 font-semibold mb-2 text-sm">
                                Register As *
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                {roles.map((role) => (
                                    <label
                                        key={role.value}
                                        className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition duration-200 ${
                                            formData.role === role.value
                                                ? "border-indigo-500 bg-indigo-50"
                                                : "border-gray-300 bg-gray-50 hover:border-indigo-300"
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="role"
                                            value={role.value}
                                            checked={formData.role === role.value}
                                            onChange={handleChange}
                                            className="sr-only"
                                            disabled={loading}
                                        />
                                        <div className={`w-4 h-4 border-2 rounded-full mr-3 flex items-center justify-center ${
                                            formData.role === role.value
                                                ? "border-indigo-500"
                                                : "border-gray-400"
                                        }`}>
                                            {formData.role === role.value && (
                                                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                            )}
                                        </div>
                                        <span className="font-medium text-gray-700">
                                            {role.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Full Name */}
                        <div>
                            <label className="block text-gray-700 font-semibold mb-2 text-sm">
                                Full Name *
                            </label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                placeholder="Enter your full name"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition duration-200 bg-gray-50"
                                required
                                disabled={loading}
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-gray-700 font-semibold mb-2 text-sm">
                                Email Address *
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter your email"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition duration-200 bg-gray-50"
                                required
                                disabled={loading}
                            />
                        </div>

                        {/* Mobile */}
                        <div>
                            <label className="block text-gray-700 font-semibold mb-2 text-sm">
                                Mobile Number *
                            </label>
                            <input
                                type="tel"
                                name="mobile"
                                value={formData.mobile}
                                onChange={handleChange}
                                placeholder="10-digit mobile number"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition duration-200 bg-gray-50"
                                required
                                disabled={loading}
                            />
                        </div>

                        {/* Department - Only for Intern Incharge */}
                        {formData.role === "InternIncharge" && (
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2 text-sm">
                                    Department *
                                </label>
                                <select
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition duration-200 bg-gray-50"
                                    required={formData.role === "InternIncharge"}
                                    disabled={loading}
                                >
                                    <option value="">Select Department</option>
                                    {departments.map((dept) => (
                                        <option key={dept} value={dept}>
                                            {dept}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    You can be assigned more departments by admin later
                                </p>
                            </div>
                        )}

                        {/* Gender */}
                        <div className={formData.role === "ReviewTeam" ? "md:col-span-2" : ""}>
                            <label className="block text-gray-700 font-semibold mb-2 text-sm">
                                Gender *
                            </label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition duration-200 bg-gray-50"
                                required
                                disabled={loading}
                            >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-gray-700 font-semibold mb-2 text-sm">
                                Password *
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter password"
                                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition duration-200 bg-gray-50"
                                    required
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3 text-gray-500 hover:text-indigo-600"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-gray-700 font-semibold mb-2 text-sm">
                                Confirm Password *
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Confirm your password"
                                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition duration-200 bg-gray-50"
                                    required
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-3 text-gray-500 hover:text-indigo-600"
                                >
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Secret Key */}
                        <div>
                            <label className="block text-gray-700 font-semibold mb-2 text-sm">
                                Secret Key *
                            </label>
                            <input
                                type="text"
                                name="Secret_Key"
                                value={formData.Secret_Key}
                                onChange={handleChange}
                                placeholder="Enter secret key"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition duration-200 bg-gray-50"
                                required
                                disabled={loading}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Contact admin to get your secret key
                            </p>
                        </div>

                        {/* Address */}
                        <div className="md:col-span-2">
                            <label className="block text-gray-700 font-semibold mb-2 text-sm">
                                Address
                            </label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Enter your address"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition duration-200 bg-gray-50"
                                disabled={loading}
                            />
                        </div>

                        {/* City */}
                        <div>
                            <label className="block text-gray-700 font-semibold mb-2 text-sm">
                                City
                            </label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                placeholder="Enter your city"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition duration-200 bg-gray-50"
                                disabled={loading}
                            />
                        </div>

                        {/* State */}
                        <div>
                            <label className="block text-gray-700 font-semibold mb-2 text-sm">
                                State
                            </label>
                            <input
                                type="text"
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                placeholder="Enter your state"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition duration-200 bg-gray-50"
                                disabled={loading}
                            />
                        </div>

                        {/* Pin Code */}
                        <div>
                            <label className="block text-gray-700 font-semibold mb-2 text-sm">
                                Pin Code
                            </label>
                            <input
                                type="text"
                                name="pinCode"
                                value={formData.pinCode}
                                onChange={handleChange}
                                placeholder="6-digit pin code"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition duration-200 bg-gray-50"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition duration-200 transform hover:scale-[1.02] disabled:opacity-50 shadow-lg"
                    >
                        {loading 
                            ? "Registering..." 
                            : `Register as ${formData.role === "InternIncharge" ? "Intern Incharge" : "Review Team Member"}`
                        }
                    </button>
                </form>

                {/* Footer Links */}
                <div className="text-center mt-6 space-y-2">
                    <p className="text-gray-600 text-sm">
                        Already have an account?{" "}
                        <Link
                            to={formData.role === "InternIncharge" ? "/intern-incharge-login" : "/review-team-login"}
                            className="text-indigo-600 font-semibold hover:text-indigo-800 hover:underline transition duration-200"
                        >
                            Login here
                        </Link>
                    </p>
                    <p className="text-gray-600 text-sm">
                        <Link
                            to="/"
                            className="text-gray-500 hover:text-gray-700 transition duration-200"
                        >
                            ← Back to Home
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TeamMemberRegister;