import React, { useState, useEffect, useCallback } from 'react';
import {
  Truck, Building2, MapPin, Search, Plus, Minus, ShoppingBag, CheckCircle,
  Clock, Phone, ShieldCheck, QrCode, FileText, ChevronRight,
  Sparkles, RefreshCw, Stethoscope, X, Radar, Globe,
  Crosshair, Zap, Bot, ArrowRight, Activity, HeartPulse
} from 'lucide-react';
import { api } from '../services/api';
import {
  Pharmacy, MedicineItem, Hospital, MedicineOrderResponse,
  PatientRegistrationResponse, AutoPilotActionResponse
} from '../types';

interface CityPreset {
  name: string;
  city: string;
  area: string;
  lat: number;
  lng: number;
}

const CITY_PRESETS: CityPreset[] = [
  { name: 'Bengaluru (Koramangala)', city: 'Bengaluru', area: 'Koramangala 4th Block', lat: 12.9352, lng: 77.6245 },
  { name: 'Bengaluru (Indiranagar)', city: 'Bengaluru', area: '100 Feet Rd, Indiranagar', lat: 12.9784, lng: 77.6408 },
  { name: 'Bengaluru (HSR Layout)', city: 'Bengaluru', area: 'Sector 1, HSR Layout', lat: 12.9121, lng: 77.6446 },
  { name: 'Mumbai (Bandra West)', city: 'Mumbai', area: 'Hill Road, Bandra West', lat: 19.0596, lng: 72.8295 },
  { name: 'Delhi (Saket)', city: 'Delhi', area: 'Press Enclave, Saket', lat: 28.5245, lng: 77.2066 },
  { name: 'Hyderabad (Hitec City)', city: 'Hyderabad', area: 'Mindspace, Hitec City', lat: 17.4435, lng: 78.3772 },
  { name: 'Chennai (T. Nagar)', city: 'Chennai', area: 'Pondy Bazaar, T. Nagar', lat: 13.0418, lng: 80.2341 },
  { name: 'Pune (Koregaon Park)', city: 'Pune', area: 'North Main Rd, Koregaon Park', lat: 18.5362, lng: 73.8940 }
];

