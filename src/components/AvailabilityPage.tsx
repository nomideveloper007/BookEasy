/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Business } from '../types';
import { Calendar, Clock, Plus, Trash2, CheckCircle, Save, Loader2, Sparkles, AlertCircle } from 'lucide-react';

interface AvailabilityPageProps {
  businessId: string;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' }
];

export default function AvailabilityPage({ businessId }: AvailabilityPageProps) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Buffer and Schedule state
  const [bufferTime, setBufferTime] = useState(5);
  const [schedule, setSchedule] = useState<Business['schedule']>({});
  
  // Block date form state
  const [blockedDates, setBlockedDates] = useState<Business['blockedDates']>([]);
  const [newBlockDate, setNewBlockDate] = useState('');
  const [newBlockReason, setNewBlockReason] = useState('');

  useEffect(() => {
    const fetchBusiness = async () => {
      setLoading(true);
      try {
        const docSnap = await getDoc(doc(db, "businesses", businessId));
        if (docSnap.exists()) {
          const data = docSnap.data() as Business;
          setBusiness(data);
          setBufferTime(data.bufferTime || 0);
          setSchedule(data.schedule || {});
          setBlockedDates(data.blockedDates || []);
        } else {
          setError("Business profile not found.");
        }
      } catch (err: any) {
        console.error("Error loading availability:", err);
        setError("Failed to load availability configuration.");
      } finally {
        setLoading(false);
      }
    };

    if (businessId) {
      fetchBusiness();
    }
  }, [businessId]);

  const handleToggleDay = (day: number) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        active: !prev[day]?.active
      }
    }));
  };

  const handleTimeChange = (day: number, field: 'startTime' | 'endTime', value: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleAddBlockDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockDate) return;

    // Check if already blocked
    if (blockedDates.some(b => b.date === newBlockDate)) {
      setError("This date is already blocked.");
      return;
    }

    const updated = [...blockedDates, { date: newBlockDate, reason: newBlockReason || 'Holiday / Day Off' }]
      .sort((a, b) => a.date.localeCompare(b.date));

    setBlockedDates(updated);
    setNewBlockDate('');
    setNewBlockReason('');
    setError(null);
  };

  const handleRemoveBlockDate = (indexToRemove: number) => {
    const updated = blockedDates.filter((_, idx) => idx !== indexToRemove);
    setBlockedDates(updated);
  };

  const handleSaveAll = async () => {
    if (!businessId) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const bizRef = doc(db, "businesses", businessId);
      await updateDoc(bizRef, {
        bufferTime: Number(bufferTime),
        schedule: schedule,
        blockedDates: blockedDates
      });
      setSuccess("Availability and settings successfully updated!");
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error("Error saving availability:", err);
      setError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans max-w-4xl text-slate-600">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-slate-900">Availability & Schedule</h1>
          <p className="text-slate-500 text-sm mt-1">Set up your weekly business hours, buffer times between clients, and block vacation days.</p>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 transition flex items-center justify-center space-x-2 shadow-md shadow-indigo-100 cursor-pointer"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'Saving...' : 'Save All Changes'}</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl flex items-start space-x-2 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl flex items-start space-x-2 text-sm">
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Grid of availability adjustments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Weekly Business Hours */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="font-display font-bold text-lg text-slate-900 flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Clock className="w-5 h-5 text-slate-500" />
              <span>Weekly Operating Hours</span>
            </h2>

            <div className="space-y-4">
              {DAYS_OF_WEEK.map((day) => {
                const dayConfig = schedule[day.value] || { active: false, startTime: '09:00', endTime: '17:00' };
                return (
                  <div key={day.value} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-100 hover:bg-slate-50/50 transition-all">
                    <div className="flex items-center space-x-3 min-w-[120px]">
                      <input
                        type="checkbox"
                        checked={dayConfig.active}
                        onChange={() => handleToggleDay(day.value)}
                        className="w-5 h-5 text-indigo-600 rounded-lg border-slate-300 focus:ring-indigo-500/30 accent-indigo-600 cursor-pointer"
                        id={`check-day-${day.value}`}
                      />
                      <label htmlFor={`check-day-${day.value}`} className={`text-sm font-bold cursor-pointer ${dayConfig.active ? 'text-slate-900' : 'text-slate-400'}`}>
                        {day.label}
                      </label>
                    </div>

                    {dayConfig.active ? (
                      <div className="flex items-center space-x-2 text-sm">
                        <input
                          type="time"
                          value={dayConfig.startTime}
                          onChange={(e) => handleTimeChange(day.value, 'startTime', e.target.value)}
                          className="px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                        />
                        <span className="text-slate-400 font-medium">to</span>
                        <input
                          type="time"
                          value={dayConfig.endTime}
                          onChange={(e) => handleTimeChange(day.value, 'endTime', e.target.value)}
                          className="px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium italic">Closed for appointments</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: Buffer Time & Block Dates */}
        <div className="space-y-6">
          {/* Buffer Time */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-base text-slate-900 flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Clock className="w-4.5 h-4.5 text-slate-500" />
              <span>Buffer Time Between Bookings</span>
            </h3>
            <div>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">
                Choose how many buffer minutes you need between bookings to catch your breath, clean up, or prepare for your next client.
              </p>
              <select
                value={bufferTime}
                onChange={(e) => setBufferTime(Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white cursor-pointer"
              >
                <option value={0}>No Buffer (Back-to-Back)</option>
                <option value={5}>5 Minutes</option>
                <option value={10}>10 Minutes</option>
                <option value={15}>15 Minutes</option>
                <option value={20}>20 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>1 Hour</option>
              </select>
            </div>
          </div>

          {/* Block Specific Dates */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-base text-slate-900 flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Calendar className="w-4.5 h-4.5 text-slate-500" />
              <span>Block Vacation & Days Off</span>
            </h3>

            {/* Block date form */}
            <form onSubmit={handleAddBlockDate} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pick Date</label>
                <input
                  type="date"
                  required
                  value={newBlockDate}
                  onChange={(e) => setNewBlockDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Reason / Description</label>
                <input
                  type="text"
                  value={newBlockReason}
                  onChange={(e) => setNewBlockReason(e.target.value)}
                  placeholder="e.g. Christmas, Staff Retreat"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-slate-100 text-slate-800 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Date Block</span>
              </button>
            </form>

            <hr className="border-slate-100" />

            {/* Blocked dates list */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {blockedDates.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 italic">
                  No custom date blocks configured.
                </div>
              ) : (
                blockedDates.map((block, idx) => (
                  <div key={`${block.date}-${idx}`} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <p className="font-bold text-slate-900">
                        {new Date(block.date + "T00:00:00").toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-slate-500 mt-0.5 truncate max-w-[150px] font-medium">{block.reason}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveBlockDate(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                      title="Remove block"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
