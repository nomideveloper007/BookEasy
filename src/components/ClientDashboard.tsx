/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  addDoc, 
  setDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { AppUser, Booking, SupportTicket, Review, Business } from '../types';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  MessageSquare, 
  User, 
  Phone, 
  Mail, 
  Star, 
  Plus, 
  AlertCircle,
  HelpCircle,
  ChevronRight,
  LogOut,
  Send,
  Building,
  Search
} from 'lucide-react';

const DASHBOARD_CATEGORIES = [
  'All',
  'Barber & Salon',
  'Home Academy & Tutors',
  'Car Mechanic & Detailing',
  'Clinic & Dentist',
  'Tailor & Darzi',
  'Electrician & AC Repair',
  'Fitness & Gym Trainer'
];

interface ClientDashboardProps {
  clientUser: AppUser;
  onLogout: () => void;
}

export default function ClientDashboard({ clientUser, onLogout }: ClientDashboardProps) {
  const [activeTab, setActiveTab] = useState<'appointments' | 'tickets' | 'profile'>('appointments');
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [businesses, setBusinesses] = useState<Record<string, { name: string, slug: string }>>({});
  
  // Search & Browse states
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isBrowsing, setIsBrowsing] = useState(false);
  
  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  
  // Support ticket states
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketReply, setTicketReply] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Profile forms
  const [fullName, setFullName] = useState(clientUser.fullName || '');
  const [phone, setPhone] = useState(clientUser.phone || '');
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [notification, setNotification] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const triggerNotification = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadClientData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Bookings for this Client
      const bookingsQuery = query(collection(db, "bookings"), where("clientUserId", "==", clientUser.uid));
      const bSnap = await getDocs(bookingsQuery);
      const bList: Booking[] = [];
      bSnap.forEach(d => {
        bList.push({ id: d.id, ...d.data() } as Booking);
      });
      // Sort bookings: upcoming first (earliest start time), then past
      bList.sort((a, b) => a.startTime.localeCompare(b.startTime));
      setBookings(bList);

      // 2. Fetch Businesses mapping once
      const bizSnap = await getDocs(collection(db, "businesses"));
      const bizMap: Record<string, { name: string, slug: string }> = {};
      const bizList: Business[] = [];
      bizSnap.forEach(d => {
        const data = d.data();
        bizMap[d.id] = { name: data.name, slug: data.slug };
        bizList.push({ id: d.id, ...data } as Business);
      });
      setBusinesses(bizMap);
      setAllBusinesses(bizList);

      // 3. Fetch Support Tickets raised by this client
      try {
        const ticketsQuery = query(collection(db, "supportTickets"), where("createdByUserId", "==", clientUser.uid));
        const tSnap = await getDocs(ticketsQuery);
        const tList: SupportTicket[] = [];
        tSnap.forEach(d => {
          tList.push({ id: d.id, ...d.data() } as SupportTicket);
        });
        setTickets(tList);
      } catch (ticketErr) {
        console.error("Non-blocking support tickets load failure:", ticketErr);
      }

      // 4. Fetch Reviews submitted by this client
      try {
        const reviewsQuery = query(collection(db, "reviews"), where("clientUserId", "==", clientUser.uid));
        const rSnap = await getDocs(reviewsQuery);
        const rList: Review[] = [];
        rSnap.forEach(d => {
          rList.push({ id: d.id, ...d.data() } as Review);
        });
        setReviews(rList);
      } catch (revErr) {
        console.error("Non-blocking reviews load failure:", revErr);
      }

    } catch (err: any) {
      console.error("Error loading client dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientData();
  }, [clientUser.uid]);

  // Cancel Booking action
  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      await updateDoc(doc(db, "bookings", bookingId), { status: 'cancelled' });
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
      triggerNotification('success', "Appointment cancelled successfully.");
    } catch (err: any) {
      console.error(err);
      triggerNotification('error', "Failed to cancel appointment.");
    }
  };

  // Submit Review Action
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForReview) return;

    try {
      const reviewId = `rev_${Date.now()}`;
      const newReview: Review = {
        id: reviewId,
        businessId: selectedBookingForReview.businessId,
        clientUserId: clientUser.uid,
        clientName: fullName || clientUser.email,
        bookingId: selectedBookingForReview.id,
        rating: reviewRating,
        comment: reviewComment.trim(),
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, "reviews", reviewId), newReview);
      setReviews(prev => [...prev, newReview]);
      
      // Update local booking status (completed bookings keep status but we mark reviewed locally)
      setShowReviewModal(false);
      setSelectedBookingForReview(null);
      setReviewComment('');
      triggerNotification('success', "Thank you! Your review has been saved.");
    } catch (err: any) {
      console.error(err);
      triggerNotification('error', "Failed to save review.");
    }
  };

  // Submit Support Ticket Action
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;

    try {
      const ticketId = `ticket_${Date.now()}`;
      const newTicket: SupportTicket = {
        id: ticketId,
        createdByUserId: clientUser.uid,
        createdByEmail: clientUser.email,
        roleOfCreator: 'client',
        subject: ticketSubject.trim(),
        message: ticketMessage.trim(),
        status: 'open',
        createdAt: new Date().toISOString(),
        responses: []
      };

      await setDoc(doc(db, "supportTickets", ticketId), newTicket);
      setTickets(prev => [newTicket, ...prev]);
      setShowNewTicketForm(false);
      setTicketSubject('');
      setTicketMessage('');
      triggerNotification('success', "Your support ticket has been submitted to the platform operator.");
    } catch (err: any) {
      console.error(err);
      triggerNotification('error', "Failed to submit support ticket.");
    }
  };

  // Submit reply on support ticket
  const handleSubmitTicketReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !ticketReply.trim()) return;

    setSubmittingReply(true);
    try {
      const updatedResponses = selectedTicket.responses || [];
      const newResponse = {
        senderId: clientUser.uid,
        senderEmail: clientUser.email,
        message: ticketReply.trim(),
        createdAt: new Date().toISOString()
      };

      const finalResponses = [...updatedResponses, newResponse];
      await updateDoc(doc(db, "supportTickets", selectedTicket.id), {
        responses: finalResponses,
        status: 'open' // Keep open if customer replies
      });

      const updatedTicketObj = { 
        ...selectedTicket, 
        responses: finalResponses,
        status: 'open' as const
      };

      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? updatedTicketObj : t));
      setSelectedTicket(updatedTicketObj);
      setTicketReply('');
      triggerNotification('success', 'Your follow-up response has been sent.');
    } catch (err: any) {
      console.error(err);
      triggerNotification('error', 'Failed to reply to support ticket.');
    } finally {
      setSubmittingReply(false);
    }
  };

  // Profile Save action
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      await updateDoc(doc(db, "users", clientUser.uid), {
        fullName: fullName.trim(),
        phone: phone.trim()
      });
      setProfileMsg({ type: 'success', text: 'Profile metrics updated successfully.' });
    } catch (err: any) {
      console.error(err);
      setProfileMsg({ type: 'error', text: 'Failed to update profile details.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const todayStr = new Date().toISOString();
  const upcomingBookings = bookings.filter(b => b.startTime >= todayStr && b.status === 'confirmed');
  const pastBookings = bookings.filter(b => b.startTime < todayStr || b.status !== 'confirmed');

  // Filter businesses for search/directory
  const filteredBusinesses = allBusinesses.filter(biz => {
    if (biz.status !== 'active') return false;
    
    const matchesSearch = 
      biz.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (biz.category || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (biz.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCategory = 
      selectedCategory === 'All' || 
      (biz.category || '').toLowerCase() === selectedCategory.toLowerCase() ||
      (selectedCategory === 'Barber & Salon' && (biz.category || '').toLowerCase().includes('barber')) ||
      (selectedCategory === 'Barber & Salon' && (biz.category || '').toLowerCase().includes('salon'));
      
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
          <p className="text-sm text-slate-400">Syncing client portal workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div id="client-dashboard-layout" className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 animate-in fade-in duration-300">
      
      {/* Header */}
      <header className="h-20 bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between shrink-0 shadow-sm z-20">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-neutral-900 text-white rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">BookEasy Client Portal</span>
        </div>

        {/* Center Tabs */}
        <nav className="hidden md:flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition cursor-pointer ${
              activeTab === 'appointments'
                ? 'bg-indigo-950 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            My Appointments
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition cursor-pointer ${
              activeTab === 'tickets'
                ? 'bg-indigo-950 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Support Tickets
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-indigo-950 text-white shadow-sm'
                : 'text-slate-650 hover:bg-slate-200'
            }`}
          >
            Profile Settings
          </button>
        </nav>

        <div className="flex items-center space-x-4">
          <div className="hidden sm:block text-right">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Signed In As</p>
            <p className="text-xs font-bold text-indigo-950">{clientUser.email}</p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center space-x-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 px-3.5 py-2 rounded-xl transition border border-transparent hover:border-rose-100 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Hero Banner Section */}
      <section className="relative bg-indigo-950 text-white py-14 px-6 sm:px-8 overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-55 pointer-events-none"
          style={{ backgroundImage: "url('/premium_salon_bg.png')" }}
        />
        {/* Dark linear gradient overlay to make text pop */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/70 via-slate-900/80 to-indigo-950/90 pointer-events-none" />
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center space-y-4 relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-[10px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>Exclusive Industry Network</span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            BookEasy Premium Services
          </h1>
          <p className="text-xs text-slate-350 max-w-xl mx-auto leading-relaxed">
            Connect with verified local tailors, tutors, salons, and technicians across Pakistan. Manage your appointments, write detailed feedback, and request instant ticket escalations.
          </p>

          {/* Premium Search box */}
          <div className="relative max-w-md mx-auto mt-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim() !== '') {
                  setIsBrowsing(true);
                }
              }}
              onFocus={() => setIsBrowsing(true)}
              placeholder="Search verified businesses or categories..."
              className="w-full px-5 py-3 pl-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-xs text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
            <Search className="absolute left-4.5 top-3.5 w-4 h-4 text-white/50" />
            <button
              onClick={() => setIsBrowsing(true)}
              className="absolute right-2 top-1.5 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-indigo-950 font-bold rounded-xl text-[10px] uppercase tracking-wider opacity-90 transition cursor-pointer"
            >
              Browse
            </button>
          </div>
        </div>
      </section>

      {/* Stat counters row */}
      <section className="bg-white border-b border-slate-200 py-6 px-6 shadow-sm">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="space-y-1">
            <p className="text-2xl font-black text-indigo-950">21+</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Elite Partners</p>
          </div>
          <div className="space-y-1 border-t md:border-t-0 md:border-x border-slate-100 py-3 md:py-0">
            <p className="text-2xl font-black text-indigo-950">5.0 / 5.0</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Average Satisfaction</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-black text-indigo-950">24/7</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Concierge Support</p>
          </div>
        </div>
      </section>

      {/* Main Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 sm:p-8 flex flex-col gap-8">
        
        {/* Mobile Navigation fallback */}
        <div className="md:hidden flex space-x-1 bg-slate-205 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`flex-1 py-2 text-center rounded-lg text-xs font-bold transition ${activeTab === 'appointments' ? 'bg-indigo-950 text-white shadow-sm' : 'text-slate-600'}`}
          >
            Appointments
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`flex-1 py-2 text-center rounded-lg text-xs font-bold transition ${activeTab === 'tickets' ? 'bg-indigo-950 text-white shadow-sm' : 'text-slate-650'}`}
          >
            Support Tickets
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 text-center rounded-lg text-xs font-bold transition ${activeTab === 'profile' ? 'bg-indigo-950 text-white shadow-sm' : 'text-slate-650'}`}
          >
            Profile Settings
          </button>
        </div>

        {notification && (
          <div className={`p-4 rounded-2xl border flex items-center space-x-2 text-sm animate-in fade-in duration-200 ${notification.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'}`}>
            {notification.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-rose-500" />}
            <span>{notification.text}</span>
          </div>
        )}

        {/* Search Results / Directory Section */}
        {(searchQuery.trim() !== '' || isBrowsing) && (
          <div className="space-y-6 animate-in fade-in duration-200 bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-indigo-950 flex items-center space-x-2">
                  <Search className="w-5 h-5 text-amber-500" />
                  <span>{searchQuery.trim() !== '' ? 'Search Results' : 'Browse Verified Businesses'}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Showing matches for verified local service providers in Pakistan
                </p>
              </div>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsBrowsing(false);
                }}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Category Quick Badges */}
            <div className="flex flex-wrap gap-2">
              {DASHBOARD_CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold cursor-pointer transition border uppercase tracking-wider ${
                      isActive
                        ? 'bg-indigo-950 border-indigo-950 text-white shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {cat === 'All' ? '🔥 All' : cat}
                  </button>
                );
              })}
            </div>

            {/* Results Grid */}
            {filteredBusinesses.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-neutral-200">
                No businesses found matching your criteria. Try adjusting your search query or category filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredBusinesses.map((biz) => (
                  <div
                    key={biz.id}
                    className="border border-slate-200/80 bg-slate-50/50 hover:bg-white rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-slate-350 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {biz.category || 'Service Provider'}
                        </span>
                        {biz.status === 'active' && (
                          <span className="flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">Active</span>
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{biz.name}</h3>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                          {biz.description || 'No description provided by the business.'}
                        </p>
                      </div>
                      <div className="text-xs text-slate-600 space-y-1 bg-white border border-slate-100 p-3.5 rounded-2xl">
                        <p className="flex items-center space-x-1.5">
                          <span className="font-bold text-slate-800">📍 Address:</span>
                          <span className="truncate text-slate-650">{biz.address || 'Pakistan'}</span>
                        </p>
                        {biz.contactPhone && (
                          <p className="flex items-center space-x-1.5">
                            <span className="font-bold text-slate-800">📞 Phone:</span>
                            <span className="text-slate-650">{biz.contactPhone}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <a
                        href={`/?b=${biz.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-indigo-950 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition shadow-md shadow-indigo-900/10 cursor-pointer flex items-center space-x-1"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Book Appointment</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: APPOINTMENTS */}
        {activeTab === 'appointments' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            
            {/* Featured Partner spotlight */}
            <div className="bg-indigo-950 text-white rounded-3xl overflow-hidden shadow-xl grid grid-cols-1 lg:grid-cols-12 border border-indigo-900">
              <div className="lg:col-span-5 relative p-8 flex flex-col justify-between min-h-[220px] overflow-hidden">
                {/* Background Image */}
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity"
                  style={{ backgroundImage: "url('/barber_working.png')" }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/80 to-indigo-950/95" />
                
                <div className="relative z-10 flex flex-col h-full justify-between space-y-6">
                  <span className="px-3 py-1 bg-amber-500 text-indigo-950 text-[9px] font-extrabold uppercase tracking-widest rounded-full w-fit">
                    Spotlight Partner
                  </span>
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-amber-400 font-serif">Glow Hair Studio</h3>
                    <p className="text-xs text-slate-350 mt-2 leading-relaxed">
                      Experience premier styling and salon services in DHA Lahore. Book slots with highly skilled tailors, hairdressers, and detailing specialists.
                    </p>
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                    <span>Verified BookEasy Member</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="lg:col-span-7 bg-white text-slate-800 p-8 flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest block mb-1">Featured Professional</span>
                  <h4 className="text-lg font-bold text-slate-900">Glow Hair Studio — DHA Lahore</h4>
                  <div className="flex items-center space-x-1.5 mt-1.5">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-slate-700">(5.0 Rating)</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                    Professional hair dressing, conditioning, coloring, and styling service customized to your aesthetics. Unbiased standards, premium salon environment, and verified booking slots.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <a
                    href="/?b=glow-hair-studio-nomi"
                    target="_blank"
                    className="px-4 py-2 bg-indigo-950 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-900/10 cursor-pointer"
                  >
                    View Full Profile
                  </a>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">DHA Lahore, Pakistan</span>
                </div>
              </div>
            </div>

            {/* Upcoming Schedule */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-indigo-950 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-amber-500" />
                <span>Upcoming Schedule</span>
              </h2>

              {upcomingBookings.length === 0 ? (
                <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl text-slate-400 text-xs shadow-sm">
                  No upcoming appointments booked. Use your business booking links to schedule one!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {upcomingBookings.map((b) => {
                    const biz = businesses[b.businessId] || { name: 'Glow Studio', slug: 'glow' };
                    const startTimeLocal = new Date(b.startTime);
                    return (
                      <div key={b.id} className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all relative overflow-hidden">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                              {b.status}
                            </span>
                            <span className="text-xs font-extrabold text-indigo-950">${b.servicePrice}</span>
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-base">{b.serviceName}</h3>
                            <p className="text-xs text-slate-500 flex items-center space-x-1.5 mt-1">
                              <Building className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-medium text-slate-600">{biz.name}</span>
                            </p>
                          </div>
                          <div className="text-xs text-slate-700 space-y-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                            <p className="font-bold text-slate-800">
                              {startTimeLocal.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                            <p className="text-slate-500 font-medium">
                              {startTimeLocal.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({b.serviceDuration} min)
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-3 mt-5 pt-5 border-t border-slate-100">
                          <a
                            href={`/?b=${biz.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-center rounded-xl text-xs transition border border-slate-200 cursor-pointer"
                          >
                            Reschedule
                          </a>
                          <button
                            onClick={() => handleCancelBooking(b.id)}
                            className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl text-xs transition border border-rose-100 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Booking History */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-indigo-950 flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-amber-500" />
                <span>Booking History</span>
              </h2>

              {pastBookings.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs bg-white border border-slate-200 rounded-3xl">
                  No past appointments logged.
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm divide-y divide-slate-100">
                  {pastBookings.map((b) => {
                    const biz = businesses[b.businessId] || { name: 'Glow Studio', slug: 'glow' };
                    const isReviewed = reviews.some(r => r.bookingId === b.id);
                    const isCompleted = b.status === 'completed';
                    return (
                      <div key={b.id} className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-50/50 transition">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 text-sm">{b.serviceName}</span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${b.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-slate-105 text-slate-600'}`}>
                              {b.status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1.5 space-y-0.5">
                            <p className="font-semibold text-slate-700">{biz.name}</p>
                            <p>{new Date(b.startTime).toLocaleString()} • ${b.servicePrice}</p>
                          </div>
                        </div>

                        {isCompleted && (
                          <div>
                            {isReviewed ? (
                              <span className="inline-flex items-center space-x-1.5 text-emerald-600 text-xs font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                                <Star className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
                                <span>Reviewed</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedBookingForReview(b);
                                  setShowReviewModal(true);
                                }}
                                className="px-3.5 py-1.5 bg-indigo-950 hover:bg-indigo-900 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                              >
                                Leave Review
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: TICKETS */}
        {activeTab === 'tickets' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-indigo-950 flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-amber-500" />
                <span>My Support Escalations</span>
              </h2>
              <button
                onClick={() => setShowNewTicketForm(!showNewTicketForm)}
                className="px-3.5 py-2.5 bg-indigo-950 hover:bg-indigo-900 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Open New Ticket</span>
              </button>
            </div>

            {showNewTicketForm && (
              <form onSubmit={handleCreateTicket} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4 animate-in slide-in-from-top duration-200">
                <h3 className="font-bold text-slate-900 text-sm">Raise Help Ticket</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Subject</label>
                    <input
                      type="text"
                      required
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      placeholder="Double booking on haircut service"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Message Description</label>
                    <textarea
                      required
                      rows={3}
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      placeholder="Describe the issue you are facing in detail..."
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2.5">
                  <button
                    type="button"
                    onClick={() => setShowNewTicketForm(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-950 hover:bg-indigo-900 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
                  >
                    Submit Ticket
                  </button>
                </div>
              </form>
            )}

            {/* Tickets Thread List */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl shadow-sm h-[420px] flex flex-col overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Support History</span>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {tickets.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No support tickets raised yet.
                    </div>
                  ) : (
                    tickets.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTicket(t)}
                        className={`w-full p-4 text-left hover:bg-slate-50 transition border-b border-slate-100 flex justify-between items-start cursor-pointer ${selectedTicket?.id === t.id ? 'bg-indigo-50/50 border-l-4 border-l-indigo-950' : ''}`}
                      >
                        <div className="space-y-1 truncate max-w-[80%]">
                          <span className="font-bold text-slate-900 text-xs block truncate">{t.subject}</span>
                          <span className="text-[11px] text-slate-500 line-clamp-1">{t.message}</span>
                        </div>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${t.status === 'open' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                          {t.status}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl shadow-sm h-[420px] flex flex-col justify-between overflow-hidden">
                {selectedTicket ? (
                  <div className="flex-1 flex flex-col justify-between h-full">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                      <span className="font-bold text-slate-900 text-xs truncate">{selectedTicket.subject}</span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${selectedTicket.status === 'open' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                        {selectedTicket.status}
                      </span>
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/20">
                      {/* Initial client message */}
                      <div className="flex flex-col items-start space-y-0.5 max-w-[85%]">
                        <div className="p-3 bg-white border border-slate-200 rounded-2xl rounded-tl-none shadow-sm text-xs text-slate-700">
                          {selectedTicket.message}
                        </div>
                        <span className="text-[8px] text-slate-400">{new Date(selectedTicket.createdAt).toLocaleString()}</span>
                      </div>

                      {/* Responses */}
                      {selectedTicket.responses?.map((resp, i) => {
                        const isOperator = resp.senderId !== clientUser.uid;
                        return (
                          <div key={i} className={`flex flex-col space-y-0.5 max-w-[85%] ${isOperator ? 'items-start' : 'ml-auto items-end'}`}>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{isOperator ? 'Support Agent' : 'You'}</span>
                            <div className={`p-3 border shadow-sm text-xs rounded-2xl ${isOperator ? 'bg-white border-slate-200 text-slate-700 rounded-tl-none' : 'bg-indigo-950 border-indigo-950 text-white rounded-tr-none'}`}>
                              {resp.message}
                            </div>
                            <span className="text-[8px] text-slate-400">{new Date(resp.createdAt).toLocaleString()}</span>
                          </div>
                        );
                      })}
                    </div>

                    <form onSubmit={handleSubmitTicketReply} className="p-3 border-t border-slate-100 flex gap-2">
                      <input
                        type="text"
                        required
                        value={ticketReply}
                        onChange={(e) => setTicketReply(e.target.value)}
                        placeholder="Type follow-up response message..."
                        className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                      <button
                        type="submit"
                        disabled={submittingReply || !ticketReply.trim()}
                        className="px-4 py-2 bg-indigo-950 hover:bg-indigo-900 text-white rounded-xl font-bold text-xs flex items-center justify-center transition shadow-md disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer"
                      >
                        {submittingReply ? <Loader2 className="w-3 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-2 p-8">
                    <HelpCircle className="w-8 h-8 text-slate-350" />
                    <p className="font-semibold text-xs">No ticket selected</p>
                    <p className="text-[10px] text-slate-400 text-center max-w-xs">Select any ticket from the left sidebar history to read operator replies.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: PROFILE */}
        {activeTab === 'profile' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm max-w-lg animate-in fade-in duration-200">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2 border-b border-slate-100 pb-3 mb-5">
              <User className="w-5 h-5 text-amber-500" />
              <span>Personal Client Details</span>
            </h2>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {profileMsg && (
                <div className={`p-3.5 border rounded-xl flex items-center space-x-2 text-xs font-semibold ${profileMsg.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'}`}>
                  {profileMsg.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-rose-500" />}
                  <span>{profileMsg.text}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Account Email Address
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    disabled
                    value={clientUser.email}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 text-slate-400 focus:outline-none"
                  />
                </div>
                <p className="text-[9px] text-slate-400 mt-1 leading-normal">
                  Email address cannot be changed. Contact Support if you need an email migration.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Full Name
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Phone Number
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+92 (300) 123-4567"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full py-3 bg-indigo-950 hover:bg-slate-900 text-white rounded-xl font-bold text-xs transition flex justify-center items-center space-x-2 shadow-md disabled:bg-slate-300 cursor-pointer"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Details...</span>
                    </>
                  ) : (
                    <span>Save Profile Settings</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-10 px-6 mt-12 text-center text-xs">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex items-center justify-center space-x-2 text-white">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span className="font-bold tracking-tight text-sm">BookEasy Pakistan</span>
          </div>
          <p className="max-w-md mx-auto text-[11px] leading-relaxed text-slate-500">
            Connecting clients with vetted professionals across Pakistan. All services are licensed, insured, and verified for high satisfaction.
          </p>
          <div className="pt-4 border-t border-slate-800 text-[10px] text-slate-600">
            © 2026 BookEasy Pakistan. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Modal: Write Star Review */}
      {showReviewModal && selectedBookingForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-150 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-slate-900">Write Appointment Review</h3>
            <p className="text-xs text-slate-400 leading-normal">
              Rate your experience for service <strong>{selectedBookingForReview.serviceName}</strong>. Your feedback helps businesses improve.
            </p>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Star Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Star Rating (1 - 5)
                </label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 cursor-pointer transition hover:scale-110"
                    >
                      <Star 
                        className={`w-8 h-8 ${star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Review Details
                </label>
                <textarea
                  required
                  rows={4}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share details about what you liked or how we can improve..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowReviewModal(false);
                    setSelectedBookingForReview(null);
                  }}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-indigo-950 hover:bg-indigo-900 text-white rounded-xl text-sm font-bold transition shadow-md cursor-pointer"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
