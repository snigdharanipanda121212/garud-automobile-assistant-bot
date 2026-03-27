/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, Component, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Mic, 
  MicOff, 
  Info, 
  Truck, 
  Battery, 
  Zap, 
  Wrench, 
  BadgePercent,
  MessageSquare,
  Plus,
  Trash2,
  Layout,
  Car,
  Image as ImageIcon,
  Upload,
  FileText,
  DollarSign,
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  Check,
  X,
  Calendar,
  Clock,
  Star,
  BarChart3,
  ClipboardList,
  Users,
  Search,
  Globe,
  LogOut,
  Send,
  Camera
} from 'lucide-react';
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { COMMERCIAL_SCRIPT, Scene, Vehicle, INITIAL_VEHICLES, OWNER_MESSAGE } from './constants';
import { auth, db, loginWithGoogle, logout, OperationType, handleFirestoreError, testConnection } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, setDoc, getDoc, serverTimestamp, Timestamp, orderBy, updateDoc } from 'firebase/firestore';
import { translations, Language } from './translations';

// --- Quotation Form Component ---
const QuotationForm = ({ vehicle, onClose, onOpenFinance }: { vehicle: Vehicle, onClose: () => void, onOpenFinance: () => void }) => {
  const { t } = useContext(LanguageContext);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    financeNeeded: false
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'quotations'), {
        ...formData,
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        vehicleModel: vehicle.model,
        vehiclePrice: vehicle.price,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      if (formData.financeNeeded) {
        onOpenFinance();
      }
      setSubmitted(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'quotations');
    }
  };

  if (submitted) {
    return (
      <div className="glass-panel p-8 rounded-2xl border border-lemon-yellow/30 text-center space-y-4">
        <div className="w-16 h-16 bg-lemon-yellow/20 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="text-lemon-yellow" size={32} />
        </div>
        <h3 className="text-2xl font-bold text-glow-yellow">{t.requestSubmitted.toUpperCase()}</h3>
        <p className="text-white/60">{t.contactSoon}</p>
        <button onClick={onClose} className="bg-electric-blue px-6 py-2 rounded-lg font-bold">{t.close.toUpperCase()}</button>
      </div>
    );
  }

  return (
    <div className="glass-panel p-8 rounded-2xl border border-white/10 space-y-6 relative">
      <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white">
        <X size={20} />
      </button>
      <h2 className="text-2xl font-bold text-glow-blue flex items-center gap-2">
        <FileText className="text-lemon-yellow" />
        {t.requestQuotation.toUpperCase()}
      </h2>
      <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg overflow-hidden">
          <img src={vehicle.imageUrl} alt={vehicle.name} className="w-full h-full object-cover" />
        </div>
        <div>
          <h4 className="font-bold">{vehicle.name}</h4>
          <p className="text-xs text-white/40">{vehicle.model} • {vehicle.price}</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-white/40">{t.fullName}</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
              <input 
                required
                type="text" 
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 focus:border-electric-blue outline-none"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-white/40">{t.phone}</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
              <input 
                required
                type="tel" 
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 focus:border-electric-blue outline-none"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-widest text-white/40">{t.email}</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
            <input 
              type="email" 
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 focus:border-electric-blue outline-none"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-widest text-white/40">{t.address}</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 text-white/20" size={14} />
            <textarea 
              required
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 focus:border-electric-blue outline-none"
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
            />
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-electric-blue/10 rounded-xl border border-electric-blue/20">
          <input 
            type="checkbox" 
            id="finance"
            className="w-4 h-4 accent-electric-blue"
            checked={formData.financeNeeded}
            onChange={e => setFormData({...formData, financeNeeded: e.target.checked})}
          />
          <label htmlFor="finance" className="text-sm font-bold cursor-pointer">{t.needFinance}</label>
        </div>
        <button type="submit" className="w-full bg-lemon-yellow text-black font-black py-3 rounded-xl shadow-lg hover:scale-[1.02] transition-all">
          {t.submitRequest.toUpperCase()}
        </button>
      </form>
    </div>
  );
};

// --- Finance Sheet Component (Excel Style) ---
const FinanceSheet = ({ onClose }: { onClose: () => void }) => {
  const [rows, setRows] = useState([
    { id: 1, detail: 'Applicant Name', value: '' },
    { id: 2, detail: 'Monthly Income', value: '' },
    { id: 3, detail: 'Down Payment', value: '' },
    { id: 4, detail: 'Loan Tenure (Months)', value: '' },
    { id: 5, detail: 'Existing Loans', value: '' },
    { id: 6, detail: 'Aadhar Number', value: '' },
    { id: 7, detail: 'PAN Number', value: '' },
  ]);

  const updateValue = (id: number, val: string) => {
    setRows(rows.map(r => r.id === id ? { ...r, value: val } : r));
  };

  return (
    <div className="glass-panel p-8 rounded-2xl border border-white/10 space-y-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-green-500" />
      <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white">
        <X size={20} />
      </button>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center text-white text-xs">XLS</div>
          FINANCE APPLICATION SHEET
        </h2>
        <span className="text-[10px] bg-white/5 px-2 py-1 rounded border border-white/10 text-white/40">DOC_ID: GARUD_FIN_2024</span>
      </div>

      <div className="border border-white/10 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="w-10 p-2 text-center border-r border-white/10 text-white/20">#</th>
              <th className="p-2 text-left border-r border-white/10 text-white/40 uppercase tracking-widest text-[10px]">Particulars</th>
              <th className="p-2 text-left text-white/40 uppercase tracking-widest text-[10px]">Value / Input</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-2 text-center border-r border-white/10 text-white/20 font-mono">{idx + 1}</td>
                <td className="p-2 border-r border-white/10 font-medium">{row.detail}</td>
                <td className="p-0">
                  <input 
                    type="text" 
                    className="w-full bg-transparent px-3 py-2 outline-none focus:bg-green-500/10 transition-colors"
                    value={row.value}
                    onChange={e => updateValue(row.id, e.target.value)}
                    placeholder="Enter details..."
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-4">
        <button onClick={onClose} className="flex-1 bg-white/5 hover:bg-white/10 py-3 rounded-xl font-bold transition-all">
          SAVE DRAFT
        </button>
        <button 
          onClick={() => { alert("Finance details submitted to owner!"); onClose(); }}
          className="flex-1 bg-green-600 hover:bg-green-500 py-3 rounded-xl font-bold transition-all shadow-lg"
        >
          SUBMIT TO OWNER
        </button>
      </div>
    </div>
  );
};

