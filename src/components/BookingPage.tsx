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
  getDoc,
  doc, 
  setDoc,
  addDoc, 
  updateDoc 
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Business, Service, Booking } from '../types';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  User, 
  Mail, 
  Phone, 
  FileText, 
  MapPin, 
  ChevronRight, 
  ArrowLeft, 
  Loader2,
  Check,
  X,
  Bell,
  Trash2,
  Globe,
  Instagram,
  Facebook,
  Users,
  Star,
  Sparkles
} from 'lucide-react';

interface BookingPageProps {
  businessSlug?: string;
  onNavigateHome: () => void;
}

export default function BookingPage({ businessSlug, onNavigateHome }: BookingPageProps) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking process states
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD
  const [selectedTime, setSelectedTime] = useState<string>(''); // HH:MM
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [fetchingSlots, setFetchingSlots] = useState(false);

  // Client Details Form State
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  // Cancel/Reschedule flow from external link
  const [isCancelFlow, setIsCancelFlow] = useState(false);
  const [cancelBooking, setCancelBooking] = useState<Booking | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [loadingCancel, setLoadingCancel] = useState(false);

  // Authenticated user state
  const [loggedInUser, setLoggedInUser] = useState<any | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      // 1. Mock session
      const savedMockUser = localStorage.getItem('bookeasy_mock_user');
      if (savedMockUser) {
        try {
          const mockUser = JSON.parse(savedMockUser);
          setLoggedInUser(mockUser);
          setClientEmail(mockUser.email || '');
          const docSnap = await getDoc(doc(db, "users", mockUser.uid));
          if (docSnap.exists()) {
            const uData = docSnap.data();
            setClientName(uData.fullName || '');
            setClientPhone(uData.phone || '');
          }
          return;
        } catch (e) {
          localStorage.removeItem('bookeasy_mock_user');
        }
      }
      
      // 2. Real user
      if (auth.currentUser) {
        setLoggedInUser({
          uid: auth.currentUser.uid,
          email: auth.currentUser.email
        });
        setClientEmail(auth.currentUser.email || '');
        const docSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (docSnap.exists()) {
          const uData = docSnap.data();
          setClientName(uData.fullName || '');
          setClientPhone(uData.phone || '');
        }
      }
    };
    checkAuth();
  }, []);

  // Parse query params to check for specific business slugs or cancellations
  useEffect(() => {
    const fetchBusinessBySlug = async () => {
      setLoading(true);
      setError(null);
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const cancelId = urlParams.get('cancel');

        if (cancelId) {
          setIsCancelFlow(true);
          // Fetch booking to cancel
          const bookingSnap = await getDoc(doc(db, "bookings", cancelId));
          if (bookingSnap.exists()) {
            const bData = { id: bookingSnap.id, ...bookingSnap.data() } as Booking;
            setCancelBooking(bData);
            
            // Also fetch corresponding business info
            const bizSnap = await getDoc(doc(db, "businesses", bData.businessId));
            if (bizSnap.exists()) {
              setBusiness(bizSnap.data() as Business);
            }
          } else {
            setError("We couldn't find that appointment in our records.");
          }
          setLoading(false);
          return;
        }

        const slug = businessSlug || urlParams.get('b') || '';
        if (!slug) {
          setError("No business selected. Please check your URL link.");
          setLoading(false);
          return;
        }

        // Query business by slug
        const bizQuery = query(collection(db, "businesses"), where("slug", "==", slug));
        const bizSnapshot = await getDocs(bizQuery);
        if (bizSnapshot.empty) {
          setError("The business you're looking for doesn't exist or may have been deleted.");
          setLoading(false);
          return;
        }

        const bizDoc = bizSnapshot.docs[0];
        const bizData = { id: bizDoc.id, ...bizDoc.data() } as Business;
        setBusiness(bizData);

        // Load services for this business
        const sQuery = query(collection(db, "services"), where("businessId", "==", bizData.id));
        const sSnapshot = await getDocs(sQuery);
        const sList: Service[] = [];
        sSnapshot.forEach((docSnap) => {
          sList.push({ id: docSnap.id, ...docSnap.data() } as Service);
        });
        setServices(sList);

        // Load reviews for this business
        try {
          const revQuery = query(collection(db, "reviews"), where("businessId", "==", bizData.id));
          const revSnapshot = await getDocs(revQuery);
          const rList: any[] = [];
          revSnapshot.forEach((docSnap) => {
            rList.push({ id: docSnap.id, ...docSnap.data() });
          });
          rList.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
          setReviews(rList);
        } catch (revErr) {
          console.error("Non-blocking error loading reviews:", revErr);
        }
      } catch (err: any) {
        console.error("Error setting up booking page:", err);
        setError("Failed to load booking details.");
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessBySlug();
  }, [businessSlug]);

  // Calculate available slots on Date/Service change
  useEffect(() => {
    const calculateSlots = async () => {
      if (!business || !selectedService || !selectedDate) {
        setAvailableSlots([]);
        return;
      }

      setFetchingSlots(true);
      setSelectedTime(''); // Reset selected time
      
      try {
        // 1. Check if date is blocked
        const dateBlock = business.blockedDates?.find(b => b.date === selectedDate);
        if (dateBlock) {
          setAvailableSlots([]);
          setFetchingSlots(false);
          return;
        }

        // 2. Check if day of week is active
        const dayOfWeek = new Date(selectedDate + 'T00:00:00').getDay();
        const dayConfig = business.schedule?.[dayOfWeek];
        if (!dayConfig || !dayConfig.active) {
          setAvailableSlots([]);
          setFetchingSlots(false);
          return;
        }

        const { startTime, endTime } = dayConfig; // e.g. "09:00" and "17:00"
        const [startH, startM] = startTime.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);

        // Fetch all bookings for this business on this day
        // Standard start/end ISO range for the selected day in UTC/Local approximation
        const startDayISO = `${selectedDate}T00:00:00`;
        const endDayISO = `${selectedDate}T23:59:59`;

        const bQuery = query(
          collection(db, "bookings"),
          where("businessId", "==", business.id),
          where("status", "==", "confirmed")
        );
        const bSnapshot = await getDocs(bQuery);
        const dayBookings: Booking[] = [];
        bSnapshot.forEach((snap) => {
          const b = snap.data() as Booking;
          // Filter client-side to ensure dates match perfectly
          if (b.startTime.startsWith(selectedDate)) {
            dayBookings.push(b);
          }
        });

        // Generate candidate slots in 30 minute intervals (or customizable, default 30m increments for beautiful layout)
        const slots: string[] = [];
        let currentMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        const duration = selectedService.durationMinutes;
        const buffer = business.bufferTime || 0;

        // Compare with today's actual local time if the user picked today's date
        const todayStr = new Date().toISOString().split('T')[0];
        const isToday = selectedDate === todayStr;
        const now = new Date();
        const currentLocalMinutes = now.getHours() * 60 + now.getMinutes();

        while (currentMinutes + duration <= endMinutes) {
          const slotHour = Math.floor(currentMinutes / 60);
          const slotMin = currentMinutes % 60;
          const slotTimeStr = `${String(slotHour).padStart(2, '0')}:${String(slotMin).padStart(2, '0')}`;
          
          let isAvailable = true;

          // If date is today, skip past slots
          if (isToday && currentMinutes <= currentLocalMinutes + 15) {
            isAvailable = false;
          }

          if (isAvailable) {
            // Check overlaps
            const slotStart = currentMinutes;
            const slotEnd = currentMinutes + duration;

            for (const b of dayBookings) {
              const bStartObj = new Date(b.startTime);
              const bEndObj = new Date(b.endTime);
              const bStartMin = bStartObj.getHours() * 60 + bStartObj.getMinutes();
              const bEndMin = bEndObj.getHours() * 60 + bEndObj.getMinutes();

              // Overlap check including buffer!
              const bStartWithBuffer = bStartMin - buffer;
              const bEndWithBuffer = bEndMin + buffer;

              if (slotStart < bEndWithBuffer && slotEnd > bStartWithBuffer) {
                isAvailable = false;
                break;
              }
            }
          }

          if (isAvailable) {
            slots.push(slotTimeStr);
          }

          // Move forward by 30 minutes to generate next slot
          currentMinutes += 30;
        }

        setAvailableSlots(slots);
      } catch (err: any) {
        console.error("Error generating slots:", err);
      } finally {
        setFetchingSlots(false);
      }
    };

    calculateSlots();
  }, [selectedDate, selectedService, business]);

  // Handle Booking form submission
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !selectedService || !selectedDate || !selectedTime || !clientName.trim() || !clientEmail.trim()) {
      alert("Please fill out all fields.");
      return;
    }

    setSubmittingBooking(true);
    try {
      // Calculate start and end ISO strings
      const startISO = `${selectedDate}T${selectedTime}:00`;
      
      const startTimeDate = new Date(startISO);
      const endTimeDate = new Date(startTimeDate.getTime() + selectedService.durationMinutes * 60000);
      const endISO = endTimeDate.toISOString().replace(/\.\d+Z$/, ''); // Normalize timezone-less local string representation

      const bookingId = `book_${Date.now()}`;

      const newBooking: Booking = {
        id: bookingId,
        businessId: business.id,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        serviceDuration: selectedService.durationMinutes,
        servicePrice: selectedService.price,
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        clientPhone: clientPhone.trim(),
        startTime: startISO,
        endTime: endISO,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        notes: clientNotes.trim(),
        ...(loggedInUser && { clientUserId: loggedInUser.uid })
      };

      // Save Booking to Firestore
      await setDoc(doc(db, "bookings", bookingId), newBooking);
      setConfirmedBooking(newBooking);
    } catch (err: any) {
      console.error("Error creating booking:", err);
      alert("We encountered an error. Please try booking again.");
    } finally {
      setSubmittingBooking(false);
    }
  };

  // Handle Cancellation submission
  const handleCancelBooking = async () => {
    if (!cancelBooking) return;
    setLoadingCancel(true);

    try {
      // Update status to 'cancelled' in Firestore
      await updateDoc(doc(db, "bookings", cancelBooking.id), {
        status: 'cancelled'
      });
      setCancelSuccess(true);
    } catch (err: any) {
      console.error("Error cancelling booking:", err);
      alert("Failed to cancel your booking. Please contact the business owner directly.");
    } finally {
      setLoadingCancel(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
          <p className="text-sm text-slate-500 font-bold">Loading booking page...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-6 lg:px-8 font-sans text-slate-600">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl w-fit mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-display font-bold text-slate-900">Oops, something went wrong</h2>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">{error}</p>
          <button
            onClick={onNavigateHome}
            className="mt-6 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition shadow-md shadow-indigo-100 cursor-pointer"
          >
            Go Back to BookEasy Home
          </button>
        </div>
      </div>
    );
  }

  // CANCELLATION FLOW VIEW
  if (isCancelFlow && cancelBooking) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-600">
        <div className="sm:mx-auto sm:w-full sm:max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-100 p-8 space-y-6">
          <div className="text-center">
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-500 rounded-2xl w-fit mx-auto mb-4">
              <X className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-display font-bold text-slate-900">
              {cancelSuccess ? 'Appointment Cancelled' : 'Cancel Appointment?'}
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              With {business?.name || 'our business'}
            </p>
          </div>

          {cancelSuccess ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-100 text-sm leading-relaxed font-medium">
                Your appointment for <strong>{cancelBooking.serviceName}</strong> has been successfully cancelled. The business owner has been notified. No further action is required.
              </div>
              <button
                onClick={onNavigateHome}
                className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-slate-850 transition-all cursor-pointer"
              >
                Return to BookEasy Home
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="border border-slate-100 rounded-2xl p-4 space-y-3 text-sm text-slate-700 bg-slate-50/50">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">Service:</span>
                  <span className="font-bold text-slate-900">{cancelBooking.serviceName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">Date:</span>
                  <span className="font-bold text-slate-900">
                    {new Date(cancelBooking.startTime.split('T')[0] + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">Time:</span>
                  <span className="font-bold text-slate-900">
                    {cancelBooking.startTime.split('T')[1]?.substring(0, 5) || ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">Price:</span>
                  <span className="font-bold text-indigo-600">${cancelBooking.servicePrice}</span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleCancelBooking}
                  disabled={loadingCancel}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm transition flex items-center justify-center space-x-1.5 shadow-md shadow-rose-150 cursor-pointer"
                >
                  {loadingCancel ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span>{loadingCancel ? 'Cancelling...' : 'Confirm Cancellation'}</span>
                </button>
                <button
                  onClick={() => setIsCancelFlow(false)}
                  disabled={loadingCancel}
                  className="w-full py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer"
                >
                  Keep Appointment
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // SUCCESS CONFIRMATION VIEW
  if (confirmedBooking) {
    const cancelLink = `${window.location.origin}/?cancel=${confirmedBooking.id}`;
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-600">
        <div className="sm:mx-auto sm:w-full sm:max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-100 p-8 space-y-6">
          <div className="text-center">
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-500 rounded-2xl w-fit mx-auto mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-display font-bold text-slate-900">Booking Confirmed!</h2>
            <p className="text-slate-400 text-xs mt-1 font-medium">
              Your appointment is locked in with {business?.name}
            </p>
          </div>

          <div className="border border-slate-100 rounded-2xl p-5 space-y-3.5 text-sm bg-slate-50/50">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="font-semibold text-slate-400">Service:</span>
              <span className="font-bold text-slate-900">{confirmedBooking.serviceName}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="font-semibold text-slate-400">Date:</span>
              <span className="font-bold text-slate-900">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="font-semibold text-slate-400">Time:</span>
              <span className="font-bold text-slate-900">{selectedTime}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="font-semibold text-slate-400">Duration:</span>
              <span className="font-bold text-slate-900">{confirmedBooking.serviceDuration} min</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-400">Price:</span>
              <span className="font-bold text-indigo-600">${confirmedBooking.servicePrice}</span>
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-100 text-amber-900 rounded-2xl space-y-1">
            <p className="text-xs font-bold flex items-center">
              <Bell className="w-3.5 h-3.5 mr-1 shrink-0 text-amber-500" />
              Automated Reminders Active
            </p>
            <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
              We've sent a confirmation email to <strong>{confirmedBooking.clientEmail}</strong>. You'll get an automatic reminder 24h before appointment.
            </p>
          </div>

          <div className="text-center pt-2">
            <p className="text-xs text-slate-400 font-medium">
              Need to reschedule or cancel? Use this unique link:
            </p>
            <p className="text-[11px] font-mono mt-1 text-rose-600 break-all select-all hover:underline">
              {cancelLink}
            </p>
          </div>

          <button
            onClick={onNavigateHome}
            className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700 transition shadow-md shadow-indigo-100 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // STANDARD CLIENT BOOKING WIZARD FLOW
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-600">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Back Link to Landing */}
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-400 hover:text-indigo-600 transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to BookEasy Home</span>
        </button>

        {/* Business Header Panel */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden animate-in fade-in duration-300">
          {/* Banner Gradient or Cover Strip */}
          <div className={`h-24 w-full ${business?.bannerGradient || 'bg-gradient-to-r from-indigo-600 to-purple-600'}`} />
          
          <div className="p-6 sm:p-8 -mt-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            {business?.logoUrl ? (
              <img 
                src={business.logoUrl} 
                alt={business.name} 
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md shrink-0 bg-white animate-in zoom-in duration-200" 
              />
            ) : (
              <div className="w-20 h-20 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-bold font-display text-3xl shadow-md border-4 border-white shrink-0">
                {business?.name?.charAt(0) || 'B'}
              </div>
            )}
            
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
                <h1 className="text-2xl font-display font-extrabold tracking-tight text-slate-900 leading-tight">
                  {business?.name}
                </h1>
                {business?.category && (
                  <span className="w-fit inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 border border-indigo-100 text-indigo-700">
                    {business.category}
                  </span>
                )}
              </div>

              <p className="text-slate-500 text-xs flex items-center justify-center sm:justify-start font-semibold">
                <MapPin className="w-3.5 h-3.5 mr-1 shrink-0 text-slate-400" />
                <span>{business?.address}</span>
              </p>

              {business?.contactPhone && (
                <p className="text-slate-450 text-xs flex items-center justify-center sm:justify-start font-medium">
                  <Phone className="w-3.5 h-3.5 mr-1 shrink-0 text-slate-400" />
                  <span>{business.contactPhone}</span>
                </p>
              )}

              <p className="text-slate-600 text-sm leading-relaxed max-w-xl font-medium mt-1">
                {business?.description}
              </p>

              {/* Social links & Website URL */}
              {(business?.instagramUrl || business?.facebookUrl || business?.websiteUrl) && (
                <div className="flex justify-center sm:justify-start items-center gap-3 pt-2">
                  {business.websiteUrl && (
                    <a
                      href={business.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-slate-50 text-slate-400 hover:text-indigo-650 rounded-lg hover:bg-indigo-50 border border-slate-200 transition"
                      title="Website"
                    >
                      <Globe className="w-4 h-4" />
                    </a>
                  )}
                  {business.instagramUrl && (
                    <a
                      href={business.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-slate-50 text-slate-400 hover:text-indigo-650 rounded-lg hover:bg-indigo-50 border border-slate-200 transition"
                      title="Instagram"
                    >
                      <Instagram className="w-4 h-4" />
                    </a>
                  )}
                  {business.facebookUrl && (
                    <a
                      href={business.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-slate-50 text-slate-400 hover:text-indigo-650 rounded-lg hover:bg-indigo-50 border border-slate-200 transition"
                      title="Facebook"
                    >
                      <Facebook className="w-4 h-4" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Wizard Form container */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-100 overflow-hidden">
          
          {/* Step 1: Choose Service */}
          <div className="p-6 sm:p-8 border-b border-slate-100">
            <h2 className="text-lg font-display font-bold text-slate-900 flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">1</span>
              <span>Choose a Service</span>
            </h2>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {services.length === 0 ? (
                <p className="text-sm text-slate-400 italic p-4 text-center sm:col-span-2">This business hasn't loaded any services yet.</p>
              ) : (
                services.map((service) => {
                  const isSelected = selectedService?.id === service.id;
                  return (
                    <div
                      key={service.id}
                      onClick={() => { setSelectedService(service); setSelectedDate(''); setSelectedTime(''); }}
                      className={`p-4 rounded-2xl border-2 text-left cursor-pointer transition-all ${isSelected ? 'border-indigo-600 bg-indigo-50/10 shadow-sm shadow-indigo-100/30' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="font-bold text-sm text-slate-900">{service.name}</h4>
                        {isSelected && <div className="p-0.5 bg-indigo-600 text-white rounded-full"><Check className="w-3 h-3" /></div>}
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-0.5 text-slate-400" /> {service.durationMinutes} min</span>
                        <span className="font-bold text-slate-800">${service.price}</span>
                      </div>
                      <p className="text-slate-500 text-xs mt-2 line-clamp-2 leading-relaxed font-medium">{service.description}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Step 2: Date and Time slots */}
          {selectedService && (
            <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/20">
              <h2 className="text-lg font-display font-bold text-slate-900 flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                <span>Select Appointment Date & Time</span>
              </h2>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date Input */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Choose Date</label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <CalendarIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]} // No booking past dates
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                    />
                  </div>
                </div>

                {/* Slots Grid */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Available Times</label>
                  {fetchingSlots ? (
                    <div className="flex items-center space-x-1.5 py-3 text-xs text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                      <span>Checking calendar schedule...</span>
                    </div>
                  ) : !selectedDate ? (
                    <p className="text-xs text-slate-400 italic py-2 font-medium">Please pick a date first to view hours.</p>
                  ) : availableSlots.length === 0 ? (
                    <div className="p-3 bg-rose-50 text-rose-800 border border-rose-100 rounded-xl text-xs flex items-center space-x-1.5 font-medium">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                      <span>No slots available for this date. Pick another day!</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[160px] overflow-y-auto pr-1">
                      {availableSlots.map((slot) => {
                        const isSelected = selectedTime === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedTime(slot)}
                            className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-white border-slate-200 hover:border-indigo-300 text-slate-800'}`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {selectedService && selectedDate && selectedTime && (
            <div className="p-6 sm:p-8">
              <h2 className="text-lg font-display font-bold text-slate-900 flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">3</span>
                <span>Enter Your Information</span>
              </h2>

              <div className="mt-4">
                {loggedInUser ? (
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-850">
                    Logged in as Client: <strong>{loggedInUser.email}</strong>. This booking will be saved to your dashboard calendar history.
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-650 flex justify-between items-center">
                    <span>Want to save this appointment to your client account?</span>
                    <button
                      type="button"
                      onClick={() => {
                        window.location.href = `${window.location.origin}/?auth=client`;
                      }}
                      className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer"
                    >
                      Log In / Register
                    </button>
                  </div>
                )}
              </div>

              <form onSubmit={handleCreateBooking} className="mt-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Full Name *</label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Email Address *</label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Phone Number</label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        placeholder="(555) 012-3456"
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Special Instructions (Optional)</label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <FileText className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={clientNotes}
                        onChange={(e) => setClientNotes(e.target.value)}
                        placeholder="e.g. Scalp sensitivities, gate code 405"
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-5 mt-5 flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingBooking}
                    className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 transition text-sm flex items-center space-x-1.5 shadow-md shadow-indigo-100 cursor-pointer"
                  >
                    {submittingBooking && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{submittingBooking ? 'Booking appointment...' : 'Confirm Secure Booking'}</span>
                    {!submittingBooking && <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

        {/* Bottom grid: Details & Reviews */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-8">
          {/* Left Column: Team & Schedule */}
          <div className="md:col-span-5 space-y-6">
            
            {/* Team Staff members */}
            {business?.staffMembers && business.staffMembers.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 animate-in fade-in duration-300">
                <h3 className="font-display font-bold text-sm text-slate-900 flex items-center space-x-2">
                  <Users className="w-4 h-4 text-indigo-650" />
                  <span>Meet Our Stylists</span>
                </h3>
                <div className="space-y-3">
                  {business.staffMembers.map((staff, idx) => (
                    <div key={idx} className="flex items-center space-x-3 p-2 bg-slate-50 rounded-xl border border-slate-100/50">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-750 flex items-center justify-center text-xs font-bold font-sans">
                        {staff.charAt(0)}
                      </div>
                      <span className="text-xs font-semibold text-slate-800">{staff}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Operating Schedule */}
            {business?.schedule && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 animate-in fade-in duration-300">
                <h3 className="font-display font-bold text-sm text-slate-900 flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-indigo-650" />
                  <span>Operating Hours</span>
                </h3>
                <div className="space-y-2 text-xs font-medium text-slate-650">
                  {Object.entries(business.schedule).map(([dayKey, val]) => {
                    const dayVal = val as any;
                    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    const dayName = days[Number(dayKey)];
                    return (
                      <div key={dayKey} className="flex justify-between border-b border-slate-50 pb-1.5 last:border-b-0">
                        <span className="text-slate-500 font-semibold">{dayName}</span>
                        <span>
                          {dayVal.active ? `${dayVal.startTime} - ${dayVal.endTime}` : <span className="text-rose-550 font-bold uppercase text-[9px] tracking-wider bg-rose-50 px-2 py-0.5 rounded">Closed</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Customer Reviews */}
          <div className="md:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between animate-in fade-in duration-300">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-display font-bold text-sm text-slate-900 flex items-center space-x-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>Client Feedback</span>
                </h3>
                {reviews.length > 0 && (
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                    {(() => {
                      const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
                      return `${avg.toFixed(1)} / 5 Rating (${reviews.length} reviews)`;
                    })()}
                  </span>
                )}
              </div>

              {reviews.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs italic">
                  No client reviews submitted yet for this business.
                </div>
              ) : (
                <div className="space-y-4 overflow-y-auto max-h-[300px] pr-1.5">
                  {reviews.map((r) => (
                    <div key={r.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100/50 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800 text-xs">{r.clientName}</span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={`w-3 h-3 ${star <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} 
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-650 text-xs leading-relaxed font-medium">"{r.comment}"</p>
                      <p className="text-[9px] text-slate-400 text-right">
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
