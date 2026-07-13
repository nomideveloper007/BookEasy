/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Send, 
  CheckCircle2, 
  Building2, 
  Phone, 
  Mail, 
  User, 
  MapPin, 
  Globe, 
  Calendar,
  AlertCircle,
  Search,
  ChevronDown,
  Check
} from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface PartnerApplicationPageProps {
  onBack: () => void;
}

const BUSINESS_CATEGORIES: Record<string, string[]> = {
  "Business Services": [
    "Advertising", "Overseas Business", "General Office Services", "General Business", "Retail Services", "Consultants", "Printing", "Cotton", "Small Business", "Human Resources", "Marketing", "Health and Safety", "Market Research", "Consulting", "Fire Safety Consultants", "Sales Outsourcing", "Training", "Public Relations", "Secretarial Services", "Business to Business (B2B)", "AC Repair Services", "Business Development", "Laundry and Dry Cleaning", "Pet Grooming", "Tailors and Alterations", "Warehousing", "Recycling", "Cremation Service", "Cold Storage Services", "Storage Services", "Waste Services", "Junk Dealers", "Animal Shelters", "Housekeeping Service", "Timeshares", "Nanny Agency", "Membership Services", "Debt Collection Agencies", "Baby Sitters"
  ],
  "Computers & Internet": [
    "Communications", "Web Development", "Information Technology", "Web Design", "Software Applications", "Software", "Web Services", "Computer Software Solutions", "Computer Services", "Online Content", "Web Hosting", "Networking", "Computer Consumables", "Computer Training", "Apps", "Internet Service Providers", "Computer Repair", "Information Services", "Cloud Computing", "EdTech (Educational Technology)", "Artificial Intelligence", "FinTech (Financial Technology)", "SaaS", "Project Management", "E-Learning", "Cyber Security", "iOS Development", "Software Engineering", "Trading Platforms", "Blockchain", "Machine Learning", "AgTech (Agricultural Technology)", "Virtual Reality", "Cryptocurrency", "Augmented Reality", "Digital Currency Mining", "3D Technology", "Scanning Services", "Mail Services", "Data Privacy"
  ],
  "Entertainment & Media": [
    "Sports", "Arts and Crafts", "Newspapers", "Film", "Television and Video", "Photography", "Fashion", "Pets and Animals", "Leisure", "Hobbies", "Pubs and Clubs", "Music", "Social Network", "Culture", "Bookmakers", "Lifestyle Management", "Performing Arts", "Casinos", "Parties", "Gambling"
  ],
  "Events & Conferences": [
    "Weddings", "Event Services", "Event Equipment", "Conferences"
  ],
  "Finances & Insurance": [
    "Financial Activity", "Audit and Accounting", "Legal Services", "Banks & Credit Unions", "Tax Consultants", "Business Management Consulting", "Leasing", "Investment Companies", "Insurance Companies", "Insurance Services", "Asset Management", "Banking Equipment", "Stock Exchanges", "Online Payment Services", "Funding Platforms", "Personal Finance", "Money Service Business", "Investing", "Payroll Services", "Debt Counseling", "Pawnshops", "Consumer Lending", "Crowdfunding"
  ],
  "Food & Drink": [
    "Food Retailers", "Food Manufacturing", "Restaurants", "Catering", "Catering Equipment", "Cafes", "Take Aways", "Cookery", "Food Distributors", "Supermarkets", "Organic Products", "Wine and Beer", "Farmers Market"
  ],
  "Health & Beauty": [
    "Health Care", "Doctors and Clinics", "Medical Equipment", "Beauty Products", "Dentists", "Beauty Professionals", "Fitness", "Opticians", "Hairdressers", "Complementary Therapy", "Pharmacies", "Nursing and Care", "Cosmetic Surgery", "Pregnancy and Child Birth", "Wellness", "Mental Health Care", "Massage Therapists", "Personal Care", "Spirituality", "Vitamins and Supplements", "Gynecologist", "Mobility Aids", "Sewing and Needlework"
  ],
  "Legal": [
    "Solicitors", "Lawyers", "Legal Services", "Wills and Trusts"
  ],
  "Manufacturing & Industry": [
    "Industrial Services", "Engineering", "Farming", "Steel Products", "Furniture Manufacturers", "Industrial Equipment", "Oil & Gas Companies", "Energy Suppliers", "Water Treatment", "Electrical Service", "Engineers", "Civil Engineering", "Industrial Automation", "Industrial Supplies", "Automotive", "Industrial Premises", "Pumps Manufacturers", "Product Development", "Paper Products", "Solar Panels", "Aerospace", "Science", "Infrastructure", "Utilities", "Hunting", "Carpentry", "Firearms", "Fisheries", "Disinfecting Services"
  ],
  "Shopping": [
    "Clothing and Accessories", "Textile", "Electrical Goods", "Home and Garden", "Leather Products", "Hardware Stores", "Jewellery", "General Shopping", "General Merchandise", "Books", "Kids", "Gifts", "Mobile Phone Shops", "Shopping Centres", "Music", "Camping and Outdoors", "Marketplace", "Department Stores", "Optical Shops", "Gadgets", "Brand Name", "Online Shopping", "Cigars and Tobacco", "Sporting Goods", "Discount Stores", "Fishing Equipment", "Outlets", "Pet Shops", "Furniture", "Duty Free Shops", "Aquariums", "Secondhand Stores"
  ],
  "Tourism & Accommodation": [
    "Tourist Information", "Travel Agents", "Hotels", "Tour Operators", "Visa Agencies", "Guest Houses", "Attractions", "Specialist Accommodation", "Hotel & Motel Equipment", "Places to Visit", "Tourism", "Sightseeing", "Camping and Caravans", "Translation Services", "Bed and Breakfast", "Apartments", "Holiday Homes", "Excursions", "Recreation", "Self Catering Accommodation", "Cottages"
  ],
  "Tradesmen & Construction": [
    "Chemicals", "Building Materials", "Construction", "Architectural Services", "Decorators", "Construction Services", "Aluminium Openings", "Construction Equipment", "Gardeners", "Landscaping", "Plumbers", "Construction Training", "Windows", "Roofing", "Concrete", "Metals", "Handyman", "Remodeling", "Stone", "Doors", "Exterminating and Disinfecting", "Paving", "Glass Manufacturing", "Forestry", "Fencing and Fence Materials", "Sandblasting", "Excavators", "Topographic Survey and Layout Services"
  ],
  "Transport & Motoring": [
    "Vehicle Sales", "Car Parts and Accessories", "Vehicle Services", "Logistics", "Transport", "Marine Services", "Car Rental", "Air Travel", "Motorbikes", "Air Transport", "Transportation", "Transport Agents", "Bicycles", "Cargo Services", "Package Shipping", "Courier Services", "Taxis", "Shipping & Port Agents", "Haulage", "Auto Parts (New & Used)", "Auto Insurance", "Auto Services", "Driving Schools", "Auto Repair", "Vehicle Manufacturers", "Mechanics", "Auto Dealers (New & Used)", "Electric Vehicles", "Bus Lines", "Petrol Stations", "Rail Transport", "Car Wash", "Auto Supplies", "Cruises", "Limousines", "Aviation", "Ports and Harbours", "Boats and Boating", "Towing Service"
  ],
  "Public & Social Services": [
    "Community & Government", "Education", "Child Daycare Services", "Organizations", "Environmental Services", "Business Education", "Schools", "Public Transport", "Social Work Services", "Universities", "Nonprofit Organizations", "Religion", "Communities", "Group Homes", "Government Services", "Associations", "Colleges", "Government", "Tutoring", "Children's Services", "Sustainability", "Charity", "Voluntary Organisations", "Advice Centres", "After School Programs", "Funeral Directors", "Local Authorities", "Counseling Services", "Youth Organizations", "Military", "Churches", "Post Offices"
  ],
  "Property": [
    "Real Estate Agents", "Interior Design", "Security", "Property Consultants", "Property Development", "Realtors", "Fire Safety Equipment", "Commercial Property", "Renovation", "Online Property Listings", "Property Management", "Removals and Relocation", "Buildings", "Overseas Property", "Building Maintenance", "Apartment Rental", "Letting Agents", "Cleaning", "Home Improvement", "Rental Property", "Warehouses", "Vacation Rentals", "Coworking Spaces", "Auctions", "Land Survey Services", "Land Measurements"
  ]
};