// --- Test Drive Form Component ---
const TestDriveForm = ({ vehicle, onClose }: { vehicle: Vehicle, onClose: () => void }) => {
  const { t } = useContext(LanguageContext);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date: '',
    time: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'test_drives'), {
        ...formData,
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setSubmitted(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'test_drives');
    }
  };

  if (submitted) {
    return (
      <div className="glass-panel p-8 rounded-2xl border border-lemon-yellow/30 text-center space-y-4">
        <div className="w-16 h-16 bg-lemon-yellow/20 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="text-lemon-yellow" size={32} />
        </div>
        <h3 className="text-2xl font-bold text-glow-yellow">{t.requestSubmitted.toUpperCase()}</h3>
        <p className="text-white/60">{t.contactSoon}</p>
        <button onClick={onClose} className="bg-electric-blue px-6 py-2 rounded-lg font-bold">{t.close.toUpperCase()}</button>
      </div>
    );
  }

  return (
    <div className="glass-panel p-8 rounded-2xl border border-white/10 space-y-6 relative overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(0,123,255,0.1)_0%,transparent_50%)]">
      <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white">
        <X size={20} />
      </button>
      <div className="space-y-2">
        <h2 className="text-2xl font-black tracking-tighter text-glow-blue uppercase italic">{t.bookTestDrive.toUpperCase()}</h2>
        <div className="flex items-center gap-2 text-lemon-yellow font-bold text-sm">
          <Car size={16} />
          {vehicle.name} ({vehicle.model})
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-white/40">{t.fullName}</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
              <input 
                required
                type="text" 
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 focus:border-electric-blue outline-none"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-white/40">{t.phone}</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
              <input 
                required
                type="tel" 
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 focus:border-electric-blue outline-none"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-white/40">{t.date}</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
              <input 
                required
                type="date" 
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 focus:border-electric-blue outline-none"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-white/40">{t.time}</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
              <input 
                required
                type="time" 
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 focus:border-electric-blue outline-none"
                value={formData.time}
                onChange={e => setFormData({...formData, time: e.target.value})}
              />
            </div>
          </div>
        </div>
        <button type="submit" className="w-full bg-electric-blue text-white font-black py-3 rounded-xl shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
          <Zap size={18} className="text-lemon-yellow" />
          {t.submitRequest.toUpperCase()}
        </button>
      </form>
    </div>
  );
};

