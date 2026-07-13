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
  updateDoc, 
  doc, 
  deleteDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Booking } from '../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  FileText, 
  CheckCircle, 
  XCircle, 
  X, 
  Trash2, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';

interface CalendarViewProps {
  businessId: string;
}

export default function CalendarView({ businessId }: CalendarViewProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayBookings, setSelectedDayBookings] = useState<Booking[]>([]);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(''); // YYYY-MM-DD
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "bookings"), where("businessId", "==", businessId));
      const querySnapshot = await getDocs(q);
      const list: Booking[] = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Booking);
      });
      // Sort by start time ascending
      list.sort((a, b) => a.startTime.localeCompare(b.startTime));
      setBookings(list);
    } catch (err: any) {
      console.error("Error loading bookings:", err);
      setError("Failed to fetch calendar bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (businessId) {
      fetchBookings();
    }
  }, [businessId]);

  // Set default selected day to today
  useEffect(() => {
    const todayStr = currentDate.toISOString().split('T')[0];
    setSelectedDateStr(todayStr);
  }, []);

  // Update selected day bookings when bookings or selected date changes
  useEffect(() => {
    if (selectedDateStr) {
      const filtered = bookings.filter(b => b.startTime.startsWith(selectedDateStr));
      setSelectedDayBookings(filtered);
    } else {
      setSelectedDayBookings([]);
    }
  }, [selectedDateStr, bookings]);

  const changeMonth = (direction: 'prev' | 'next') => {
    const nextDate = new Date(currentDate);
    if (direction === 'prev') {
      nextDate.setMonth(nextDate.getMonth() - 1);
    } else {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }
    setCurrentDate(nextDate);
  };

  // Helper arrays for generating calendar month grid
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const renderDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month); // Day of week (0 = Sunday, 1 = Monday...)

    const days = [];
    
    // Empty cells for preceding month padding
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-14 sm:h-20 bg-neutral-50/50 border border-neutral-100"></div>);
    }

    // Actual month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isSelected = selectedDateStr === dateString;
      
      const dayBookings = bookings.filter(b => b.startTime.startsWith(dateString) && b.status !== 'cancelled');
      const hasBookings = dayBookings.length > 0;

      days.push(
        <div
          key={`day-${day}`}
          onClick={() => setSelectedDateStr(dateString)}
          className={`h-14 sm:h-20 p-2 border border-neutral-100 relative cursor-pointer hover:bg-neutral-50 transition flex flex-col justify-between ${isSelected ? 'bg-neutral-900/5 ring-1 ring-neutral-900 ring-inset' : 'bg-white'}`}
        >
          <span className={`text-xs font-semibold ${isSelected ? 'text-neutral-900 font-extrabold' : 'text-neutral-700'}`}>
            {day}
          </span>
          
          {hasBookings && (
            <div className="flex flex-wrap gap-1 mt-1">
              {/* Desktop indicators */}
              <div className="hidden sm:flex flex-col gap-1 w-full">
                {dayBookings.slice(0, 2).map((b, idx) => (
                  <div 
                    key={b.id} 
                    className={`text-[9px] px-1.5 py-0.5 rounded truncate font-medium ${b.status === 'completed' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-neutral-100 text-neutral-800 border border-neutral-200'}`}
                  >
                    {b.startTime.split('T')[1]?.substring(0, 5)} {b.serviceName}
                  </div>
                ))}
                {dayBookings.length > 2 && (
                  <div className="text-[8px] text-neutral-500 font-bold pl-1">
                    +{dayBookings.length - 2} more
                  </div>
                )}
              </div>

              {/* Mobile circular indicator */}
              <div className="sm:hidden w-2 h-2 rounded-full bg-neutral-900 mx-auto"></div>
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  const handleStatusUpdate = async (id: string, newStatus: 'confirmed' | 'cancelled' | 'completed') => {
    try {
      await updateDoc(doc(db, "bookings", id), { status: newStatus });
      // Update locally
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
      if (activeBooking && activeBooking.id === id) {
        setActiveBooking({ ...activeBooking, status: newStatus });
      }
    } catch (err: any) {
      console.error("Error updating status:", err);
      alert("Failed to update status.");
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this booking record? This cannot be undone.")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "bookings", id));
      setBookings(prev => prev.filter(b => b.id !== id));
      setActiveBooking(null);
    } catch (err: any) {
      console.error("Error deleting booking:", err);
      alert("Failed to delete booking.");
    }
  };

  const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 font-sans text-slate-600">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-slate-900">Calendar Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Review upcoming appointments, client details, and complete or cancel sessions.</p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl flex items-start space-x-2 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Monthly Calendar Grid (Left Column) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
              {/* Calendar Month Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-display font-bold text-lg text-slate-900">{monthLabel}</h2>
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => changeMonth('prev')}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition text-slate-600 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => changeMonth('next')}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition text-slate-600 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Day names headers */}
              <div className="grid grid-cols-7 bg-slate-50/50 text-center border-b border-slate-100 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              {/* Grid cells */}
              <div className="grid grid-cols-7 bg-slate-100/10">
                {(() => {
                  const year = currentDate.getFullYear();
                  const month = currentDate.getMonth();
                  const daysInMonth = getDaysInMonth(year, month);
                  const firstDay = getFirstDayOfMonth(year, month);
                  const days = [];
                  
                  // Empty cells
                  for (let i = 0; i < firstDay; i++) {
                    days.push(<div key={`empty-${i}`} className="h-14 sm:h-20 bg-slate-50/20 border-r border-b border-slate-100"></div>);
                  }

                  // Month days
                  for (let day = 1; day <= daysInMonth; day++) {
                    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isSelected = selectedDateStr === dateString;
                    const dayBookings = bookings.filter(b => b.startTime.startsWith(dateString) && b.status !== 'cancelled');
                    const hasBookings = dayBookings.length > 0;

                    days.push(
                      <div
                        key={`day-${day}`}
                        onClick={() => setSelectedDateStr(dateString)}
                        className={`h-14 sm:h-20 p-2 border-r border-b border-slate-100 relative cursor-pointer hover:bg-slate-50 transition flex flex-col justify-between ${isSelected ? 'bg-indigo-50/40 ring-1 ring-indigo-500 ring-inset' : 'bg-white'}`}
                      >
                        <span className={`text-xs font-bold ${isSelected ? 'text-indigo-600' : 'text-slate-700'}`}>
                          {day}
                        </span>
                        
                        {hasBookings && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {/* Desktop indicators */}
                            <div className="hidden sm:flex flex-col gap-1 w-full">
                              {dayBookings.slice(0, 2).map((b) => (
                                <div 
                                  key={b.id} 
                                  className={`text-[9px] px-1.5 py-0.5 rounded truncate font-medium ${b.status === 'completed' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'}`}
                                >
                                  {b.startTime.split('T')[1]?.substring(0, 5)} {b.serviceName}
                                </div>
                              ))}
                              {dayBookings.length > 2 && (
                                <div className="text-[8px] text-slate-400 font-bold pl-1">
                                  +{dayBookings.length - 2} more
                                </div>
                              )}
                            </div>

                            {/* Mobile circular indicator */}
                            <div className="sm:hidden w-1.5 h-1.5 rounded-full bg-indigo-600 mx-auto"></div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return days;
                })()}
              </div>
            </div>
          </div>

          {/* Bookings List for Selected Day (Right Column) */}
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm min-h-[300px] flex flex-col justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
                  <span>
                    Schedule for{' '}
                    {selectedDateStr ? new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Today'}
                  </span>
                  <span className="text-xs bg-slate-50 text-slate-600 px-2.5 py-0.5 rounded-full font-bold">
                    {selectedDayBookings.length}
                  </span>
                </h3>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {selectedDayBookings.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 italic text-sm">
                      <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      No appointments booked for this day.
                    </div>
                  ) : (
                    selectedDayBookings.map((booking) => (
                      <div
                        key={booking.id}
                        onClick={() => setActiveBooking(booking)}
                        className={`p-3.5 rounded-2xl border border-slate-200 cursor-pointer transition-all hover:border-indigo-500 text-left space-y-1.5 ${booking.status === 'cancelled' ? 'bg-rose-50/20 border-rose-100 opacity-60' : 'bg-slate-50/40 hover:bg-white shadow-sm hover:shadow'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-slate-800 bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-sm">
                            {booking.startTime.split('T')[1]?.substring(0, 5) || ''}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            booking.status === 'completed' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                            booking.status === 'cancelled' ? 'bg-rose-50 text-rose-800 border border-rose-100' :
                            'bg-indigo-50 text-indigo-800 border border-indigo-100'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 leading-tight">
                          {booking.serviceName}
                        </h4>
                        <div className="text-xs text-slate-500 flex items-center">
                          <User className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          <span>{booking.clientName}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Booking Details Dialog Modal overlay */}
      {activeBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 relative text-slate-600">
            <button
              onClick={() => setActiveBooking(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-50 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="font-display font-bold text-xl text-slate-900 leading-tight">
                Appointment Details
              </h3>
              <p className="text-xs text-slate-400">
                Created on {new Date(activeBooking.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* Core Booking Fields Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-3.5 text-sm">
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="font-semibold text-slate-500">Service:</span>
                <span className="font-bold text-slate-900">{activeBooking.serviceName}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="font-semibold text-slate-500">Scheduled:</span>
                <span className="font-medium text-slate-900">
                  {new Date(activeBooking.startTime.split('T')[0] + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {activeBooking.startTime.split('T')[1]?.substring(0, 5)}
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="font-semibold text-slate-500">Duration / Price:</span>
                <span className="font-medium text-slate-900">{activeBooking.serviceDuration} min / ${activeBooking.servicePrice}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Status:</span>
                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  activeBooking.status === 'completed' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                  activeBooking.status === 'cancelled' ? 'bg-rose-50 text-rose-800 border border-rose-100' :
                  'bg-indigo-50 text-indigo-800 border border-indigo-100'
                }`}>
                  {activeBooking.status}
                </span>
              </div>
            </div>

            {/* Client Info details */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Client Contact Details</h4>
              <div className="space-y-2 text-sm text-slate-700">
                <div className="flex items-center space-x-2">
                  <User className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-900">{activeBooking.clientName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                  <span>{activeBooking.clientEmail}</span>
                </div>
                {activeBooking.clientPhone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                    <span>{activeBooking.clientPhone}</span>
                  </div>
                )}
                {activeBooking.notes && (
                  <div className="flex items-start space-x-2 bg-slate-50 border border-slate-100 p-3 rounded-xl mt-2 text-xs">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <p className="leading-relaxed text-slate-600"><strong className="text-slate-800">Special notes:</strong> {activeBooking.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="border-t border-slate-100 pt-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-1.5">
                {activeBooking.status !== 'completed' && activeBooking.status !== 'cancelled' && (
                  <button
                    onClick={() => handleStatusUpdate(activeBooking.id, 'completed')}
                    className="px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-100 hover:bg-emerald-100 transition rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Mark Completed</span>
                  </button>
                )}
                {activeBooking.status === 'confirmed' && (
                  <button
                    onClick={() => handleStatusUpdate(activeBooking.id, 'cancelled')}
                    className="px-3 py-2 bg-rose-50 text-rose-800 border border-rose-100 hover:bg-rose-100 transition rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Cancel Appointment</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => handleDeleteBooking(activeBooking.id)}
                className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold flex items-center space-x-1 transition cursor-pointer"
                title="Delete Record"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Record</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
