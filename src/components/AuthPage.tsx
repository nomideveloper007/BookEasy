/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc,
  collection, 
  addDoc 
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Calendar, Mail, Lock, User, Briefcase, ChevronRight, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';

interface AuthPageProps {
  initialMode: 'login' | 'signup';
  onAuthSuccess: (uid: string, businessId: string) => void;
  onBackToLanding: () => void;
  portalType?: 'client' | 'partner';
}

export default function AuthPage({ initialMode, onAuthSuccess, onBackToLanding, portalType = 'client' }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'shop_owner' | 'client'>(portalType === 'partner' ? 'shop_owner' : 'client');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    setRole(portalType === 'partner' ? 'shop_owner' : 'client');
  }, [portalType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const lowercaseEmail = email.toLowerCase().trim();
    const safeDocId = "mock_" + lowercaseEmail.replace(/[^a-z0-9@.]/g, '_');

    try {
      // -------------------------------------------------------------
      // SPECIAL ADMIN PRE-SEED LOGIN CHECK
      // -------------------------------------------------------------
      if (mode === 'login' && lowercaseEmail === 'admin@bookeasy.com' && password === 'admin123') {
        console.log("Admin login matched. Pre-seeding admin account if not exists...");
        const adminUid = "mock_admin_id";
        const adminUserData = {
          uid: adminUid,
          email: lowercaseEmail,
          password: password,
          role: 'admin' as const,
          status: 'active' as const,
          createdAt: new Date().toISOString(),
          isMock: true
        };

        // Write both doc paths for mock user
        await setDoc(doc(db, "users", adminUid), adminUserData);
        await setDoc(doc(db, "users", safeDocId), adminUserData);

        // Store session in localStorage
        localStorage.setItem('bookeasy_mock_user', JSON.stringify({
          uid: adminUid,
          email: lowercaseEmail,
          role: 'admin',
          businessId: '',
          isMock: true
        }));

        onAuthSuccess(adminUid, '');
        setLoading(false);
        return;
      }

      // -------------------------------------------------------------
      // DEVELOPER QUICK SEED FOR CLIENT
      // -------------------------------------------------------------
      if (mode === 'login' && lowercaseEmail === 'client@bookeasy.com' && password === 'client123') {
        console.log("Pre-seeding developer client profile...");
        const clientUid = "mock_client_tester";
        const clientUserData = {
          uid: clientUid,
          email: lowercaseEmail,
          password: password,
          role: 'client' as const,
          status: 'active' as const,
          fullName: "Emily Watson (Client)",
          phone: "(555) 018-2938",
          createdAt: new Date().toISOString(),
          isMock: true
        };

        await setDoc(doc(db, "users", clientUid), clientUserData);
        await setDoc(doc(db, "users", safeDocId), clientUserData);

        localStorage.setItem('bookeasy_mock_user', JSON.stringify({
          uid: clientUid,
          email: lowercaseEmail,
          role: 'client',
          businessId: '',
          isMock: true
        }));

        onAuthSuccess(clientUid, '');
        setLoading(false);
        return;
      }

      // -------------------------------------------------------------
      // DEVELOPER QUICK SEED FOR SHOP OWNER
      // -------------------------------------------------------------
      if (mode === 'login' && lowercaseEmail === 'nomideveloper007@gmail.com' && password === 'Nomi@123') {
        console.log("Pre-seeding developer shop owner profile...");
        const devUid = "mock_user_nomi";
        const devBizId = "biz_nomi_glow";
        const devBizName = "Glow Hair Studio";
        const devSlug = "glow-hair-studio-nomi";

        const defaultBusiness = {
          id: devBizId,
          ownerUserId: devUid,
          name: devBizName,
          slug: devSlug,
          description: `Welcome to Glow Hair Studio! We provide premium haircutting, styling, balayage color work, and custom keratin smoothing services. Book your online slot with one of our master stylists below.`,
          address: "123 Main Street, Suite 100, New York, NY 10001",
          timezone: "America/New_York",
          contactEmail: lowercaseEmail,
          contactPhone: "(212) 555-0182",
          planId: "pro" as const,
          status: "active" as const,
          createdAt: new Date().toISOString(),
          bufferTime: 5,
          category: "Barber/Salon",
          instagramUrl: "https://instagram.com/glowhairstudio",
          websiteUrl: "https://glowhairstudio.com",
          facebookUrl: "https://facebook.com/glowhairstudio",
          bannerGradient: "bg-gradient-to-r from-indigo-600 to-purple-600 text-white",
          staffMembers: ["Jessica (Master Stylist)", "Michael (Color Expert)", "Sarah (Blowout Queen)"],
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
        };

        await setDoc(doc(db, "businesses", devBizId), defaultBusiness);

        const devUserData = {
          uid: devUid,
          email: lowercaseEmail,
          password: password,
          role: 'shop_owner' as const,
          businessId: devBizId,
          status: 'active' as const,
          createdAt: new Date().toISOString(),
          isMock: true
        };

        await setDoc(doc(db, "users", safeDocId), devUserData);
        await setDoc(doc(db, "users", devUid), devUserData);

        // Seed 4 premium services with static IDs to avoid duplicate appends on logins
        const srv1 = {
          id: "srv_nomi_1",
          businessId: devBizId,
          name: "Standard Hair Cut & Styling",
          durationMinutes: 45,
          price: 60,
          description: "A customized precision haircut, luxury wash with a soothing scalp massage, and blowout styling."
        };
        const srv2 = {
          id: "srv_nomi_2",
          businessId: devBizId,
          name: "Balayage & Full Highlights",
          durationMinutes: 120,
          price: 180,
          description: "Custom hand-painted color highlights tailored to your hair texture. Includes gloss toner and blowout styling."
        };
        const srv3 = {
          id: "srv_nomi_3",
          businessId: devBizId,
          name: "Keratin Smoothing Blowout",
          durationMinutes: 90,
          price: 150,
          description: "Deep conditioning keratin treatment designed to eliminate frizz and smooth curls for up to 3 months."
        };
        const srv4 = {
          id: "srv_nomi_4",
          businessId: devBizId,
          name: "Express Scalp Therapy & Wash",
          durationMinutes: 30,
          price: 40,
          description: "Soothing warm oil treatment with relaxing head pressure massage followed by styling rinse."
        };
        await setDoc(doc(db, "services", "srv_nomi_1"), srv1);
        await setDoc(doc(db, "services", "srv_nomi_2"), srv2);
        await setDoc(doc(db, "services", "srv_nomi_3"), srv3);
        await setDoc(doc(db, "services", "srv_nomi_4"), srv4);

        // Seed 3 client reviews with static IDs for instant rich social proof
        const review1 = {
          id: "rev_seed_1",
          businessId: devBizId,
          clientUserId: "client_seed_1",
          clientName: "Emily Watson",
          bookingId: "book_seed_1",
          rating: 5,
          comment: "Jessica did an amazing job with my balayage highlights! She was very detailed and friendly. Beautiful space!",
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60000).toISOString()
        };
        const review2 = {
          id: "rev_seed_2",
          businessId: devBizId,
          clientUserId: "client_seed_2",
          clientName: "David Miller",
          bookingId: "book_seed_2",
          rating: 5,
          comment: "Best haircut in town. Michael is incredibly professional and skilled at fades. Highly recommended!",
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60000).toISOString()
        };
        const review3 = {
          id: "rev_seed_3",
          businessId: devBizId,
          clientUserId: "client_seed_3",
          clientName: "Sophia Chen",
          bookingId: "book_seed_3",
          rating: 4,
          comment: "Love my blowout! Very clean salon and they offer tea while you wait. Will book again.",
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, "reviews", "rev_seed_1"), review1);
        await setDoc(doc(db, "reviews", "rev_seed_2"), review2);
        await setDoc(doc(db, "reviews", "rev_seed_3"), review3);

        localStorage.setItem('bookeasy_mock_user', JSON.stringify({
          uid: devUid,
          email: lowercaseEmail,
          role: 'shop_owner',
          businessId: devBizId,
          isMock: true
        }));

        onAuthSuccess(devUid, devBizId);
        setLoading(false);
        return;
      }

      if (mode === 'signup') {
        if (role === 'client' && (!firstName.trim() || !lastName.trim())) {
          throw new Error('Please fill in both First Name and Last Name.');
        }
        if (role === 'shop_owner' && !businessName.trim()) {
          throw new Error('Please enter your business name.');
        }

        try {
          // 1. Try standard Firebase Auth first
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const uid = userCredential.user.uid;

          let businessId = '';
          if (role === 'shop_owner') {
            const baseSlug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            const slug = `${baseSlug || 'business'}-${randomSuffix}`;
            businessId = `biz_${Date.now()}`;

            const defaultBusiness = {
              id: businessId,
              ownerUserId: uid,
              name: businessName,
              slug: slug,
              description: `Welcome to ${businessName}! Book your appointment online with our expert team in just a few clicks.`,
              address: "123 Main Street, Suite 100",
              timezone: "America/New_York",
              contactEmail: email,
              contactPhone: "",
              planId: "free" as const,
              status: "active" as const,
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
            };

            await setDoc(doc(db, "businesses", businessId), defaultBusiness);

            // Create default service
            const defaultService = {
              businessId: businessId,
              name: "Standard Initial Consultation",
              durationMinutes: 30,
              price: 50,
              description: "A standard introductory assessment session where we will discuss your unique needs and map out a custom plan."
            };
            await addDoc(collection(db, "services"), defaultService);
          }

          // Write User metadata document
          const finalUserData = {
            uid: uid,
            email: email,
            role: role,
            status: 'active' as const,
            createdAt: new Date().toISOString(),
            ...(role === 'client' && { firstName: firstName.trim(), lastName: lastName.trim() }),
            ...(role === 'shop_owner' && { businessId })
          };
          await setDoc(doc(db, "users", uid), finalUserData);

          onAuthSuccess(uid, businessId);
        } catch (authErr: any) {
          // If Email/Password auth is disabled, fallback immediately to direct database-backed auth!
          if (authErr.code === 'auth/operation-not-allowed' || authErr.code === 'auth/admin-restricted' || authErr.message?.includes('not-allowed')) {
            console.log("Firebase Auth disabled or blocked. Running Firestore fallback...");
            
            const uid = `mock_u_${Date.now()}`;
            let businessId = '';

            if (role === 'shop_owner') {
              const baseSlug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
              const randomSuffix = Math.floor(1000 + Math.random() * 9000);
              const slug = `${baseSlug || 'business'}-${randomSuffix}`;
              businessId = `biz_${Date.now()}`;

              const defaultBusiness = {
                id: businessId,
                ownerUserId: uid,
                name: businessName,
                slug: slug,
                description: `Welcome to ${businessName}! Book your appointment online with our expert team in just a few clicks.`,
                address: "123 Main Street, Suite 100",
                timezone: "America/New_York",
                contactEmail: email,
                contactPhone: "",
                planId: "free" as const,
                status: "active" as const,
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
              };

              await setDoc(doc(db, "businesses", businessId), defaultBusiness);

              // Create default service
              const defaultService = {
                businessId: businessId,
                name: "Standard Initial Consultation",
                durationMinutes: 30,
                price: 50,
                description: "A standard introductory assessment session where we will discuss your unique needs and map out a custom plan."
              };
              await addDoc(collection(db, "services"), defaultService);
            }

            // Save user credential metadata documents
            const mockUserData = {
              uid: uid,
              email: email,
              password: password, // Store password in Firestore for mock verification
              role: role,
              status: 'active' as const,
              createdAt: new Date().toISOString(),
              isMock: true,
              ...(role === 'client' && { firstName: firstName.trim(), lastName: lastName.trim() }),
              ...(role === 'shop_owner' && { businessId })
            };

            await setDoc(doc(db, "users", safeDocId), mockUserData);
            await setDoc(doc(db, "users", uid), mockUserData);

            // Save persistent session in localStorage
            localStorage.setItem('bookeasy_mock_user', JSON.stringify({
              uid,
              email,
              role,
              businessId,
              isMock: true
            }));

            onAuthSuccess(uid, businessId);
          } else {
            throw authErr;
          }
        }
      } else {
        // Log in flow
        try {
          const lowercaseEmail = email.toLowerCase().trim();

          // Hardcoded credentials check
          if (lowercaseEmail === 'admin@bookeasy.com' && password === 'admin123') {
            localStorage.setItem('bookeasy_mock_user', JSON.stringify({
              uid: 'hardcoded_admin_uid',
              email: 'admin@bookeasy.com',
              role: 'admin',
              status: 'active',
              isMock: true
            }));
            onAuthSuccess('hardcoded_admin_uid', '');
            return;
          }

          if (lowercaseEmail === 'nomideveloper007@gmail.com' && (password === 'Nomi@123' || password === 'nomi@123')) {
            localStorage.setItem('bookeasy_mock_user', JSON.stringify({
              uid: 'hardcoded_nomi_uid',
              email: 'nomideveloper007@gmail.com',
              role: 'shop_owner',
              businessId: 'biz_nomi_glow',
              status: 'active',
              isMock: true
            }));
            onAuthSuccess('hardcoded_nomi_uid', 'biz_nomi_glow');
            return;
          }

          if (lowercaseEmail === 'client@bookeasy.com' && (password === 'client123' || password === 'client@123')) {
            localStorage.setItem('bookeasy_mock_user', JSON.stringify({
              uid: 'hardcoded_client_uid',
              email: 'client@bookeasy.com',
              role: 'client',
              status: 'active',
              isMock: true
            }));
            onAuthSuccess('hardcoded_client_uid', '');
            return;
          }

          // Try standard login first
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const uid = userCredential.user.uid;
          
          // Verify role is saved properly in document
          const userDoc = await getDoc(doc(db, "users", uid));
          if (!userDoc.exists()) {
            // Seed a default shop_owner user doc in Firestore if standard Auth succeeded but database record was lost
            await setDoc(doc(db, "users", uid), {
              uid: uid,
              email: email,
              role: 'shop_owner',
              status: 'active',
              createdAt: new Date().toISOString()
            });
          }
          
          onAuthSuccess(uid, '');
        } catch (authErr: any) {
          console.log("Firebase standard login failed. Trying Firestore credentials fallback...", authErr.code);
          
          // Look up in our safe direct-key Firestore path
          const mockUserDoc = await getDoc(doc(db, "users", safeDocId));
          if (mockUserDoc.exists()) {
            const userData = mockUserDoc.data();
            if (userData.password === password) {
              localStorage.setItem('bookeasy_mock_user', JSON.stringify({
                uid: userData.uid,
                email: userData.email,
                role: userData.role,
                businessId: userData.businessId || '',
                isMock: true
              }));
              onAuthSuccess(userData.uid, userData.businessId || '');
              return;
            } else {
              throw new Error("Incorrect password. Please try again.");
            }
          }

          if (authErr.code === 'auth/operation-not-allowed') {
            throw new Error("This login record does not exist in the database fallback. Please register a new account above.");
          }

          throw authErr;
        }
      }
    } catch (err: any) {
      console.error(err);
      let errMsg = err.message;
      if (err.code === 'auth/email-already-in-use') {
        errMsg = 'This email is already in use. Try logging in instead!';
      } else if (err.code === 'auth/weak-password') {
        errMsg = 'The password must be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        errMsg = 'Invalid email address format.';
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errMsg = 'Incorrect email or password.';
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-page" className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-slate-600">
      <div className="absolute top-6 left-6">
        <button 
          onClick={onBackToLanding}
          className="inline-flex items-center space-x-2 text-sm text-slate-500 hover:text-slate-900 transition font-bold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-400" />
          <span>Back to Home</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
            <Calendar className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-display font-bold tracking-tight text-slate-900">
          {mode === 'login' ? 'Welcome back to BookEasy' : 'Create your BookEasy account'}
        </h2>
        {portalType === 'client' && (
          <p className="mt-2 text-center text-sm text-slate-500">
            Or{' '}
            <button 
              onClick={() => { setError(null); setMode(mode === 'login' ? 'signup' : 'login'); }}
              className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline transition cursor-pointer"
            >
              {mode === 'login' ? 'create a new account' : 'log into your existing account'}
            </button>
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 border border-slate-200 sm:rounded-3xl sm:px-10 shadow-xl shadow-slate-100">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl flex items-start space-x-2 text-sm">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}



            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                    First Name
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jane"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Last Name
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white transition"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                Email Address
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                {mode === 'login' ? 'Password' : 'Create Password'}
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-650 transition focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl disabled:bg-slate-300 transition text-xs flex items-center justify-center space-x-2 shadow-md shadow-indigo-100 cursor-pointer uppercase tracking-wider"
              >
                <span>{loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                {!loading && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </form>

          {mode === 'login' && (
            <div className="mt-6 text-center">
              <button 
                type="button"
                onClick={() => setError('Please enter your email and click "Forgot Password". Password resets will be sent to verified addresses.')}
                className="text-xs text-slate-400 hover:text-slate-900 transition font-medium cursor-pointer"
              >
                Forgot your password?
              </button>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 text-center flex flex-col items-center space-y-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Want to list your business?</span>
            <button
              type="button"
              onClick={() => {
                onAuthSuccess('partner-application-trigger', '');
              }}
              className="px-4 py-2 border border-indigo-200 hover:border-indigo-300 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Become a BookEasy Partner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
