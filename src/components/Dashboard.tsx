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
  doc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Booking, Business } from '../types';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Slash, 
  Plus, 
  Copy, 
  Check, 
  ExternalLink, 
  Loader2, 
  AlertCircle,
  FileText,
  Clock3,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';

interface DashboardProps {
  businessId: string;
  appUrl: string;
  onNavigateTab: (tab: 'calendar' | 'services' | 'availability' | 'profile') => void;
}

export default function Dashboard({ businessId, appUrl, onNavigateTab }: DashboardProps) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Business
        const bizSnap = await getDoc(doc(db, "businesses", businessId));
        if (bizSnap.exists()) {
          setBusiness(bizSnap.data() as Business);
        }

        // 2. Fetch All Bookings
        const q = query(collection(db, "bookings"), where("businessId", "==", businessId));
        const qSnapshot = await getDocs(q);
        const list: Booking[] = [];
        qSnapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Booking);
        });
        setBookings(list);
      } catch (err: any) {
        console.error("Error loading dashboard data:", err);
        setError("Failed to load dashboard metrics.");
      } finally {
        setLoading(false);
      }
    };

    if (businessId) {
      loadDashboardData();
    }
  }, [businessId]);

  // Compute stats
  const todayStr = new Date().toISOString().split('T')[0];
  const activeBookings = bookings.filter(b => b.status === 'confirmed');
  const todayBookings = bookings.filter(b => b.startTime.startsWith(todayStr) && b.status !== 'cancelled')
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  
  // Calculate this week's bookings and revenue
  // We'll consider bookings in the next 7 days or this calendar week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const oneWeekHence = new Date();
  oneWeekHence.setDate(oneWeekHence.getDate() + 7);

  const thisWeeksBookings = bookings.filter(b => {
    const bDate = new Date(b.startTime);
    return bDate >= oneWeekAgo && bDate <= oneWeekHence && b.status !== 'cancelled';
  });

  const estimatedWeeklyRevenue = thisWeeksBookings.reduce((sum, b) => sum + (b.servicePrice || 0), 0);
  const totalCancellations = bookings.filter(b => b.status === 'cancelled').length;
  const totalCompleted = bookings.filter(b => b.status === 'completed').length;

  const handleCopyLink = () => {
    if (!business) return;
    const publicUrl = `${appUrl || window.location.origin}/?b=${business.slug}`;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Generate bar chart data for bookings count by Day of Week for the next 7 days
  const getNext7DaysData = () => {
    const daysData = [];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const count = bookings.filter(b => b.startTime.startsWith(dateStr) && b.status !== 'cancelled').length;
      
      daysData.push({
        dayName: i === 0 ? 'Today' : weekdays[d.getDay()],
        count: count,
        dateFormatted: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
    return daysData;
  };

  const next7DaysData = getNext7DaysData();
  const maxBookingCount = Math.max(...next7DaysData.map(d => d.count), 1); // Avoid division by zero

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  const publicBookingUrl = business ? `${appUrl || window.location.origin}/?b=${business.slug}` : '';

  return (
    <div className="space-y-8 font-sans text-slate-600">
      
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-slate-900">
            Welcome back, {business?.name || 'Partner'}!
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Here is an overview of your booking queue and calendar schedule today.</p>
        </div>
        
        {/* Share Button Group */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopyLink}
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Link Copied!' : 'Copy Booking Link'}</span>
          </button>
          <a
            href={publicBookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shadow-md shadow-indigo-100 cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>View Public Page</span>
          </a>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl flex items-start space-x-2 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid of Key Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Bookings */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Bookings This Week</span>
            <div className="p-2 bg-slate-50 text-slate-600 rounded-xl">
              <CalendarIcon className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-display font-bold text-slate-900">{thisWeeksBookings.length}</h3>
            <p className="text-[10px] text-slate-400 mt-1">Past 7 days & upcoming 7 days</p>
          </div>
        </div>

        {/* Weekly Revenue */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Est. Weekly Revenue</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-display font-bold text-slate-900">${estimatedWeeklyRevenue}</h3>
            <p className="text-[10px] text-emerald-600 font-medium mt-1">From active appointments</p>
          </div>
        </div>

        {/* Active Bookings */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Queue</span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
              <Clock3 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-display font-bold text-slate-900">{activeBookings.length}</h3>
            <p className="text-[10px] text-slate-400 mt-1">Confirmed pending sessions</p>
          </div>
        </div>

        {/* Cancellations */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">History Rate</span>
            <div className="p-2 bg-slate-50 text-slate-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-display font-bold text-slate-900">{totalCompleted} Done</h3>
            <p className="text-[10px] text-rose-600 font-semibold mt-1">{totalCancellations} client cancellations</p>
          </div>
        </div>
      </div>

      {/* Split section: Today's Bookings Feed & Booking Volume Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col (2 cols wide): Today's Appointments feed */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-display font-bold text-base text-slate-900 flex items-center space-x-2">
              <Clock className="w-5 h-5 text-slate-500" />
              <span>Today's Appointment Schedule</span>
            </h2>
            <button
              onClick={() => onNavigateTab('calendar')}
              className="text-xs font-bold text-indigo-600 hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>Full Calendar</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {todayBookings.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm italic">
                No appointments scheduled today. Take some breath or check other days!
              </div>
            ) : (
              todayBookings.map((b) => (
                <div key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border-l-4 border-indigo-500 transition-all hover:bg-slate-50/80">
                  <div className="flex items-start space-x-3.5">
                    <span className="font-mono text-xs font-bold text-slate-800 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-sm shrink-0">
                      {b.startTime.split('T')[1]?.substring(0, 5) || ''}
                    </span>
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-sm text-slate-900 leading-tight">{b.serviceName}</h4>
                      <p className="text-xs text-slate-500 flex items-center">
                        <Users className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        <span>Client: {b.clientName} ({b.clientPhone || b.clientEmail})</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 self-end sm:self-center">
                    <span className="text-xs font-bold text-slate-900">${b.servicePrice}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      b.status === 'completed' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                      b.status === 'cancelled' ? 'bg-rose-50 text-rose-800 border border-rose-100' :
                      'bg-indigo-50 text-indigo-800 border border-indigo-100'
                    }`}>
                      {b.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Col: 7-day volume CSS Bar Chart */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-display font-bold text-base text-slate-900 border-b border-slate-100 pb-3 flex items-center space-x-2">
              <TrendingUp className="w-4.5 h-4.5 text-slate-500" />
              <span>7-Day Booking Trend</span>
            </h3>

            {/* Custom high-quality HTML/CSS Bar Chart */}
            <div className="pt-4 flex items-end justify-between h-40 gap-1 px-1">
              {next7DaysData.map((data, index) => {
                const heightPercent = (data.count / maxBookingCount) * 100;
                return (
                  <div key={index} className="flex flex-col items-center flex-1 group">
                    {/* Tooltip on hover */}
                    <span className="opacity-0 group-hover:opacity-100 transition duration-200 bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded absolute -translate-y-8 font-mono z-10">
                      {data.count} book{data.count !== 1 && 's'}
                    </span>
                    
                    {/* Bar graphic */}
                    <div className="w-full bg-slate-50 rounded-t-md relative overflow-hidden h-28 flex items-end">
                      <div 
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-md transition-all duration-500 ${data.count > 0 ? 'bg-indigo-600' : 'bg-slate-200/40'}`}
                      ></div>
                    </div>

                    <span className="text-[10px] font-bold text-slate-700 mt-2">{data.dayName}</span>
                    <span className="text-[8px] text-slate-400 mt-0.5">{data.dateFormatted}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-600 leading-relaxed flex items-start space-x-2">
            <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <span>Use the share button above to post your scheduling link on Instagram, Yelp, or Google and fill these empty slots!</span>
          </div>
        </div>

      </div>

      {/* Bottom Row: Quick setup checklist / wizard help */}
      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4">
        <h3 className="font-display font-bold text-sm text-slate-900">BookEasy Setup Checklist</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div 
            onClick={() => onNavigateTab('services')}
            className="p-4 border border-slate-200 rounded-2xl hover:border-indigo-500 hover:shadow-sm transition-all cursor-pointer flex items-start space-x-3.5 text-left group"
          >
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shrink-0 mt-0.5 group-hover:bg-indigo-600 group-hover:text-white transition-all"><Plus className="w-4 h-4" /></div>
            <div>
              <h5 className="text-xs font-bold text-slate-900">Manage Services</h5>
              <p className="text-[10px] text-slate-500 mt-1">Configure pricing, session descriptions, and durations for booking.</p>
            </div>
          </div>

          <div 
            onClick={() => onNavigateTab('availability')}
            className="p-4 border border-slate-200 rounded-2xl hover:border-indigo-500 hover:shadow-sm transition-all cursor-pointer flex items-start space-x-3.5 text-left group"
          >
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shrink-0 mt-0.5 group-hover:bg-indigo-600 group-hover:text-white transition-all"><Clock className="w-4 h-4" /></div>
            <div>
              <h5 className="text-xs font-bold text-slate-900">Operating Hours</h5>
              <p className="text-[10px] text-slate-500 mt-1">Set regular operating days, start/end boundaries, and buffers.</p>
            </div>
          </div>

          <div 
            onClick={() => onNavigateTab('profile')}
            className="p-4 border border-slate-200 rounded-2xl hover:border-indigo-500 hover:shadow-sm transition-all cursor-pointer flex items-start space-x-3.5 text-left group"
          >
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shrink-0 mt-0.5 group-hover:bg-indigo-600 group-hover:text-white transition-all"><Users className="w-4 h-4" /></div>
            <div>
              <h5 className="text-xs font-bold text-slate-900">Business Profile</h5>
              <p className="text-[10px] text-slate-500 mt-1">Upload branding logos, choose custom timezone, and configure slugs.</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
