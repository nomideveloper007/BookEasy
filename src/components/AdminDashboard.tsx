/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where,
  setDoc,
  addDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { AppUser, Business, Booking, SupportTicket } from '../types';
import { 
  Users, 
  Briefcase, 
  Calendar, 
  DollarSign, 
  Search, 
  ShieldAlert, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  MessageSquare, 
  ChevronRight, 
  Send,
  AlertCircle,
  HelpCircle,
  BarChart3,
  CreditCard,
  Settings,
  UserCheck,
  UserX,
  LogOut
} from 'lucide-react';

interface AdminDashboardProps {
  adminUser: AppUser;
  onLogout: () => void;
}

export default function AdminDashboard({ adminUser, onLogout }: AdminDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'shops' | 'clients' | 'tickets' | 'applications' | 'settings'>('analytics');
  const [loading, setLoading] = useState(true);
  
  // Platform records from database
  const [users, setUsers] = useState<AppUser[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);

  // Search & filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Selected support ticket detail modal/view
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketReply, setTicketReply] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchPlatformData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Users
      const usersSnap = await getDocs(collection(db, "users"));
      const usersList: AppUser[] = [];
      usersSnap.forEach(d => {
        usersList.push({ uid: d.id, ...d.data() } as AppUser);
      });
      setUsers(usersList);

      // 2. Fetch Businesses
      const bizSnap = await getDocs(collection(db, "businesses"));
      const bizList: Business[] = [];
      bizSnap.forEach(d => {
        bizList.push({ id: d.id, ...d.data() } as Business);
      });
      setBusinesses(bizList);

      // 3. Fetch Bookings
      const bookingsSnap = await getDocs(collection(db, "bookings"));
      const bookingsList: Booking[] = [];
      bookingsSnap.forEach(d => {
        bookingsList.push({ id: d.id, ...d.data() } as Booking);
      });
      setBookings(bookingsList);

      // 4. Fetch Support Tickets
      try {
        const ticketsSnap = await getDocs(collection(db, "supportTickets"));
        const ticketsList: SupportTicket[] = [];
        ticketsSnap.forEach(d => {
          ticketsList.push({ id: d.id, ...d.data() } as SupportTicket);
        });
        setTickets(ticketsList);
      } catch (ticketErr) {
        console.error("Non-blocking support tickets load failure:", ticketErr);
      }

      // 5. Fetch Partner Applications
      try {
        const appsSnap = await getDocs(collection(db, "partnerApplications"));
        const appsList: any[] = [];
        appsSnap.forEach(d => {
          appsList.push({ id: d.id, ...d.data() });
        });
        setApplications(appsList);
      } catch (appErr) {
        console.error("Non-blocking partner applications load failure:", appErr);
      }

    } catch (err: any) {
      console.error("Error loading admin data:", err);
      setError("Failed to sync platform records. Check Firestore Security Rules.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlatformData();
  }, []);

  const triggerNotification = (type: 'success' | 'error', msg: string) => {
    if (type === 'success') {
      setSuccess(msg);
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(msg);
      setTimeout(() => setError(null), 4000);
    }
  };

  // Actions
  const handleToggleShopSuspension = async (biz: Business) => {
    const newStatus = biz.status === 'suspended' ? 'active' : 'suspended';
    try {
      // 1. Update business record
      await updateDoc(doc(db, "businesses", biz.id), { status: newStatus });
      
      // 2. Find owner user uid and suspend their user doc too
      const ownerUser = users.find(u => u.uid === biz.ownerUserId);
      if (ownerUser) {
        await updateDoc(doc(db, "users", ownerUser.uid), { status: newStatus });
      }

      setBusinesses(prev => prev.map(b => b.id === biz.id ? { ...b, status: newStatus } : b));
      setUsers(prev => prev.map(u => u.uid === biz.ownerUserId ? { ...u, status: newStatus } : u));
      triggerNotification('success', `Business '${biz.name}' has been ${newStatus === 'suspended' ? 'suspended' : 'reactivated'} successfully.`);
    } catch (err: any) {
      console.error(err);
      triggerNotification('error', `Failed to toggle business suspension status.`);
    }
  };

  const handleToggleClientSuspension = async (client: AppUser) => {
    const newStatus = client.status === 'suspended' ? 'active' : 'suspended';
    try {
      await updateDoc(doc(db, "users", client.uid), { status: newStatus });
      setUsers(prev => prev.map(u => u.uid === client.uid ? { ...u, status: newStatus } : u));
      triggerNotification('success', `Client account '${client.email}' has been ${newStatus === 'suspended' ? 'suspended' : 'reactivated'}.`);
    } catch (err: any) {
      console.error(err);
      triggerNotification('error', `Failed to toggle client suspension.`);
    }
  };

  const handleChangeShopPlan = async (bizId: string, newPlan: 'free' | 'pro' | 'team') => {
    try {
      await updateDoc(doc(db, "businesses", bizId), { planId: newPlan });
      setBusinesses(prev => prev.map(b => b.id === bizId ? { ...b, planId: newPlan } : b));
      triggerNotification('success', `Subscription plan upgraded to ${newPlan.toUpperCase()} successfully.`);
    } catch (err: any) {
      console.error(err);
      triggerNotification('error', `Failed to update subscription plan.`);
    }
  };

  const handleSubmitTicketReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !ticketReply.trim()) return;

    setSubmittingReply(true);
    try {
      const updatedResponses = selectedTicket.responses || [];
      const newResponse = {
        senderId: adminUser.uid,
        senderEmail: adminUser.email,
        message: ticketReply.trim(),
        createdAt: new Date().toISOString()
      };

      const finalResponses = [...updatedResponses, newResponse];
      
      await updateDoc(doc(db, "supportTickets", selectedTicket.id), {
        responses: finalResponses,
        status: 'closed' // Automatically mark responded tickets as resolved or closed
      });

      const updatedTicketObj = { 
        ...selectedTicket, 
        responses: finalResponses,
        status: 'closed' as const
      };

      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? updatedTicketObj : t));
      setSelectedTicket(updatedTicketObj);
      setTicketReply('');
      triggerNotification('success', 'Your response has been sent and ticket marked as closed.');
    } catch (err: any) {
      console.error(err);
      triggerNotification('error', 'Failed to reply to support ticket.');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleApproveApp = async (app: any) => {
    try {
      const businessId = `biz_${Date.now()}`;
      const baseSlug = app.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const slug = `${baseSlug || 'business'}-${randomSuffix}`;
      
      // 1. Update application status
      await updateDoc(doc(db, "partnerApplications", app.id), {
        status: 'approved',
        businessId,
        slug
      });

      // 2. Pre-create the business page config template
      await setDoc(doc(db, "businesses", businessId), {
        id: businessId,
        ownerUserId: '', // Set on activation password setup step
        name: app.businessName,
        slug: slug,
        category: app.profession,
        subcategory: app.subcategory || '',
        description: app.description,
        address: `${app.address}${app.suite ? `, ${app.suite}` : ''}, ${app.city}, ${app.state} ${app.zip}`,
        timezone: "Asia/Karachi",
        contactEmail: app.email,
        contactPhone: app.phone,
        planId: "free",
        status: "active",
        createdAt: new Date().toISOString(),
        bufferTime: 5,
        notificationSettings: {
          emailOnBooking: true,
          emailOnCancellation: true,
          sendReminders: true
        },
        schedule: {
          1: { active: true, startTime: "09:00", endTime: "17:00" },
          2: { active: true, startTime: "09:00", endTime: "17:00" },
          3: { active: true, startTime: "09:00", endTime: "17:00" },
          4: { active: true, startTime: "09:00", endTime: "17:00" },
          5: { active: true, startTime: "09:00", endTime: "17:00" },
          6: { active: false, startTime: "09:00", endTime: "17:00" },
          0: { active: false, startTime: "09:00", endTime: "17:00" }
        },
        blockedDates: []
      });

      // 3. Create default service package
      await addDoc(collection(db, "services"), {
        businessId,
        name: "Standard Booking Consultation",
        durationMinutes: 45,
        price: 1500,
        description: "Primary assessment and styling service slot."
      });

      // 4. Send email notification inside mock mailbox
      await addDoc(collection(db, "mockEmails"), {
        to: app.email,
        subject: "🎉 Your Partner Application is Approved! Set Your Password",
        body: `Dear ${app.firstName},\n\nCongratulations! Your application to become a BookEasy Partner has been approved by our administrators.\n\nTo activate your profile, claim your business page (${app.businessName}), and set your dashboard password, click the activation link below:\n\n`,
        activationApplicationId: app.id,
        createdAt: new Date().toISOString()
      });

      triggerNotification('success', `Application for ${app.businessName} approved! Verification email sent.`);
      fetchPlatformData();
      setSelectedApp(null);
    } catch (err: any) {
      console.error(err);
      triggerNotification('error', 'Failed to approve partner application.');
    }
  };

  const handleRejectApp = async (app: any) => {
    try {
      await updateDoc(doc(db, "partnerApplications", app.id), {
        status: 'rejected'
      });
      triggerNotification('success', `Application for ${app.businessName} has been rejected.`);
      fetchPlatformData();
      setSelectedApp(null);
    } catch (err: any) {
      console.error(err);
      triggerNotification('error', 'Failed to reject partner application.');
    }
  };

  // Computations
  const totalShopsCount = businesses.length;
  const totalClientsCount = users.filter(u => u.role === 'client').length;
  const totalBookingsCount = bookings.length;
  
  // Simulated Platform Revenue Calculation
  // Plan values: free = $0, pro = $15, team = $35
  const monthlyPlatformRevenue = businesses.reduce((acc, biz) => {
    if (biz.status === 'suspended') return acc;
    if (biz.planId === 'pro') return acc + 15;
    if (biz.planId === 'team') return acc + 35;
    return acc;
  }, 0);

  const openTicketsCount = tickets.filter(t => t.status === 'open').length;

  // Filtered lists
  const filteredShops = businesses.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          b.contactEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = planFilter === 'all' || b.planId === planFilter;
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  const filteredClients = users.filter(u => {
    if (u.role !== 'client') return false;
    const matchesSearch = u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (u.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (u.phone || '').includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingApplicationsCount = applications.filter(a => a.status === 'pending').length;

  return (
    <div id="admin-workspace-inner" className="w-full min-h-screen bg-slate-50 p-6 sm:p-8 md:p-10 space-y-6 font-sans text-slate-650 max-w-7xl mx-auto">
      
      {/* Premium Admin Header & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-slate-900">Admin Control Center</h1>
          <p className="text-slate-555 text-xs mt-1">Platform monitoring, business accounts, client database registry, and support queues.</p>
        </div>
        
        {/* Navigation tabs & Log Out */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/50 w-fit shrink-0">
            <button 
              onClick={() => setActiveSubTab('analytics')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition ${activeSubTab === 'analytics' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Analytics
            </button>
            <button 
              onClick={() => setActiveSubTab('shops')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition ${activeSubTab === 'shops' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Shops
            </button>
            <button 
              onClick={() => setActiveSubTab('clients')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition ${activeSubTab === 'clients' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Clients
            </button>
            <button 
              onClick={() => setActiveSubTab('tickets')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition ${activeSubTab === 'tickets' ? 'bg-white text-indigo-600 shadow-sm relative' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Support Queue {openTicketsCount > 0 && `(${openTicketsCount})`}
            </button>
            <button 
              onClick={() => setActiveSubTab('applications')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition ${activeSubTab === 'applications' ? 'bg-white text-indigo-600 shadow-sm relative' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Applications {pendingApplicationsCount > 0 && `(${pendingApplicationsCount})`}
            </button>
            <button 
              onClick={() => setActiveSubTab('settings')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition ${activeSubTab === 'settings' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Settings
            </button>
          </div>

          <button
            onClick={onLogout}
            className="px-3.5 py-1.5 border border-rose-250 bg-rose-50/50 hover:bg-rose-50 text-rose-600 text-xs font-bold rounded-xl transition cursor-pointer flex items-center space-x-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Stats grid */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-xs font-bold uppercase tracking-widest">Active Shops</span>
                <Briefcase className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900">{businesses.filter(b => b.status === 'active').length}</div>
              <p className="text-[10px] text-slate-400">{businesses.filter(b => b.status === 'suspended').length} suspended</p>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-xs font-bold uppercase tracking-widest">Total Clients</span>
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900">{totalClientsCount}</div>
              <p className="text-[10px] text-slate-400">Across all registered shops</p>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-xs font-bold uppercase tracking-widest">Total Bookings</span>
                <Calendar className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900">{totalBookingsCount}</div>
              <p className="text-[10px] text-slate-400">Processed by BookEasy</p>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-xs font-bold uppercase tracking-widest">Platform MRR</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900">${monthlyPlatformRevenue}</div>
              <p className="text-[10px] text-emerald-500 font-semibold font-sans">Simulated subscription total</p>
            </div>
          </div>

          {/* Plan Distribution */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <span>Plan Distribution</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Free Tier</p>
                <p className="text-xl font-bold text-slate-900">{businesses.filter(b => b.planId === 'free').length} Businesses</p>
                <p className="text-[10px] text-slate-400">$0 / month limit 20 bookings</p>
              </div>

              <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl text-center space-y-1">
                <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Pro Tier ($15/mo)</p>
                <p className="text-xl font-bold text-indigo-900">{businesses.filter(b => b.planId === 'pro').length} Businesses</p>
                <p className="text-[10px] text-indigo-600 font-semibold">MRR: ${businesses.filter(b => b.planId === 'pro').length * 15}</p>
              </div>

              <div className="p-4 bg-violet-50/50 border border-violet-100 rounded-xl text-center space-y-1">
                <p className="text-xs font-bold text-violet-500 uppercase tracking-widest">Team Tier ($35/mo)</p>
                <p className="text-xl font-bold text-violet-900">{businesses.filter(b => b.planId === 'team').length} Businesses</p>
                <p className="text-[10px] text-violet-600 font-semibold">MRR: ${businesses.filter(b => b.planId === 'team').length * 35}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB: SHOPS */}
      {activeSubTab === 'shops' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search shops by name, slug or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="all">All Plans</option>
                <option value="free">Free Plan</option>
                <option value="pro">Pro Plan</option>
                <option value="team">Team Plan</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {filteredShops.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                No shop owners matched the search criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                      <th className="p-4">Business / Slug</th>
                      <th className="p-4">Contact Email</th>
                      <th className="p-4">Billing Plan</th>
                      <th className="p-4">Bookings</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredShops.map((biz) => {
                      const bizBookings = bookings.filter(b => b.businessId === biz.id);
                      return (
                        <tr key={biz.id} className="hover:bg-slate-50/50 transition">
                          <td className="p-4">
                            <div className="font-bold text-slate-900">{biz.name}</div>
                            <div className="text-xs text-slate-400">/{biz.slug}</div>
                          </td>
                          <td className="p-4 text-slate-600">{biz.contactEmail}</td>
                          <td className="p-4">
                            <select
                              value={biz.planId}
                              onChange={(e) => handleChangeShopPlan(biz.id, e.target.value as any)}
                              className="px-2.5 py-1 border border-slate-200 bg-white rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            >
                              <option value="free">Free</option>
                              <option value="pro">Pro ($15)</option>
                              <option value="team">Team ($35)</option>
                            </select>
                          </td>
                          <td className="p-4 font-semibold text-slate-700">
                            {bizBookings.length} bookings
                          </td>
                          <td className="p-4">
                            {biz.status === 'suspended' ? (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
                                <XCircle className="w-3 h-3" />
                                <span>Suspended</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                <CheckCircle className="w-3 h-3" />
                                <span>Active</span>
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleToggleShopSuspension(biz)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                                biz.status === 'suspended'
                                  ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700'
                                  : 'bg-white border-rose-200 text-rose-600 hover:bg-rose-50'
                              }`}
                            >
                              {biz.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB: CLIENTS */}
      {activeSubTab === 'clients' && (
        <div className="space-y-6">
          <div className="flex gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search clients by email, name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {filteredClients.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                No clients found matching query.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                      <th className="p-4">Client User</th>
                      <th className="p-4">Name / Contact</th>
                      <th className="p-4">Signup Date</th>
                      <th className="p-4">Appointments</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredClients.map((client) => {
                      const clientBookings = bookings.filter(b => b.clientUserId === client.uid);
                      return (
                        <tr key={client.uid} className="hover:bg-slate-50/50 transition">
                          <td className="p-4">
                            <div className="font-bold text-slate-900">{client.email}</div>
                            <div className="text-[10px] text-slate-400">UID: {client.uid}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-slate-700 font-semibold">{client.fullName || 'No Name Provided'}</div>
                            <div className="text-xs text-slate-400">{client.phone || 'No Phone'}</div>
                          </td>
                          <td className="p-4 text-xs text-slate-500">
                            {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="p-4 font-semibold text-slate-600">
                            {clientBookings.length} booked
                          </td>
                          <td className="p-4">
                            {client.status === 'suspended' ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
                                <span>Suspended</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                <span>Active</span>
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleToggleClientSuspension(client)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                                client.status === 'suspended'
                                  ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700'
                                  : 'bg-white border-rose-200 text-rose-600 hover:bg-rose-50'
                              }`}
                            >
                              {client.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB: SUPPORT TICKETS */}
      {activeSubTab === 'tickets' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[550px]">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="font-bold text-slate-900">Tickets Queue</h3>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {tickets.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  No support tickets raised yet.
                </div>
              ) : (
                tickets.map((ticket) => {
                  return (
                    <button
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`w-full p-4 text-left hover:bg-slate-50 transition flex justify-between items-start cursor-pointer border-b border-slate-100 ${selectedTicket?.id === ticket.id ? 'bg-indigo-50/50 border-l-4 border-l-indigo-600' : ''}`}
                    >
                      <div className="space-y-1.5 max-w-[80%]">
                        <div className="flex items-center space-x-1.5">
                          <span className={`inline-block w-2 h-2 rounded-full ${ticket.status === 'open' ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'}`} />
                          <span className="font-bold text-slate-900 truncate block">{ticket.subject}</span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1">{ticket.message}</p>
                        <div className="text-[10px] text-slate-400">
                          From: {ticket.createdByEmail} ({ticket.roleOfCreator.toUpperCase()})
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${ticket.status === 'open' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                        {ticket.status}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-sm h-[550px] flex flex-col overflow-hidden">
            {selectedTicket ? (
              <div className="flex-1 flex flex-col h-full justify-between">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{selectedTicket.subject}</h3>
                      <p className="text-xs text-slate-400 mt-1">Ticket ID: {selectedTicket.id}</p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${selectedTicket.status === 'open' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                      {selectedTicket.status}
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30">
                  <div className="flex flex-col space-y-1 items-start max-w-[85%]">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedTicket.createdByEmail} ({selectedTicket.roleOfCreator})</span>
                    <div className="p-3 bg-white border border-slate-200 rounded-2xl rounded-tl-none shadow-sm text-sm text-slate-700 leading-relaxed">
                      {selectedTicket.message}
                    </div>
                    <span className="text-[9px] text-slate-400">{new Date(selectedTicket.createdAt).toLocaleString()}</span>
                  </div>

                  {selectedTicket.responses?.map((resp, idx) => {
                    const isAdminSender = resp.senderId === adminUser.uid;
                    return (
                      <div 
                        key={idx} 
                        className={`flex flex-col space-y-1 max-w-[85%] ${isAdminSender ? 'ml-auto items-end' : 'items-start'}`}
                      >
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {isAdminSender ? 'You (Platform Admin)' : resp.senderEmail}
                        </span>
                        <div className={`p-3 border shadow-sm text-sm leading-relaxed rounded-2xl ${isAdminSender ? 'bg-indigo-600 border-indigo-600 text-white rounded-tr-none' : 'bg-white border-slate-200 text-slate-700 rounded-tl-none'}`}>
                          {resp.message}
                        </div>
                        <span className="text-[9px] text-slate-400">{new Date(resp.createdAt).toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>

                <form onSubmit={handleSubmitTicketReply} className="p-4 border-t border-slate-100 flex gap-2">
                  <input
                    type="text"
                    required
                    disabled={submittingReply}
                    value={ticketReply}
                    onChange={(e) => setTicketReply(e.target.value)}
                    placeholder="Type response and press Send (auto closes ticket)..."
                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={submittingReply || !ticketReply.trim()}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center transition shadow-md shadow-indigo-100 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none cursor-pointer"
                  >
                    {submittingReply ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-2 p-8">
                <HelpCircle className="w-10 h-10 text-slate-300" />
                <p className="font-semibold text-sm">No ticket selected</p>
                <p className="text-xs text-slate-400 max-w-xs text-center">Click a support ticket on the left to read and reply.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB: APPLICATIONS */}
      {activeSubTab === 'applications' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: Applications List */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col space-y-4">
            <h3 className="text-base font-bold text-slate-900">Partner Applications</h3>
            
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {applications.length === 0 ? (
                <div className="text-center text-slate-400 py-8 text-xs font-semibold">No applications found.</div>
              ) : (
                applications.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition flex flex-col space-y-1 ${
                      selectedApp?.id === app.id 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500/10' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{app.businessName}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        app.status === 'approved' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : app.status === 'rejected'
                          ? 'bg-rose-50 text-rose-700 border border-rose-100'
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium truncate">{app.firstName} {app.lastName} • {app.profession}</p>
                    <p className="text-[9px] text-slate-400 font-medium">{new Date(app.createdAt).toLocaleDateString()}</p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right: Selected Application Details */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col min-h-[400px]">
            {selectedApp ? (
              <div className="space-y-6 flex-1 flex flex-col justify-between">
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-base font-bold text-slate-900">{selectedApp.businessName}</h4>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">Applied on {new Date(selectedApp.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      selectedApp.status === 'approved' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-150'
                        : selectedApp.status === 'rejected'
                        ? 'bg-rose-50 text-rose-700 border border-rose-150'
                        : 'bg-amber-50 text-amber-700 border border-amber-150'
                    }`}>
                      {selectedApp.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Name</span>
                      <span className="text-xs font-bold text-slate-800">{selectedApp.firstName} {selectedApp.lastName}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Direct Phone</span>
                      <span className="text-xs font-bold text-slate-800">{selectedApp.phone}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</span>
                      <span className="text-xs font-bold text-slate-800">{selectedApp.email}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Profession/Category</span>
                      <span className="text-xs font-bold text-slate-800">{selectedApp.profession}</span>
                    </div>
                    {selectedApp.subcategory && (
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subcategory</span>
                        <span className="text-xs font-bold text-slate-800">{selectedApp.subcategory}</span>
                      </div>
                    )}
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Years in Business</span>
                      <span className="text-xs font-bold text-slate-800">{selectedApp.yearsInBusiness}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Website</span>
                      <span className="text-xs font-bold text-slate-850 truncate">{selectedApp.website || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4 space-y-3">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Business Address</span>
                      <span className="text-xs font-semibold text-slate-700 font-sans">
                        {selectedApp.address}{selectedApp.suite && `, ${selectedApp.suite}`}, {selectedApp.city}, {selectedApp.state} {selectedApp.zip}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Business Description</span>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium mt-0.5">{selectedApp.description}</p>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">What makes you preferred?</span>
                      <p className="text-xs text-slate-650 leading-relaxed font-medium mt-0.5">{selectedApp.whatMakesPreferred}</p>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">How did you hear about us?</span>
                      <p className="text-xs text-slate-650 leading-relaxed font-medium mt-0.5">{selectedApp.hearAboutUs}</p>
                    </div>
                    {selectedApp.additionalInfo && (
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Additional Info</span>
                        <p className="text-xs text-slate-650 leading-relaxed font-medium mt-0.5">{selectedApp.additionalInfo}</p>
                      </div>
                    )}
                  </div>
                </div>

                {selectedApp.status === 'pending' && (
                  <div className="flex items-center space-x-3 pt-6 border-t border-slate-100 mt-4">
                    <button
                      onClick={() => handleApproveApp(selectedApp)}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Approve Partner</span>
                    </button>
                    <button
                      onClick={() => handleRejectApp(selectedApp)}
                      className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject Application</span>
                    </button>
                  </div>
                )}

                {selectedApp.status === 'approved' && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold rounded-xl text-center mt-4">
                    Approved. Activation email link is active in Sandbox Inbox.
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-2 p-8">
                <Briefcase className="w-10 h-10 text-slate-300" />
                <p className="font-semibold text-sm text-slate-650">No application selected</p>
                <p className="text-xs text-slate-400 max-w-xs text-center font-medium">Click a partner application on the left sidebar list to review and update status.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* SUBTAB: SETTINGS */}
      {activeSubTab === 'settings' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-2xl space-y-6">
          <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            <span>Platform System Parameters</span>
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Platform Operation Mode
              </label>
              <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-medium leading-relaxed">
                This platform is running in <strong>Standard Multi-Tenant Simulation mode</strong>. Database queries utilize direct document key filtering combined with structural index bounds to guarantee isolated data contexts.
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                Platform Support Hotline
              </label>
              <input
                type="text"
                disabled
                value="support@bookeasy.com"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 text-slate-400 focus:outline-none"
              />
            </div>
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl space-y-1.5">
              <p className="text-xs font-bold text-indigo-800">Operational Note:</p>
              <p className="text-xs text-indigo-700 leading-relaxed">
                All user profiles suspended in this Admin Panel will immediately lose authorization to write to Firestore or load operational workspace calendars due to structural validation rules checked in components.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav Spacer */}
      <div className="pt-2" />

    </div>
  );
}
