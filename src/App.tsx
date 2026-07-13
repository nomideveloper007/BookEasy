/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { auth, db } from './firebase';
import { AppUser } from './types';

// Import our beautiful modular components
import LandingPage from './components/LandingPage';
import PartnerApplicationPage from './components/PartnerApplicationPage';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import ServicesPage from './components/ServicesPage';
import AvailabilityPage from './components/AvailabilityPage';
import BusinessProfilePage from './components/BusinessProfilePage';
import BookingPage from './components/BookingPage';
import AdminDashboard from './components/AdminDashboard';
import ClientDashboard from './components/ClientDashboard';
import { OwnerBillingView, OwnerTicketsView } from './components/OwnerBillingAndTickets';

// Lucide icons for our gorgeous dashboard sidebar
import { 
  Calendar, 
  Grid, 
  Settings, 
  Clock, 
  Briefcase, 
  LogOut, 
  Menu, 
  X, 
  ExternalLink, 
  Sparkles,
  Loader2,
  Lock,
  CreditCard,
  HelpCircle,
  AlertCircle,
  Mail,
  Eye,
  EyeOff,
  MessageSquare,
  Send
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [businessId, setBusinessId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  // Navigation states
  const [currentView, setCurrentView] = useState<'landing' | 'auth' | 'dashboard' | 'booking-client' | 'admin-dashboard' | 'client-dashboard' | 'partner-application' | 'activate-partner'>('landing');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'services' | 'availability' | 'profile' | 'billing' | 'tickets'>('dashboard');
  const [authPortalType, setAuthPortalType] = useState<'client' | 'partner'>('client');
  
  // Sidebar responsiveness
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Partner activation states
  const [activationAppId, setActivationAppId] = useState<string | null>(null);
  const [activationApp, setActivationApp] = useState<any | null>(null);
  const [activationPassword, setActivationPassword] = useState('');
  const [activationConfirmPassword, setActivationConfirmPassword] = useState('');
  const [activationError, setActivationError] = useState<string | null>(null);
  const [activationLoading, setActivationLoading] = useState(false);
  const [showActivationPassword, setShowActivationPassword] = useState(false);
  const [showActivationConfirmPassword, setShowActivationConfirmPassword] = useState(false);

  // AI Chat states
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'assistant' | 'system', content: string}>>([
    { role: 'assistant', content: 'Hi there! I am your BookEasy AI Assistant. How can I help you list your shop or book a service today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // App URL for link copying
  const appUrl = window.location.origin;

  const getOfflineResponse = (query: string): string => {
    const q = query.toLowerCase();
    
    // Greetings
    if (q === 'hi' || q === 'hello' || q === 'hey' || q.startsWith('hello') || q.startsWith('hi ')) {
      return "Hello! I am the BookEasy Assistant. How can I help you today? You can ask me how to list your business, how clients book services, or about our subscription plans.";
    }

    // Client role / Booking queries
    if (q.includes('client') || q.includes('book') || q.includes('appointment') || q.includes('schedule') || q.includes('time') || q.includes('salon') || q.includes('service') || q.includes('customer')) {
      return "As a client on BookEasy, you can search for local services in Pakistan (like barbers, salons, tailors, clinics, and car detailing) on our landing page. Clicking on a category badge filters providers, allowing you to choose a shop, view their services, pick a convenient time slot, and book instantly. No registration is required to browse, and client account creation is quick and simple!";
    }

    // Partner role / Registration queries
    if (q.includes('partner') || q.includes('business') || q.includes('shop') || q.includes('sell') || q.includes('sign') || q.includes('register') || q.includes('owner') || q.includes('work')) {
      return "For partners/shop owners, BookEasy provides a dedicated 'BookEasy Partner' portal. To join, click 'Become a BookEasy Partner' at the bottom of the auth page or in the landing footer. Fill out the application form with your business details. Once submitted, it goes to the Admin for approval. Upon approval, you will receive an email containing an activation link to set your password and access your dashboard to manage bookings, services, and availability.";
    }

    // Admin dashboard / Approval queries
    if (q.includes('admin') || q.includes('approve') || q.includes('reject') || q.includes('status')) {
      return "Our Admin team reviews all BookEasy Partner applications. Admins can log in using 'admin@bookeasy.com' / 'admin123' to approve or reject pending partner applications and manage the platform.";
    }

    // Pricing queries
    if (q.includes('price') || q.includes('cost') || q.includes('fee') || q.includes('free') || q.includes('tier') || q.includes('rs') || q.includes('pay') || q.includes('charge')) {
      return "BookEasy offers three simple pricing tiers:\n1. Free Tier: Rs. 0/mo (For new partners, up to 20 bookings/mo)\n2. Pro Tier: Rs. 4,000/mo (For growing businesses, unlimited bookings & profile features)\n3. Team Tier: Rs. 9,500/mo (For larger salons/clinics, multiple staff members & advanced calendar settings).";
    }

    // Website overview / About
    if (q.includes('website') || q.includes('about') || q.includes('know') || q.includes('what is') || q.includes('bookeasy') || q.includes('app') || q.includes('weebsite')) {
      return "BookEasy is Pakistan's premium online appointment booking and scheduling platform. It connects clients looking for services (like haircuts, tailoring, dental checks, AC repairs, and detailing) with local certified service providers. Partners get a professional booking website and dashboard, and clients get instant scheduling with zero phone calls.";
    }

    // Categories in Pakistan
    if (q.includes('pakistan') || q.includes('category') || q.includes('categories') || q.includes('service') || q.includes('darzi') || q.includes('tailor') || q.includes('barber')) {
      return "BookEasy Pakistan supports a variety of popular local categories, including:\n• Barber & Salon (haircuts, styling)\n• Tailor & Darzi (men/women apparel tailoring)\n• Clinic & Dentist (health appointments)\n• Car Detailing (car wash and polish)\n• AC & Electrician (home repairs)\n• Home Academy / Tutor\n• Gym & Fitness Trainer.";
    }

    return "I am the BookEasy Assistant! I can help you with listing a shop, booking appointments, category filters, and platform pricing plans. What can I assist you with today?";
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);

    try {
      const messagesPayload = [
        { role: 'system', content: `You are the BookEasy AI Assistant, a helpful virtual assistant for the BookEasy appointment scheduling platform (available in Pakistan).
Your training is strictly limited to helping users navigate the BookEasy website, client appointment bookings, and listing local business profiles.
Guidelines:
1. Only answer questions related to BookEasy (scheduling, barbershops, tailors, AC repair, clinic bookings, etc.). Do NOT answer questions about unrelated topics (e.g. general coding, recipes, other companies). If asked about other topics, politely decline and steer back to BookEasy.
2. NEVER disclose or share confidential or sensitive system/user data, database schemas, client passwords, or private partner records. Protect client/partner privacy at all costs.
3. Keep responses concise, clear, and professional.` },
        ...chatMessages.filter(m => m.role !== 'system'),
        { role: 'user', content: userMessage }
      ];

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4-second timeout limit

      const response = await fetch('https://corsproxy.io/?https://api.atomesus.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer atms_sk_c1bff4b2b7a9eb97d5e64c825cfeea7ebf47ef4819fdf5c5b16d5195e7fd5321'
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'cipher',
          messages: messagesPayload,
          max_tokens: 150,
          temperature: 0.5
        })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API response status: ${response.status}`);
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || getOfflineResponse(userMessage);
      setChatMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      console.warn("AI Chat API connection failed or timed out. Using offline fallback response.", err);
      const reply = getOfflineResponse(userMessage);
      setChatMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    // 1. Check if the URL contains booking parameters (?b=slug or ?cancel=id or ?activate=id)
    const params = new URLSearchParams(window.location.search);
    if (params.get('b') || params.get('cancel')) {
      setCurrentView('booking-client');
      setLoading(false);
      return;
    }

    if (params.get('activate')) {
      setActivationAppId(params.get('activate'));
      setCurrentView('activate-partner');
      setLoading(false);
      return;
    }

    if (params.get('auth') === 'client') {
      setAuthMode('signup');
      setCurrentView('auth');
      setLoading(false);
      return;
    }

    // Check if there is a persistent mock auth session active
    const savedMockUser = localStorage.getItem('bookeasy_mock_user');
    if (savedMockUser) {
      try {
        const mockUser = JSON.parse(savedMockUser);
        if (mockUser.uid && mockUser.uid.startsWith('hardcoded_')) {
          setCurrentUser(mockUser);
          setBusinessId(mockUser.businessId || '');
          setCurrentView(mockUser.role === 'admin' ? 'admin-dashboard' : mockUser.role === 'client' ? 'client-dashboard' : 'dashboard');
          setLoading(false);
          return;
        }
        const loadMockSession = async () => {
          try {
            const userDoc = await getDoc(doc(db, "users", mockUser.uid));
            if (userDoc.exists()) {
              const uData = userDoc.data() as AppUser;
              setCurrentUser(uData);
              setBusinessId(uData.businessId || '');
              
              if (uData.status === 'suspended') {
                // Handled in render blocking screen
              } else if (uData.role === 'admin') {
                setCurrentView('admin-dashboard');
              } else if (uData.role === 'client') {
                setCurrentView('client-dashboard');
              } else {
                setCurrentView('dashboard');
              }
            } else {
              localStorage.removeItem('bookeasy_mock_user');
              setCurrentView('landing');
            }
          } catch (e) {
            setCurrentUser(mockUser);
            setBusinessId(mockUser.businessId || '');
            setCurrentView(mockUser.role === 'admin' ? 'admin-dashboard' : mockUser.role === 'client' ? 'client-dashboard' : 'dashboard');
          }
          setLoading(false);
        };
        loadMockSession();
        return;
      } catch (e) {
        localStorage.removeItem('bookeasy_mock_user');
      }
    }

    // 2. Watch Auth State Changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Check if there is an active mock session first
      const savedMockUser = localStorage.getItem('bookeasy_mock_user');
      if (savedMockUser) {
        try {
          const mockUser = JSON.parse(savedMockUser);
          if (mockUser.isMock) {
            // Keep the mock user session active
            return;
          }
        } catch (e) {
          // ignore parsing error
        }
      }

      if (firebaseUser) {
        const uId = firebaseUser.uid;
        try {
          const userDoc = await getDoc(doc(db, "users", uId));
          if (userDoc.exists()) {
            const uData = userDoc.data() as AppUser;
            setBusinessId(uData.businessId || '');
            setCurrentUser(uData);
            
            if (uData.status === 'suspended') {
              // Blocking screen
            } else if (uData.role === 'admin') {
              setCurrentView('admin-dashboard');
            } else if (uData.role === 'client') {
              setCurrentView('client-dashboard');
            } else {
              setCurrentView('dashboard');
            }
          } else {
            // Document missing, default fallback
            setCurrentUser({
              uid: uId,
              email: firebaseUser.email || '',
              role: 'shop_owner',
              status: 'active',
              createdAt: new Date().toISOString()
            });
            setCurrentView('auth');
            setAuthMode('signup');
          }
        } catch (err) {
          console.error("Error loading user context:", err);
        }
      } else {
        // Logged out
        setCurrentUser(null);
        setBusinessId('');
        if (currentView === 'dashboard' || currentView === 'admin-dashboard' || currentView === 'client-dashboard') {
          setCurrentView('landing');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentView]);

  useEffect(() => {
    if (!activationAppId) return;
    const loadApp = async () => {
      try {
        const docRef = doc(db, "partnerApplications", activationAppId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setActivationApp({ id: docSnap.id, ...docSnap.data() });
        } else {
          setActivationError("Partner application record not found or link has expired.");
        }
      } catch (err) {
        console.error("Failed to load partner application details:", err);
        setActivationError("Could not retrieve application info. Please check Firestore connection.");
      }
    };
    loadApp();
  }, [activationAppId]);

  const handleActivatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activationApp) return;
    if (activationPassword.length < 6) {
      setActivationError("Password must be at least 6 characters.");
      return;
    }
    if (activationPassword !== activationConfirmPassword) {
      setActivationError("Passwords do not match.");
      return;
    }

    setActivationLoading(true);
    setActivationError(null);

    try {
      const mockUid = `mock_owner_${Date.now()}`;
      const safeDocId = activationApp.email.toLowerCase().replace(/[^a-z0-9]/g, '_');
      
      const mockUserData = {
        uid: mockUid,
        email: activationApp.email.toLowerCase(),
        password: activationPassword,
        role: 'shop_owner',
        status: 'active',
        businessId: activationApp.businessId,
        createdAt: new Date().toISOString(),
        isMock: true
      };

      // 1. Write the new shop owner user docs
      await setDoc(doc(db, "users", safeDocId), mockUserData);
      await setDoc(doc(db, "users", mockUid), mockUserData);

      // 2. Link the business ownerUserId
      await updateDoc(doc(db, "businesses", activationApp.businessId), {
        ownerUserId: mockUid
      });

      // 3. Mark the application status as activated
      await updateDoc(doc(db, "partnerApplications", activationApp.id), {
        status: 'activated'
      });

      // 4. Clean parameters and login automatically
      window.history.pushState({}, '', window.location.pathname);
      localStorage.setItem('bookeasy_mock_user', JSON.stringify({
        uid: mockUid,
        email: activationApp.email,
        role: 'shop_owner',
        businessId: activationApp.businessId,
        isMock: true
      }));

      setCurrentUser(mockUserData as any);
      setBusinessId(activationApp.businessId);
      setCurrentView('dashboard');
      
      // Reset states
      setActivationAppId(null);
      setActivationApp(null);
      setActivationPassword('');
      setActivationConfirmPassword('');
    } catch (err: any) {
      console.error("Activation failed:", err);
      setActivationError("Activation failed. Make sure your Firestore settings are active.");
    } finally {
      setActivationLoading(false);
    }
  };

  const handleAuthSuccess = async (uid: string, bId: string) => {
    if (uid === 'partner-application-trigger') {
      setCurrentView('partner-application');
      return;
    }
    // Clean redirect parameters
    window.history.pushState({}, '', window.location.pathname);

    if (uid.startsWith('hardcoded_')) {
      const savedMockUser = localStorage.getItem('bookeasy_mock_user');
      if (savedMockUser) {
        const mockUser = JSON.parse(savedMockUser);
        setCurrentUser(mockUser);
        setBusinessId(mockUser.businessId || '');
        setCurrentView(mockUser.role === 'admin' ? 'admin-dashboard' : mockUser.role === 'client' ? 'client-dashboard' : 'dashboard');
        return;
      }
    }

    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const uData = userDoc.data() as AppUser;
        setBusinessId(uData.businessId || '');
        setCurrentUser(uData);
        
        if (uData.status === 'suspended') {
          // Blocking
        } else if (uData.role === 'admin') {
          setCurrentView('admin-dashboard');
        } else if (uData.role === 'client') {
          setCurrentView('client-dashboard');
        } else {
          setCurrentView('dashboard');
        }
      }
    } catch (err) {
      console.error("Auth success parsing failed:", err);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const renderAIChat = () => {
    return (
      <div className="fixed bottom-6 right-6 z-[9999] font-sans text-xs">
        {/* Toggle Button */}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="bg-indigo-600 text-white p-3.5 rounded-full shadow-2xl hover:bg-indigo-700 transition flex items-center justify-center relative cursor-pointer group border-0 focus:outline-none"
          title="BookEasy AI Assistant"
        >
          <MessageSquare className="w-5 h-5" />
          <span className="absolute right-full mr-3 bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition shadow">
            💬 BookEasy AI Assistant
          </span>
        </button>

        {/* Chat window */}
        {chatOpen && (
          <div className="absolute bottom-16 right-0 w-80 sm:w-96 bg-white border border-slate-200 shadow-2xl rounded-3xl overflow-hidden flex flex-col h-[480px] max-h-[85vh] animate-in slide-in-from-bottom-4 duration-200">
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="font-bold text-xs uppercase tracking-wider">BookEasy AI Assistant</span>
              </div>
              <button 
                onClick={() => setChatOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50 flex flex-col">
              {chatMessages.map((msg, index) => (
                <div 
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 shadow-sm text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none font-medium'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white text-slate-400 border border-slate-200 rounded-2xl rounded-tl-none px-3.5 py-2.5 shadow-sm text-xs flex items-center space-x-1.5 font-semibold">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400 animate-pulse" />
                    <span>AI is composing response...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendChatMessage} className="p-3 border-t border-slate-200 bg-white flex items-center space-x-2 shrink-0">
              <input
                type="text"
                required
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask something about BookEasy..."
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <button
                type="submit"
                disabled={chatLoading}
                className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition disabled:opacity-50 flex items-center justify-center cursor-pointer border-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div id="app-loading-screen" className="min-h-screen bg-neutral-50 flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-950 mx-auto" id="loading-spinner-icon" />
          <p className="text-sm text-neutral-500 font-semibold tracking-tight">Syncing BookEasy secure session...</p>
        </div>
      </div>
    );
  }

  // Active View router selector
  let viewElement;

  if (currentUser && currentUser.status === 'suspended') {
    viewElement = (
      <div id="suspended-account-view" className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-md w-full text-center space-y-4">
          <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl w-fit mx-auto">
            <Lock className="w-8 h-8 text-rose-500 animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Account Suspended</h3>
          <p className="text-sm text-slate-505 leading-relaxed">
            Your BookEasy account ({currentUser.email}) has been suspended by the platform administrator due to a billing issue or violation of terms.
          </p>
          <p className="text-xs text-slate-400">
            Contact platform helpdesk at <strong className="text-slate-600">support@bookeasy.com</strong> to reactivate.
          </p>
          <button
            onClick={async () => {
              localStorage.removeItem('bookeasy_mock_user');
              await signOut(auth);
              setCurrentUser(null);
              setCurrentView('landing');
            }}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition cursor-pointer"
          >
            Log Out
          </button>
        </div>
      </div>
    );
  } else if (currentView === 'activate-partner') {
    viewElement = (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-650">
        <div className="bg-white border border-slate-200 shadow-xl rounded-3xl p-8 max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <span className="text-[9px] font-extrabold text-indigo-600 uppercase tracking-widest bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
              Account Activation
            </span>
            <h2 className="text-2xl font-display font-extrabold text-slate-900">Set Your Password</h2>
            {activationApp ? (
              <p className="text-xs text-slate-400 font-medium">
                Set a password to complete registration for <strong>{activationApp.businessName}</strong>.
              </p>
            ) : (
              <p className="text-xs text-slate-400 font-medium">Retrieving partner application details...</p>
            )}
          </div>

          {activationError && (
            <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-800 text-xs font-bold rounded-2xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{activationError}</span>
            </div>
          )}

          {activationApp && (
            <form onSubmit={handleActivatePartner} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Business Email</label>
                <input 
                  type="email" 
                  disabled
                  value={activationApp.email}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 text-slate-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">New Password</label>
                <div className="relative">
                  <input 
                    type={showActivationPassword ? 'text' : 'password'} 
                    required
                    value={activationPassword}
                    onChange={(e) => setActivationPassword(e.target.value)}
                    placeholder="Min 6 characters" 
                    className="w-full pl-4 pr-10 py-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowActivationPassword(!showActivationPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  >
                    {showActivationPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Confirm Password</label>
                <div className="relative">
                  <input 
                    type={showActivationConfirmPassword ? 'text' : 'password'} 
                    required
                    value={activationConfirmPassword}
                    onChange={(e) => setActivationConfirmPassword(e.target.value)}
                    placeholder="Confirm password" 
                    className="w-full pl-4 pr-10 py-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowActivationConfirmPassword(!showActivationConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  >
                    {showActivationConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={activationLoading}
                className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl text-xs transition shadow-md disabled:opacity-50 cursor-pointer"
              >
                {activationLoading ? 'Activating Profile...' : 'Activate Shop Owner Profile'}
              </button>
            </form>
          )}

          <div className="text-center pt-2">
            <button 
              onClick={() => {
                window.history.pushState({}, '', window.location.pathname);
                setCurrentView('landing');
              }}
              className="text-xs text-indigo-600 hover:underline font-bold"
            >
              Cancel & Return Home
            </button>
          </div>
        </div>
      </div>
    );
  } else if (currentView === 'partner-application') {
    viewElement = (
      <PartnerApplicationPage 
        onBack={() => setCurrentView('landing')}
      />
    );
  } else if (currentView === 'booking-client') {
    viewElement = (
      <BookingPage 
        onNavigateHome={() => {
          window.history.pushState({}, '', window.location.pathname);
          setCurrentView('landing');
        }} 
      />
    );
  } else if (currentView === 'auth') {
    viewElement = (
      <AuthPage 
        initialMode={authMode} 
        onAuthSuccess={handleAuthSuccess}
        onBackToLanding={() => setCurrentView('landing')}
        portalType={authPortalType}
      />
    );
  } else if (currentView === 'admin-dashboard' && currentUser) {
    viewElement = (
      <AdminDashboard 
        adminUser={currentUser} 
        onLogout={async () => {
          localStorage.removeItem('bookeasy_mock_user');
          await signOut(auth);
          setCurrentUser(null);
          setCurrentView('landing');
        }}
      />
    );
  } else if (currentView === 'client-dashboard' && currentUser) {
    viewElement = (
      <ClientDashboard 
        clientUser={currentUser}
        onLogout={async () => {
          localStorage.removeItem('bookeasy_mock_user');
          await signOut(auth);
          setCurrentUser(null);
          setCurrentView('landing');
        }}
      />
    );
  } else if (currentView === 'dashboard' && currentUser) {
    viewElement = (
      <div id="owner-workspace" className="min-h-screen bg-slate-50 flex font-sans text-slate-600">
        
        {/* Desktop Sidebar */}
        <aside id="desktop-sidebar" className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0">
          <div className="p-6 border-b border-slate-100 flex items-center space-x-3">
            <div className="p-2 bg-indigo-600 text-white rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">BookEasy</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-4 mb-2">Workspace</p>
              <nav className="space-y-1">
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <Grid className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>
                <button 
                  onClick={() => setActiveTab('calendar')}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'calendar' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Live Scheduler</span>
                </button>
              </nav>
            </div>

            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-4 mb-2">Management</p>
              <nav className="space-y-1">
                <button 
                  onClick={() => setActiveTab('services')}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'services' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Service Catalog</span>
                </button>
                <button 
                  onClick={() => setActiveTab('availability')}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'availability' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Operating Hours</span>
                </button>
                <button 
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Business Profile</span>
                </button>
                <button 
                  onClick={() => setActiveTab('billing')}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'billing' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Billing Subscription</span>
                </button>
                <button 
                  onClick={() => setActiveTab('tickets')}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'tickets' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Help & Support</span>
                </button>
              </nav>
            </div>
          </div>

          <div className="p-4 border-t border-slate-100">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 flex lg:hidden bg-slate-900/40 backdrop-blur-sm">
            <aside className="w-64 bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-left duration-200">
              <div>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-600 text-white rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <span className="text-xl font-bold text-slate-900 tracking-tight">BookEasy</span>
                  </div>
                  <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <nav className="p-4 space-y-1">
                  <button
                    onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
                    className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <Grid className="w-4 h-4" />
                    <span>Dashboard</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('calendar'); setSidebarOpen(false); }}
                    className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'calendar' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Live Scheduler</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('services'); setSidebarOpen(false); }}
                    className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'services' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>Service Catalog</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('availability'); setSidebarOpen(false); }}
                    className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'availability' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>Operating Hours</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('profile'); setSidebarOpen(false); }}
                    className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Business Profile</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('billing'); setSidebarOpen(false); }}
                    className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'billing' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Billing Subscription</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('tickets'); setSidebarOpen(false); }}
                    className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'tickets' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>Help & Support</span>
                  </button>
                </nav>
              </div>

              <div className="p-4 border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Main Workspace Frame */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-20 bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between lg:justify-end shrink-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center space-x-4">
              <span className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Standard Business Plan</span>
              </span>
              <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center">
                {currentUser.email.charAt(0).toUpperCase()}
              </div>
            </div>
          </header>

          {/* Tab Screen Router view */}
          <main className="flex-1 overflow-y-auto p-6 sm:p-8 max-w-7xl w-full mx-auto">
            {activeTab === 'dashboard' && (
              <Dashboard 
                businessId={businessId} 
                appUrl={appUrl} 
                onNavigateTab={(tab) => setActiveTab(tab)} 
              />
            )}
            {activeTab === 'calendar' && <CalendarView businessId={businessId} />}
            {activeTab === 'services' && <ServicesPage businessId={businessId} />}
            {activeTab === 'availability' && <AvailabilityPage businessId={businessId} />}
            {activeTab === 'profile' && <BusinessProfilePage businessId={businessId} appUrl={appUrl} />}
            {activeTab === 'billing' && <OwnerBillingView businessId={businessId} />}
            {activeTab === 'tickets' && (
              <OwnerTicketsView 
                businessId={businessId} 
                email={currentUser.email} 
                uid={currentUser.uid} 
              />
            )}
          </main>
        </div>

        {/* Custom Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div id="logout-confirm-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-150 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center space-x-3 text-rose-600 bg-rose-50 p-3 rounded-2xl w-fit">
                <LogOut className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Sign Out</h3>
                <p className="text-sm text-slate-505 mt-1 leading-relaxed">
                  Are you sure you want to log out of your BookEasy account? You'll need to log back in to manage bookings.
                </p>
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setShowLogoutConfirm(false);
                    localStorage.removeItem('bookeasy_mock_user');
                    await signOut(auth);
                    setCurrentUser(null);
                    setCurrentView('landing');
                  }}
                  className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold transition shadow-md shadow-rose-100 cursor-pointer"
                >
                  Yes, Log Out
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  } else {
    viewElement = (
      <LandingPage 
        onNavigate={(target: any, portalOrSlug?: string) => {
          if (target === 'login') {
            setAuthMode('login');
            setAuthPortalType(portalOrSlug === 'partner' ? 'partner' : 'client');
            setCurrentView('auth');
          } else if (target === 'signup') {
            setAuthMode('signup');
            setAuthPortalType('client');
            setCurrentView('auth');
          } else if (target === 'partner-application') {
            setCurrentView('partner-application');
          } else if (target === 'booking-demo') {
            window.history.pushState({}, '', `?b=${portalOrSlug || 'glow-hair-studio-nomi'}`);
            setCurrentView('booking-client');
          } else {
            setCurrentView(target as any);
          }
        }} 
      />
    );
  }

  return (
    <>
      {viewElement}
      {renderAIChat()}
    </>
  );
}