// --- Vehicle Management Page ---
const VehicleManagement = ({ vehicles, onRequestQuotation, onBookTestDrive, onImageClick, onGoToReviews, isOwner }: { 
  vehicles: Vehicle[], 
  onRequestQuotation: (v: Vehicle) => void, 
  onBookTestDrive: (v: Vehicle) => void,
  onImageClick: (url: string) => void,
  onGoToReviews: () => void,
  isOwner: boolean 
}) => {
  const { t } = useContext(LanguageContext);
  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({
    model: 'L-5',
    range: '200 KM',
    batteryWarranty: '3 Years',
    vehicleWarranty: '1 Year'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewVehicle({ ...newVehicle, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const addVehicle = async () => {
    if (!newVehicle.name || !newVehicle.price) return;
    try {
      const vehicleData = {
        ...newVehicle,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'vehicles'), vehicleData);
      
      setNewVehicle({
        model: 'L-5',
        range: '200 KM',
        batteryWarranty: '3 Years',
        vehicleWarranty: '1 Year'
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'vehicles');
    }
  };

  const removeVehicle = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'vehicles', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `vehicles/${id}`);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {isOwner && (
        <div className="glass-panel p-8 rounded-2xl border border-white/10">
          <h2 className="text-2xl font-bold text-glow-blue mb-6 flex items-center gap-2">
            <Plus className="text-lemon-yellow" />
            ADD NEW VEHICLE TYPE
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-white/40">Vehicle Name</label>
              <input
                type="text"
                value={newVehicle.name || ''}
                onChange={(e) => setNewVehicle({ ...newVehicle, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:border-electric-blue outline-none"
                placeholder="e.g. Garud Super Passenger"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-white/40">Model</label>
              <select
                value={newVehicle.model}
                onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value as 'L-3' | 'L-5' })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:border-electric-blue outline-none"
              >
                <option value="L-3">L-3</option>
                <option value="L-5">L-5</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-white/40">Price</label>
              <input
                type="text"
                value={newVehicle.price || ''}
                onChange={(e) => setNewVehicle({ ...newVehicle, price: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:border-electric-blue outline-none"
                placeholder="e.g. ₹1,90,000"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-white/40">Range</label>
              <input
                type="text"
                value={newVehicle.range || ''}
                onChange={(e) => setNewVehicle({ ...newVehicle, range: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:border-electric-blue outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-white/40">Battery Warranty</label>
              <input
                type="text"
                value={newVehicle.batteryWarranty || ''}
                onChange={(e) => setNewVehicle({ ...newVehicle, batteryWarranty: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:border-electric-blue outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-white/40">Vehicle Image</label>
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  {newVehicle.imageUrl ? <ImageIcon size={16} className="text-lemon-yellow" /> : <Upload size={16} />}
                  {newVehicle.imageUrl ? 'Image Selected' : 'Upload Image'}
                </button>
                {newVehicle.imageUrl && (
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10">
                    <img src={newVehicle.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-end lg:col-span-3">
              <button
                onClick={addVehicle}
                className="w-full bg-electric-blue hover:bg-electric-blue/80 text-white font-bold py-3 rounded-lg transition-all shadow-[0_0_15px_rgba(0,123,255,0.3)]"
              >
                ADD VEHICLE TO FLEET
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((v) => (
          <motion.div
            layout
            key={v.id}
            className="glass-panel rounded-2xl border border-white/10 relative group overflow-hidden"
          >
            {/* Vehicle Image */}
            <div 
              className={`aspect-video w-full bg-white/5 relative overflow-hidden ${v.imageUrl ? 'cursor-zoom-in' : ''}`}
              onClick={() => v.imageUrl && onImageClick(v.imageUrl)}
            >
              {v.imageUrl ? (
                <img 
                  src={v.imageUrl} 
                  alt={v.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/10">
                  <Car size={48} />
                </div>
              )}
              <div className="absolute top-4 left-4">
                <span className="text-[10px] bg-lemon-yellow text-black px-2 py-1 rounded font-black uppercase tracking-tighter shadow-lg">
                  {v.model}
                </span>
              </div>
            </div>

            <div className="p-6">
              {isOwner && (
                <button
                  onClick={() => removeVehicle(v.id)}
                  className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md text-white/50 hover:text-red-500 transition-colors rounded-full opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              )}
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-electric-blue/20 rounded-lg flex items-center justify-center shrink-0">
                  <Truck className="text-electric-blue" size={20} />
                </div>
                <h3 className="font-bold text-lg leading-tight">{v.name}</h3>
              </div>

              <div className="space-y-2 text-sm text-white/60">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="flex items-center gap-2"><Zap size={14} /> Range:</span>
                  <span className="text-white font-medium">{v.range}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="flex items-center gap-2"><Battery size={14} /> Battery:</span>
                  <span className="text-white font-medium">{v.batteryWarranty}</span>
                </div>
                <div className="flex justify-between items-center pt-2 gap-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-white/40 text-[10px] uppercase">Price:</span>
                    <span className="text-lemon-yellow font-black text-xl text-glow-yellow">{v.price}</span>
                  </div>
                  <div className="flex flex-col gap-2 flex-1">
                    <button 
                      onClick={() => onRequestQuotation(v)}
                      className="w-full bg-electric-blue hover:bg-electric-blue/80 text-white text-[10px] font-black py-2 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      <FileText size={12} />
                      {t.quotation.toUpperCase()}
                    </button>
                    <button 
                      onClick={() => onBookTestDrive(v)}
                      className="w-full bg-lemon-yellow hover:bg-lemon-yellow/80 text-black text-[10px] font-black py-2 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      <Calendar size={12} />
                      {t.testDrive.toUpperCase()}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// --- Review Page Component ---
const ReviewPage = ({ user, isOwner, vehicles, customerName }: { user: FirebaseUser | null, isOwner: boolean, vehicles: Vehicle[], customerName: string }) => {
  const { t } = useContext(LanguageContext);
  const [reviews, setReviews] = useState<any[]>([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '', vehicleId: '', vehicleType: '', customVehicleName: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setReviews(list);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'reviews'));
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.comment.trim()) return;

    setIsSubmitting(true);
    try {
      const selectedVehicle = vehicles.find(v => v.id === newReview.vehicleId);
      await addDoc(collection(db, 'reviews'), {
        userId: user?.uid || 'guest',
        userName: user?.displayName || customerName || 'Guest Customer',
        userPhoto: user?.photoURL || '',
        rating: newReview.rating,
        comment: newReview.comment,
        vehicleId: newReview.vehicleId,
        vehicleName: selectedVehicle ? selectedVehicle.name : newReview.customVehicleName,
        vehicleType: selectedVehicle ? selectedVehicle.category : newReview.vehicleType,
        createdAt: serverTimestamp()
      });
      setNewReview({ rating: 5, comment: '', vehicleId: '', vehicleType: '', customVehicleName: '' });
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'reviews');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      await deleteDoc(doc(db, 'reviews', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'reviews');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black tracking-tighter uppercase italic text-glow-blue">{t.reviews}</h2>
        <p className="text-white/40 font-mono text-xs tracking-widest uppercase">{t.shareExperience}</p>
      </div>

      <div className="glass-panel p-8 rounded-3xl border border-white/10 space-y-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Star className="text-lemon-yellow" size={20} />
          {t.writeReview}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] text-white/40 uppercase tracking-widest font-mono">{t.rating}</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewReview({ ...newReview, rating: star })}
                    className={`transition-all ${newReview.rating >= star ? 'text-lemon-yellow scale-110' : 'text-white/20'}`}
                  >
                    <Star fill={newReview.rating >= star ? 'currentColor' : 'none'} size={24} />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-white/40 uppercase tracking-widest font-mono">{t.selectVehicle}</label>
              <select
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-electric-blue outline-none text-sm"
                value={newReview.vehicleId}
                onChange={(e) => setNewReview({ ...newReview, vehicleId: e.target.value, customVehicleName: '', vehicleType: '' })}
              >
                <option value="" className="bg-black">{t.selectVehicle}</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id} className="bg-black">{v.name}</option>
                ))}
                <option value="other" className="bg-black">Other / Not Listed</option>
              </select>
            </div>

            {newReview.vehicleId === 'other' && (
              <>
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <label className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Vehicle Type</label>
                  <select
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-electric-blue outline-none text-sm"
                    value={newReview.vehicleType}
                    onChange={(e) => setNewReview({ ...newReview, vehicleType: e.target.value })}
                  >
                    <option value="" className="bg-black">Select Type</option>
                    <option value="Passenger" className="bg-black">Passenger</option>
                    <option value="Cargo" className="bg-black">Cargo</option>
                    <option value="Tipper" className="bg-black">Tipper</option>
                    <option value="Loader" className="bg-black">Loader</option>
                  </select>
                </div>
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <label className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Vehicle Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="Enter vehicle model..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-electric-blue outline-none text-sm"
                    value={newReview.customVehicleName}
                    onChange={(e) => setNewReview({ ...newReview, customVehicleName: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>
          <textarea
            required
            rows={3}
            placeholder="Share your experience with Garud Automobiles..."
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:border-electric-blue outline-none resize-none"
            value={newReview.comment}
            onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
          />
          {submitted && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-400 text-sm font-bold text-center"
            >
              REVIEW POSTED SUCCESSFULLY! THANK YOU.
            </motion.div>
          )}
          <button
            disabled={isSubmitting}
            type="submit"
            className="bg-electric-blue hover:bg-electric-blue/80 text-white font-black px-8 py-3 rounded-xl transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'SUBMITTING...' : t.postReview.toUpperCase()}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reviews.map((review) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <img src={review.userPhoto} alt={review.userName} className="w-10 h-10 rounded-full border border-white/10" />
                <div>
                  <h4 className="font-bold text-sm">{review.userName}</h4>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={10}
                          className={review.rating >= star ? 'text-lemon-yellow' : 'text-white/10'}
                          fill={review.rating >= star ? 'currentColor' : 'none'}
                        />
                      ))}
                    </div>
                    {review.vehicleName && (
                      <span className="text-[10px] text-lemon-yellow font-mono uppercase tracking-tighter bg-lemon-yellow/10 px-2 py-0.5 rounded border border-lemon-yellow/20">
                        {review.vehicleName}
                      </span>
                    )}
                    {review.vehicleType && (
                      <span className="text-[10px] text-white/40 font-mono uppercase tracking-tighter bg-white/5 px-2 py-0.5 rounded border border-white/10">
                        {review.vehicleType}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-white/20 font-mono">
                  {review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString() : 'Just now'}
                </span>
                {isOwner && (
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="p-1 hover:bg-red-500/20 rounded transition-all text-white/20 hover:text-red-500"
                    title="Delete Review"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
            <p className="text-sm text-white/70 italic leading-relaxed">"{review.comment}"</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// --- Owner Dashboard Component ---
const OwnerDashboard = () => {
  const { lang, t } = useContext(LanguageContext);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [testDrives, setTestDrives] = useState<any[]>([]);
  const [activeView, setActiveView] = useState<'quotations' | 'test_drives'>('quotations');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const qQ = query(collection(db, 'quotations'), orderBy('createdAt', sortBy === 'newest' ? 'desc' : 'asc'));
    const unsubscribeQ = onSnapshot(qQ, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setQuotations(list);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'quotations'));

    const qT = query(collection(db, 'test_drives'), orderBy('createdAt', sortBy === 'newest' ? 'desc' : 'asc'));
    const unsubscribeT = onSnapshot(qT, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setTestDrives(list);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'test_drives'));

    return () => {
      unsubscribeQ();
      unsubscribeT();
    };
  }, [sortBy]);

  const filteredItems = (activeView === 'quotations' ? quotations : testDrives).filter(item => {
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.phone.includes(searchTerm) ||
                         (item.email && item.email.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="space-y-1 text-center md:text-left">
          <h2 className="text-3xl font-black tracking-tighter uppercase italic text-glow-blue">{t.ownerDashboard}</h2>
          <p className="text-white/40 font-mono text-xs tracking-widest uppercase">{t.manageInquiries}</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveView('quotations')}
            className={`px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeView === 'quotations' ? 'bg-electric-blue text-white shadow-lg' : 'text-white/40 hover:text-white'
            }`}
          >
            <ClipboardList size={14} />
            {t.quotation.toUpperCase()} ({quotations.length})
          </button>
          <button
            onClick={() => setActiveView('test_drives')}
            className={`px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeView === 'test_drives' ? 'bg-electric-blue text-white shadow-lg' : 'text-white/40 hover:text-white'
            }`}
          >
            <Car size={14} />
            {t.testDrive.toUpperCase()} ({testDrives.length})
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
          <input
            type="text"
            placeholder={t.search}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:border-electric-blue outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-electric-blue outline-none text-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all" className="bg-black">{t.all} {t.status}</option>
          <option value="pending" className="bg-black">{t.pending}</option>
          <option value="completed" className="bg-black">{t.completed}</option>
        </select>
        <select
          className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-electric-blue outline-none text-sm"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
        >
          <option value="newest" className="bg-black">{t.sortBy}: {t.newest}</option>
          <option value="oldest" className="bg-black">{t.sortBy}: {t.oldest}</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 bg-electric-blue/20 rounded-xl flex items-center justify-center">
            <Users className="text-electric-blue" size={24} />
          </div>
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">{t.totalLeads}</p>
            <p className="text-2xl font-black">{quotations.length + testDrives.length}</p>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 bg-lemon-yellow/20 rounded-xl flex items-center justify-center">
            <BarChart3 className="text-lemon-yellow" size={24} />
          </div>
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">{t.conversionRate}</p>
            <p className="text-2xl font-black">
              {(() => {
                const total = quotations.length + testDrives.length;
                const completed = quotations.filter(q => q.status === 'completed').length + testDrives.filter(t => t.status === 'completed').length;
                return total > 0 ? ((completed / total) * 100).toFixed(1) : '0';
              })()}%
            </p>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
            <Zap className="text-green-500" size={24} />
          </div>
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">{t.activeInquiries}</p>
            <p className="text-2xl font-black">{quotations.filter(q => q.status === 'pending').length + testDrives.filter(t => t.status === 'pending').length}</p>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/40">{t.customer}</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/40">{t.vehicle}</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/40">{t.details}</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/40">{t.date}</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/40">{t.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className="font-bold text-sm">{item.name}</p>
                      <p className="text-xs text-white/40">{item.phone}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className="font-bold text-sm">{item.vehicleName}</p>
                      <p className="text-[10px] text-white/40 uppercase">{item.vehicleModel}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs truncate text-xs text-white/60">
                      {activeView === 'quotations' ? (
                        <span>{item.address} {item.financeNeeded && '• Finance Needed'}</span>
                      ) : (
                        <span>{item.date} at {item.time}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[10px] font-mono text-white/40">
                      {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'N/A'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        item.status === 'pending' ? 'bg-lemon-yellow/20 text-lemon-yellow' : 'bg-green-500/20 text-green-500'
                      }`}>
                        {item.status === 'pending' ? t.pending : t.completed}
                      </span>
                      {item.status === 'pending' && (
                        <button
                          onClick={async () => {
                            try {
                              await updateDoc(doc(db, activeView, item.id), { status: 'completed' });
                            } catch (error) {
                              handleFirestoreError(error, OperationType.UPDATE, `${activeView}/${item.id}`);
                            }
                          }}
                          className="p-1 hover:bg-white/10 rounded text-white/40 hover:text-green-500 transition-colors"
                          title="Mark as Completed"
                        >
                          <CheckCircle size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- Error Boundary Component ---
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      try {
        const parsed = JSON.parse(this.state.error.message);
        if (parsed.error) errorMessage = `Firebase Error: ${parsed.error} (${parsed.operationType} at ${parsed.path})`;
      } catch (e) {
        errorMessage = this.state.error.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
          <div className="glass-panel p-8 rounded-2xl border border-red-500/30 max-w-md w-full text-center space-y-4">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <X className="text-red-500" size={32} />
            </div>
            <h3 className="text-2xl font-bold text-red-500">SYSTEM ERROR</h3>
            <p className="text-white/60 text-sm">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-lg font-bold transition-all"
            >
              RELOAD SYSTEM
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Contact Page Component ---
function ContactPage() {
  const { t } = useContext(LanguageContext);
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="glass-panel p-12 rounded-3xl border border-white/10 text-center space-y-8 bg-[radial-gradient(circle_at_top_right,rgba(0,123,255,0.1)_0%,transparent_50%)]">
        <div className="w-24 h-24 bg-electric-blue rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(0,123,255,0.4)]">
          <Phone className="text-lemon-yellow w-12 h-12" />
        </div>
        
        <div className="space-y-4">
          <h2 className="text-4xl font-black tracking-tighter uppercase italic">{t.contact}</h2>
          <p className="text-white/60 font-mono text-sm tracking-widest uppercase">Garud Automobiles - Berhampur</p>
        </div>

        <div className="py-8 border-y border-white/5">
          <p className="text-xl text-white/80 mb-4">{t.moreInfo}</p>
          <a 
            href="tel:8221822926" 
            className="text-5xl md:text-7xl font-black text-lemon-yellow tracking-tighter hover:scale-105 transition-transform inline-block"
          >
            8221822926
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
          <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
            <MapPin className="text-electric-blue w-6 h-6 mx-auto mb-3" />
            <p className="text-xs font-bold uppercase tracking-widest">Location</p>
            <p className="text-[10px] text-white/40 mt-1">Near Santoshi Maa Temple, Bijupur, Berhampur</p>
          </div>
          <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
            <Zap className="text-electric-blue w-6 h-6 mx-auto mb-3" />
            <p className="text-xs font-bold uppercase tracking-widest">Experience</p>
            <p className="text-[10px] text-white/40 mt-1">Leading EV Commercial Vehicle Dealer</p>
          </div>
          <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
            <Truck className="text-electric-blue w-6 h-6 mx-auto mb-3" />
            <p className="text-xs font-bold uppercase tracking-widest">Fleet</p>
            <p className="text-[10px] text-white/40 mt-1">Wide range of EVCO loaders and passenger vehicles</p>
          </div>
        </div>

        <div className="pt-12 text-center opacity-30">
          <p className="text-[10px] uppercase tracking-widest font-mono">
            Note: If the app does not work, please open it the next day.
          </p>
        </div>
      </div>
    </div>
  );
}

// --- Main App Component ---
export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

const LanguageContext = React.createContext<{ lang: Language, t: any }>({ lang: 'en', t: translations.en });

function AppContent() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'viewer'>('viewer');
  const [activeTab, setActiveTab] = useState<'script' | 'vehicles' | 'contact' | 'reviews' | 'dashboard'>('script');
  const [lang, setLang] = useState<Language | null>(null);
  const [showLangSelector, setShowLangSelector] = useState(true);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const t = translations[lang || 'en'];
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [transcription, setTranscription] = useState<string[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [selectedVehicleForQuotation, setSelectedVehicleForQuotation] = useState<Vehicle | null>(null);
  const [selectedVehicleForTestDrive, setSelectedVehicleForTestDrive] = useState<Vehicle | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showFinanceSheet, setShowFinanceSheet] = useState(false);
  const [loading, setLoading] = useState(true);

  const [ownerPassword, setOwnerPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  // Auth & Role Sync
  useEffect(() => {
    testConnection();
    
    // Load saved owner status
    const savedOwner = localStorage.getItem('garud_is_owner');
    if (savedOwner === 'true') {
      setIsOwner(true);
      setUserRole('admin');
      setShowLangSelector(false);
      if (!lang) setLang('en');
    }

    // Load saved language and user info
    const saved = localStorage.getItem('garud_user_info');
    if (saved) {
      try {
        const { name, phone, lang: savedLang } = JSON.parse(saved);
        if (name && phone && savedLang) {
          setCustomerName(name);
          setCustomerPhone(phone);
          setLang(savedLang);
          setShowLangSelector(false);
        }
      } catch (e) {
        console.error("Error parsing saved info:", e);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setUser(firebaseUser);
        if (firebaseUser) {
          // Sync user to Firestore and get role
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          // Check if this is the owner email (keeping as backup)
          const isOwnerEmail = firebaseUser.email === 'sarita.riusriu121212@gmail.com';
          
          if (userDoc.exists()) {
            const role = isOwnerEmail ? 'admin' : userDoc.data().role;
            // Only override if not already set by password
            if (!isOwner) {
              setUserRole(role);
              setIsOwner(role === 'admin');
              if (role === 'admin') {
                setShowLangSelector(false);
                if (!lang) setLang('en');
              }
            }
          } else {
            // New user
            const role = isOwnerEmail ? 'admin' : 'viewer';
            const newUser = {
              displayName: firebaseUser.displayName || 'Anonymous',
              email: firebaseUser.email || '',
              role: role,
              photoURL: firebaseUser.photoURL || ''
            };
            await setDoc(userDocRef, newUser);
            if (!isOwner) {
              setUserRole(role);
              setIsOwner(role === 'admin');
              if (role === 'admin') {
                setShowLangSelector(false);
                if (!lang) setLang('en');
              }
            }
          }
        }
      } catch (error) {
        console.error("Auth state sync error:", error);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [isOwner]);

  const handleOwnerLogin = () => {
    if (ownerPassword === '2122011') {
      setIsOwner(true);
      setUserRole('admin');
      setShowLangSelector(false);
      if (!lang) setLang('en');
      localStorage.setItem('garud_is_owner', 'true');
      setPasswordError(false);
    } else {
      setPasswordError(true);
      setTimeout(() => setPasswordError(false), 3000);
    }
  };

  // Vehicles Sync
  useEffect(() => {
    const q = query(collection(db, 'vehicles'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const vehicleList: Vehicle[] = [];
      snapshot.forEach((doc) => {
        vehicleList.push({ id: doc.id, ...doc.data() } as Vehicle);
      });
      if (vehicleList.length > 0) {
        setVehicles(vehicleList);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'vehicles');
    });
    return () => unsubscribe();
  }, []);

  const currentScene = COMMERCIAL_SCRIPT[currentSceneIndex];

  // Live API Refs
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const nextScene = () => {
    setCurrentSceneIndex((prev) => (prev + 1) % COMMERCIAL_SCRIPT.length);
  };

  const prevScene = () => {
    setCurrentSceneIndex((prev) => (prev - 1 + COMMERCIAL_SCRIPT.length) % COMMERCIAL_SCRIPT.length);
  };

  const startLiveSession = async () => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        setTranscription(prev => [...prev, "Error: GEMINI_API_KEY is not configured."]);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      const sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        callbacks: {
          onopen: () => {
            setIsRecording(true);
            source.connect(processorRef.current!);
            processorRef.current!.connect(audioContextRef.current!.destination);
            
            processorRef.current!.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmData = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
              }
              const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
              
              if (sessionRef.current) {
                sessionRef.current.sendRealtimeInput({
                  audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
                });
              }
            };
          },
          onmessage: async (message: LiveServerMessage) => {
            const parts = message.serverContent?.modelTurn?.parts;
            if (parts) {
              for (const part of parts) {
                if (part.text) {
                  setTranscription(prev => [...prev.slice(-10), `AI: ${part.text}`]);
                }
                if (part.inlineData?.data) {
                  const base64Audio = part.inlineData.data;
                  
                  // Manually decode raw PCM data (16-bit, 24kHz)
                  const binaryString = atob(base64Audio);
                  const bytes = new Uint8Array(binaryString.length);
                  for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                  }
                  const pcmData = new Int16Array(bytes.buffer);
                  const floatData = new Float32Array(pcmData.length);
                  for (let i = 0; i < pcmData.length; i++) {
                    floatData[i] = pcmData[i] / 32768.0;
                  }

                  const audioBuffer = audioContextRef.current!.createBuffer(1, floatData.length, 24000);
                  audioBuffer.getChannelData(0).set(floatData);

                  const playSource = audioContextRef.current!.createBufferSource();
                  playSource.buffer = audioBuffer;
                  playSource.connect(audioContextRef.current!.destination);
                  playSource.start();
                }
              }
            }
            if (message.serverContent?.interrupted) {
              // Handle interruption if needed
              console.log("AI Interrupted");
            }
          },
          onclose: () => setIsRecording(false),
          onerror: (e) => {
            console.error("Live API Error:", e);
            setTranscription(prev => [...prev, "Error: Connection failed."]);
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          tools: [{ googleSearch: {} }],
          systemInstruction: "You are an expert on Garud Automobiles. ONLY answer questions about vehicles, the Garud EVCO range (L-5, L-3), 200km range, 3-year battery warranty, and exchange offers. If asked about anything else, politely redirect to Garud vehicles. Use Google Search to provide up-to-date info on electric vehicle trends if relevant to Garud. Respond in Berhampur Odiya or English.",
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Failed to start Live session:", err);
      setTranscription(prev => [...prev, "Error: Could not access microphone or connect to AI."]);
    }
  };

  const handleSendText = () => {
    if (!aiInput.trim()) return;
    setTranscription(prev => [...prev.slice(-10), `You: ${aiInput}`]);
    if (sessionRef.current) {
      sessionRef.current.sendRealtimeInput({
        text: aiInput
      });
    } else {
      // If session not started, start it first? 
      // For now, just show error or start it.
      startLiveSession().then(() => {
        if (sessionRef.current) {
          sessionRef.current.sendRealtimeInput({ text: aiInput });
        }
      });
    }
    setAiInput('');
  };

  const handleImageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && sessionRef.current) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = (reader.result as string).split(',')[1];
        sessionRef.current?.sendRealtimeInput({
          video: { data: base64Data, mimeType: file.type }
        });
        setTranscription(prev => [...prev, "Sent image for analysis..."]);
      };
      reader.readAsDataURL(file);
    }
  };

  const stopLiveSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Zap className="text-lemon-yellow w-12 h-12 animate-pulse" />
          <p className="text-white/40 font-mono text-xs tracking-widest uppercase">Initializing Garud Systems...</p>
        </div>
      </div>
    );
  }

  if (showLangSelector || !lang) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-electric-blue/10 via-transparent to-lemon-yellow/10 opacity-50" />
        <div className="glass-panel p-8 md:p-12 rounded-[40px] border border-white/10 max-w-lg w-full text-center space-y-8 relative z-10">
          <div className="w-16 h-16 bg-electric-blue rounded-2xl flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(0,102,255,0.3)]">
            <Zap className="text-lemon-yellow w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tighter uppercase italic">WELCOME TO GARUD</h2>
            <p className="text-white/40 font-mono text-[10px] tracking-[0.2em] uppercase">Initial Setup Required</p>
          </div>

          <div className="space-y-4 text-left">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-white/40 ml-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                <input 
                  type="tel" 
                  placeholder="Enter your phone"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:border-electric-blue outline-none transition-all"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-white/40 ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                <input 
                  type="text" 
                  placeholder="Enter your name"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:border-electric-blue outline-none transition-all"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-white/40 font-mono text-[10px] tracking-[0.2em] uppercase">STEP 2: SELECT YOUR LANGUAGE</p>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'en', label: 'ENGLISH', sub: 'Global Standard' },
                  { id: 'or', label: 'ଓଡ଼ିଆ', sub: 'ସ୍ଥାନୀୟ ଗର୍ବ' },
                  { id: 'te', label: 'తెలుగు', sub: 'ప్రాంతీయ పరిధి' }
                ].map((l) => (
                  <button
                    key={l.id}
                    disabled={!customerName || !customerPhone}
                    onClick={() => {
                      const selectedLang = l.id as Language;
                      setLang(selectedLang);
                      setShowLangSelector(false);
                      localStorage.setItem('garud_user_info', JSON.stringify({
                        name: customerName,
                        phone: customerPhone,
                        lang: selectedLang
                      }));
                    }}
                    className="group relative p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-electric-blue/50 transition-all text-left flex items-center justify-between disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <div>
                      <p className="font-black text-lg tracking-tight group-hover:text-electric-blue transition-colors">{l.label}</p>
                      <p className="text-[10px] text-white/20 uppercase tracking-widest font-mono">{l.sub}</p>
                    </div>
                    <ChevronRight className="text-white/10 group-hover:text-electric-blue group-hover:translate-x-1 transition-all" size={20} />
                  </button>
                ))}
              </div>
            </div>
            
            <div className="pt-6 border-t border-white/5 space-y-3">
              <p className="text-white/20 font-mono text-[8px] tracking-[0.2em] uppercase mb-1 text-center">OWNER ACCESS</p>
              <div className="flex gap-2">
                <input 
                  type="password"
                  placeholder="Enter Owner Password"
                  className={`flex-1 bg-white/5 border ${passwordError ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 focus:border-lemon-yellow outline-none transition-all text-sm`}
                  value={ownerPassword}
                  onChange={e => setOwnerPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleOwnerLogin()}
                />
                <button
                  onClick={handleOwnerLogin}
                  className="bg-lemon-yellow text-black font-black px-4 py-3 rounded-xl hover:bg-lemon-yellow/80 transition-all"
                >
                  <Check size={20} />
                </button>
              </div>
              {passwordError && (
                <p className="text-red-500 text-[10px] uppercase font-bold text-center animate-pulse">Invalid Password</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <LanguageContext.Provider value={{ lang: lang || 'en', t }}>
      <div className="min-h-screen bg-black text-white selection:bg-electric-blue/30">
      {/* Header */}
      {/* Owner's Message Ticker */}
      <div className="fixed top-[72px] w-full z-40 bg-lemon-yellow/90 backdrop-blur-md text-black py-1 overflow-hidden border-b border-black/10">
        <div className="whitespace-nowrap animate-marquee flex items-center gap-8">
          <span className="text-[10px] font-black uppercase tracking-tighter flex items-center gap-2">
            <Info size={12} /> OWNER'S MESSAGE: {OWNER_MESSAGE}
          </span>
          <span className="text-[10px] font-black uppercase tracking-tighter flex items-center gap-2">
            <Info size={12} /> OWNER'S MESSAGE: {OWNER_MESSAGE}
          </span>
          <span className="text-[10px] font-black uppercase tracking-tighter flex items-center gap-2">
            <Info size={12} /> OWNER'S MESSAGE: {OWNER_MESSAGE}
          </span>
        </div>
      </div>

      <header className="fixed top-0 w-full z-50 glass-panel border-b border-white/10 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-electric-blue rounded-lg flex items-center justify-center">
            <Zap className="text-lemon-yellow w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tighter text-glow-blue">GARUD AUTOMOBILES</h1>
            <p className="text-[10px] uppercase tracking-widest text-white/50">Commercial Script v1.0</p>
          </div>
        </div>
        
          <nav className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('script')}
              className={`px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'script' ? 'bg-electric-blue text-white' : 'text-white/50 hover:text-white'
              }`}
            >
              <Layout size={14} />
              {t.commercial}
            </button>
            <button
              onClick={() => setActiveTab('vehicles')}
              className={`px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'vehicles' ? 'bg-electric-blue text-white' : 'text-white/50 hover:text-white'
              }`}
            >
              <Car size={14} />
              {t.fleet}
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'contact' ? 'bg-electric-blue text-white' : 'text-white/50 hover:text-white'
              }`}
            >
              <Phone size={14} />
              {t.contact}
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'reviews' ? 'bg-electric-blue text-white' : 'text-white/50 hover:text-white'
              }`}
            >
              <Star size={14} />
              {t.reviews}
            </button>
            {!isOwner && (
              <button
                onClick={() => setShowLangSelector(true)}
                className="px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap text-white/50 hover:text-lemon-yellow hover:bg-white/5"
              >
                <User size={14} />
                OWNER LOGIN
              </button>
            )}
            {isOwner && (
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'dashboard' ? 'bg-lemon-yellow text-black' : 'text-white/50 hover:text-white'
                }`}
              >
                <BarChart3 size={14} />
                {t.dashboard}
              </button>
            )}
            {isOwner && (
              <button
                onClick={() => {
                  setIsOwner(false);
                  setUserRole('viewer');
                  localStorage.removeItem('garud_is_owner');
                  setShowLangSelector(true);
                  setActiveTab('script');
                }}
                className="px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap text-red-500 hover:bg-red-500/10"
              >
                <LogOut size={14} />
                LOGOUT
              </button>
            )}
          </nav>

        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold">{user.displayName}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">{userRole}</p>
              </div>
              <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-8 h-8 rounded-full border border-white/10" />
              <button 
                onClick={logout}
                className="text-[10px] font-bold text-white/40 hover:text-white transition-colors"
              >
                LOGOUT
              </button>
            </div>
          )}

          {userRole === 'admin' && (
            <button
              onClick={() => setIsOwner(!isOwner)}
              className={`p-2 rounded-full border transition-all ${
                isOwner ? 'bg-lemon-yellow text-black border-lemon-yellow' : 'bg-white/5 text-white/50 border-white/10 hover:text-white'
              }`}
              title={isOwner ? "Owner Mode Active" : "Switch to Owner Mode"}
            >
              <User size={18} />
            </button>
          )}

          <button 
            onClick={() => {
              setIsLiveMode(!isLiveMode);
              if (!isLiveMode) setActiveTab('script');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              isLiveMode ? 'bg-lemon-yellow text-black' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            <MessageSquare size={14} />
            {isLiveMode ? 'EXIT LIVE CHAT' : 'AI VOICE GUIDE'}
          </button>
        </div>
      </header>

      <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
        {activeTab === 'script' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Left Column: Scene Viewer */}
            <div className="lg:col-span-8 space-y-6">
              <div className="relative aspect-video rounded-2xl overflow-hidden glass-panel border border-white/10 group">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentScene.id}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-electric-blue/10 to-transparent opacity-50" />
                    <div className="relative z-10">
                      <span className="text-lemon-yellow font-mono text-sm mb-4 block tracking-widest">SCENE {currentScene.id} / {COMMERCIAL_SCRIPT.length}</span>
                      <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 leading-none uppercase italic">
                        {currentScene.title}
                      </h2>
                      <div className="max-w-2xl mx-auto">
                        <p className="text-lg text-white/70 leading-relaxed italic mb-4">
                          {currentScene.visuals}
                        </p>
                        {currentScene.audioDialogue && (
                          <div className="bg-lemon-yellow/20 border border-lemon-yellow/30 p-4 rounded-xl">
                            <p className="text-lemon-yellow font-black text-xl italic tracking-tight">
                              "{currentScene.audioDialogue}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Controls Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-4">
                    <button onClick={prevScene} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                      <ChevronLeft />
                    </button>
                    <button onClick={nextScene} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                      <ChevronRight />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-mono text-lemon-yellow">
                    <Info size={16} />
                    {currentScene.duration}
                  </div>
                </div>
              </div>

              {/* Script Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel p-6 rounded-xl border border-white/10">
                  <p className="text-lemon-yellow font-bold text-lg leading-tight">
                    {currentScene.textOverlay}
                  </p>
                </div>
                <div className="glass-panel p-6 rounded-xl border border-white/10">
                  <div className="space-y-4">
                    <div className="bg-lemon-yellow/10 p-4 rounded-lg border border-lemon-yellow/20">
                      <p className="text-lemon-yellow font-black text-xl italic leading-tight">
                        "{currentScene.audioDialogue || 'Electricity byabahara karantu, petrol banchantu!'}"
                      </p>
                      <p className="text-white/40 text-[10px] mt-2 uppercase tracking-widest">
                        (Use electricity, save petrol!)
                      </p>
                    </div>
                    <p className="text-white/60 text-sm italic">
                      {currentScene.audioVO}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Info & AI */}
            <div className="lg:col-span-4 space-y-6">
              {isLiveMode ? (
                <div className="glass-panel rounded-2xl border border-lemon-yellow/30 p-6 h-full flex flex-col min-h-[500px]">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-lemon-yellow flex items-center gap-2">
                      <Zap size={18} />
                      GARUD AI ASSISTANT
                    </h3>
                    <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-white/20'}`} />
                  </div>
                  
                  <div className="flex-1 space-y-4 overflow-y-auto mb-6 max-h-[400px] scrollbar-hide">
                    {transcription.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-30">
                        <Zap size={48} className="text-lemon-yellow" />
                        <p className="text-sm italic">Ask me anything about Garud Vehicles...</p>
                      </div>
                    ) : (
                      transcription.map((t, i) => (
                        <div key={i} className={`p-3 rounded-xl text-sm ${t.startsWith('AI:') ? 'bg-electric-blue/20 border border-electric-blue/30 self-start' : 'bg-white/5 self-end ml-8'}`}>
                          {t}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="relative flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-2 focus-within:border-electric-blue transition-all">
                      <Search size={18} className="ml-2 text-white/20" />
                      <input 
                        type="file" 
                        id="ai-camera" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageInput}
                      />
                      <label htmlFor="ai-camera" className="p-2 hover:bg-white/10 rounded-xl cursor-pointer text-white/40 hover:text-white transition-all">
                        <Camera size={20} />
                      </label>
                      <input 
                        type="text"
                        placeholder="Ask about vehicles..."
                        className="flex-1 bg-transparent border-none outline-none text-sm py-2"
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
                      />
                      <button 
                        onClick={isRecording ? stopLiveSession : startLiveSession}
                        className={`p-2 rounded-xl transition-all ${isRecording ? 'text-red-500 bg-red-500/10' : 'text-white/40 hover:text-white'}`}
                      >
                        {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                      </button>
                      <button 
                        onClick={handleSendText}
                        className="p-2 bg-electric-blue text-white rounded-xl hover:bg-electric-blue/80 transition-all"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                    {isRecording && (
                      <p className="text-[10px] text-center text-red-500 font-bold uppercase tracking-widest animate-pulse">
                        Live Voice Active - I am listening...
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="glass-panel p-6 rounded-2xl border border-lemon-yellow/20 bg-lemon-yellow/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                      <MessageSquare size={40} />
                    </div>
                    <h3 className="font-bold mb-3 text-lemon-yellow uppercase tracking-widest text-xs flex items-center gap-2">
                      <User size={14} />
                      Owner's Message
                    </h3>
                    <p className="text-sm text-white/80 italic leading-relaxed">
                      "{OWNER_MESSAGE}"
                    </p>
                  </div>

                  <div className="glass-panel p-6 rounded-2xl border border-white/10">
                    <h3 className="font-bold mb-4 text-electric-blue uppercase tracking-widest text-xs">Vehicle Specs</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Zap className="text-lemon-yellow" size={18} />
                          <span className="text-sm">Range</span>
                        </div>
                        <span className="font-bold">200 KM / Charge</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Battery className="text-lemon-yellow" size={18} />
                          <span className="text-sm">Battery Warranty</span>
                        </div>
                        <span className="font-bold">3 Years</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Truck className="text-lemon-yellow" size={18} />
                          <span className="text-sm">Vehicle Warranty</span>
                        </div>
                        <span className="font-bold">1 Year</span>
                      </div>
                    </div>
                  </div>

                  <div className="glass-panel p-6 rounded-2xl border border-white/10">
                    <h3 className="font-bold mb-4 text-electric-blue uppercase tracking-widest text-xs">Services</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                        <Wrench size={16} className="text-lemon-yellow" />
                        <span className="text-sm">Quick Repair & Service</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                        <BadgePercent size={16} className="text-lemon-yellow" />
                        <span className="text-sm">Exchange Offer (60-70%)</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                        <Zap size={16} className="text-lemon-yellow" />
                        <span className="text-sm">Finance Available</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-lemon-yellow p-6 rounded-2xl text-black">
                    <h3 className="font-black text-2xl tracking-tighter mb-2">BOOK NOW</h3>
                    <p className="text-sm font-bold opacity-80 mb-4">Secure your vehicle with just ₹50,000 + Advance</p>
                    <div className="text-[10px] font-mono uppercase tracking-tighter opacity-60">
                      Near Santoshi Maa Temple, Bijupur, Berhampur
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'vehicles' ? (
          <VehicleManagement 
            vehicles={vehicles} 
            onRequestQuotation={(v) => setSelectedVehicleForQuotation(v)}
            onBookTestDrive={(v) => setSelectedVehicleForTestDrive(v)}
            onImageClick={(url) => setSelectedImage(url)}
            onGoToReviews={() => setActiveTab('reviews')}
            isOwner={isOwner}
          />
        ) : activeTab === 'reviews' ? (
          <ReviewPage user={user} isOwner={isOwner} vehicles={vehicles} customerName={customerName} />
        ) : (activeTab === 'dashboard' && isOwner) ? (
          <OwnerDashboard />
        ) : (
          <ContactPage />
        )}        {/* Modals */}
        <AnimatePresence>
          {selectedVehicleForQuotation && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-lg"
              >
                <QuotationForm 
                  vehicle={selectedVehicleForQuotation} 
                  onClose={() => setSelectedVehicleForQuotation(null)}
                  onOpenFinance={() => setShowFinanceSheet(true)}
                />
              </motion.div>
            </motion.div>
          )}

          {showFinanceSheet && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-2xl"
              >
                <FinanceSheet onClose={() => setShowFinanceSheet(false)} />
              </motion.div>
            </motion.div>
          )}

          {selectedVehicleForTestDrive && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-lg"
              >
                <TestDriveForm 
                  vehicle={selectedVehicleForTestDrive} 
                  onClose={() => setSelectedVehicleForTestDrive(null)}
                />
              </motion.div>
            </motion.div>
          )}

          {selectedImage && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedImage(null)}
              className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative max-w-5xl w-full max-h-[90vh] flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-12 right-0 text-white/60 hover:text-white transition-colors flex items-center gap-2 font-bold uppercase tracking-widest text-xs"
                >
                  CLOSE <X size={20} />
                </button>
                <img 
                  src={selectedImage} 
                  alt="Vehicle Gallery" 
                  className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl border border-white/10"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Progress */}
      <footer className="fixed bottom-0 w-full h-1 bg-white/10">
        <motion.div 
          className="h-full bg-electric-blue shadow-[0_0_10px_#007BFF]"
          initial={{ width: "0%" }}
          animate={{ width: activeTab === 'script' ? `${((currentSceneIndex + 1) / COMMERCIAL_SCRIPT.length) * 100}%` : '100%' }}
        />
      </footer>
    </div>
    </LanguageContext.Provider>
  );
}
