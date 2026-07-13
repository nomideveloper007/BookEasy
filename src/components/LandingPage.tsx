/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  Shield, 
  Smartphone, 
  Bell, 
  DollarSign, 
  ArrowRight, 
  Users, 
  HelpCircle, 
  MessageSquare,
  Sparkles,
  Layers,
  Zap,
  Menu,
  X,
  Search,
  Star,
  MapPin,
  Briefcase,
  Grid,
  ChevronRight,
  Facebook,
  Instagram,
  Twitter,
  Mail,
  Phone,
  ThumbsUp,
  Award,
  TrendingUp,
  Check
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (view: 'landing' | 'login' | 'signup' | 'dashboard' | 'booking-demo' | 'partner-application', slug?: string) => void;
}

const PAKISTANI_CATEGORIES = [
  'All',
  'Barber & Salon',
  'Home Academy & Tutors',
  'Car Mechanic & Detailing',
  'Clinic & Dentist',
  'Tailor & Darzi',
  'Electrician & AC Repair',
  'Fitness & Gym Trainer'
];

const MOCK_SHOPS = [
  {
    id: "biz_nomi_glow",
    name: "Glow Hair Studio",
    slug: "glow-hair-studio-nomi",
    category: "Barber & Salon",
    description: "Premium hair cutting, customized styling, beard grooming, and facial therapies in DHA.",
    address: "DHA Phase 5, Lahore, Pakistan",
    rating: "5.0",
    reviewsCount: 3,
    logoLetter: "G",
    bgGradient: "bg-gradient-to-r from-indigo-600 to-purple-600",
    imageUrl: "/barber_working.png"
  },
  {
    id: "biz_apex_auto",
    name: "Apex Auto Care",
    slug: "apex-auto-nomi",
    category: "Car Mechanic & Detailing",
    description: "High-tech engine tuning, oil change, detailing, and suspension repair workshops.",
    address: "Korangi Industrial Area, Karachi, Pakistan",
    rating: "4.9",
    reviewsCount: 14,
    logoLetter: "A",
    bgGradient: "bg-gradient-to-r from-blue-500 to-teal-500",
    imageUrl: "/mechanic_working.png"
  },
  {
    id: "biz_darzi_royal",
    name: "Royal Darzi & Tailors",
    slug: "royal-darzi-nomi",
    category: "Tailor & Darzi",
    description: "Bespoke stitching for luxury Shalwar Kameez, Waistcoats, Sherwanis, and formal suits.",
    address: "F-10 Markaz, Islamabad, Pakistan",
    rating: "4.8",
    reviewsCount: 19,
    logoLetter: "R",
    bgGradient: "bg-gradient-to-r from-rose-500 to-orange-500",
    imageUrl: "/tailor_working.png"
  },
  {
    id: "biz_tutor_star",
    name: "Al-Noor Home Academy",
    slug: "al-noor-academy-nomi",
    category: "Home Academy & Tutors",
    description: "Professional home tutors for Matric, FSc, O/A Levels, and entry test preparation courses.",
    address: "Gulgasht Colony, Multan, Pakistan",
    rating: "4.9",
    reviewsCount: 7,
    logoLetter: "N",
    bgGradient: "bg-gradient-to-r from-emerald-600 to-teal-600",
    imageUrl: ""
  }
];

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const [landingMode, setLandingMode] = useState<'client' | 'business'>('client');
  const changeLandingMode = (mode: 'client' | 'business') => {
    setLandingMode(mode);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Contact form state
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactName, setContactName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactEmail || !contactMessage) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setContactEmail('');
      setContactName('');
      setContactMessage('');
    }, 3000);
  };

  const filteredShops = MOCK_SHOPS.filter(shop => {
    const matchesSearch = shop.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          shop.category.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          shop.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || shop.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div id="landing-page" className="min-h-screen bg-neutral-50 text-neutral-900 selection:bg-neutral-200 font-sans">
      
      {/* Header navbar */}
      <header id="landing-header" className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-neutral-950 text-white rounded-xl">
              <Calendar className="w-5 h-5" id="nav-logo-icon" />
            </div>
            <span id="brand-name" className="text-xl font-display font-bold tracking-tight text-neutral-955">BookEasy</span>
          </div>

          {/* Desktop Navigation */}
          <nav id="desktop-nav" className="hidden md:flex items-center space-x-8 text-neutral-600 text-sm font-semibold">
            {landingMode === 'client' ? (
              <>
                <a href="#directory" className="hover:text-neutral-955 transition">Find Services</a>
                <a href="#benefits" className="hover:text-neutral-955 transition">Why BookEasy</a>
                <a href="#testimonials" className="hover:text-neutral-955 transition">Testimonials</a>
                <a href="#faq" className="hover:text-neutral-955 transition">FAQs</a>
              </>
            ) : (
              <>
                <a href="#features" className="hover:text-neutral-955 transition">Features</a>
                <a href="#pricing" className="hover:text-neutral-955 transition">Pricing</a>
                <a href="#faq" className="hover:text-neutral-955 transition">FAQ</a>
              </>
            )}
          </nav>

          <div id="nav-actions" className="hidden md:flex items-center space-x-3">
            {/* Business Partner Toggle Button */}
            {landingMode === 'client' ? (
              <button 
                onClick={() => changeLandingMode('business')} 
                className="px-4 py-2 border border-indigo-200 bg-indigo-50/50 text-indigo-700 text-xs font-bold rounded-xl hover:bg-indigo-50 transition shadow-sm flex items-center space-x-1.5 cursor-pointer"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Business Partner</span>
              </button>
            ) : (
              <button 
                onClick={() => changeLandingMode('client')} 
                className="px-4 py-2 border border-emerald-250 bg-emerald-50/50 text-emerald-700 text-xs font-bold rounded-xl hover:bg-emerald-50 transition shadow-sm flex items-center space-x-1.5 cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Client Portal</span>
              </button>
            )}

            <button 
              onClick={() => onNavigate('login', landingMode === 'client' ? 'client' : 'partner')} 
              id="btn-nav-login"
              className="px-3.5 py-2 text-xs font-bold text-neutral-600 hover:text-neutral-900 transition cursor-pointer"
            >
              Log In
            </button>
            <button 
              onClick={() => onNavigate((landingMode === 'client' ? 'signup' : 'partner-application') as any)} 
              id="btn-nav-signup"
              className="px-4 py-2 bg-neutral-900 text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition shadow-sm cursor-pointer"
            >
              Sign Up
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-neutral-600 hover:text-neutral-900 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-neutral-100 p-4 space-y-3 shadow-md animate-in slide-in-from-top duration-150">
            <nav className="flex flex-col space-y-2 text-sm font-semibold text-neutral-600">
              {landingMode === 'client' ? (
                <>
                  <a href="#directory" onClick={() => setMobileMenuOpen(false)} className="py-1">Find Services</a>
                  <a href="#benefits" onClick={() => setMobileMenuOpen(false)} className="py-1">Benefits</a>
                  <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="py-1">Help</a>
                </>
              ) : (
                <>
                  <a href="#features" onClick={() => setMobileMenuOpen(false)} className="py-1">Features</a>
                  <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="py-1">Pricing</a>
                </>
              )}
            </nav>
            <div className="border-t border-neutral-100 pt-3 flex flex-col gap-2">
              {landingMode === 'client' ? (
                <button 
                  onClick={() => { changeLandingMode('business'); setMobileMenuOpen(false); }}
                  className="w-full py-2 border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Business Partner</span>
                </button>
              ) : (
                <button 
                  onClick={() => { changeLandingMode('client'); setMobileMenuOpen(false); }}
                  className="w-full py-2 border border-emerald-250 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Client Portal</span>
                </button>
              )}
              <div className="flex gap-2 w-full pt-1">
                <button onClick={() => { onNavigate('login', landingMode === 'client' ? 'client' : 'partner'); setMobileMenuOpen(false); }} className="flex-1 py-2 text-xs font-bold border border-neutral-200 rounded-xl hover:bg-neutral-50">Log In</button>
                <button onClick={() => { onNavigate((landingMode === 'client' ? 'signup' : 'partner-application') as any); setMobileMenuOpen(false); }} className="flex-1 py-2 text-xs font-bold bg-neutral-900 text-white rounded-xl hover:bg-neutral-850">Sign Up</button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          CLIENT VIEW LANDING PAGE
          ========================================================================= */}
      {landingMode === 'client' ? (
        <div className="animate-in fade-in duration-300">
          
          {/* Split Hero Section */}
          <section className="relative overflow-hidden py-20 lg:py-28 bg-gradient-to-b from-white to-neutral-50 border-b border-neutral-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Left Column: Headline & Search */}
              <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full text-[10px] font-bold text-emerald-700 uppercase tracking-wider mx-auto lg:mx-0">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span>EASY APPOINTMENT SCHEDULER IN PAKISTAN</span>
                </div>

                <h1 className="text-4xl sm:text-6xl font-display font-extrabold tracking-tight text-neutral-950 leading-[1.1]">
                  Book local salons, tailors & mechanics <span className="text-indigo-600">instantly</span>
                </h1>

                <p className="text-base sm:text-lg text-neutral-600 leading-relaxed max-w-2xl font-medium">
                  No more endless calls or WhatsApp chats. Search verified Pakistani service professionals, view pricing packages, and self-book your appointment slots online.
                </p>

                {/* Search Bar inside Hero */}
                <div className="max-w-xl bg-white p-2 rounded-2xl border border-neutral-200 shadow-xl flex items-center gap-2 mx-auto lg:mx-0">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-400" />
                    <input 
                      type="text" 
                      placeholder="Search hair salons, spas, academies, tailors..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 text-sm focus:outline-none bg-white rounded-xl text-neutral-800"
                    />
                  </div>
                  <a 
                    href="#directory"
                    className="px-6 py-3.5 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl flex items-center justify-center shrink-0 transition"
                  >
                    Find Shop
                  </a>
                </div>

                {/* Category Quick Badges */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-2">
                  {PAKISTANI_CATEGORIES.slice(0, 5).map((cat) => {
                    const isActive = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold cursor-pointer transition border uppercase tracking-wider ${isActive ? 'bg-indigo-600 border-indigo-700 text-white shadow-sm shadow-indigo-100' : 'bg-white border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'}`}
                      >
                        {cat === 'All' ? '🔥 All' : cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Hero Visual Showcase */}
              <div className="lg:col-span-5 relative">
                <div className="relative rounded-3xl overflow-hidden border border-neutral-200 bg-white shadow-2xl p-3 animate-in zoom-in duration-300">
                  <img 
                    src="/barber_working.png" 
                    alt="Barber styling hair" 
                    className="w-full h-80 object-cover rounded-2xl" 
                  />
                  <div className="absolute bottom-6 left-6 right-6 bg-slate-900/90 backdrop-blur-md text-white p-4 rounded-2xl space-y-1.5 border border-slate-700/50">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Active Partner Studio</p>
                    <h4 className="font-bold text-sm">Glow Hair Studio — DHA Lahore</h4>
                    <p className="text-xs text-slate-300">1,200+ online client appointments processed this month.</p>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* Quick Statistics Banner */}
          <section className="bg-neutral-900 text-white py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-extrabold text-indigo-400">45,000+</div>
                <div className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider">Completed Bookings</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-extrabold text-indigo-400">150+</div>
                <div className="text-[10px] font-bold text-neutral-455 uppercase tracking-wider">Verified Pakistani Shops</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-extrabold text-indigo-400">98%</div>
                <div className="text-[10px] font-bold text-neutral-460 uppercase tracking-wider">No-Show Reduction</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-extrabold text-indigo-400">Rs. 1.2M+</div>
                <div className="text-[10px] font-bold text-neutral-465 uppercase tracking-wider">Saved in Booking Hours</div>
              </div>
            </div>
          </section>

          {/* Interactive Client Directory Grid */}
          <section id="directory" className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
              <div className="text-center space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600">Explore Directory</h2>
                <h3 className="text-3xl sm:text-4xl font-display font-extrabold text-neutral-950">Featured Pakistani Shops</h3>
                <p className="text-neutral-500 text-sm max-w-lg mx-auto">Filter by categories and click any partner card to view services and book open slots.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredShops.map((shop) => (
                  <div key={shop.id} className="bg-neutral-50 border border-neutral-200/60 rounded-3xl overflow-hidden shadow-sm flex flex-col md:flex-row justify-between hover:shadow-md transition duration-200">
                    
                    {/* Left: Thumbnail image */}
                    {shop.imageUrl ? (
                      <div className="w-full md:w-56 h-56 shrink-0 relative">
                        <img 
                          src={shop.imageUrl} 
                          alt={shop.name} 
                          className="w-full h-full object-cover" 
                        />
                        <span className="absolute top-4 left-4 bg-slate-900/90 text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-slate-700/50">
                          {shop.category}
                        </span>
                      </div>
                    ) : (
                      <div className={`w-full md:w-56 h-56 shrink-0 flex items-center justify-center font-extrabold text-white text-3xl shadow-inner relative ${shop.bgGradient}`}>
                        {shop.logoLetter}
                        <span className="absolute top-4 left-4 bg-slate-900/95 text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                          {shop.category}
                        </span>
                      </div>
                    )}

                    {/* Right: Shop Info details */}
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 justify-between">
                          <h4 className="font-bold text-neutral-900 text-base">{shop.name}</h4>
                          <div className="flex items-center text-amber-500 text-xs font-bold gap-0.5">
                            <Star className="w-3.5 h-3.5 fill-amber-550 text-amber-500" />
                            <span>{shop.rating}</span>
                          </div>
                        </div>
                        <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                          {shop.description}
                        </p>
                      </div>

                      <div className="space-y-3 pt-1">
                        <div className="flex items-center text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                          <MapPin className="w-3.5 h-3.5 mr-1 shrink-0 text-neutral-400" />
                          <span className="truncate">{shop.address}</span>
                        </div>
                        <button
                          onClick={() => onNavigate('booking-demo', shop.slug)}
                          className="w-full py-3 bg-neutral-950 hover:bg-neutral-800 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1 transition shadow-md shadow-neutral-100 cursor-pointer"
                        >
                          <Calendar className="w-4 h-4" />
                          <span>Book Appointment Now</span>
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>

              {filteredShops.length === 0 && (
                <div className="p-12 text-center text-neutral-400 text-sm bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
                  No shops found matching your search. Try changing the categories filter tab!
                </div>
              )}
            </div>
          </section>

          {/* Detailed Features: Why Clients Love BookEasy */}
          <section id="benefits" className="py-20 bg-neutral-50 border-t border-b border-neutral-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
              <div className="text-center space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-650">Why Choose Us</h2>
                <h3 className="text-3xl sm:text-4xl font-display font-extrabold text-neutral-950">Say goodbye to scheduling headaches</h3>
                <p className="text-neutral-500 text-xs max-w-md mx-auto">BookEasy bridges the gap between client convenience and business workspace management.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="bg-white border border-neutral-200/50 p-6 rounded-3xl space-y-3.5 shadow-sm">
                  <div className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl w-fit">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-neutral-900 text-sm">Automated Alerts</h4>
                  <p className="text-neutral-500 text-xs leading-relaxed font-medium">
                    Receive confirmation alerts and instant 24h/1h reminders before booking times via SMS/Email.
                  </p>
                </div>

                <div className="bg-white border border-neutral-200/50 p-6 rounded-3xl space-y-3.5 shadow-sm">
                  <div className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl w-fit">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-neutral-900 text-sm">Reschedule in 1-Click</h4>
                  <p className="text-neutral-500 text-xs leading-relaxed font-medium">
                    Changed plans? Reschedule or cancel appointments directly from the client dashboard in a single click.
                  </p>
                </div>

                <div className="bg-white border border-neutral-200/50 p-6 rounded-3xl space-y-3.5 shadow-sm">
                  <div className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl w-fit">
                    <Users className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-neutral-900 text-sm">Stylist & Staff Choices</h4>
                  <p className="text-neutral-500 text-xs leading-relaxed font-medium">
                    Select your preferred master stylist, tutor coach, or darzi custom tailors when reserving your timings.
                  </p>
                </div>

                <div className="bg-white border border-neutral-200/50 p-6 rounded-3xl space-y-3.5 shadow-sm">
                  <div className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl w-fit">
                    <Shield className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-neutral-900 text-sm">Verified Reviews</h4>
                  <p className="text-neutral-500 text-xs leading-relaxed font-medium">
                    Read genuine, authenticated star feedback left by real clients who have booked that business before.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Testimonials Section */}
          <section id="testimonials" className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
              <div className="text-center space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600">Client Feedback</h2>
                <h3 className="text-3xl font-display font-extrabold text-neutral-950">What our community says</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-8 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-4">
                  <div className="flex text-amber-500 gap-0.5">
                    {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-amber-500 text-amber-500" />)}
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed font-medium italic">
                    "I used to call my salon back and forth on WhatsApp just to get a hair coloring slot. With BookEasy, I book Glow Hair Studio DHA in seconds. The SMS reminder is a lifesaver!"
                  </p>
                  <div>
                    <h5 className="font-bold text-xs text-neutral-900">Zainab Khan</h5>
                    <p className="text-[9px] text-neutral-400 font-bold uppercase mt-0.5">Client • Lahore</p>
                  </div>
                </div>

                <div className="p-8 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-4">
                  <div className="flex text-amber-500 gap-0.5">
                    {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-amber-500 text-amber-500" />)}
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed font-medium italic">
                    "Outstanding convenience. Scheduled my car tuning at Apex Auto Care Karachi. Pushed parameters directly to my Google Calendar. Very clean and fast client dashboard."
                  </p>
                  <div>
                    <h5 className="font-bold text-xs text-neutral-900">Ali Raza</h5>
                    <p className="text-[9px] text-neutral-400 font-bold uppercase mt-0.5">Client • Karachi</p>
                  </div>
                </div>

                <div className="p-8 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-4">
                  <div className="flex text-amber-500 gap-0.5">
                    {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-amber-500 text-amber-500" />)}
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed font-medium italic">
                    "Booked custom sherwani sizing sessions at Royal Darzi in Islamabad. The Darzi profile showed styling reviews and operating hours. Highly recommend BookEasy."
                  </p>
                  <div>
                    <h5 className="font-bold text-xs text-neutral-900">Kamran Ahmed</h5>
                    <p className="text-[9px] text-neutral-400 font-bold uppercase mt-0.5">Client • Islamabad</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : (
        /* =========================================================================
           BUSINESS PARTNER / SAAS PAGE
           ========================================================================= */
        <div className="animate-in fade-in duration-300">
          
          {/* SaaS Split Hero Section */}
          <section className="py-20 lg:py-28 bg-gradient-to-b from-white to-neutral-50 border-b border-neutral-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Left Column: Headline */}
              <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-[10px] font-bold text-indigo-700 uppercase tracking-wider mx-auto lg:mx-0">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>BOOKEASY FOR BUSINESS PARTNERS IN PAKISTAN</span>
                </div>

                <h1 className="text-4xl sm:text-6xl font-display font-extrabold tracking-tight text-neutral-950 leading-[1.1]">
                  Stop losing clients to missed calls & <span className="text-indigo-650">no-shows</span>
                </h1>

                <p className="text-base sm:text-lg text-neutral-600 leading-relaxed max-w-2xl font-medium">
                  Convert your Instagram bio or WhatsApp links into a high-converting self-booking scheduler. Manage schedules, teams, billing, and automated reminders in one unified interface.
                </p>

                <div id="hero-ctas" className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                  <button 
                    onClick={() => onNavigate('partner-application' as any)} 
                    className="w-full sm:w-auto px-8 py-4 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1 cursor-pointer transition shadow-lg shadow-neutral-900/10"
                  >
                    <span>Start Free Trial (Business)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => onNavigate('login', 'partner')} 
                    className="w-full sm:w-auto px-8 py-4 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-800 font-bold rounded-xl text-xs flex items-center justify-center space-x-1 cursor-pointer transition shadow-md"
                  >
                    <span>Partner Log In</span>
                  </button>
                </div>

                <div id="hero-benefits" className="flex items-center justify-center lg:justify-start space-x-6 text-[9px] font-bold text-neutral-400 uppercase tracking-wider pt-2">
                  <span className="flex items-center"><CheckCircle className="w-4 h-4 mr-1 text-emerald-500" /> NO CREDIT CARD</span>
                  <span className="flex items-center"><CheckCircle className="w-4 h-4 mr-1 text-emerald-500" /> SEED DEMO READY</span>
                </div>
              </div>

              {/* Right Column: Visual image of business partner */}
              <div className="lg:col-span-5 relative">
                <div className="relative rounded-3xl overflow-hidden border border-neutral-200 bg-white shadow-2xl p-3 animate-in zoom-in duration-300">
                  <img 
                    src="/tailor_working.png" 
                    alt="Tailor designing clothing" 
                    className="w-full h-80 object-cover rounded-2xl" 
                  />
                  <div className="absolute bottom-6 left-6 right-6 bg-slate-900/90 backdrop-blur-md text-white p-4 rounded-2xl space-y-1 border border-slate-700/50">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Sherwani Tailoring Partner</p>
                    <h4 className="font-bold text-sm">Royal Darzi & Tailors — Islamabad</h4>
                    <p className="text-xs text-slate-300">"Saves me 12 hours of sizing phone calls weekly."</p>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* Interactive UI Mockup */}
          <section className="bg-white py-12 border-b border-neutral-100">
            <div className="max-w-7xl mx-auto px-4">
              <div id="hero-mockup" className="relative rounded-3xl border border-neutral-200 bg-white p-4 shadow-2xl max-w-4xl mx-auto">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-4">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-400"></span>
                    <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                    <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                  </div>
                  <div className="text-xs font-mono text-neutral-400 bg-neutral-50 px-3 py-1 rounded-md">
                    bookeasy.app/glow-studio
                  </div>
                  <div className="w-12"></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left p-2">
                  <div className="md:col-span-1 border-r border-neutral-100 pr-6 space-y-4">
                    <div className="w-14 h-14 bg-neutral-900 text-white rounded-2xl flex items-center justify-center font-bold text-xl">G</div>
                    <div>
                      <h3 className="font-display font-bold text-base text-neutral-900">Glow Hair Studio</h3>
                      <p className="text-[10px] text-neutral-400 font-bold uppercase mt-0.5">Lahore • Barber & Salon</p>
                    </div>
                    <p className="text-xs text-neutral-500 leading-relaxed font-medium">
                      Premium custom hairstyling and beard grooming services.
                    </p>
                  </div>

                  <div className="md:col-span-2 space-y-4">
                    <h4 className="font-bold text-xs text-neutral-400 uppercase tracking-widest">Select a Service</h4>
                    <div className="space-y-2">
                      <div className="p-3 border border-neutral-200 rounded-xl flex items-center justify-between bg-neutral-50/50">
                        <div>
                          <h5 className="font-semibold text-xs text-neutral-900">Signature Haircut & Style</h5>
                          <p className="text-[10px] text-neutral-400 font-bold mt-0.5">45 min • Rs. 1500</p>
                        </div>
                        <button className="px-3 py-1.5 bg-neutral-900 text-white text-[10px] font-bold rounded-lg cursor-default">Select</button>
                      </div>
                      <div className="p-3 border border-neutral-150 rounded-xl flex items-center justify-between">
                        <div>
                          <h5 className="font-semibold text-xs text-neutral-900">Keratin Smoothing Blowout</h5>
                          <p className="text-[10px] text-neutral-400 font-bold mt-0.5">90 min • Rs. 5000</p>
                        </div>
                        <button className="px-3 py-1.5 bg-neutral-100 text-neutral-800 text-[10px] font-bold rounded-lg cursor-default">Select</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features Grid */}
          <section id="features" className="py-20 bg-neutral-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
              <div className="text-center space-y-2">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">Operational Tools</h2>
                <h3 className="text-3xl font-display font-extrabold text-neutral-900">Everything needed to run your salon, academy or tailor shop</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-8 bg-white border border-neutral-200/50 rounded-3xl space-y-4 shadow-sm">
                  <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl w-fit">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-neutral-900 text-lg">No more back-and-forth</h4>
                  <p className="text-neutral-500 text-xs leading-relaxed font-medium">
                    Stop texting open slots manually. Clients review live calendars, book instantly, and automatically update your business calendar.
                  </p>
                </div>

                <div className="p-8 bg-white border border-neutral-200/50 rounded-3xl space-y-4 shadow-sm">
                  <div className="p-3 bg-amber-50 border border-amber-100 text-amber-600 rounded-xl w-fit">
                    <Bell className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-neutral-900 text-lg">Prevent missed bookings</h4>
                  <p className="text-neutral-500 text-xs leading-relaxed font-medium">
                    Auto-send confirmations and 24h reminders before appointments. Reduce no-shows and keep slots booked.
                  </p>
                </div>

                <div className="p-8 bg-white border border-neutral-200/50 rounded-3xl space-y-4 shadow-sm">
                  <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl w-fit">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-neutral-900 text-lg">Tenant Isolation Rules</h4>
                  <p className="text-neutral-500 text-xs leading-relaxed font-medium">
                    Your database (services, bookings, client history) is isolated at the query and Firestore rule level. No client logs leak to other shops.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Pricing Grid */}
          <section id="pricing" className="py-20 bg-white border-t border-neutral-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
              <div className="text-center space-y-2">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">Fair Pricing Plans</h2>
                <h3 className="text-3xl font-display font-extrabold text-neutral-900">Choose the tier that matches your studio scale</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-neutral-50 border border-neutral-200 p-8 rounded-3xl space-y-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-neutral-900 text-lg">Free Tier</h4>
                      <p className="text-xs text-neutral-400 font-medium">For independent darzis, tutors or stylists</p>
                    </div>
                    <div className="text-3xl font-bold text-neutral-950 font-sans">Rs. 0 <span className="text-xs text-neutral-400 font-semibold">/ month</span></div>
                    <ul className="text-xs text-neutral-600 space-y-2.5 pt-4 border-t border-neutral-200/50 font-medium">
                      <li className="flex items-center space-x-2"><CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> <span>Limit 20 bookings / mo</span></li>
                      <li className="flex items-center space-x-2"><CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> <span>1 staff account profile</span></li>
                      <li className="flex items-center space-x-2"><CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> <span>Standard email confirmations</span></li>
                    </ul>
                  </div>
                  <button onClick={() => onNavigate('partner-application' as any)} className="w-full py-3 bg-neutral-900 text-white font-bold rounded-xl text-xs hover:bg-neutral-800 transition">Get Started Free</button>
                </div>

                <div className="bg-white border-2 border-indigo-500 p-8 rounded-3xl space-y-6 flex flex-col justify-between shadow-xl shadow-indigo-100/50 relative">
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 text-white text-[9px] font-bold rounded-full uppercase tracking-widest shadow">Popular Option</span>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-neutral-900 text-lg">Pro Tier</h4>
                      <p className="text-xs text-neutral-400 font-medium">For active tailors, academies & gym trainers</p>
                    </div>
                    <div className="text-3xl font-bold text-neutral-950 font-sans">Rs. 4,000 <span className="text-xs text-neutral-400 font-semibold">/ month</span></div>
                    <ul className="text-xs text-neutral-600 space-y-2.5 pt-4 border-t border-neutral-200/50 font-medium">
                      <li className="flex items-center space-x-2"><CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> <span>Unlimited monthly bookings</span></li>
                      <li className="flex items-center space-x-2"><CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> <span>Automated text notifications</span></li>
                      <li className="flex items-center space-x-2"><CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> <span>Custom cover page selection</span></li>
                    </ul>
                  </div>
                  <button onClick={() => onNavigate('partner-application' as any)} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-indigo-100">Upgrade to Pro</button>
                </div>

                <div className="bg-neutral-50 border border-neutral-200 p-8 rounded-3xl space-y-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-neutral-900 text-lg">Team Tier</h4>
                      <p className="text-xs text-neutral-400 font-medium">For clinics, gyms & larger salons</p>
                    </div>
                    <div className="text-3xl font-bold text-neutral-955 font-sans">Rs. 9,500 <span className="text-xs text-neutral-400 font-semibold">/ month</span></div>
                    <ul className="text-xs text-neutral-600 space-y-2.5 pt-4 border-t border-neutral-200/50 font-medium">
                      <li className="flex items-center space-x-2"><CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> <span>Multi-staff account integrations</span></li>
                      <li className="flex items-center space-x-2"><CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> <span>Deposit payment integrations</span></li>
                      <li className="flex items-center space-x-2"><CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> <span>Advanced analytics metrics</span></li>
                    </ul>
                  </div>
                  <button onClick={() => onNavigate('partner-application' as any)} className="w-full py-3 bg-neutral-900 text-white font-bold rounded-xl text-xs hover:bg-neutral-800 transition">Get Started Team</button>
                </div>
              </div>
            </div>
          </section>

        </div>
      )}

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-neutral-50 border-t border-b border-neutral-200/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">FAQ</h2>
            <h3 className="text-3xl font-display font-extrabold text-neutral-900">Frequently Asked Questions</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-white border border-neutral-200 rounded-2xl space-y-2">
              <h4 className="font-bold text-sm text-neutral-900">Is my customer booking data isolated?</h4>
              <p className="text-xs text-neutral-500 leading-relaxed font-medium">
                Yes. BookEasy implements full multi-tenant tenant isolation. Security validation rules are evaluated at the Firestore level to prevent cross-account reads or writes.
              </p>
            </div>
            <div className="p-6 bg-white border border-neutral-200 rounded-2xl space-y-2">
              <h4 className="font-bold text-sm text-neutral-900">How do clients log in to reschedule?</h4>
              <p className="text-xs text-neutral-500 leading-relaxed font-medium">
                Clients can sign up with their booking credentials directly. Once registered, they get their own dashboard detailing upcoming bookings, past histories, review options, and active help tickets.
              </p>
            </div>
            <div className="p-6 bg-white border border-neutral-200 rounded-2xl space-y-2">
              <h4 className="font-bold text-sm text-neutral-900">Are WhatsApp/SMS notifications supported in Pakistan?</h4>
              <p className="text-xs text-neutral-500 leading-relaxed font-medium">
                Yes, BookEasy supports sending automated appointment scheduling SMS and alerts to clients across all mobile networks in Pakistan (Mobilink, Telenor, Zong, Ufone).
              </p>
            </div>
            <div className="p-6 bg-white border border-neutral-200 rounded-2xl space-y-2">
              <h4 className="font-bold text-sm text-neutral-900">Can I get a custom subdomain links for my shop?</h4>
              <p className="text-xs text-neutral-500 leading-relaxed font-medium">
                Yes, every business partner registers a unique slug booking link (e.g. `bookeasy.app/?b=your-shop-slug`) which can be shared directly in social bio grids or printed cards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Contact support block */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-md mx-auto px-4 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">Support</h2>
            <h3 className="text-2xl font-display font-extrabold text-neutral-900">Need help? Get in touch</h3>
            <p className="text-neutral-500 text-xs font-medium">Send us a message and our support operator queue will reply immediately.</p>
          </div>

          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Your Name</label>
              <input 
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Name"
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Email *</label>
              <input 
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Message *</label>
              <textarea 
                rows={4}
                required
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="What can we help you with?"
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-neutral-955 text-white font-bold rounded-xl text-xs hover:bg-neutral-800 transition cursor-pointer"
            >
              Send Support Message
            </button>
          </form>

          {submitted && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold rounded-xl text-center">
              Message sent! Our support team has logged your ticket and will reply shortly.
            </div>
          )}
        </div>
      </section>

      {/* Expanded Multi-Column Premium Footer */}
      <footer className="bg-neutral-900 text-neutral-400 pt-16 pb-8 border-t border-neutral-800 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10 border-b border-neutral-800 pb-12 mb-8">
          
          {/* Col 1: About */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-white">
              <div className="p-2 bg-white text-neutral-900 rounded-xl">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold tracking-tight">BookEasy</span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed font-medium">
              Simplified online appointment booking & client management platform tailored for service professionals and local shops in Pakistan.
            </p>
            <div className="flex items-center space-x-3 pt-2">
              <a href="https://facebook.com" className="p-2 bg-neutral-800 hover:bg-indigo-650 hover:text-white rounded-lg transition" title="Facebook"><Facebook className="w-4 h-4" /></a>
              <a href="https://instagram.com" className="p-2 bg-neutral-800 hover:bg-indigo-650 hover:text-white rounded-lg transition" title="Instagram"><Instagram className="w-4 h-4" /></a>
              <a href="https://twitter.com" className="p-2 bg-neutral-800 hover:bg-indigo-650 hover:text-white rounded-lg transition" title="Twitter"><Twitter className="w-4 h-4" /></a>
            </div>
          </div>

          {/* Col 2: Categories */}
          <div className="space-y-3.5">
            <h5 className="text-white text-xs font-bold uppercase tracking-widest">Find Services</h5>
            <ul className="text-xs space-y-2.5 font-medium">
              <li><a href="#directory" className="hover:text-white transition">Barber & Hair Salons</a></li>
              <li><a href="#directory" className="hover:text-white transition">Home Tutors & Academy</a></li>
              <li><a href="#directory" className="hover:text-white transition">Car Detailing & Repair</a></li>
              <li><a href="#directory" className="hover:text-white transition">Darzi & Custom Tailoring</a></li>
              <li><a href="#directory" className="hover:text-white transition">Electrician & Plumbers</a></li>
            </ul>
          </div>

          {/* Col 3: For Business Partners */}
          <div className="space-y-3.5">
            <h5 className="text-white text-xs font-bold uppercase tracking-widest">For Partners</h5>
            <ul className="text-xs space-y-2.5 font-medium">
              <li><button onClick={() => changeLandingMode('business')} className="hover:text-white transition text-left">Partner Program</button></li>
              <li><button onClick={() => onNavigate('partner-application' as any)} className="hover:text-white transition text-left">Create Business Page</button></li>
              <li><button onClick={() => onNavigate('login', 'partner')} className="hover:text-white transition text-left">Partner Dashboard</button></li>
              <li><a href="#pricing" className="hover:text-white transition">Subscription Pricing</a></li>
            </ul>
          </div>

          {/* Col 4: Platform Help & Legal */}
          <div className="space-y-3.5">
            <h5 className="text-white text-xs font-bold uppercase tracking-widest">Support & Legal</h5>
            <ul className="text-xs space-y-2.5 font-medium">
              <li><a href="#contact" className="hover:text-white transition">Help Center & Support</a></li>
              <li><a href="#faq" className="hover:text-white transition">Frequently Asked Questions</a></li>
              <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-neutral-500 text-[11px] font-medium gap-4">
          <p>© {new Date().getFullYear()} BookEasy SaaS Platform. All rights reserved.</p>
          <div className="flex space-x-4">
            <span>Powered by secure multi-tenant Firestore cloud.</span>
            <span>Made for Pakistan 🇵🇰</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