export default function PartnerApplicationPage({ onBack }: PartnerApplicationPageProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [catSearch, setCatSearch] = useState('');
  const [subSearch, setSubSearch] = useState('');
  const [catOpen, setCatOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '+92',
    email: '',
    businessName: '',
    description: '',
    whatMakesPreferred: '',
    address: '',
    suite: '',
    city: '',
    state: '',
    zip: '',
    website: '',
    yearsInBusiness: '',
    profession: '', // Main category
    subcategory: '', // Subcategory
    hearAboutUs: '',
    additionalInfo: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      if (!value.startsWith('+92')) {
        const rawDigits = value.replace(/[^\d]/g, '');
        const cleanDigits = rawDigits.startsWith('92') ? rawDigits.slice(2) : rawDigits;
        const cappedDigits = cleanDigits.slice(0, 10);
        setFormData(prev => ({ ...prev, phone: '+92' + cappedDigits }));
        return;
      } else {
        const afterPrefix = value.slice(3);
        const cleanDigits = afterPrefix.replace(/[^\d]/g, '');
        const cappedDigits = cleanDigits.slice(0, 10);
        setFormData(prev => ({ ...prev, phone: '+92' + cappedDigits }));
        return;
      }
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate dropdown selections
    if (!formData.yearsInBusiness) {
      setError("Please select years in business.");
      setLoading(false);
      return;
    }
    if (!formData.profession) {
      setError("Please select your business category.");
      setLoading(false);
      return;
    }
    if (!formData.subcategory) {
      setError("Please select your business subcategory.");
      setLoading(false);
      return;
    }

    try {
      await addDoc(collection(db, "partnerApplications"), {
        ...formData,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      
      setSuccess(true);
    } catch (err: any) {
      console.error("Failed to submit partner application:", err);
      setError("Failed to submit application. Please check your internet connection or firestore credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* Back Button */}
      <div className="max-w-3xl mx-auto mb-6">
        <button 
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Landing Page</span>
        </button>
      </div>

      <div className="max-w-3xl mx-auto">
        
        {success ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-xl shadow-slate-100/50 space-y-6">
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-display font-extrabold text-slate-900">Application Submitted!</h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed font-medium">
              Thank you for applying to become a preferred BookEasy partner. The platform Administrator has received your application in their dashboard queue.
            </p>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs text-left text-slate-600 max-w-lg mx-auto space-y-2">
              <p className="font-bold text-slate-800 uppercase tracking-widest text-[9px] mb-1">Developer Test Instructions:</p>
              <p>1. Log in to the administrator portal using: <b>admin@bookeasy.com</b> / <b>admin123</b></p>
              <p>2. Open the <b>Applications</b> tab and click <b>Approve</b> on your request.</p>
              <p>3. Use the floating <b>Developer Sandbox Mailbox</b> at the bottom right of the screen to open the verification email, click the activation link, set your password, and instantly log in to your new shop dashboard!</p>
            </div>
            <button 
              onClick={onBack}
              className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Return Home
            </button>
          </div>
        ) : (
          <div className="bg-white border border-slate-250/60 rounded-3xl overflow-hidden shadow-xl shadow-slate-100/50">
            
            {/* Form Banner Header */}
            <div className="p-8 text-center border-b border-slate-100 space-y-2 bg-gradient-to-b from-white to-slate-50/50">
              <span className="text-[9px] font-extrabold text-indigo-600 uppercase tracking-widest bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                Step 1: Application
              </span>
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900">Become a BookEasy Partner</h2>
              <p className="text-slate-500 text-xs font-medium max-w-md mx-auto">
                We strictly curate our network to include only the highest quality service professionals and local studio partners.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              
              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-800 text-xs font-bold rounded-2xl flex items-center space-x-2">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* SECTION A: Primary Contact */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Primary Contact</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">First Name *</label>
                    <input 
                      type="text" 
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="First Name" 
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Last Name *</label>
                    <input 
                      type="text" 
                      name="lastName"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Last Name" 
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Direct Phone *</label>
                    <input 
                      type="text" 
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+92 300 1234567" 
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <p className="text-[9px] text-slate-450 mt-1 font-medium">Country code + phone number (e.g. +92 300 1234567)</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Business Email *</label>
                    <input 
                      type="email" 
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="email@company.com" 
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION B: Business Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Business Details</h3>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Legal Business Name *</label>
                  <input 
                    type="text" 
                    name="businessName"
                    required
                    value={formData.businessName}
                    onChange={handleChange}
                    placeholder="LLC or Inc Name" 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Business Description *</label>
                  <textarea 
                    rows={3}
                    name="description"
                    required
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Briefly describe what your business does..." 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">What makes you a BookEasy Partner? *</label>
                  <textarea 
                    rows={3}
                    name="whatMakesPreferred"
                    required
                    value={formData.whatMakesPreferred}
                    onChange={handleChange}
                    placeholder="Tell us what sets you apart—experience, quality, local expertise, etc." 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <p className="text-[9px] text-slate-455 mt-1 font-medium">Help residents understand why they should choose you.</p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Business Address *</label>
                  <input 
                    type="text" 
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Street Address" 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Apartment or Suite</label>
                    <input 
                      type="text" 
                      name="suite"
                      value={formData.suite}
                      onChange={handleChange}
                      placeholder="Apt, Suite" 
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">City *</label>
                    <input 
                      type="text" 
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="City" 
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">State *</label>
                    <input 
                      type="text" 
                      name="state"
                      required
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="State" 
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ZIP *</label>
                    <input 
                      type="text" 
                      name="zip"
                      required
                      value={formData.zip}
                      onChange={handleChange}
                      placeholder="ZIP" 
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Website (Optional)</label>
                  <input 
                    type="text" 
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://www.example.com" 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Years in Business *</label>
                    <select
                      name="yearsInBusiness"
                      required
                      value={formData.yearsInBusiness}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="">Select duration...</option>
                      <option value="Less than 1 year">Less than 1 year</option>
                      <option value="1-3 years">1-3 years</option>
                      <option value="3-5 years">3-5 years</option>
                      <option value="5+ years">5+ years</option>
                    </select>
                  </div>
                  <div className="relative">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Business Category *</label>
                    <button
                      type="button"
                      onClick={() => { setCatOpen(!catOpen); setSubOpen(false); }}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 flex items-center justify-between cursor-pointer"
                    >
                      <span className={formData.profession ? "text-slate-800 font-medium" : "text-slate-400"}>
                        {formData.profession || "Select category..."}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    {catOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setCatOpen(false)} />
                        <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 shadow-2xl rounded-2xl p-2 z-40 max-h-60 overflow-y-auto space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                          <div className="relative sticky top-0 bg-white pb-1.5">
                            <input
                              type="text"
                              value={catSearch}
                              onChange={(e) => setCatSearch(e.target.value)}
                              placeholder="Search categories..."
                              className="w-full pl-8 pr-3 py-1.5 border border-slate-100 rounded-lg text-xs bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:bg-white transition"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                          </div>
                          <div className="space-y-0.5">
                            {Object.keys(BUSINESS_CATEGORIES)
                              .filter(cat => cat.toLowerCase().includes(catSearch.toLowerCase()))
                              .map(cat => (
                                <button
                                  key={cat}
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, profession: cat, subcategory: '' }));
                                    setCatOpen(false);
                                    setCatSearch('');
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition flex items-center justify-between cursor-pointer ${
                                    formData.profession === cat
                                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                                      : 'text-slate-650 hover:bg-slate-50'
                                  }`}
                                >
                                  <span>{cat}</span>
                                  {formData.profession === cat && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                                </button>
                              ))}
                            {Object.keys(BUSINESS_CATEGORIES).filter(cat => cat.toLowerCase().includes(catSearch.toLowerCase())).length === 0 && (
                              <div className="text-center py-4 text-slate-400 text-[11px] font-medium">No categories found</div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="relative">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Business Subcategory *</label>
                    <button
                      type="button"
                      disabled={!formData.profession}
                      onClick={() => { setSubOpen(!subOpen); setCatOpen(false); }}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 flex items-center justify-between cursor-pointer disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                    >
                      <span className={formData.subcategory ? "text-slate-800 font-medium" : "text-slate-400"}>
                        {formData.subcategory || "Select subcategory..."}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    {subOpen && formData.profession && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setSubOpen(false)} />
                        <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 shadow-2xl rounded-2xl p-2 z-40 max-h-60 overflow-y-auto space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                          <div className="relative sticky top-0 bg-white pb-1.5">
                            <input
                              type="text"
                              value={subSearch}
                              onChange={(e) => setSubSearch(e.target.value)}
                              placeholder="Search subcategories..."
                              className="w-full pl-8 pr-3 py-1.5 border border-slate-100 rounded-lg text-xs bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:bg-white transition"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                          </div>
                          <div className="space-y-0.5">
                            {BUSINESS_CATEGORIES[formData.profession]
                              ?.filter(sub => sub.toLowerCase().includes(subSearch.toLowerCase()))
                              .map(sub => (
                                <button
                                  key={sub}
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, subcategory: sub }));
                                    setSubOpen(false);
                                    setSubSearch('');
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition flex items-center justify-between cursor-pointer ${
                                    formData.subcategory === sub
                                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                                      : 'text-slate-650 hover:bg-slate-50'
                                  }`}
                                >
                                  <span>{sub}</span>
                                  {formData.subcategory === sub && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                                </button>
                              ))}
                            {BUSINESS_CATEGORIES[formData.profession]?.filter(sub => sub.toLowerCase().includes(subSearch.toLowerCase())).length === 0 && (
                              <div className="text-center py-4 text-slate-400 text-[11px] font-medium">No subcategories found</div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">How did you hear about us? *</label>
                  <input 
                    type="text" 
                    name="hearAboutUs"
                    required
                    value={formData.hearAboutUs}
                    onChange={handleChange}
                    placeholder="Type your response..." 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Is there anything additional you would like to share? (Optional)</label>
                  <textarea 
                    rows={3}
                    name="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={handleChange}
                    placeholder="Share any additional details you'd like us to know..." 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-100 flex flex-col items-center">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-2xl text-xs flex items-center justify-center space-x-1.5 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'Submitting Application...' : 'Submit Partner Application'}</span>
                </button>
                <p className="text-[10px] text-slate-450 mt-3 font-semibold text-center">
                  Our team typically reviews initial applications within 48-72 hours.
                </p>
              </div>

            </form>
          </div>
        )}

      </div>
    </div>
  );
}
