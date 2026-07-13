/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Business {
  id: string;
  ownerUserId: string; // Links business to shop owner
  name: string;
  slug: string;
  description: string;
  address: string;
  logoUrl?: string;
  timezone: string;
  contactEmail: string;
  contactPhone?: string;
  planId: 'free' | 'pro' | 'team';
  status: 'active' | 'suspended';
  createdAt: string;
  bufferTime: number; // in minutes
  notificationSettings: {
    emailOnBooking: boolean;
    emailOnCancellation: boolean;
    sendReminders: boolean; // Toggle for automated simulated reminders
  };
  schedule: {
    [dayOfWeek: number]: {
      active: boolean;
      startTime: string; // e.g. "09:00"
      endTime: string;   // e.g. "17:00"
    };
  };
  blockedDates: {
    date: string; // "YYYY-MM-DD"
    reason: string;
  }[];
  category?: string;
  instagramUrl?: string;
  websiteUrl?: string;
  facebookUrl?: string;
  bannerGradient?: string;
  staffMembers?: string[];
}

export interface Service {
  id: string;
  businessId: string;
  name: string;
  durationMinutes: number;
  price: number;
  description: string;
}

export interface Booking {
  id: string;
  businessId: string;
  serviceId: string;
  serviceName: string;
  serviceDuration: number;
  servicePrice: number;
  clientUserId?: string; // Nullable if guest booking
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  startTime: string; // ISO String (e.g. "2026-07-11T10:00:00Z")
  endTime: string;   // ISO String (e.g. "2026-07-11T10:30:00Z")
  status: 'confirmed' | 'cancelled' | 'completed';
  createdAt: string; // ISO String
  notes?: string;
}

export interface AppUser {
  uid: string;
  email: string;
  role: 'admin' | 'shop_owner' | 'client';
  businessId?: string; // Associated business if shop_owner
  fullName?: string;
  phone?: string;
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  createdByUserId: string;
  createdByEmail: string;
  roleOfCreator: 'admin' | 'shop_owner' | 'client';
  subject: string;
  message: string;
  status: 'open' | 'closed';
  assignedAdminId?: string;
  createdAt: string;
  responses?: {
    senderId: string;
    senderEmail: string;
    message: string;
    createdAt: string;
  }[];
}

export interface Review {
  id: string;
  businessId: string;
  clientUserId: string;
  clientName: string;
  bookingId: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
}
