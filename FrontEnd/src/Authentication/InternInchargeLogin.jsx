import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff, Mail, ArrowLeft, RefreshCw } from "lucide-react";
import Athenura from "../../public/loginPNG.webp";

const InternInchargeLogin = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Captcha States
    const [captcha, setCaptcha] = useState("");
    const [userCaptcha, setUserCaptcha] = useState("");

    // Forgot Password States
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [countdown, setCountdown] = useState(0);

    // ✅ Generate random numeric captcha
    const generateCaptcha = () => {
        const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit number
        setCaptcha(randomNum.toString());
        setUserCaptcha(""); // Clear previous input
    };

    // ✅ Initialize captcha on component mount
    useEffect(() => {
        generateCaptcha();
    }, []);

    // ✅ Check if already logged in
    useEffect(() => {
        const checkInternInchargeAuth = async () => {
            try {
                const res = await axios.get("/api/intern-incharge/check-auth", {
                    withCredentials: true,
                });
                if (res.status === 200 && res.data.user) {
                    navigate("/intern-incharge-dashboard");
                }
            } catch (err) {
                console.log("No active session, stay on login.", err);
            }
        };
        checkInternInchargeAuth();
    }, [navigate]);

    // Countdown timer for OTP resend
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // ✅ Handle input change
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError("");
    };

    // ✅ Handle captcha input change
    const handleCaptchaChange = (e) => {
        // Only allow numbers
        const value = e.target.value.replace(/\D/g, '');
        setUserCaptcha(value);
        setError("");
    };

    // ✅ Validate captcha
    const validateCaptcha = () => {
        return userCaptcha === captcha;
    };

    // ✅ Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess(false);

        // Validate captcha first
        if (!validateCaptcha()) {
            setError("Invalid captcha! Please enter the correct numbers.");
            generateCaptcha(); // Generate new captcha on failure
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post(
                "/api/incharge/login",
                formData,
                {
                    headers: { "Content-Type": "application/json" },
                    withCredentials: true,
                }
            );

            if (response.status === 200) {
                setSuccess(true);
                setSuccess("Incharge Login Successfully");
                const { user } = response.data;

                // Save user info locally (optional)
                localStorage.setItem("internIncharge", JSON.stringify(user));

                // Redirect to intern incharge dashboard
                setTimeout(() => {
                    navigate("/intern-incharge-dashboard");
                }, 1000);
            }
        } catch (err) {
            if (err.response?.status === 401) {
                setError("Invalid email or password!");
            } else if (err.response?.status === 403) {
                setError("Account is inactive. Please contact administrator.");
            } else {
                setError("Login failed. Please try again.");
            }
            
            // Generate new captcha on login failure
            generateCaptcha();
        } finally {
            setLoading(false);
        }
    };

    // ✅ Handle Forgot Password - Send OTP
    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setForgotPasswordLoading(true);
        setError("");

        try {
            const response = await axios.post("/api/incharge/forgot-password", {
                email: forgotPasswordEmail,
            });

            if (response.status === 200) {
                setOtpSent(true);
                setCountdown(60); // 60 seconds countdown
                setSuccess("OTP sent to your email!");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to send OTP. Please try again.");
        } finally {
            setForgotPasswordLoading(false);
        }
    };

    // ✅ Verify OTP
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setForgotPasswordLoading(true);
        setError("");

        try {
            const response = await axios.post("/api/incharge/verify-otp", {
                email: forgotPasswordEmail,
                otp: otp
            });

            if (response.status === 200) {
                setOtpVerified(true);
                setSuccess("OTP verified! Please set your new password.");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Invalid OTP. Please try again.");
        } finally {
            setForgotPasswordLoading(false);
        }
    };

    // ✅ Reset Password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setForgotPasswordLoading(true);
        setError("");

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match!");
            setForgotPasswordLoading(false);
            return;
        }

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters long!");
            setForgotPasswordLoading(false);
            return;
        }

        try {
            const response = await axios.post("/api/incharge/reset-password", {
                email: forgotPasswordEmail,
                otp: otp,
                newPassword: newPassword
            });

            if (response.status === 200) {
                setSuccess("Password reset successfully! You can now login with your new password.");
                setTimeout(() => {
                    resetForgotPasswordStates();
                }, 2000);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to reset password. Please try again.");
        } finally {
            setForgotPasswordLoading(false);
        }
    };

    // ✅ Reset forgot password states
    const resetForgotPasswordStates = () => {
        setShowForgotPassword(false);
        setForgotPasswordEmail("");
        setOtp("");
        setNewPassword("");
        setConfirmPassword("");
        setOtpSent(false);
        setOtpVerified(false);
        setCountdown(0);
        setError("");
        setSuccess(false);
    };

    // ✅ Resend OTP
    const handleResendOtp = async () => {
        if (countdown > 0) return;

        setForgotPasswordLoading(true);
        try {
            const response = await axios.post("/api/incharge/resend-otp", {
                email: forgotPasswordEmail
            });

            if (response.status === 200) {
                setCountdown(60);
                setSuccess("OTP resent to your email!");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to resend OTP. Please try again.");
        } finally {
            setForgotPasswordLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex sm:flex-row flex-col items-center justify-around bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-8">
            <img
                src={Athenura}
                alt="Login Illustration"
                className="w-1/3 h-full object-cover rounded-3xl shadow-lg"
            />

            <div className="bg-white/80 backdrop-blur-lg shadow-xl rounded-3xl p-6 sm:p-8 w-full max-w-md">
                {/* Back Button for Forgot Password */}
                {showForgotPassword && (
                    <button
                        onClick={resetForgotPasswordStates}
                        className="flex items-center text-gray-600 hover:text-gray-800 mb-4 transition duration-200"
                    >
                        <ArrowLeft size={20} className="mr-1" />
                        Back to Login
                    </button>
                )}

                <div className="text-center mb-8">
                    <h2 className="text-3xl sm:text-4xl font-bold text-indigo-700 mb-2">
                        {showForgotPassword ? "Reset Password" : "Intern Incharge Login"}
                    </h2>
                    <p className="text-gray-600 text-sm">
                        {showForgotPassword 
                            ? "Enter your email to reset your password" 
                            : "Access your intern management dashboard"
                        }
                    </p>
                </div>

                {/* Error / Success Messages */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm">
                        {success}
                    </div>
                )}

                {/* Forgot Password Flow */}
                {showForgotPassword ? (
                    <div className="space-y-6">
                        {/* Step 1: Email Input */}
                        {!otpSent && (
                            <form onSubmit={handleForgotPassword} className="space-y-6">
                                <div>
                                    <label className="block text-gray-700 font-semibold mb-2 text-sm">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            value={forgotPasswordEmail}
                                            onChange={(e) => setForgotPasswordEmail(e.target.value)}
                                            placeholder="Enter your registered email"
                                            className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition duration-200 bg-gray-50"
                                            required
                                            disabled={forgotPasswordLoading}
                                        />
                                        <Mail size={18} className="absolute left-3 top-3.5 text-gray-400" />
                                    </div>
                                </div>
                                
                                <button
                                    type="submit"
                                    disabled={forgotPasswordLoading}
                                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition duration-200 transform hover:scale-[1.02] disabled:opacity-50 shadow-lg"
                                >
                                    {forgotPasswordLoading ? "Sending OTP..." : "Send OTP"}
                                </button>
                            </form>
                        )}

                        {/* Step 2: OTP Verification */}
                        {otpSent && !otpVerified && (
                            <form onSubmit={handleVerifyOtp} className="space-y-6">
                                <div>
                                    <label className="block text-gray-700 font-semibold mb-2 text-sm">
                                        Enter OTP
                                    </label>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="Enter 6-digit OTP"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition duration-200 bg-gray-50 text-center text-lg font-mono tracking-widest"
                                        required
                                        maxLength={6}
                                        disabled={forgotPasswordLoading}
                                    />
                                    <p className="text-xs text-gray-500 mt-2 text-center">
                                        Check your email for the 6-digit OTP code
                                    </p>
                                </div>

                                <div className="text-center">
                                    <button
                                        type="button"
                                        onClick={handleResendOtp}
                                        disabled={countdown > 0 || forgotPasswordLoading}
                                        className="text-indigo-600 hover:text-indigo-800 text-sm disabled:opacity-50 font-medium"
                                    >
                                        {countdown > 0 ? `Resend OTP in ${countdown}s` : "Resend OTP"}
                                    </button>
                                </div>

                                <button
                                    type="submit"
                                    disabled={forgotPasswordLoading || otp.length !== 6}
                                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition duration-200 transform hover:scale-[1.02] disabled:opacity-50 shadow-lg"
                                >
                                    {forgotPasswordLoading ? "Verifying..." : "Verify OTP"}
                                </button>
                            </form>
                        )}

                        {/* Step 3: New Password */}
                        {otpVerified && (
                            <form onSubmit={handleResetPassword} className="space-y-6">
                                <div>
                                    <label className="block text-gray-700 font-semibold mb-2 text-sm">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new password (min. 6 characters)"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition duration-200 bg-gray-50"
                                        required
                                        minLength={6}
                                        disabled={forgotPasswordLoading}
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-700 font-semibold mb-2 text-sm">
                                        Confirm New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm new password"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition duration-200 bg-gray-50"
                                        required
                                        minLength={6}
                                        disabled={forgotPasswordLoading}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={forgotPasswordLoading}
                                    className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 focus:ring-2 focus:ring-green-500 focus:outline-none transition duration-200 transform hover:scale-[1.02] disabled:opacity-50 shadow-lg"
                                >
                                    {forgotPasswordLoading ? "Resetting..." : "Reset Password"}
                                </button>
                            </form>
                        )}
                    </div>
                ) : (
                    /* Original Login Form */
                    <>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Email */}
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2 text-sm">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="Enter your registered email"
                                        className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition duration-200 bg-gray-50"
                                        required
                                        disabled={loading}
                                    />
                                    <Mail size={18} className="absolute left-3 top-3.5 text-gray-400" />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2 text-sm">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Enter your password"
                                        className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition duration-200 bg-gray-50"
                                        required
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3 text-gray-500 hover:text-indigo-600"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            {/* Captcha Section */}
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2 text-sm">
                                    Security Verification
                                </label>
                                
                                {/* Captcha Display and Refresh */}
                                <div className="flex items-center space-x-3 mb-3">
                                    <div className="flex-1 bg-gradient-to-r from-gray-100 to-gray-200 border-2 border-dashed border-gray-300 rounded-xl p-3 text-center">
                                        <span className="text-2xl font-bold text-gray-800 tracking-widest select-none">
                                            {captcha}
                                        </span>
                                    </div>
                                    
                                    {/* Refresh Button */}
                                    <button
                                        type="button"
                                        onClick={generateCaptcha}
                                        className="p-3 bg-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-200 transition duration-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        title="Refresh Captcha"
                                        disabled={loading}
                                    >
                                        <RefreshCw size={20} />
                                    </button>
                                </div>
                                
                                {/* Captcha Input */}
                                <input
                                    type="text"
                                    value={userCaptcha}
                                    onChange={handleCaptchaChange}
                                    placeholder="Enter the numbers above"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition duration-200 bg-gray-50 text-center text-lg font-mono tracking-widest"
                                    required
                                    maxLength={4}
                                    disabled={loading}
                                />
                                <p className="text-xs text-gray-500 mt-2 text-center">
                                    Enter the 4-digit number shown above
                                </p>
                            </div>

                            {/* Forgot Password Link */}
                            <div className="text-right">
                                <button
                                    type="button"
                                    onClick={() => setShowForgotPassword(true)}
                                    className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold transition duration-200"
                                >
                                    Forgot Password?
                                </button>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-blue-700 focus:ring-2 focus:ring-green-500 focus:outline-none transition duration-200 transform hover:scale-[1.02] disabled:opacity-50 shadow-lg"
                            >
                                {loading ? "Logging in..." : "Login as Intern Incharge"}
                            </button>
                        </form>

                        {/* Footer Links */}
                        <div className="text-center mt-8 space-y-3">
                            <p className="text-gray-600 text-sm">
                                Don't have an account?{" "}
                                <Link
                                    to="/intern-incharge-register"
                                    className="text-indigo-600 font-semibold hover:text-indigo-800 hover:underline transition duration-200"
                                >
                                    Register here
                                </Link>
                            </p>

                            <p className="text-gray-600 text-sm">
                                Are you HR or Admin?{" "}
                                <Link
                                    to="/login"
                                    className="text-purple-600 font-semibold hover:text-purple-800 hover:underline transition duration-200"
                                >
                                    HR/Admin Login
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
                    </>
                )}
            </div>
        </div>
    );
};

export default InternInchargeLogin;