export const CareNavigatorPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pharmacy' | 'hospitals' | 'history'>('pharmacy');
  
  // Location States
  const [locationInput, setLocationInput] = useState('Bengaluru (Koramangala)');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({ lat: 12.9352, lng: 77.6245 });
  const [locationStatus, setLocationStatus] = useState<string>('📍 Selected: Bengaluru (Koramangala)');
  const [isLocating, setIsLocating] = useState(false);

  // Autonomous Auto-Pilot State
  const [autoPilotPrompt, setAutoPilotPrompt] = useState('');
  const [isAutoPilotRunning, setIsAutoPilotRunning] = useState(false);
  const [autoPilotResult, setAutoPilotResult] = useState<AutoPilotActionResponse | null>(null);

  // Pharmacy State
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [isLoadingPharmacies, setIsLoadingPharmacies] = useState(false);
  const [medicineSearchQuery, setMedicineSearchQuery] = useState('');
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [cart, setCart] = useState<{ [medId: string]: { item: MedicineItem; qty: number; pharmacyId: string } }>({});
  const [deliveryMode, setDeliveryMode] = useState<'express_delivery' | 'store_pickup'>('express_delivery');
  const [patientName, setPatientName] = useState('Alex Morgan');
  const [patientPhone, setPatientPhone] = useState('+91 98765 43210');
  const [deliveryAddress, setDeliveryAddress] = useState('Flat 402, Green Glen Heights, 80 Feet Road, Koramangala, Bengaluru');
  const [prescriptionNotes, setPrescriptionNotes] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [latestOrder, setLatestOrder] = useState<MedicineOrderResponse | null>(null);

  // Hospital State
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(false);
  const [symptomFilter, setSymptomFilter] = useState('Acute chest tightness and shortness of breath');
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [selectedHospitalForIntake, setSelectedHospitalForIntake] = useState<Hospital | null>(null);

  // Intake Registration Form State
  const [regPatientName, setRegPatientName] = useState('Alex Morgan');
  const [regAge, setRegAge] = useState(42);
  const [regGender, setRegGender] = useState('Male');
  const [regContact, setRegContact] = useState('+91 98765 43210');
  const [regEmergencyContact, setRegEmergencyContact] = useState('+91 98111 22334 (Spouse)');
  const [regSymptoms, setRegSymptoms] = useState('Severe retrosternal chest pain radiating to left shoulder, diaphoresis');
  const [regChiefComplaint, setRegChiefComplaint] = useState('Suspected Acute Coronary Event / Angina');
  const [regMedicalHistory, setRegMedicalHistory] = useState('Hypertension (5 yrs), Hyperlipidemia');
  const [regIsEmergency, setRegIsEmergency] = useState(true);
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);
  const [latestRegistration, setLatestRegistration] = useState<PatientRegistrationResponse | null>(null);

  // History State
  const [orderHistory, setOrderHistory] = useState<MedicineOrderResponse[]>([]);
  const [registrationHistory, setRegistrationHistory] = useState<PatientRegistrationResponse[]>([]);

  // Load history from localStorage
  useEffect(() => {
    try {
      const savedOrders = localStorage.getItem('aegis_pharma_orders');
      if (savedOrders) setOrderHistory(JSON.parse(savedOrders));
      const savedRegs = localStorage.getItem('aegis_hospital_regs');
      if (savedRegs) setRegistrationHistory(JSON.parse(savedRegs));
    } catch {
      // ignore
    }
  }, []);

  // Multi-tier location detection
  const handleDetectLocation = useCallback(async () => {
    setIsLocating(true);
    setLocationStatus('📡 Acquiring live GPS satellite fix...');

    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 30000
          });
        });

        const lat = Number(position.coords.latitude.toFixed(4));
        const lng = Number(position.coords.longitude.toFixed(4));
        const accuracy = Math.round(position.coords.accuracy || 15);

        setUserCoords({ lat, lng });
        setLocationInput(`Live GPS: ${lat}°N, ${lng}°E (±${accuracy}m accuracy)`);
        setLocationStatus(`🟢 Live GPS Active · Lat: ${lat}, Lng: ${lng} (±${accuracy}m)`);
        setIsLocating(false);
        return;
      } catch (err) {
        console.warn('Browser GPS unavailable, switching to network geo-relay...', err);
      }
    }

    try {
      setLocationStatus('🌐 Resolving network IP coordinates...');
      const fallbackRes = await fetch('/api/v1/concierge/detect-location')
        .then((r) => r.json())
        .catch(() => null);

      if (fallbackRes && fallbackRes.latitude) {
        const lat = Number(fallbackRes.latitude);
        const lng = Number(fallbackRes.longitude);
        setUserCoords({ lat, lng });
        setLocationInput(`${fallbackRes.city || 'Bengaluru'} (${fallbackRes.locality || 'Central'})`);
        setLocationStatus(`🌐 Network Geo-Relay Active · ${fallbackRes.city}, ${fallbackRes.state}`);
        setIsLocating(false);
        return;
      }
    } catch (e) {
      console.warn('Network fallback error:', e);
    }

    const defaultCity = CITY_PRESETS[0];
    setUserCoords({ lat: defaultCity.lat, lng: defaultCity.lng });
    setLocationInput(defaultCity.name);
    setLocationStatus(`📍 Regional Preset Active · ${defaultCity.name}`);
    setIsLocating(false);
  }, []);

  const handleSelectCityPreset = (preset: CityPreset) => {
    setUserCoords({ lat: preset.lat, lng: preset.lng });
    setLocationInput(preset.name);
    setLocationStatus(`📍 Switched Location: ${preset.name}`);
  };

  // Fetch Data
  const fetchPharmacies = useCallback(async () => {
    setIsLoadingPharmacies(true);
    try {
      const res = await api.searchPharmacies({
        location: locationInput,
        latitude: userCoords.lat,
        longitude: userCoords.lng,
        medicine_query: medicineSearchQuery
      });
      setPharmacies(res);
      if (res.length > 0 && !selectedPharmacy) {
        setSelectedPharmacy(res[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingPharmacies(false);
    }
  }, [locationInput, userCoords, medicineSearchQuery, selectedPharmacy]);

  const fetchHospitals = useCallback(async () => {
    setIsLoadingHospitals(true);
    try {
      const res = await api.searchHospitals({
        location: locationInput,
        latitude: userCoords.lat,
        longitude: userCoords.lng,
        symptoms: symptomFilter,
        emergency_only: emergencyOnly
      });
      setHospitals(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingHospitals(false);
    }
  }, [locationInput, userCoords, symptomFilter, emergencyOnly]);

  useEffect(() => {
    fetchPharmacies();
    fetchHospitals();
  }, [userCoords, locationInput]);

  // Execute Autonomous AI Auto-Pilot Dispatch
  const handleRunAutoPilot = async (customPrompt?: string) => {
    const promptToRun = customPrompt || autoPilotPrompt;
    if (!promptToRun.trim()) {
      alert('Please enter a clinical request or select an autonomous preset.');
      return;
    }

    setIsAutoPilotRunning(true);
    setAutoPilotResult(null);

    try {
      const payload = {
        prompt: promptToRun,
        patient_name: patientName || 'Alex Morgan',
        patient_age: Number(regAge) || 42,
        patient_gender: regGender || 'Male',
        patient_phone: patientPhone || '+91 98765 43210',
        emergency_contact: regEmergencyContact || '+91 98111 22334',
        delivery_address: deliveryAddress || 'Koramangala, Bengaluru',
        latitude: userCoords.lat,
        longitude: userCoords.lng
      };

      const res = await api.runAutoPilotConcierge(payload);
      setAutoPilotResult(res);

      // Save generated orders and passes to persistent state
      if (res.medicine_order) {
        const updatedOrders = [res.medicine_order, ...orderHistory];
        setOrderHistory(updatedOrders);
        localStorage.setItem('aegis_pharma_orders', JSON.stringify(updatedOrders));
      }
      if (res.hospital_registration) {
        const updatedRegs = [res.hospital_registration, ...registrationHistory];
        setRegistrationHistory(updatedRegs);
        localStorage.setItem('aegis_hospital_regs', JSON.stringify(updatedRegs));
      }

      // Clear input
      setAutoPilotPrompt('');
    } catch (err: any) {
      alert(err.message || 'Autonomous AI dispatch failed');
    } finally {
      setIsAutoPilotRunning(false);
    }
  };

  const addToCart = (pharmacy: Pharmacy, med: MedicineItem) => {
    setSelectedPharmacy(pharmacy);
    setCart((prev) => {
      const existing = prev[med.id];
      const currentQty = existing ? existing.qty : 0;
      return {
        ...prev,
        [med.id]: {
          item: med,
          qty: currentQty + 1,
          pharmacyId: pharmacy.id
        }
      };
    });
  };

  const removeFromCart = (medId: string) => {
    setCart((prev) => {
      const copy = { ...prev };
      if (!copy[medId]) return copy;
      if (copy[medId].qty > 1) {
        copy[medId].qty -= 1;
      } else {
        delete copy[medId];
      }
      return copy;
    });
  };

  const calculateCartSubtotal = () => {
    return Object.values(cart).reduce((sum, item) => sum + (item.item.price_inr * item.qty), 0);
  };

  const handleCheckoutMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPharmacy) {
      alert('Please select a pharmacy first.');
      return;
    }
    const cartItems = Object.values(cart);
    if (cartItems.length === 0) {
      alert('Your medicine cart is empty. Add medicines to order.');
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const orderPayload = {
        pharmacy_id: selectedPharmacy.id,
        patient_name: patientName,
        patient_phone: patientPhone,
        delivery_address: deliveryAddress,
        delivery_mode: deliveryMode,
        prescription_notes: prescriptionNotes,
        payment_method: 'UPI / Cash on Delivery',
        items: cartItems.map((c) => ({
          medicine_id: c.item.id,
          quantity: c.qty
        }))
      };

      const res = await api.orderMedicines(orderPayload);
      setLatestOrder(res);
      const updatedHistory = [res, ...orderHistory];
      setOrderHistory(updatedHistory);
      localStorage.setItem('aegis_pharma_orders', JSON.stringify(updatedHistory));
      setCart({});
    } catch (err: any) {
      alert(err.message || 'Failed to submit order');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleHospitalRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHospitalForIntake) return;

    setIsSubmittingReg(true);
    try {
      const regPayload = {
        hospital_id: selectedHospitalForIntake.id,
        patient_name: regPatientName,
        patient_age: Number(regAge),
        patient_gender: regGender,
        contact_number: regContact,
        emergency_contact: regEmergencyContact,
        symptoms: regSymptoms,
        chief_complaint: regChiefComplaint,
        medical_history: regMedicalHistory,
        is_emergency: regIsEmergency
      };

      const res = await api.registerPatientAtHospital(regPayload);
      setLatestRegistration(res);
      const updatedRegs = [res, ...registrationHistory];
      setRegistrationHistory(updatedRegs);
      localStorage.setItem('aegis_hospital_regs', JSON.stringify(updatedRegs));
      setSelectedHospitalForIntake(null);
    } catch (err: any) {
      alert(err.message || 'Failed to register patient');
    } finally {
      setIsSubmittingReg(false);
    }
  };

  const autoPilotPresets = [
    {
      title: '🚨 Auto-Register Emergency Cardiac Bed',
      prompt: 'Emergency: Severe retrosternal chest pain and breathlessness for Alex Morgan, age 45. Immediately register at nearest cardiac hospital with cath lab.'
    },
    {
      title: '💊 Auto-Dispatch Fever & ORS Kit',
      prompt: 'High fever 102°F and dehydration. Immediately order Dolo 650, Electral ORS, and Pantoprazole for express doorstep delivery.'
    },
    {
      title: '🏥 Auto-Register Pediatric Emergency Pass',
      prompt: 'Pediatric high fever with shivering and vomiting for 6-year-old child. Issue digital queue pass at nearest hospital with pediatric ICU.'
    },
    {
      title: '⚡ Auto-Dispatch Asthma & Inhaler Kit',
      prompt: 'Acute asthma wheezing and tight chest. Order Asthalin Inhaler and Cetirizine with priority delivery to my live GPS location.'
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner with Real-time GPS & Live Radar */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-cyan-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-emerald-500/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Autonomous Agent #7 · Dr. Aiden Cross
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <span>🚑</span> Autonomous AI Care Concierge & Direct Dispatcher
            </h1>
            <p className="text-emerald-100/80 text-xs sm:text-sm max-w-2xl">
              Automatic zero-touch medicine ordering and instant hospital emergency pre-registration powered by clinical AI deliberation.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="bg-black/40 backdrop-blur border border-white/10 rounded-2xl p-3 text-left">
              <div className="text-[11px] text-emerald-300 font-semibold uppercase tracking-wider">Emergency Hotline</div>
              <div className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Phone className="w-4 h-4 text-rose-400 animate-bounce" /> 108 / 112 (Ambulance 24/7)
              </div>
            </div>
          </div>
        </div>

        {/* Live Location Radar Bar */}
        <div className="mt-6 pt-4 border-t border-emerald-500/20 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 shrink-0 border border-emerald-500/30">
                <MapPin className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                className="bg-black/40 border border-emerald-500/30 text-white rounded-xl px-3.5 py-2 text-xs sm:text-sm w-full max-w-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="Enter street, area or city..."
              />
              <button
                onClick={handleDetectLocation}
                disabled={isLocating}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shrink-0 shadow-md shadow-emerald-600/30"
                title="Detect Real GPS Location"
              >
                <Crosshair className={`w-4 h-4 ${isLocating ? 'animate-spin text-amber-300' : ''}`} />
                {isLocating ? 'Locating...' : 'Live GPS Detect'}
              </button>
            </div>

            {/* Live GPS / Network Status Pill */}
            <div className="flex items-center gap-2 text-xs bg-black/40 px-3.5 py-2 rounded-xl border border-emerald-500/20 text-emerald-200">
              <Radar className="w-4 h-4 text-emerald-400 animate-spin" />
              <span className="font-mono text-[11px] font-semibold">{locationStatus}</span>
            </div>
          </div>

          {/* Quick City Presets */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 text-xs">
            <span className="text-emerald-300/80 text-[11px] font-semibold shrink-0 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" /> Quick Cities:
            </span>
            {CITY_PRESETS.map((preset) => {
              const isSelected = userCoords.lat === preset.lat && userCoords.lng === preset.lng;
              return (
                <button
                  key={preset.name}
                  onClick={() => handleSelectCityPreset(preset)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition shrink-0 ${
                    isSelected
                      ? 'bg-emerald-500 text-white shadow-md font-bold'
                      : 'bg-white/10 hover:bg-white/20 text-emerald-100'
                  }`}
                >
                  {preset.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ⚡ AUTONOMOUS AI AUTO-PILOT DISPATCH PANEL */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-2 border-indigo-500/40 rounded-3xl p-6 shadow-2xl text-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
              <Zap className="w-5 h-5 animate-pulse text-amber-400" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg flex items-center gap-2">
                <span>⚡ 1-Click Autonomous AI Dispatcher</span>
                <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-400/30 uppercase font-extrabold tracking-wider">
                  Zero Manual Forms
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Type your medical urgency in natural language. Dr. Aiden Cross automatically selects facilities, confirms availability, and issues orders or hospital tokens immediately.
              </p>
            </div>
          </div>
        </div>

        {/* Input Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
          <div className="relative flex-1">
            <Bot className="w-4 h-4 text-indigo-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={autoPilotPrompt}
              onChange={(e) => setAutoPilotPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRunAutoPilot()}
              placeholder="e.g., Alex Morgan has acute chest pain, register at nearest hospital OR Send Dolo 650 to my location..."
              className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 rounded-2xl py-3 pl-10 pr-4 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 transition"
            />
          </div>

          <button
            onClick={() => handleRunAutoPilot()}
            disabled={isAutoPilotRunning}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition shrink-0"
          >
            {isAutoPilotRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                <span>Agent Deliberating...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Execute Autonomous Dispatch</span>
              </>
            )}
          </button>
        </div>

        {/* Preset Action Chips */}
        <div className="space-y-1.5 pt-1">
          <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> One-Touch Autonomous Scenarios:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {autoPilotPresets.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleRunAutoPilot(preset.prompt)}
                disabled={isAutoPilotRunning}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-400/40 text-left transition flex items-center justify-between group text-xs"
              >
                <span className="font-semibold text-slate-200 group-hover:text-white line-clamp-1">
                  {preset.title}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-300 shrink-0 ml-1" />
              </button>
            ))}
          </div>
        </div>

        {/* Live Auto-Pilot Deliberation & Fulfillment Output */}
        {autoPilotResult && (
          <div className="bg-black/50 backdrop-blur-md rounded-2xl border border-indigo-500/40 p-5 space-y-4 animate-fadeIn">
            <div className="flex items-start justify-between border-b border-white/10 pb-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 mb-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  Autonomous Execution Completed · {autoPilotResult.target_facility}
                </div>
                <p className="text-xs text-slate-300 font-medium">{autoPilotResult.intent_summary}</p>
              </div>
              <button
                onClick={() => setAutoPilotResult(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Deliberation Timeline Steps */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
                🤖 Autonomous Reasoning & Tool Trajectory:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {autoPilotResult.deliberation_steps.map((step) => (
                  <div
                    key={step.step}
                    className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1 text-xs"
                  >
                    <div className="font-bold text-slate-200 flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{step.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{step.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Render Output Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {/* Hospital Pass Result */}
              {autoPilotResult.hospital_registration && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/60 to-indigo-900/60 border border-blue-400/40 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-500 text-white font-extrabold text-[11px]">
                      Queue Token: {autoPilotResult.hospital_registration.queue_token}
                    </span>
                    <span className="text-rose-300 font-bold text-[10px] uppercase">
                      {autoPilotResult.hospital_registration.triage_priority}
                    </span>
                  </div>
                  <div className="font-bold text-sm text-white">
                    {autoPilotResult.hospital_registration.hospital_name}
                  </div>
                  <div className="text-slate-300 text-[11px]">
                    Room: <strong>{autoPilotResult.hospital_registration.assigned_room}</strong> · Consult: <strong>{autoPilotResult.hospital_registration.estimated_consultation_time}</strong>
                  </div>
                  <div className="font-mono text-[10px] text-blue-200 border-t border-white/10 pt-1.5">
                    QR Hash: {autoPilotResult.hospital_registration.digital_pass_qr_code}
                  </div>
                </div>
              )}

              {/* Medicine Order Result */}
              {autoPilotResult.medicine_order && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-900/60 to-teal-900/60 border border-emerald-400/40 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-emerald-300">
                      Order: {autoPilotResult.medicine_order.order_id}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white font-bold text-[10px]">
                      {autoPilotResult.medicine_order.order_status}
                    </span>
                  </div>
                  <div className="font-bold text-sm text-white">
                    {autoPilotResult.medicine_order.pharmacy_name}
                  </div>
                  <div className="text-slate-300 text-[11px]">
                    Tracking: <strong>{autoPilotResult.medicine_order.tracking_id}</strong> · ETA: <strong>{autoPilotResult.medicine_order.estimated_arrival_mins} mins</strong>
                  </div>
                  <div className="flex justify-between text-[11px] font-bold text-emerald-200 border-t border-white/10 pt-1.5">
                    <span>Total: ₹{autoPilotResult.medicine_order.total_amount_inr}</span>
                    <span>Doorstep Express</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Studio Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('pharmacy')}
            className={`px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition ${
              activeTab === 'pharmacy'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Truck className="w-4 h-4" />
            1. Nearby Pharmacies & Manual Catalog
            {Object.keys(cart).length > 0 && (
              <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {Object.keys(cart).length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('hospitals')}
            className={`px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition ${
              activeTab === 'hospitals'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Building2 className="w-4 h-4" />
            2. Hospital Finder & Manual Intake
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition ${
              activeTab === 'history'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            3. Saved Orders & Passes ({orderHistory.length + registrationHistory.length})
          </button>
        </div>

        <button
          onClick={() => {
            fetchPharmacies();
            fetchHospitals();
          }}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg transition"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Recalculate Live Distances
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PHARMACY & MEDICINE DELIVERY */}
      {/* ========================================================================= */}
      {activeTab === 'pharmacy' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Pharmacies & Medicine Catalog */}
          <div className="lg:col-span-8 space-y-6">
            {/* Search Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={medicineSearchQuery}
                onChange={(e) => setMedicineSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchPharmacies()}
                placeholder="Search paracetamol, augmentin, asthalin inhaler, pan 40, ORS..."
                className="w-full bg-transparent border-none focus:outline-none text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400"
              />
              <button
                onClick={fetchPharmacies}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-sm"
              >
                Search Live Stock
              </button>
            </div>

            {/* Pharmacies List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <span>🏪</span> Verified Nearby Pharmacies ({pharmacies.length})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live GPS distance calculated from ({userCoords.lat}°N, {userCoords.lng}°E)
                  </p>
                </div>
                <span className="text-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                  ⚡ 20–35 min Delivery
                </span>
              </div>

              {isLoadingPharmacies ? (
                <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                  <p className="text-sm text-slate-500">Connecting to local pharmacy inventory networks...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pharmacies.map((pharm) => {
                    const isSelected = selectedPharmacy?.id === pharm.id;
                    return (
                      <div
                        key={pharm.id}
                        onClick={() => setSelectedPharmacy(pharm)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500 shadow-md shadow-emerald-500/10'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                              {pharm.name}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                              {pharm.address}
                            </p>
                          </div>
                          {pharm.is_open_24x7 && (
                            <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                              24/7 OPEN
                            </span>
                          )}
                        </div>

                        <div className="mt-3 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2.5">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400">
                              📍 {pharm.distance_km} km away
                            </span>
                            <span className="flex items-center gap-1">
                              ⭐ {pharm.rating} ({pharm.total_reviews})
                            </span>
                          </div>
                          <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                            <Clock className="w-3.5 h-3.5 text-emerald-600" /> ~{pharm.estimated_delivery_mins} mins
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Medicine Inventory Grid from Selected Pharmacy */}
            {selectedPharmacy && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                      <span>💊</span> Available Inventory · {selectedPharmacy.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Standard pricing verified with GST & prescription labeling
                    </p>
                  </div>
                  <div className="text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-slate-600 dark:text-slate-300 font-medium">
                    Delivery Fee: ₹{selectedPharmacy.delivery_fee_inr}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedPharmacy.available_medicines.map((med) => {
                    const inCartCount = cart[med.id]?.qty || 0;
                    return (
                      <div
                        key={med.id}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:bg-slate-50 dark:hover:bg-slate-950 transition flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                                {med.name}
                              </h4>
                              <p className="text-[11px] text-slate-500 font-mono">
                                {med.generic_name} · {med.dosage}
                              </p>
                            </div>
                            <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400 shrink-0">
                              ₹{med.price_inr}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 line-clamp-2">
                            {med.indications}
                          </p>

                          <div className="mt-2 flex items-center gap-2 text-[11px]">
                            <span className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-medium">
                              {med.form}
                            </span>
                            {med.prescription_required ? (
                              <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded font-medium">
                                Rx Required
                              </span>
                            ) : (
                              <span className="bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded font-medium">
                                OTC
                              </span>
                            )}
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium ml-auto">
                              In Stock
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                          <span className="text-[11px] text-slate-400">Mfg: {med.manufacturer}</span>
                          
                          {inCartCount === 0 ? (
                            <button
                              onClick={() => addToCart(selectedPharmacy, med)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                            >
                              <Plus className="w-3 h-3" /> Add to Order
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 bg-emerald-600 text-white px-2 py-0.5 rounded-lg text-xs">
                              <button
                                onClick={() => removeFromCart(med.id)}
                                className="hover:bg-emerald-700 rounded p-0.5"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-bold">{inCartCount}</span>
                              <button
                                onClick={() => addToCart(selectedPharmacy, med)}
                                className="hover:bg-emerald-700 rounded p-0.5"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Cart & Express Checkout */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm sticky top-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-emerald-600" />
                  Medicine Cart & Dispatch
                </h3>
                <span className="text-xs bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold px-2.5 py-0.5 rounded-full">
                  {Object.keys(cart).length} Items
                </span>
              </div>

              {Object.keys(cart).length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-sm">
                  <p>Your cart is empty.</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Use the ⚡ Auto-Pilot above or select medicines from the catalog.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleCheckoutMedicine} className="space-y-4">
                  {/* Cart Items List */}
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {Object.values(cart).map(({ item, qty }) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800"
                      >
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            ₹{item.price_inr} × {qty}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            ₹{item.price_inr * qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="text-slate-400 hover:text-rose-500"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Delivery Mode Toggle */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Fulfillment Mode
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDeliveryMode('express_delivery')}
                        className={`p-2 rounded-xl text-xs font-medium border text-center transition ${
                          deliveryMode === 'express_delivery'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        ⚡ Express (20m)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryMode('store_pickup')}
                        className={`p-2 rounded-xl text-xs font-medium border text-center transition ${
                          deliveryMode === 'store_pickup'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        🏪 Store Pickup
                      </button>
                    </div>
                  </div>

                  {/* Patient Info */}
                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Patient Name & Phone
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          value={patientName}
                          onChange={(e) => setPatientName(e.target.value)}
                          placeholder="Patient Name"
                          className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <input
                          type="text"
                          required
                          value={patientPhone}
                          onChange={(e) => setPatientPhone(e.target.value)}
                          placeholder="Phone Number"
                          className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    {deliveryMode === 'express_delivery' && (
                      <div>
                        <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          Doorstep Delivery Address
                        </label>
                        <textarea
                          required
                          rows={2}
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          placeholder="Complete Address with landmark..."
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                        />
                      </div>
                    )}

                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Doctor Prescription / Clinical Notes (Optional)
                      </label>
                      <input
                        type="text"
                        value={prescriptionNotes}
                        onChange={(e) => setPrescriptionNotes(e.target.value)}
                        placeholder="e.g., Prescribed by Dr. Triage for acute fever"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Medicines Subtotal</span>
                      <span>₹{calculateCartSubtotal()}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Delivery & Dispatch</span>
                      <span>
                        {deliveryMode === 'express_delivery'
                          ? `₹${selectedPharmacy?.delivery_fee_inr || 35}`
                          : 'FREE'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Taxes & GST (5%)</span>
                      <span>₹{Math.round(calculateCartSubtotal() * 0.05)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 dark:text-slate-100 pt-2 border-t border-slate-200 dark:border-slate-800 text-sm">
                      <span>Total Amount</span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        ₹
                        {calculateCartSubtotal() +
                          (deliveryMode === 'express_delivery' ? (selectedPharmacy?.delivery_fee_inr || 35) : 0) +
                          Math.round(calculateCartSubtotal() * 0.05)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingOrder}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition"
                  >
                    {isSubmittingOrder ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Dispatching Agent...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" /> Confirm & Dispatch Order
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Order Confirmation Modal / Card */}
              {latestOrder && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500 space-y-2 animate-fadeIn text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600" /> Order Dispatched!
                    </span>
                    <button
                      onClick={() => setLatestOrder(null)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="font-mono text-[11px] text-emerald-900 dark:text-emerald-200">
                    Order ID: <strong>{latestOrder.order_id}</strong>
                  </div>
                  <div className="font-mono text-[11px] text-emerald-900 dark:text-emerald-200">
                    Tracking ID: <strong>{latestOrder.tracking_id}</strong>
                  </div>
                  <div className="text-slate-700 dark:text-slate-300 mt-1">
                    ETA: <strong>{latestOrder.estimated_arrival_mins} mins</strong> · Total: ₹{latestOrder.total_amount_inr}
                  </div>
                  <p className="text-[11px] text-slate-500 italic border-t border-emerald-200 dark:border-emerald-800/60 pt-1.5">
                    "{latestOrder.agent_note}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: HOSPITAL FINDER & DIGITAL PATIENT INTAKE */}
      {/* ========================================================================= */}
      {activeTab === 'hospitals' && (
        <div className="space-y-6">
          {/* Symptom & Emergency Triage Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4" /> AI Condition & Specialty Matcher
                </label>
                <input
                  type="text"
                  value={symptomFilter}
                  onChange={(e) => setSymptomFilter(e.target.value)}
                  placeholder="Enter presenting symptoms (e.g., chest pain, stroke signs, pediatric trauma)..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <label className="flex items-center gap-2 cursor-pointer bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300">
                  <input
                    type="checkbox"
                    checked={emergencyOnly}
                    onChange={(e) => setEmergencyOnly(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  Emergency / ICU Only
                </label>

                <button
                  onClick={fetchHospitals}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-600/20"
                >
                  Pinpoint Hospitals
                </button>
              </div>
            </div>
          </div>

          {/* Hospitals Results Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span>🏥</span> Recommended Hospitals & Specialty Centers ({hospitals.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Proximity calculated from live coordinates ({userCoords.lat}°N, {userCoords.lng}°E)
                </p>
              </div>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                Live Bed & ICU Roster Active
              </span>
            </div>

            {isLoadingHospitals ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Dr. Aiden Cross is analyzing nearby trauma centers & hospital rosters...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {hospitals.map((hosp) => (
                  <div
                    key={hosp.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800 mb-1">
                            {hosp.type}
                          </div>
                          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                            {hosp.name}
                          </h3>
                        </div>
                        <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-800 shrink-0">
                          {hosp.match_score}% Match
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {hosp.address}
                      </p>

                      {/* Capacity Counters */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase font-semibold">Beds Avail</div>
                          <div className="text-sm font-extrabold text-blue-600 dark:text-blue-400">
                            {hosp.available_beds}/{hosp.total_beds}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase font-semibold">ICU Units</div>
                          <div className="text-sm font-extrabold text-rose-600 dark:text-rose-400">
                            {hosp.icu_available} Free
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase font-semibold">ER Wait</div>
                          <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                            ~{hosp.emergency_wait_time_mins}m
                          </div>
                        </div>
                      </div>

                      {/* Specialties & Match Reasons */}
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap gap-1">
                          {hosp.specialties.slice(0, 3).map((spec) => (
                            <span
                              key={spec}
                              className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                            >
                              {spec}
                            </span>
                          ))}
                        </div>

                        {hosp.match_reasons.length > 0 && (
                          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-medium">
                            <Sparkles className="w-3.5 h-3.5 shrink-0" />
                            <span className="line-clamp-1">{hosp.match_reasons[0]}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        <span className="font-bold text-slate-800 dark:text-slate-200">📍 {hosp.distance_km} km</span> · {hosp.trauma_level}
                      </div>

                      <button
                        onClick={() => setSelectedHospitalForIntake(hosp)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition"
                      >
                        Pre-Register <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SAVED ORDERS & HOSPITAL PASSES */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Hospital Intake Passes */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-blue-600" />
                Active Digital Hospital Passes ({registrationHistory.length})
              </h3>

              {registrationHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No active hospital passes found. Use the ⚡ Auto-Pilot above or register in Tab 2.
                </div>
              ) : (
                <div className="space-y-3">
                  {registrationHistory.map((reg) => (
                    <div
                      key={reg.registration_id}
                      className="p-4 rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20 space-y-2.5 text-xs"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                            Token: {reg.queue_token}
                          </span>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-1">
                            {reg.hospital_name}
                          </h4>
                          <p className="text-[11px] text-slate-500">{reg.assigned_department} · {reg.assigned_room}</p>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold text-[10px]">
                            {reg.triage_priority}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-1">{new Date(reg.created_at || Date.now()).toLocaleTimeString()}</p>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {reg.patient_name} ({reg.patient_age}y / {reg.patient_gender})
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Est. Consult: {reg.estimated_consultation_time}
                          </div>
                        </div>
                        <div className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
                          QR: {reg.digital_pass_qr_code.slice(0, 14)}...
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">
                        "{reg.agent_intake_summary}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pharmacy Dispatch Orders */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-600" />
                Pharmacy Dispatch Orders ({orderHistory.length})
              </h3>

              {orderHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No recent medicine orders. Use the ⚡ Auto-Pilot above or build an order in Tab 1.
                </div>
              ) : (
                <div className="space-y-3">
                  {orderHistory.map((ord) => (
                    <div
                      key={ord.order_id}
                      className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300">
                            {ord.order_id}
                          </span>
                          <h4 className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                            {ord.pharmacy_name}
                          </h4>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[10px]">
                          {ord.order_status}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-600 dark:text-slate-400">
                        {ord.items.map((i) => `${i.name} (x${i.quantity})`).join(', ')}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-emerald-200 dark:border-emerald-900/60 font-semibold text-slate-700 dark:text-slate-300">
                        <span>Total: ₹{ord.total_amount_inr}</span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                          Tracking: {ord.tracking_id}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: HOSPITAL PRE-REGISTRATION & DIGITAL PASS GENERATION */}
      {/* ========================================================================= */}
      {selectedHospitalForIntake && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-scaleUp">
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Express Digital Patient Pre-Registration
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {selectedHospitalForIntake.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedHospitalForIntake.address} · Emergency Hotline: {selectedHospitalForIntake.phone}
                </p>
              </div>
              <button
                onClick={() => setSelectedHospitalForIntake(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleHospitalRegistration} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={regPatientName}
                    onChange={(e) => setRegPatientName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Age *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={120}
                    value={regAge}
                    onChange={(e) => setRegAge(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Gender *
                  </label>
                  <select
                    value={regGender}
                    onChange={(e) => setRegGender(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Patient Contact Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={regContact}
                    onChange={(e) => setRegContact(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Emergency Contact (Next of Kin) *
                  </label>
                  <input
                    type="text"
                    required
                    value={regEmergencyContact}
                    onChange={(e) => setRegEmergencyContact(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Presenting Symptoms & Chief Complaint *
                </label>
                <textarea
                  required
                  rows={2}
                  value={regSymptoms}
                  onChange={(e) => setRegSymptoms(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Describe pain intensity, onset time, associated symptoms..."
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Prior Medical History & Allergies
                </label>
                <input
                  type="text"
                  value={regMedicalHistory}
                  onChange={(e) => setRegMedicalHistory(e.target.value)}
                  placeholder="e.g., Diabetes Type 2, Penicillin Allergy, Stent in 2022"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900">
                <input
                  type="checkbox"
                  id="regEmergency"
                  checked={regIsEmergency}
                  onChange={(e) => setRegIsEmergency(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <label htmlFor="regEmergency" className="text-xs font-semibold text-rose-800 dark:text-rose-300 cursor-pointer">
                  Flag as Immediate Critical Emergency (Requests Trauma Bay & Triage Priority 1)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedHospitalForIntake(null)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReg}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-blue-600/20"
                >
                  {isSubmittingReg ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Generating Pass...
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4" /> Issue Digital Intake Pass
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
