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
  updateDoc, 
  setDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Business, SupportTicket } from '../types';
import { 
  CreditCard, 
  Check, 
  HelpCircle, 
  Plus, 
  MessageSquare, 
  Send, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Clock
} from 'lucide-react';

// ============================================================================
// OWNER BILLING VIEW
// ============================================================================
interface OwnerBillingViewProps {
  businessId: string;
}

export function OwnerBillingView({ businessId }: OwnerBillingViewProps) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingPlan, setUpdatingPlan] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const loadBusiness = async () => {
      if (!businessId) return;
      try {
        const docSnap = await getDoc(doc(db, "businesses", businessId));
        if (docSnap.exists()) {
          setBusiness(docSnap.data() as Business);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadBusiness();
  }, [businessId]);

  const handleUpgradeDowngrade = async (newPlan: 'free' | 'pro' | 'team') => {
    setUpdatingPlan(true);
    setMsg(null);
    try {
      await updateDoc(doc(db, "businesses", businessId), { planId: newPlan });
      setBusiness(prev => prev ? { ...prev, planId: newPlan } : null);
      setMsg({ type: 'success', text: `Plan updated to ${newPlan.toUpperCase()} successfully.` });
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: 'Failed to update plan. Please try again.' });
    } finally {
      setUpdatingPlan(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="p-6 text-center text-slate-400">
        Could not load business details.
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Title */}
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
          <CreditCard className="w-5 h-5 text-indigo-600" />
          <span>Billing & Subscriptions</span>
        </h2>
        <p className="text-sm text-slate-500 mt-1">Upgrade or downgrade your scheduling capabilities instantly.</p>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl border flex items-center space-x-2 text-sm font-semibold ${msg.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'}`}>
          {msg.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-rose-500" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Pricing Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* FREE */}
        <div className={`bg-white border rounded-3xl p-6 shadow-sm flex flex-col justify-between relative ${business.planId === 'free' ? 'border-2 border-indigo-600 ring-4 ring-indigo-500/10' : 'border-slate-200'}`}>
          {business.planId === 'free' && (
            <span className="absolute -top-3 right-6 px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">Active Plan</span>
          )}
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Free Tier</h3>
              <p className="text-xs text-slate-400 mt-0.5">For new starting pros</p>
            </div>
            <div className="text-2xl font-bold text-slate-900">$0 <span className="text-xs font-medium text-slate-400">/ mo</span></div>
            <ul className="text-xs text-slate-600 space-y-2 border-t border-slate-100 pt-4">
              <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /><span>1 staff member limit</span></li>
              <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /><span>20 bookings/month limit</span></li>
              <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /><span>Email confirmation alerts</span></li>
            </ul>
          </div>
          <button
            onClick={() => handleUpgradeDowngrade('free')}
            disabled={updatingPlan || business.planId === 'free'}
            className="w-full mt-6 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-100 disabled:text-slate-400 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            {business.planId === 'free' ? 'Current Tier' : 'Downgrade to Free'}
          </button>
        </div>

        {/* PRO */}
        <div className={`bg-white border rounded-3xl p-6 shadow-sm flex flex-col justify-between relative ${business.planId === 'pro' ? 'border-2 border-indigo-600 ring-4 ring-indigo-500/10' : 'border-slate-200'}`}>
          {business.planId === 'pro' && (
            <span className="absolute -top-3 right-6 px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">Active Plan</span>
          )}
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Pro Tier</h3>
              <p className="text-xs text-slate-400 mt-0.5">For growing operators</p>
            </div>
            <div className="text-2xl font-bold text-slate-900">$15 <span className="text-xs font-medium text-slate-400">/ mo</span></div>
            <ul className="text-xs text-slate-600 space-y-2 border-t border-slate-100 pt-4">
              <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /><span>Unlimited client bookings</span></li>
              <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /><span>Automated SMS reminders</span></li>
              <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /><span>Custom scheduler branding</span></li>
            </ul>
          </div>
          <button
            onClick={() => handleUpgradeDowngrade('pro')}
            disabled={updatingPlan || business.planId === 'pro'}
            className="w-full mt-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-slate-100 disabled:text-slate-400 font-bold rounded-xl text-xs transition cursor-pointer shadow-md shadow-indigo-100 disabled:shadow-none"
          >
            {business.planId === 'pro' ? 'Current Tier' : 'Upgrade to Pro'}
          </button>
        </div>

        {/* TEAM */}
        <div className={`bg-white border rounded-3xl p-6 shadow-sm flex flex-col justify-between relative ${business.planId === 'team' ? 'border-2 border-indigo-600 ring-4 ring-indigo-500/10' : 'border-slate-200'}`}>
          {business.planId === 'team' && (
            <span className="absolute -top-3 right-6 px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">Active Plan</span>
          )}
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Team Tier</h3>
              <p className="text-xs text-slate-400 mt-0.5">For clinics, salons, groups</p>
            </div>
            <div className="text-2xl font-bold text-slate-900">$35 <span className="text-xs font-medium text-slate-400">/ mo</span></div>
            <ul className="text-xs text-slate-600 space-y-2 border-t border-slate-100 pt-4">
              <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /><span>Multi-staff calendar accounts</span></li>
              <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /><span>Stripe deposit checkout</span></li>
              <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /><span>Business analytics dashboards</span></li>
            </ul>
          </div>
          <button
            onClick={() => handleUpgradeDowngrade('team')}
            disabled={updatingPlan || business.planId === 'team'}
            className="w-full mt-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-slate-100 disabled:text-slate-400 font-bold rounded-xl text-xs transition cursor-pointer shadow-md shadow-indigo-100 disabled:shadow-none"
          >
            {business.planId === 'team' ? 'Current Tier' : 'Upgrade to Team'}
          </button>
        </div>

      </div>

      {/* Payment simulated invoices history */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">Simulated Invoices History</h3>
        <div className="divide-y divide-slate-100">
          <div className="py-3 flex justify-between text-xs">
            <div>
              <span className="font-semibold text-slate-800">BookEasy Subscription (Monthly Plan)</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Invoice #INV-29384 • Credit Card **** 9102</p>
            </div>
            <div className="text-right">
              <span className="font-bold text-slate-950">${business.planId === 'free' ? '0.00' : business.planId === 'pro' ? '15.00' : '35.00'}</span>
              <p className="text-[10px] text-emerald-600 font-bold mt-0.5">Paid Successfully</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

// ============================================================================
// OWNER SUPPORT TICKETS VIEW
// ============================================================================
interface OwnerTicketsViewProps {
  businessId: string;
  email: string;
  uid: string;
}

export function OwnerTicketsView({ businessId, email, uid }: OwnerTicketsViewProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);
  
  // Chat thread
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketReply, setTicketReply] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const loadTickets = async () => {
    try {
      const qSnap = await getDocs(query(collection(db, "supportTickets"), where("createdByUserId", "==", uid)));
      const list: SupportTicket[] = [];
      qSnap.forEach(d => {
        list.push({ id: d.id, ...d.data() } as SupportTicket);
      });
      setTickets(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [uid]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setSubmittingTicket(true);
    setMsg(null);
    try {
      const ticketId = `ticket_${Date.now()}`;
      const newTicket: SupportTicket = {
        id: ticketId,
        createdByUserId: uid,
        createdByEmail: email,
        roleOfCreator: 'shop_owner',
        subject: subject.trim(),
        message: message.trim(),
        status: 'open',
        createdAt: new Date().toISOString(),
        responses: []
      };

      await setDoc(doc(db, "supportTickets", ticketId), newTicket);
      setTickets(prev => [newTicket, ...prev]);
      setSubject('');
      setMessage('');
      setShowForm(false);
      setMsg({ type: 'success', text: 'Support ticket submitted to platform administrator.' });
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: 'Failed to submit support ticket.' });
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !ticketReply.trim()) return;

    setSubmittingReply(true);
    try {
      const updatedResponses = selectedTicket.responses || [];
      const newResponse = {
        senderId: uid,
        senderEmail: email,
        message: ticketReply.trim(),
        createdAt: new Date().toISOString()
      };

      const finalResponses = [...updatedResponses, newResponse];
      await updateDoc(doc(db, "supportTickets", selectedTicket.id), {
        responses: finalResponses,
        status: 'open'
      });

      const updatedObj = { ...selectedTicket, responses: finalResponses, status: 'open' as const };
      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? updatedObj : t));
      setSelectedTicket(updatedObj);
      setTicketReply('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReply(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Title */}
      <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
            <span>Support Tickets</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">Submit help queries directly to BookEasy operators.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer shadow-sm shadow-indigo-100"
        >
          <Plus className="w-4 h-4" />
          <span>Open Ticket</span>
        </button>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl border flex items-center space-x-2 text-sm font-semibold ${msg.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'}`}>
          {msg.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-rose-500" />}
          <span>{msg.text}</span>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreateTicket} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4 max-w-xl animate-in slide-in-from-top duration-250">
          <h3 className="font-bold text-slate-900 text-sm">Raise Help Inquiry</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Subject Title</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Billing query regarding Pro Subscription"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Detailed Message</label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Please describe your question or issue here..."
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingTicket}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-100 cursor-pointer disabled:bg-slate-200"
            >
              {submittingTicket ? 'Submitting...' : 'Submit Support Ticket'}
            </button>
          </div>
        </form>
      )}

      {/* Tickets queue list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl h-[400px] flex flex-col overflow-hidden shadow-sm">
          <div className="p-3 bg-slate-50 border-b border-slate-200">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">History Queue</span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {tickets.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No support requests submitted yet.
              </div>
            ) : (
              tickets.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className={`w-full p-4 text-left hover:bg-slate-50 transition border-b border-slate-100 flex justify-between items-start cursor-pointer ${selectedTicket?.id === t.id ? 'bg-indigo-50/50 border-l-4 border-l-indigo-600' : ''}`}
                >
                  <div className="space-y-1 truncate max-w-[80%]">
                    <span className="font-bold text-slate-900 text-sm block truncate">{t.subject}</span>
                    <span className="text-xs text-slate-500 line-clamp-1">{t.message}</span>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${t.status === 'open' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-650'}`}>
                    {t.status}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl h-[400px] flex flex-col justify-between overflow-hidden shadow-sm">
          {selectedTicket ? (
            <div className="flex-1 flex flex-col justify-between h-full">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-900 text-sm truncate">{selectedTicket.subject}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${selectedTicket.status === 'open' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-650'}`}>
                  {selectedTicket.status}
                </span>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/20">
                {/* Initial query */}
                <div className="flex flex-col items-start space-y-0.5 max-w-[85%]">
                  <div className="p-3 bg-white border border-slate-200 rounded-2xl rounded-tl-none shadow-sm text-xs text-slate-700">
                    {selectedTicket.message}
                  </div>
                  <span className="text-[8px] text-slate-400">{new Date(selectedTicket.createdAt).toLocaleString()}</span>
                </div>

                {/* Responses */}
                {selectedTicket.responses?.map((resp, i) => {
                  const isOperator = resp.senderId !== uid;
                  return (
                    <div key={i} className={`flex flex-col space-y-0.5 max-w-[85%] ${isOperator ? 'items-start' : 'ml-auto items-end'}`}>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{isOperator ? 'Support Agent' : 'You'}</span>
                      <div className={`p-3 border shadow-sm text-xs rounded-2xl ${isOperator ? 'bg-white border-slate-200 text-slate-700 rounded-tl-none' : 'bg-indigo-600 border-indigo-600 text-white rounded-tr-none'}`}>
                        {resp.message}
                      </div>
                      <span className="text-[8px] text-slate-400">{new Date(resp.createdAt).toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleSubmitReply} className="p-3 border-t border-slate-100 flex gap-2">
                <input
                  type="text"
                  required
                  value={ticketReply}
                  onChange={(e) => setTicketReply(e.target.value)}
                  placeholder="Type follow-up message..."
                  className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={submittingReply || !ticketReply.trim()}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center transition shadow-md shadow-indigo-100 disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer"
                >
                  {submittingReply ? <Loader2 className="w-3 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </button>
              </form>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-2 p-8">
              <HelpCircle className="w-8 h-8 text-slate-300" />
              <p className="font-semibold text-xs">No ticket selected</p>
              <p className="text-[10px] text-slate-400 text-center max-w-xs">Select any ticket from list on the left to read replies and write messages.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
