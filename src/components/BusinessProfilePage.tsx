/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Business } from '../types';
import { 
  Loader2, 
  Save, 
  CheckCircle, 
  Briefcase, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Sparkles, 
  AlertCircle, 
  Eye, 
  ToggleLeft, 
  ToggleRight,
  Instagram,
  Facebook,
  Grid,
  Users
} from 'lucide-react';

interface BusinessProfilePageProps {
  businessId: string;
  appUrl: string;
}

const GRADIENTS = [
  { name: 'Indigo Dream', value: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' },
  { name: 'Ocean Breeze', value: 'bg-gradient-to-r from-blue-500 to-teal-500 text-white' },
  { name: 'Sunset Coral', value: 'bg-gradient-to-r from-rose-500 to-orange-500 text-white' },
  { name: 'Forest Green', value: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white' },
  { name: 'Midnight Matte', value: 'bg-gradient-to-r from-slate-800 to-slate-950 text-white' }
];

export default function BusinessProfilePage({ businessId, appUrl }: BusinessProfilePageProps) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [timezone, setTimezone] = useState('America/New_York');

  // Expanded fields
  const [category, setCategory] = useState('Barber/Salon');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [bannerGradient, setBannerGradient] = useState(GRADIENTS[0].value);
  const [staffText, setStaffText] = useState('');

  // Notification states
  const [emailOnBooking, setEmailOnBooking] = useState(true);
  const [emailOnCancellation, setEmailOnCancellation] = useState(true);
  const [sendReminders, setSendReminders] = useState(true);

  useEffect(() => {
    const fetchBusiness = async () => {
      setLoading(true);
      try {
        const docSnap = await getDoc(doc(db, "businesses", businessId));
        if (docSnap.exists()) {
          const data = docSnap.data() as Business;
          setBusiness(data);
          setName(data.name || '');
          setSlug(data.slug || '');
          setDescription(data.description || '');
          setAddress(data.address || '');
          setLogoUrl(data.logoUrl || '');
          setContactEmail(data.contactEmail || '');
          setContactPhone(data.contactPhone || '');
          setTimezone(data.timezone || 'America/New_York');

          // Set expanded profile fields
          setCategory(data.category || 'Barber/Salon');
          setInstagramUrl(data.instagramUrl || '');
          setWebsiteUrl(data.websiteUrl || '');
          setFacebookUrl(data.facebookUrl || '');
          setBannerGradient(data.bannerGradient || GRADIENTS[0].value);
          setStaffText(data.staffMembers ? data.staffMembers.join(', ') : '');

          if (data.notificationSettings) {
            setEmailOnBooking(data.notificationSettings.emailOnBooking ?? true);
            setEmailOnCancellation(data.notificationSettings.emailOnCancellation ?? true);
            setSendReminders(data.notificationSettings.sendReminders ?? true);
          }
        } else {
          setError("Business profile not found.");
        }
      } catch (err: any) {
        console.error("Error loading business profile:", err);
        setError("Failed to load business profile.");
      } finally {
        setLoading(false);
      }
    };

    if (businessId) {
      fetchBusiness();
    }
  }, [businessId]);

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/--+/g, '-');
    setSlug(value);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim() || !contactEmail.trim()) {
      setError("Please fill out all required fields.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    // Convert staff comma list to array
    const staffArray = staffText
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    try {
      // 1. Verify slug is unique (if it changed)
      if (slug !== business?.slug) {
        const q = query(collection(db, "businesses"), where("slug", "==", slug));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          throw new Error("This booking link slug is already taken. Please pick another one!");
        }
      }

      // 2. Save Business profile
      const bizRef = doc(db, "businesses", businessId);
      await updateDoc(bizRef, {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
        address: address.trim(),
        logoUrl: logoUrl.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        timezone,
        category,
        instagramUrl: instagramUrl.trim(),
        websiteUrl: websiteUrl.trim(),
        facebookUrl: facebookUrl.trim(),
        bannerGradient,
        staffMembers: staffArray,
        notificationSettings: {
          emailOnBooking,
          emailOnCancellation,
          sendReminders
        }
      });

      setSuccess("Profile settings updated successfully!");
      
      // Update local state copy
      if (business) {
        setBusiness({
          ...business,
          name,
          slug,
          description,
          address,
          logoUrl,
          contactEmail,
          contactPhone,
          timezone,
          category,
          instagramUrl,
          websiteUrl,
          facebookUrl,
          bannerGradient,
          staffMembers: staffArray,
          notificationSettings: {
            emailOnBooking,
            emailOnCancellation,
            sendReminders
          }
        });
      }

      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error("Error saving business profile:", err);
      setError(err.message || "Failed to update business profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const publicBookingUrl = `${appUrl || window.location.origin}/?b=${slug}`;

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
          <h1 className="text-2xl font-display font-bold tracking-tight text-slate-900">Business Profile</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your customer-facing business details, cover design, social feeds, and team.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 transition flex items-center justify-center space-x-2 shadow-md shadow-indigo-100 cursor-pointer"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'Saving...' : 'Save Profile Settings'}</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl flex items-start space-x-2 text-sm animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl flex items-start space-x-2 text-sm animate-in fade-in duration-200">
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Shareable Link Display Banner */}
      <div className="p-6 bg-slate-900 text-white rounded-3xl shadow-lg shadow-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h4 className="font-display font-bold text-sm text-slate-200">Your Shareable Public Booking Link</h4>
          <p className="text-slate-400 text-xs mt-0.5">Share this URL on social bios, texts, or website buttons so clients can self-book.</p>
          <p className="font-mono text-sm text-slate-300 mt-2 select-all bg-slate-800 px-3 py-1.5 rounded-lg w-fit border border-slate-700/50">
            {publicBookingUrl}
          </p>
        </div>
        <a 
          href={publicBookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 shrink-0 transition-all shadow-md shadow-indigo-500/25 cursor-pointer"
        >
          <Eye className="w-4 h-4" />
          <span>View Public Page</span>
        </a>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Core Profile Data fields */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Cover & Brand Styling */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="font-display font-bold text-lg text-slate-900 flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Sparkles className="w-5 h-5 text-slate-500" />
              <span>Cover Design & Brand Category</span>
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Business Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white cursor-pointer"
                >
                  <option value="Barber/Salon">Barber & Hair Salon</option>
                  <option value="Wellness/Spa">Wellness & Spa / Massage</option>
                  <option value="Fitness/Coach">Personal Training & Fitness</option>
                  <option value="Tutors/Classes">Tutors & Classes / Education</option>
                  <option value="Cleaning/Contractor">Cleaning & Household Services</option>
                  <option value="Therapist/Counselor">Therapy & Counseling</option>
                  <option value="Consulting/Agency">Consulting & Professional Services</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Public Cover Gradient Banner</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {GRADIENTS.map((g, index) => {
                    const isSelected = bannerGradient === g.value;
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setBannerGradient(g.value)}
                        className={`h-16 rounded-xl border-2 p-2 flex flex-col justify-end text-left cursor-pointer transition ${isSelected ? 'border-indigo-600 ring-2 ring-indigo-500/20' : 'border-slate-200'}`}
                      >
                        <div className={`w-full h-4 rounded-md mb-1 ${g.value}`} />
                        <span className="text-[10px] font-bold text-slate-700">{g.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="font-display font-bold text-lg text-slate-900 flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Briefcase className="w-5 h-5 text-slate-500" />
              <span>Public Business Info</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Business Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Booking Slug (Unique Link) *</label>
                <div className="relative rounded-xl shadow-sm flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 text-slate-500 text-xs font-mono">
                    b=
                  </span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={handleSlugChange}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-r-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Logo / Avatar Image URL</label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/your-logo"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Address / Location *</label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Business Description</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Write a warm greeting or describe what your studio does..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Social Links & Web feeds */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="font-display font-bold text-lg text-slate-900 flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Grid className="w-5 h-5 text-slate-500" />
              <span>Social Links & Website</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Website Link</label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Instagram Link</label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Instagram className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="https://instagram.com/handle"
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Facebook Page</label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Facebook className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    value={facebookUrl}
                    onChange={(e) => setFacebookUrl(e.target.value)}
                    placeholder="https://facebook.com/page"
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Staff & Notifications */}
        <div className="space-y-6">
          {/* Team / Staff list */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-base text-slate-900 border-b border-slate-100 pb-3 flex items-center space-x-2">
              <Users className="w-4.5 h-4.5 text-indigo-500" />
              <span>Team & Staff</span>
            </h3>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Staff Members Names (comma-separated)</label>
              <textarea
                rows={3}
                value={staffText}
                onChange={(e) => setStaffText(e.target.value)}
                placeholder="Jessica (Stylist), Michael (Colors), Sarah"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white leading-normal"
              />
              <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                List staff names separated by commas. These will display on your public booking page.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="font-display font-bold text-base text-slate-900 border-b border-slate-100 pb-3 flex items-center space-x-2">
              <Mail className="w-4.5 h-4.5 text-slate-500" />
              <span>Owner & Contact Info</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Contact Email *</label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="(555) 019-2834"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Operating Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white cursor-pointer"
                >
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-base text-slate-900 border-b border-slate-100 pb-3 flex items-center space-x-2">
              <Sparkles className="w-4.5 h-4.5 text-indigo-500" />
              <span>Reminders & Alerts</span>
            </h3>

            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3 p-1 hover:bg-slate-50/50 rounded-xl transition">
                <div>
                  <h5 className="text-xs font-semibold text-slate-900">Email on New Booking</h5>
                  <p className="text-[9px] text-slate-550 leading-tight mt-0.5">Send a confirmation email to the owner immediately after a client books.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEmailOnBooking(!emailOnBooking)}
                  className="text-slate-400 hover:text-indigo-600 transition shrink-0 cursor-pointer"
                >
                  {emailOnBooking ? <ToggleRight className="w-7 h-7 text-indigo-600" /> : <ToggleLeft className="w-7 h-7 text-slate-300" />}
                </button>
              </div>

              <div className="flex items-start justify-between gap-3 p-1 hover:bg-slate-50/50 rounded-xl transition">
                <div>
                  <h5 className="text-xs font-semibold text-slate-900">Email on Cancellation</h5>
                  <p className="text-[9px] text-slate-550 leading-tight mt-0.5">Alert the owner immediately if a client cancels or reschedules an appointment.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEmailOnCancellation(!emailOnCancellation)}
                  className="text-slate-400 hover:text-indigo-600 transition shrink-0 cursor-pointer"
                >
                  {emailOnCancellation ? <ToggleRight className="w-7 h-7 text-indigo-600" /> : <ToggleLeft className="w-7 h-7 text-slate-300" />}
                </button>
              </div>

              <div className="flex items-start justify-between gap-3 p-1 hover:bg-slate-50/50 rounded-xl transition">
                <div>
                  <h5 className="text-xs font-semibold text-slate-900">Automated Reminders (24h/1h)</h5>
                  <p className="text-[9px] text-slate-550 leading-tight mt-0.5">Auto-send simulated notifications before start times to prevent no-shows.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSendReminders(!sendReminders)}
                  className="text-slate-400 hover:text-indigo-600 transition shrink-0 cursor-pointer"
                >
                  {sendReminders ? <ToggleRight className="w-7 h-7 text-indigo-600" /> : <ToggleLeft className="w-7 h-7 text-slate-300" />}
                </button>
              </div>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
