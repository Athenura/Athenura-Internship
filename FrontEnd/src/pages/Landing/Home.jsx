import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ChevronRight, ExternalLink, Users, Briefcase, Award, Globe, Code, Target } from "lucide-react";
import Athenura from "/AthenuraLogo.jpg";

const HomePage = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");

  useEffect(() => {
    setIsVisible(true);
    
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleScroll = () => {
      const sections = ['hero', 'features', 'benefits', 'stats'];
      const current = sections.find(section => {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });
      if (current) setActiveSection(current);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const FeatureCard = ({ icon: Icon, title, description, tags, gradient,  }) => (
    <div
      className={`bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2 group cursor-pointer ${isVisible ? 'animate-fade-in-up' : 'opacity-0'
        }`}
    >
      <div className={`w-14 h-14 ${gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-all duration-300 group-hover:shadow-xl`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <h4 className="font-bold text-gray-900 mb-3 text-lg group-hover:text-indigo-700 transition-colors">{title}</h4>
      <p className="text-gray-600 text-sm leading-relaxed group-hover:text-gray-800 transition-colors">
        {description}
      </p>
      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="bg-white text-gray-700 text-xs px-3 py-1.5 rounded-full border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:bg-gray-50"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );

  const FloatingElement = ({ children, className }) => (
    <div
      className={`absolute hidden md:block ${className} ${isVisible ? 'animate-float' : 'opacity-0'
        }`}
      
    >
      {children}
    </div>
  );

  const MobileMenu = () => (
    <div className={`fixed inset-0 bg-white/95 backdrop-blur-xl z-50 transform transition-all duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center p-6 border-b">
          <img src={Athenura} alt="Athenura Logo" className="h-10" />
          <button onClick={() => setIsMenuOpen(false)} className="p-2">
            <X className="w-6 h-6 text-gray-700" />
          </button>
        </div>
        
        <div className="flex-1 p-6 space-y-6">
          <Link 
            to="/login" 
            className="flex items-center justify-between p-4 rounded-2xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
            onClick={() => setIsMenuOpen(false)}
          >
            <span className="font-semibold">🔑 Login</span>
            <ChevronRight className="w-5 h-5" />
          </Link>
          
          <Link 
            to="/register" 
            className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg transition-all"
            onClick={() => setIsMenuOpen(false)}
          >
            <span className="font-semibold">✨ Register</span>
            <ChevronRight className="w-5 h-5" />
          </Link>
          
          <Link 
            to="/apply" 
            className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
            onClick={() => setIsMenuOpen(false)}
          >
            <span className="font-semibold">🎓 Apply for Internship</span>
            <ChevronRight className="w-5 h-5" />
          </Link>
          
          <Link 
            to="/review-team-login" 
            className="flex items-center justify-between p-4 rounded-2xl bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
            onClick={() => setIsMenuOpen(false)}
          >
            <span className="font-semibold">👥 Review Team Login</span>
            <ChevronRight className="w-5 h-5" />
          </Link>
          
          <Link 
            to="/intern-incharge-login" 
            className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
            onClick={() => setIsMenuOpen(false)}
          >
            <span className="font-semibold">👨‍💼 Intern Incharge Login</span>
            <ChevronRight className="w-5 h-5" />
          </Link>
          
          <Link 
            to="/intern-incharge-register" 
            className="flex items-center justify-between p-4 rounded-2xl bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors"
            onClick={() => setIsMenuOpen(false)}
          >
            <span className="font-semibold">📝 Register as Incharge</span>
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
        
        <div className="p-6 border-t">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Athenura. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );

  const NavItem = ({ to, children, icon: Icon, variant = "default" }) => {
    const baseClasses = "px-4 py-2 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2";
    const variants = {
      default: "text-gray-700 hover:text-indigo-600 hover:bg-indigo-50",
      primary: "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:scale-105",
      outline: "border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white"
    };
    
    return (
      <Link to={to} className={`${baseClasses} ${variants[variant]}`}>
        {Icon && <Icon className="w-4 h-4" />}
        <span>{children}</span>
      </Link>
    );
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      {/* Animated Background Gradient */}
      <div
        className="fixed inset-0 transition-all duration-300 ease-out pointer-events-none"
        style={{
          background: `radial-gradient(800px at ${mousePosition.x}px ${mousePosition.y}px, rgba(99, 102, 241, 0.08), transparent 80%)`
        }}
      />

      {/* Enhanced Background Blobs */}
      <div className="fixed -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-r from-indigo-200 to-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="fixed top-1/3 -right-40 w-[500px] h-[500px] bg-gradient-to-r from-pink-200 to-rose-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="fixed -bottom-40 left-1/3 w-[700px] h-[700px] bg-gradient-to-r from-cyan-200 to-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      {/* Floating Elements */}
      <FloatingElement className="top-32 left-16 text-3xl">🚀</FloatingElement>
      <FloatingElement className="top-48 right-20 text-2xl">💡</FloatingElement>
      <FloatingElement className="bottom-48 left-24 text-2xl">🌟</FloatingElement>
      <FloatingElement className="bottom-32 right-32 text-3xl">🎯</FloatingElement>

      {/* Enhanced Navbar */}
      <nav className="backdrop-blur-xl bg-white/90 border-b border-white/40 flex justify-between items-center px-4 sm:px-6 lg:px-8 py-4 shadow-lg sticky top-0 z-40 transition-all duration-300">
        <div className="flex items-center space-x-3 group cursor-pointer">
          <img
            src={Athenura}
            alt="Athenura Logo"
            className="h-10 lg:h-12 w-auto transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          <div className="flex space-x-2">
            <NavItem to="/login" variant="outline">🔑 Login</NavItem>
            <NavItem to="/register" variant="primary">✨ Register</NavItem>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button 
          onClick={() => setIsMenuOpen(true)}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Menu className="w-6 h-6 text-gray-700" />
        </button>
      </nav>

      {/* Mobile Menu */}
      <MobileMenu />

      {/* Enhanced Hero Section */}
      <main className="flex-1 relative z-10">
        <section id="hero" className="pt-12 sm:pt-20 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Main Heading */}
            <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-gray-900 mb-6 leading-tight">
                Shape Your Future with{" "}
                <span className="block mt-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient-x">
                  Real-World Experience
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-10">
                Join a community of passionate interns and transform your career through hands-on projects, expert mentorship, and meaningful collaboration.
              </p>
            </div>

            {/* Enhanced CTA Buttons */}
            <div className={`flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 mb-16 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <Link
                to="/apply"
                className="group bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl text-lg font-bold shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 text-center relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center space-x-3">
                  <Briefcase className="w-6 h-6" />
                  <span>Apply for Internship</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>

              <Link
                to="/login"
                className="group px-8 py-4 border-2 border-indigo-600 text-indigo-600 rounded-2xl text-lg font-bold hover:bg-indigo-600 hover:text-white transform hover:scale-105 transition-all duration-300 text-center shadow-lg hover:shadow-xl flex items-center justify-center space-x-3"
              >
                <span>🔐</span>
                <span>Login to Dashboard</span>
              </Link>
            </div>

            {/* Role-Based Access Section */}
            <div className={`max-w-4xl mx-auto transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Intern Incharge Section */}
                <div className="bg-gradient-to-br from-emerald-50 to-white p-6 rounded-3xl border border-emerald-100 shadow-xl">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Intern Incharge</h3>
                  </div>
                  <p className="text-gray-600 mb-6">Manage and monitor your team's progress with comprehensive tools.</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      to="/intern-incharge-login"
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300 text-center"
                    >
                      Login
                    </Link>
                    <Link
                      to="/intern-incharge-register"
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300 text-center"
                    >
                      Register
                    </Link>
                  </div>
                </div>

                {/* Review Team Section */}
                <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-3xl border border-blue-100 shadow-xl">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Review Team</h3>
                  </div>
                  <p className="text-gray-600 mb-6">Evaluate intern submissions and provide valuable feedback.</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      to="/review-team-login"
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300 text-center"
                    >
                      Login
                    </Link>
                    <Link
                      to="/intern-incharge-register"
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300 text-center"
                    >
                      Register
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-indigo-50">
          <div className="max-w-7xl mx-auto">
            <div className={`text-center mb-12 transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                Everything You Need for a{" "}
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Successful Internship
                </span>
              </h2>
              <p className="text-gray-600 text-lg max-w-3xl mx-auto">
                Our platform provides all the tools and resources to make your internship journey productive and rewarding.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                icon={Code}
                title="Real Projects"
                description="Work on actual client projects with modern tech stacks and agile methodologies."
                tags={["React", "Node.js", "Python", "ML"]}
                gradient="bg-gradient-to-r from-indigo-500 to-purple-500"
              />
              <FeatureCard
                icon={Users}
                title="Team Collaboration"
                description="Collaborate with peers using integrated tools for seamless teamwork and communication."
                tags={["Slack", "Git", "Jira", "Figma"]}
                gradient="bg-gradient-to-r from-emerald-500 to-green-500"
              />
              <FeatureCard
                icon={Target}
                title="Goal Tracking"
                description="Set and track your learning objectives with personalized milestones and progress analytics."
                tags={["Milestones", "Analytics", "Feedback", "Reviews"]}
                gradient="bg-gradient-to-r from-blue-500 to-cyan-500"
              />
              <FeatureCard
                icon={Briefcase}
                title="Career Resources"
                description="Access exclusive job opportunities, resume reviews, and interview preparation materials."
                tags={["Jobs", "Resume", "Interviews", "Network"]}
                gradient="bg-gradient-to-r from-orange-500 to-red-500"
              />
              <FeatureCard
                icon={Award}
                title="Certification"
                description="Earn verified certificates and badges that showcase your skills to employers."
                tags={["Certificates", "Badges", "Portfolio", "Verification"]}
                gradient="bg-gradient-to-r from-purple-500 to-pink-500"
              />
              <FeatureCard
                icon={Globe}
                title="Global Network"
                description="Connect with interns and professionals worldwide through our community platform."
                tags={["Community", "Events", "Mentors", "Alumni"]}
                gradient="bg-gradient-to-r from-cyan-500 to-blue-500"
              />
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className={`text-center mb-12 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Transformative{" "}
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Learning Experience
                </span>
              </h2>
              <p className="text-gray-600 text-lg max-w-3xl mx-auto">
                Every intern gains valuable skills and experiences that shape their professional journey.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: "💻",
                  title: "Industry-Ready Skills",
                  description: "Master tools and technologies used by top tech companies worldwide.",
                  color: "from-blue-500 to-indigo-500"
                },
                {
                  icon: "👥",
                  title: "Professional Network",
                  description: "Connect with mentors, alumni, and industry experts for guidance.",
                  color: "from-emerald-500 to-green-500"
                },
                {
                  icon: "📈",
                  title: "Career Growth",
                  description: "Receive PPOs, recommendations, and career advancement opportunities.",
                  color: "from-purple-500 to-pink-500"
                },
                {
                  icon: "🎓",
                  title: "Academic Credit",
                  description: "Earn credits and certifications recognized by institutions.",
                  color: "from-orange-500 to-red-500"
                },
                {
                  icon: "💼",
                  title: "Portfolio Projects",
                  description: "Build impressive projects that showcase your capabilities.",
                  color: "from-cyan-500 to-blue-500"
                },
                {
                  icon: "🌟",
                  title: "Personal Development",
                  description: "Develop soft skills, confidence, and professional demeanor.",
                  color: "from-violet-500 to-purple-500"
                }
              ].map((benefit, index) => (
                <div
                  key={index}
                  className={`bg-gradient-to-br ${benefit.color} p-6 rounded-3xl text-white transform transition-all duration-500 hover:scale-105 hover:shadow-2xl`}
                >
                  <div className="text-3xl mb-4">{benefit.icon}</div>
                  <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
                  <p className="text-white/90">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section id="stats" className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              {[
                {
                  number: "1000+",
                  label: "Active Interns",
                  icon: "👥",
                  color: "text-blue-600"
                },
                {
                  number: "200+",
                  label: "Projects Completed",
                  icon: "🚀",
                  color: "text-emerald-600"
                },
                {
                  number: "98%",
                  label: "Satisfaction Rate",
                  icon: "⭐",
                  color: "text-amber-600"
                },
                {
                  number: "50+",
                  label: "Partner Companies",
                  icon: "🏢",
                  color: "text-purple-600"
                }
              ].map((stat, index) => (
                <div
                  key={index}
                  className="bg-white p-6 rounded-3xl border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-2"
                >
                  <div className="text-3xl mb-3">{stat.icon}</div>
                  <div className={`text-3xl font-bold ${stat.color} mb-2`}>{stat.number}</div>
                  <div className="text-gray-700 font-semibold">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

    
      </main>

      {/* Enhanced Footer */}
      <footer className="bg-gradient-to-b from-white to-gray-50 border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <img src={Athenura} alt="Athenura Logo" className="h-10" />
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Athenura
              </span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/login" className="text-gray-600 hover:text-indigo-600 transition-colors">
                🔑 Login
              </Link>
              <Link to="/register" className="text-gray-600 hover:text-indigo-600 transition-colors">
                ✨ Register
              </Link>
              <Link to="/apply" className="text-gray-600 hover:text-indigo-600 transition-colors">
                🎓 Apply
              </Link>
              <Link to="/review-team-login" className="text-gray-600 hover:text-indigo-600 transition-colors">
                👥 Review Team
              </Link>
              <Link to="/intern-incharge-login" className="text-gray-600 hover:text-indigo-600 transition-colors">
                👨‍💼 Incharge Login
              </Link>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-gray-500">
              © {new Date().getFullYear()} Athenura. Empowering the next generation of professionals.
            </p>
            <p className="text-gray-400 text-sm mt-2">
              All links preserved with enhanced UI and mobile-responsive design.
            </p>
          </div>
        </div>
      </footer>

      {/* Custom Animations */}
 
    </div>
  );
};

export default HomePage;