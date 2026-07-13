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
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Service } from '../types';
import { Plus, Trash2, Edit2, Loader2, Sparkles, DollarSign, Clock, FileText, Check, X, AlertCircle } from 'lucide-react';

interface ServicesPageProps {
  businessId: string;
}

export default function ServicesPage({ businessId }: ServicesPageProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(30);
  const [price, setPrice] = useState(40);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "services"), where("businessId", "==", businessId));
      const querySnapshot = await getDocs(q);
      const items: Service[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          businessId: data.businessId,
          name: data.name,
          durationMinutes: Number(data.durationMinutes),
          price: Number(data.price),
          description: data.description || '',
        });
      });
      setServices(items);
    } catch (err: any) {
      console.error("Error loading services:", err);
      setError("Failed to load services. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (businessId) {
      fetchServices();
    }
  }, [businessId]);

  const handleEditClick = (service: Service) => {
    setEditingServiceId(service.id);
    setName(service.name);
    setDuration(service.durationMinutes);
    setPrice(service.price);
    setDescription(service.description);
    setShowForm(true);
  };

  const handleAddNewClick = () => {
    setEditingServiceId(null);
    setName('');
    setDuration(30);
    setPrice(40);
    setDescription('');
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingServiceId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const payload = {
        businessId,
        name,
        durationMinutes: Number(duration),
        price: Number(price),
        description: description.trim()
      };

      if (editingServiceId) {
        // Update service
        const sRef = doc(db, "services", editingServiceId);
        await updateDoc(sRef, payload);
      } else {
        // Add service
        await addDoc(collection(db, "services"), payload);
      }

      await fetchServices();
      setShowForm(false);
    } catch (err: any) {
      console.error("Error saving service:", err);
      setError("Failed to save service. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this service? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "services", id));
      await fetchServices();
    } catch (err: any) {
      console.error("Error deleting service:", err);
      setError("Failed to delete service.");
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-600">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-slate-900">Services Directory</h1>
          <p className="text-slate-500 text-sm mt-1">Configure duration, pricing, and descriptions for what you offer clients.</p>
        </div>
        <button
          onClick={handleAddNewClick}
          className="px-4 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition flex items-center justify-center space-x-1.5 shadow-md shadow-indigo-100 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Service</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl flex items-start space-x-2 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Quick Add / Edit Form Modal-like drawer */}
      {showForm && (
        <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-md space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-display font-bold text-lg text-slate-900">
              {editingServiceId ? 'Edit Service' : 'Create New Service'}
            </h3>
            <button onClick={handleCloseForm} className="p-1.5 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-50 transition cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Service Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Signature Haircut, Personal Training, Consult"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Duration (Minutes)</label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Clock className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  required
                  min={5}
                  max={480}
                  step={5}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Price ($)</label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <DollarSign className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  required
                  min={0}
                  max={10000}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what's included in this service, who it's for, and what to bring..."
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2 flex items-center justify-end space-x-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={handleCloseForm}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 transition shadow-md shadow-indigo-100 flex items-center space-x-1 cursor-pointer"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{saving ? 'Saving...' : 'Save Service'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Services List Display */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : services.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl shadow-sm">
          <Sparkles className="w-10 h-10 text-indigo-500 mx-auto mb-3" />
          <h3 className="font-display font-bold text-slate-900 text-base">No services configured yet</h3>
          <p className="text-slate-500 text-sm mt-1 mb-6 max-w-sm mx-auto">
            Add your first service to let clients start booking your available calendar slots.
          </p>
          <button
            onClick={handleAddNewClick}
            className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition shadow-md shadow-indigo-100 cursor-pointer"
          >
            Create Your First Service
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service) => (
            <div 
              key={service.id} 
              className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col justify-between hover:border-indigo-500 hover:shadow-sm transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-display font-bold text-lg text-slate-900 leading-tight">
                    {service.name}
                  </h3>
                  <div className="flex space-x-1 shrink-0">
                    <button
                      onClick={() => handleEditClick(service)}
                      className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition cursor-pointer"
                      title="Edit Service"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Delete Service"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-xs font-semibold text-slate-500">
                  <span className="flex items-center bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">
                    <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {service.durationMinutes} min
                  </span>
                  <span className="flex items-center bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">
                    <DollarSign className="w-3.5 h-3.5 mr-0.5 text-slate-400" />
                    {service.price}
                  </span>
                </div>

                <p className="text-slate-600 text-sm leading-relaxed pt-2">
                  {service.description || "No description provided."}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
