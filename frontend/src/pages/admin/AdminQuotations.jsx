import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Plus, Trash2, Printer, ChevronLeft, Save, History, Search, X,
  MessageSquare, Mail, ShieldCheck, CheckCircle2, Building2, Zap, Phone,
  MapPin, Calendar, Clock, AlertTriangle, Layers, ChevronDown, ChevronUp, Sun
} from 'lucide-react';
import api from '../../api/axios';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';
import logo from '../../assets/kalpana-logo.png';
import signature from '../../assets/signature.png';

const ACCENT_COLOR = '#4758da'; // Brand blue
const DARK_GRAY = '#1E1E1E';

// Helper for Indian Rupees format
function fmt(n) {
  const val = Number(n) || 0;
  return '₹ ' + Math.round(val).toLocaleString('en-IN');
}

// Convert numbers to Words in Indian numbering (Lakhs/Crores)
function numWords(num) {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
             'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
             'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  function c(n) {
    if (!n) return '';
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
    if (n < 1e3) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + c(n % 100) : '');
    if (n < 1e5) return c(Math.floor(n / 1e3)) + ' Thousand' + (n % 1e3 ? ' ' + c(n % 1e3) : '');
    if (n < 1e7) return c(Math.floor(n / 1e5)) + ' Lakh' + (n % 1e5 ? ' ' + c(n % 1e5) : '');
    return c(Math.floor(n / 1e7)) + ' Crore' + (n % 1e7 ? ' ' + c(n % 1e7) : '');
  }
  const result = c(Math.round(num));
  return result ? result + ' Rupees Only' : 'Zero Rupees Only';
}

const WIRING_OPTIONS = [
  'Complete Copper Wiring',
  'Copper + Armoured Cable + 16 mm Aluminium',
  'Copper + Armoured Cable + Copper Earthing',
];

const STRUCTURE_OPTIONS = [
  '3inch gi',
  '4inch gi',
  '6inch gi',
  'hdgi 5inch',
];

export default function AdminQuotations() {
  const navigate = useNavigate();

  // Mode: builder vs history
  const [viewMode, setViewMode] = useState('builder');
  const [history, setHistory] = useState([]);

  // Page 1: Customer Details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // Invoice identifiers
  const [estimateNo, setEstimateNo] = useState(() => String(Math.floor(Math.random() * 9000) + 1000));
  const [estimateDate, setEstimateDate] = useState(() => {
    const d = new Date();
    return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
  });

  // Page 2: Solar System Details
  const [projectCategory, setProjectCategory] = useState('Residential'); // Residential | Commercial
  const [systemType, setSystemType] = useState('On-Grid'); // On-Grid | Hybrid | Off-Grid

  // Solar Panels
  const [panelCompanyType, setPanelCompanyType] = useState('Tata Power 550W Mono PERC Bifacial');
  const [panelWattage, setPanelWattage] = useState('550 W');
  const [panelQty, setPanelQty] = useState(6);
  const [panelWarranty, setPanelWarranty] = useState('25');

  // Inverter
  const [inverterNameType, setInverterNameType] = useState('Solis Dual MPPT Grid-Tie');
  const [inverterLoad, setInverterLoad] = useState('3.3 kW');
  const [inverterWarranty, setInverterWarranty] = useState('5');

  // Battery (Conditional for Hybrid / Off-Grid)
  const [batteryNameType, setBatteryNameType] = useState('Luminous Solar Tubular Battery');
  const [batteryCapacity, setBatteryCapacity] = useState('150 Ah');
  const [batteryQty, setBatteryQty] = useState(2);
  const [batteryWarranty, setBatteryWarranty] = useState('3');

  // Structure & Wiring
  const [structureType, setStructureType] = useState(STRUCTURE_OPTIONS[0]);
  const [wiringType, setWiringType] = useState(WIRING_OPTIONS[0]);

  // Quoted Total System Amount (₹)
  const [totalSystemAmount, setTotalSystemAmount] = useState('195000');

  // Optional: Detailed itemized list (for custom components / inventory integration)
  const [showItemizedSection, setShowItemizedSection] = useState(false);
  const [items, setItems] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Automatic Payment Calculation (Section 4)
  const numericTotal = Number(totalSystemAmount) || 0;
  const advancePayment70 = Math.round(numericTotal * 0.70);
  const balancePayment30 = Math.round(numericTotal * 0.30);

  // Calculated system capacity in kW (from panels)
  const calculatedCapacityKW = (() => {
    const w = parseFloat(panelWattage) || 0;
    const q = parseFloat(panelQty) || 0;
    if (w > 0 && q > 0) {
      return ((w * q) / 1000).toFixed(2) + ' kW';
    }
    return inverterLoad || '3 kW';
  })();

  // Fetch quotations history
  const fetchHistory = () => {
    api.get('/quotations')
      .then(res => setHistory(res.data || []))
      .catch(err => console.error('Failed to load history:', err));
  };

  useEffect(() => {
    fetchHistory();
    api.get('/stock/items', { params: { picker: 1, limit: 1000 } })
      .then(res => setStockItems(res.data.items || []))
      .catch(err => console.error('Failed to load stock items:', err));
  }, []);

  // Save Quotation to History
  const handleSaveQuotation = async () => {
    if (!customerName.trim()) {
      toast.error('Please enter Customer Name.');
      return;
    }
    if (!customerPhone.trim()) {
      toast.error('Please enter Customer Phone Number.');
      return;
    }
    if (numericTotal <= 0) {
      toast.error('Please enter a valid Total System Amount.');
      return;
    }

    try {
      await api.post('/quotations', {
        estimateNo,
        date: estimateDate,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerCity: customerCity.trim(),
        customerAddress: customerAddress.trim(),
        category: projectCategory.toLowerCase(),
        projectCategory,
        systemType,
        systemDetails: {
          panelCompanyType,
          panelWattage,
          panelQty: Number(panelQty) || 0,
          panelWarranty,
          inverterNameType,
          inverterLoad,
          inverterWarranty,
          batteryNameType: systemType === 'On-Grid' ? 'N/A' : batteryNameType,
          batteryCapacity: systemType === 'On-Grid' ? 'N/A' : batteryCapacity,
          batteryQty: systemType === 'On-Grid' ? 0 : Number(batteryQty) || 0,
          batteryWarranty: systemType === 'On-Grid' ? 'N/A' : batteryWarranty,
          structureType,
          wiringType,
          totalSystemAmount: numericTotal,
        },
        paymentSplit: {
          advance70: advancePayment70,
          balance30: balancePayment30,
        },
        items: items.length > 0 ? items : [{
          name: `${projectCategory} ${systemType} Solar System (${calculatedCapacityKW})`,
          hsn: '8541',
          qty: 1,
          unit: 'Set',
          price: numericTotal,
          gst: 0
        }],
        subTotal: numericTotal,
        totalGst: 0,
        grandTotal: numericTotal,
      });

      toast.success('Quotation saved to history!');
      fetchHistory();
      setViewMode('history');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save quotation');
    }
  };

  // Print / Save PDF
  const handlePrintQuotation = async () => {
    if (!customerName.trim()) {
      toast.error('Please enter Customer Name before printing.');
      return;
    }
    if (numericTotal <= 0) {
      toast.error('Please enter a valid Total System Amount.');
      return;
    }

    try {
      await api.post('/quotations', {
        estimateNo,
        date: estimateDate,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerCity: customerCity.trim(),
        customerAddress: customerAddress.trim(),
        category: projectCategory.toLowerCase(),
        projectCategory,
        systemType,
        systemDetails: {
          panelCompanyType,
          panelWattage,
          panelQty: Number(panelQty) || 0,
          panelWarranty,
          inverterNameType,
          inverterLoad,
          inverterWarranty,
          batteryNameType: systemType === 'On-Grid' ? 'N/A' : batteryNameType,
          batteryCapacity: systemType === 'On-Grid' ? 'N/A' : batteryCapacity,
          batteryQty: systemType === 'On-Grid' ? 0 : Number(batteryQty) || 0,
          batteryWarranty: systemType === 'On-Grid' ? 'N/A' : batteryWarranty,
          structureType,
          wiringType,
          totalSystemAmount: numericTotal,
        },
        paymentSplit: {
          advance70: advancePayment70,
          balance30: balancePayment30,
        },
        items: items.length > 0 ? items : [{
          name: `${projectCategory} ${systemType} Solar System (${calculatedCapacityKW})`,
          hsn: '8541',
          qty: 1,
          unit: 'Set',
          price: numericTotal,
          gst: 0
        }],
        subTotal: numericTotal,
        totalGst: 0,
        grandTotal: numericTotal,
      });
      fetchHistory();
    } catch (err) {
      console.warn('Auto-save before print note:', err);
    }

    window.print();
  };

  // Share via WhatsApp
  const handleShareWhatsApp = () => {
    if (!customerName.trim() || numericTotal <= 0) {
      toast.error('Please enter Customer Name and System Amount.');
      return;
    }
    const cleanPhone = customerPhone.replace(/\D/g, '');
    const isBatteryApplicable = systemType !== 'On-Grid';

    const msg = `*KALPANA SOLAR — QUOTATION ESTIMATE #${estimateNo}*
📅 *Date:* ${estimateDate}
---------------------------------------
👤 *Customer:* ${customerName}
📞 *Phone:* ${customerPhone || '—'}
📍 *City / Address:* ${customerCity ? `${customerCity}, ` : ''}${customerAddress || '—'}

⚡ *SYSTEM SPECIFICATIONS:*
• *Category:* ${projectCategory} (${systemType} System)
• *Capacity:* ${calculatedCapacityKW}
• *Solar Panels:* ${panelCompanyType} (${panelWattage} × ${panelQty} Nos)
• *Panel Warranty:* ${panelWarranty} Years
• *Inverter:* ${inverterNameType} (${inverterLoad})
• *Inverter Warranty:* ${inverterWarranty} Years
${isBatteryApplicable ? `• *Battery Bank:* ${batteryNameType} (${batteryCapacity} × ${batteryQty} Nos)\n• *Battery Warranty:* ${batteryWarranty} Years\n` : ''}• *Structure:* ${structureType}
• *Wiring:* ${wiringType}

💰 *COMMERCIALS & PAYMENT TERMS:*
• *Total System Cost:* ₹ ${numericTotal.toLocaleString('en-IN')} (All inclusive)
• *70% Advance:* ₹ ${advancePayment70.toLocaleString('en-IN')}
• *30% After Installation:* ₹ ${balancePayment30.toLocaleString('en-IN')}

✅ *INCLUDED:* GST, Transportation, Installation & Civil Work
ℹ️ *Paperwork:* Extra charges apply for DISCOM & cash-related paperwork
⏳ *Validity:* 7 Days from quotation date

🏦 *BANK DETAILS FOR PAYMENT:*
Beneficiary: KALPANA SOLAR TRADERS
Bank: Canara Bank (Kidwai nagar) | A/C: 120038425487 | IFSC: CNRB0018744
GST: 09BBDPY7262H1Z3

Kalpana Solar · Kanpur (U.P.)
📞 8736992133 | ✉️ kalpanasolartradersinfo@gmail.com`;

    const url = cleanPhone.length >= 10
      ? `https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Share via Email
  const handleShareEmail = () => {
    if (!customerName.trim() || numericTotal <= 0) {
      toast.error('Please enter Customer Name and System Amount.');
      return;
    }
    const isBatteryApplicable = systemType !== 'On-Grid';
    const subject = `Solar System Quotation Estimate #${estimateNo} for ${customerName} — Kalpana Solar`;
    const body = `Dear ${customerName},

Thank you for choosing Kalpana Solar. Please find the details of your Solar System Quotation below:

Quotation No: ${estimateNo}
Date: ${estimateDate}
Customer Name: ${customerName}
Phone: ${customerPhone}
Address: ${customerAddress} ${customerCity ? `(${customerCity})` : ''}

SYSTEM CONFIGURATION:
• Project Category: ${projectCategory}
• System Type: ${systemType}
• Total Capacity: ${calculatedCapacityKW}
• Solar Panels: ${panelCompanyType} (${panelWattage} × ${panelQty} Nos) — ${panelWarranty} Years Warranty
• Solar Inverter: ${inverterNameType} (${inverterLoad}) — ${inverterWarranty} Years Warranty
${isBatteryApplicable ? `• Battery Bank: ${batteryNameType} (${batteryCapacity} × ${batteryQty} Nos) — ${batteryWarranty} Years Warranty\n` : ''}• Mounting Structure: ${structureType}
• Cabling & Wiring: ${wiringType}

COMMERCIAL TERMS:
• Total Quoted Amount: ₹ ${numericTotal.toLocaleString('en-IN')}
• Advance Payment (70%): ₹ ${advancePayment70.toLocaleString('en-IN')}
• Balance After Installation (30%): ₹ ${balancePayment30.toLocaleString('en-IN')}

STANDARD INCLUSIONS & NOTES:
• GST, Transportation, Installation and Civil Work are included in system cost.
• Extra charges will apply for DISCOM and cash-related paperwork.
• Quoted cost is based on installation up to a two-floor building height; additional height is chargeable.
• Quotation valid for 7 days from the quotation date.

BANK DETAILS FOR NEFT/RTGS/IMPS:
Beneficiary: KALPANA SOLAR TRADERS
Bank Name: Canara Bank
Branch: Kidwai nagar
Account No.: 120038425487
IFSC Code: CNRB0018744
GST: 09BBDPY7262H1Z3

Please let us know if you need any further assistance.

Warm regards,
Kalpana Solar Team
Phone: 8736992133
Email: kalpanasolartradersinfo@gmail.com
Office: 12 A Rajendra Nagar Naubasta Kanpur 208021`;

    window.open(`mailto:${customerEmail || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  // Load quotation from history
  const loadQuotation = (q) => {
    setEstimateNo(q.estimateNo);
    setEstimateDate(q.date);
    setCustomerName(q.customerName || '');
    setCustomerPhone(q.customerPhone || '');
    setCustomerCity(q.customerCity || '');
    setCustomerAddress(q.customerAddress || '');
    setProjectCategory(q.projectCategory || (q.category === 'commercial' ? 'Commercial' : 'Residential'));
    setSystemType(q.systemType || 'On-Grid');

    if (q.systemDetails) {
      setPanelCompanyType(q.systemDetails.panelCompanyType || '');
      setPanelWattage(q.systemDetails.panelWattage || '');
      setPanelQty(q.systemDetails.panelQty || 1);
      setPanelWarranty(q.systemDetails.panelWarranty || '25');
      setInverterNameType(q.systemDetails.inverterNameType || '');
      setInverterLoad(q.systemDetails.inverterLoad || '');
      setInverterWarranty(q.systemDetails.inverterWarranty || '5');
      setBatteryNameType(q.systemDetails.batteryNameType || '');
      setBatteryCapacity(q.systemDetails.batteryCapacity || '');
      setBatteryQty(q.systemDetails.batteryQty || 1);
      setBatteryWarranty(q.systemDetails.batteryWarranty || '3');
      setStructureType(q.systemDetails.structureType || STRUCTURE_OPTIONS[0]);
      setWiringType(q.systemDetails.wiringType || WIRING_OPTIONS[0]);
      setTotalSystemAmount(String(q.systemDetails.totalSystemAmount || q.grandTotal || ''));
    } else {
      setTotalSystemAmount(String(q.grandTotal || ''));
    }

    if (q.items && q.items.length > 0) {
      setItems(q.items.map(item => ({
        name: item.name,
        hsn: item.hsn || '',
        qty: item.qty,
        unit: item.unit || 'Nos',
        price: item.price,
        gst: item.gst
      })));
    }

    setViewMode('builder');
    toast.success(`Loaded Estimate #${q.estimateNo}`);
  };

  // Delete quotation from history
  const deleteQuotation = async (id) => {
    if (!window.confirm('Are you sure you want to delete this quotation from history?')) return;
    try {
      await api.delete(`/quotations/${id}`);
      toast.success('Quotation deleted from history');
      fetchHistory();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete quotation');
    }
  };

  // Itemized table helper handlers
  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    if (field === 'price' || field === 'qty' || field === 'gst') {
      updated[index][field] = parseFloat(value) || 0;
    } else {
      updated[index][field] = value;
    }
    setItems(updated);
  };

  const addRow = () => {
    setItems([...items, { name: '', hsn: '', qty: 1, unit: 'Nos', price: 0, gst: 0 }]);
  };

  const addInventoryItem = (item) => {
    const newItem = {
      name: item.name,
      hsn: '',
      qty: 1,
      unit: item.unit || 'Nos',
      price: item.sellPrice || 0,
      gst: 0
    };
    setItems([...items, newItem]);
    toast.success(`Added "${item.name}" from inventory`);
  };

  const removeRow = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculate sum of itemized items if user uses them
  const itemizedTotal = items.reduce((sum, it) => sum + (it.qty * it.price * (1 + (it.gst || 0) / 100)), 0);

  const isBatteryApplicable = systemType !== 'On-Grid';

  return (
    <Layout module="crm">
      {/* CSS Print Styles */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 6mm;
        }
        @media print {
          header, aside, .no-print {
            display: none !important;
          }
          html, body, #root, div[class*="h-screen"], main, .print-invoice-wrapper {
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            position: static !important;
            background: white !important;
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
          }
          #print-invoice, #print-invoice * {
            visibility: visible !important;
          }
          #print-invoice {
            display: block !important;
            position: relative !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: 1px solid #e5e7eb !important;
            color: #000 !important;
            background: white !important;
            box-sizing: border-box !important;
          }
          .print-header-bg {
            background-color: ${ACCENT_COLOR} !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-dark-bg {
            background-color: ${DARK_GRAY} !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-badge-bg {
            background-color: #eff2fe !important;
            color: #1e2566 !important;
            border: 1px solid #c7d2fa !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      <div className="no-print p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-600 text-sm font-semibold hover:bg-gray-50 transition shadow-xs"
            >
              <ChevronLeft size={16} /> Admin Panel
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                <FileText className="text-brand-500" /> Solar Quotation Generator
              </h1>
              <p className="text-xs sm:text-sm text-gray-500">Create, customize, share and print official Kalpana Solar quotations</p>
            </div>
          </div>

          {viewMode === 'builder' && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="btn-secondary py-2 px-3 text-xs inline-flex items-center gap-1.5 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                title="Share quotation summary on WhatsApp"
              >
                <MessageSquare size={15} className="text-emerald-600" />
                <span>WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={handleShareEmail}
                className="btn-secondary py-2 px-3 text-xs inline-flex items-center gap-1.5 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                title="Email quotation summary"
              >
                <Mail size={15} className="text-blue-600" />
                <span>Email</span>
              </button>
              <button
                type="button"
                onClick={handleSaveQuotation}
                className="btn-secondary py-2 px-3 text-xs inline-flex items-center gap-1.5"
              >
                <Save size={15} />
                <span>Save to History</span>
              </button>
              <button
                type="button"
                onClick={handlePrintQuotation}
                className="btn-primary py-2 px-3.5 text-xs inline-flex items-center gap-1.5"
              >
                <Printer size={15} />
                <span>Print / Save PDF</span>
              </button>
            </div>
          )}
        </div>

        {/* View Mode Tabs: Builder vs History */}
        <div className="flex border-b border-gray-200 mb-6 gap-6">
          <button
            onClick={() => setViewMode('builder')}
            className={`pb-3 font-bold text-sm border-b-2 transition ${viewMode === 'builder' ? 'border-brand-500 text-brand-600 font-extrabold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Quotation Builder
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`pb-3 font-bold text-sm border-b-2 transition ${viewMode === 'history' ? 'border-brand-500 text-brand-600 font-extrabold' : 'border-transparent text-gray-500 hover:text-gray-700'} flex items-center gap-1.5`}
          >
            <History size={15} /> Saved History ({history.length})
          </button>
        </div>

        {viewMode === 'builder' && (
          <div className="space-y-6">
            {/* ── Section 1: Customer Details (Page 1 Requirements) ── */}
            <div className="card p-5 sm:p-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">1</span>
                  <h3 className="font-bold text-gray-900 text-base">Customer Details (Basic Information)</h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                  <span>Est #{estimateNo}</span> · <span>{estimateDate}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="label">Customer Name *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="input"
                    placeholder="e.g. Ramesh Kumar"
                    required
                  />
                </div>

                <div>
                  <label className="label">Phone Number *</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="input"
                    placeholder="e.g. 9876543210"
                    required
                  />
                </div>

                <div>
                  <label className="label">City</label>
                  <input
                    type="text"
                    value={customerCity}
                    onChange={(e) => setCustomerCity(e.target.value)}
                    className="input"
                    placeholder="e.g. Kanpur"
                  />
                </div>

                <div>
                  <label className="label">Estimate / Quotation No.</label>
                  <input
                    type="text"
                    value={estimateNo}
                    onChange={(e) => setEstimateNo(e.target.value)}
                    className="input"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="label">Complete Address (Multi-line text)</label>
                  <textarea
                    rows={2}
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="input resize-none"
                    placeholder="e.g. Plot No. 45, Near Hanuman Mandir, Barra-2, Kanpur 208027"
                  />
                </div>

                <div>
                  <label className="label">Quotation Date</label>
                  <input
                    type="text"
                    value={estimateDate}
                    onChange={(e) => setEstimateDate(e.target.value)}
                    className="input"
                    placeholder="DD-MM-YYYY"
                  />
                </div>
              </div>
            </div>

            {/* ── Section 2: Solar System Details (Page 2 Requirements) ── */}
            <div className="card p-5 sm:p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">2</span>
                  <h3 className="font-bold text-gray-900 text-base">Solar System Details & Specifications</h3>
                </div>

                {/* Project Category & System Type Selectors */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Category */}
                  <div className="inline-flex rounded-xl p-1 bg-gray-100 border border-gray-200 text-xs">
                    {['Residential', 'Commercial'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setProjectCategory(cat)}
                        className={`px-3 py-1 rounded-lg font-bold transition-all ${
                          projectCategory === cat
                            ? 'bg-brand-500 text-white shadow-xs'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* System Type */}
                  <div className="inline-flex rounded-xl p-1 bg-gray-100 border border-gray-200 text-xs">
                    {['On-Grid', 'Hybrid', 'Off-Grid'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setSystemType(st)}
                        className={`px-3 py-1 rounded-lg font-bold transition-all ${
                          systemType === st
                            ? 'bg-brand-500 text-white shadow-xs'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Grid of System Configuration Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 3. Panel Company & Type */}
                <div className="sm:col-span-2">
                  <label className="label">Panel Company & Type (Free-text)</label>
                  <input
                    type="text"
                    value={panelCompanyType}
                    onChange={(e) => setPanelCompanyType(e.target.value)}
                    className="input"
                    placeholder="e.g. Tata Power 550W Mono PERC Bifacial"
                  />
                </div>

                {/* 4. Panel Voltage / Wattage */}
                <div>
                  <label className="label">Panel Wattage / Voltage (W / V)</label>
                  <input
                    type="text"
                    value={panelWattage}
                    onChange={(e) => setPanelWattage(e.target.value)}
                    className="input"
                    placeholder="e.g. 550 W"
                  />
                </div>

                {/* 5. Panel Quantity & 6. Warranty */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label">Panel Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={panelQty}
                      onChange={(e) => setPanelQty(e.target.value)}
                      className="input font-bold"
                    />
                  </div>
                  <div>
                    <label className="label">Warranty (Yrs)</label>
                    <input
                      type="text"
                      value={panelWarranty}
                      onChange={(e) => setPanelWarranty(e.target.value)}
                      className="input"
                      placeholder="e.g. 25"
                    />
                  </div>
                </div>

                {/* 7. Inverter Name & Type */}
                <div className="sm:col-span-2">
                  <label className="label">Inverter Name & Type (Free-text)</label>
                  <input
                    type="text"
                    value={inverterNameType}
                    onChange={(e) => setInverterNameType(e.target.value)}
                    className="input"
                    placeholder="e.g. Solis 3.3kW Dual MPPT On-Grid Inverter"
                  />
                </div>

                {/* 8. Inverter Load */}
                <div>
                  <label className="label">Inverter Load (kW / kVA)</label>
                  <input
                    type="text"
                    value={inverterLoad}
                    onChange={(e) => setInverterLoad(e.target.value)}
                    className="input"
                    placeholder="e.g. 3.3 kW"
                  />
                </div>

                {/* 9. Inverter Warranty */}
                <div>
                  <label className="label">Inverter Warranty (Yrs)</label>
                  <input
                    type="text"
                    value={inverterWarranty}
                    onChange={(e) => setInverterWarranty(e.target.value)}
                    className="input"
                    placeholder="e.g. 5"
                  />
                </div>

                {/* 10-13. Battery Fields (Conditional: Hidden/Disabled for On-Grid) */}
                {isBatteryApplicable ? (
                  <>
                    <div className="sm:col-span-2 bg-amber-50/50 p-3 rounded-xl border border-amber-200/60">
                      <div className="flex items-center justify-between mb-1">
                        <label className="label text-amber-800">Battery Name & Type ({systemType})</label>
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">Required for {systemType}</span>
                      </div>
                      <input
                        type="text"
                        value={batteryNameType}
                        onChange={(e) => setBatteryNameType(e.target.value)}
                        className="input bg-white"
                        placeholder="e.g. Luminous Solar Tubular Battery 150Ah"
                      />
                    </div>

                    <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200/60">
                      <label className="label text-amber-800">Battery Capacity</label>
                      <input
                        type="text"
                        value={batteryCapacity}
                        onChange={(e) => setBatteryCapacity(e.target.value)}
                        className="input bg-white"
                        placeholder="e.g. 150 Ah / 48V"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-amber-50/50 p-3 rounded-xl border border-amber-200/60">
                      <div>
                        <label className="label text-amber-800">Battery Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={batteryQty}
                          onChange={(e) => setBatteryQty(e.target.value)}
                          className="input bg-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="label text-amber-800">Warranty</label>
                        <input
                          type="text"
                          value={batteryWarranty}
                          onChange={(e) => setBatteryWarranty(e.target.value)}
                          className="input bg-white"
                          placeholder="e.g. 3 Yrs"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="sm:col-span-2 lg:col-span-4 p-3 bg-gray-50 border border-dashed border-gray-200 rounded-xl flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-2">
                      <ShieldCheck size={16} className="text-gray-400" />
                      <span><strong>Battery Bank:</strong> Not Applicable for On-Grid Systems (Grid-Tied Net Metering).</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSystemType('Hybrid')}
                      className="text-brand-600 font-bold hover:underline"
                    >
                      Switch to Hybrid / Off-Grid
                    </button>
                  </div>
                )}

                {/* 14. Structure Type */}
                <div className="sm:col-span-2">
                  <label className="label">Structure Type (Standard 6x8 ft / 2-floor height)</label>
                  <select
                    value={structureType}
                    onChange={(e) => setStructureType(e.target.value)}
                    className="input"
                  >
                    {STRUCTURE_OPTIONS.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                {/* 15. Wiring Type */}
                <div className="sm:col-span-2">
                  <label className="label">Wiring Type (Dropdown options)</label>
                  <select
                    value={wiringType}
                    onChange={(e) => setWiringType(e.target.value)}
                    className="input"
                  >
                    {WIRING_OPTIONS.map((wt) => (
                      <option key={wt} value={wt}>{wt}</option>
                    ))}
                  </select>
                </div>

                {/* 16. Total System Amount */}
                <div className="sm:col-span-2 lg:col-span-4 bg-brand-50/60 p-4 rounded-2xl border border-brand-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1 w-full sm:w-auto">
                    <label className="label text-brand-900 font-bold">Total Quoted System Amount (₹) *</label>
                    <div className="relative mt-1">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-extrabold text-lg">₹</span>
                      <input
                        type="number"
                        min="1"
                        value={totalSystemAmount}
                        onChange={(e) => setTotalSystemAmount(e.target.value)}
                        className="input pl-8 font-black text-lg text-brand-900 bg-white"
                        placeholder="e.g. 195000"
                        required
                      />
                    </div>
                    <p className="text-xs text-brand-700 font-semibold mt-1">
                      {numericTotal > 0 ? numWords(numericTotal) : 'Enter total amount to compute payment split'}
                    </p>
                  </div>

                  {/* Section 4: Automatic Payment Calculation Display */}
                  <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
                    <div className="bg-white p-3 rounded-xl border border-brand-200/80 shadow-xs text-center min-w-[140px]">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">70% Advance</p>
                      <p className="text-base font-black text-brand-700 mt-0.5">{fmt(advancePayment70)}</p>
                      <p className="text-[9px] text-gray-400">At booking time</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-brand-200/80 shadow-xs text-center min-w-[140px]">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">30% Post Install</p>
                      <p className="text-base font-black text-emerald-700 mt-0.5">{fmt(balancePayment30)}</p>
                      <p className="text-[9px] text-gray-400">After installation</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Section 3: Standard Inclusions & Terms Card ── */}
            <div className="card p-5 sm:p-6 bg-gradient-to-br from-white to-gray-50/70">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-3">
                <span className="w-6 h-6 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">3</span>
                <h3 className="font-bold text-gray-900 text-base">Standard Quotation Inclusions & Terms</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-gray-200">
                  <p className="font-bold text-gray-700">GST, Transport & Installation</p>
                  <p className="text-emerald-700 font-semibold mt-0.5">✓ Included in system cost</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-gray-200">
                  <p className="font-bold text-gray-700">Civil Work & Foundations</p>
                  <p className="text-emerald-700 font-semibold mt-0.5">✓ Included in system cost</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-gray-200">
                  <p className="font-bold text-gray-700">Standard Project Height</p>
                  <p className="text-gray-600 mt-0.5">2-floor building height (extra height chargeable)</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-gray-200">
                  <p className="font-bold text-gray-700">DISCOM & Paperwork</p>
                  <p className="text-amber-700 font-semibold mt-0.5">Extra charges apply</p>
                </div>
              </div>
            </div>

            {/* ── Optional Collapsible Section: Custom Itemized Line Items & Inventory Picker ── */}
            <div className="card p-4 sm:p-5">
              <button
                type="button"
                onClick={() => setShowItemizedSection(!showItemizedSection)}
                className="w-full flex items-center justify-between text-left font-bold text-gray-800 text-sm"
              >
                <span className="flex items-center gap-2">
                  <Layers size={16} className="text-brand-500" />
                  <span>Optional or Additionals</span>
                </span>
                {showItemizedSection ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {showItemizedSection && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-gray-500">
                      Add specific component stock items if you wish to generate an itemized BOM alongside the solar specification.
                    </p>
                    <div className="flex items-center gap-2">
                      {/* Inventory Dropdown Search */}
                      <div className="relative">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 text-xs">
                          <Search size={14} className="text-gray-400" />
                          <input
                            type="text"
                            placeholder="Pick from inventory..."
                            value={searchQuery}
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              setShowDropdown(true);
                            }}
                            onFocus={() => setShowDropdown(true)}
                            className="border-none outline-none text-xs bg-transparent w-36"
                          />
                        </div>

                        {showDropdown && (
                          <div className="absolute right-0 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                            {stockItems
                              .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
                              .map(item => (
                                <button
                                  key={item._id}
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    addInventoryItem(item);
                                    setSearchQuery('');
                                    setShowDropdown(false);
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-brand-50/50 flex flex-col gap-0.5 border-b border-gray-100 last:border-0 transition"
                                >
                                  <span className="font-bold text-xs text-gray-800">{item.name}</span>
                                  <span className="text-[10px] text-gray-500 flex justify-between w-full">
                                    <span>Price: ₹{item.sellPrice?.toLocaleString('en-IN')}</span>
                                    <span>Stock: {item.quantity} {item.unit}</span>
                                  </span>
                                </button>
                              ))}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={addRow}
                        className="btn-secondary py-1.5 px-3 text-xs inline-flex items-center gap-1"
                      >
                        <Plus size={14} /> Add Row
                      </button>

                      {items.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setTotalSystemAmount(String(Math.round(itemizedTotal)))}
                          className="btn-secondary py-1.5 px-3 text-xs text-brand-700 border-brand-200 bg-brand-50 hover:bg-brand-100"
                        >
                          Use Item Sum (₹{Math.round(itemizedTotal).toLocaleString('en-IN')})
                        </button>
                      )}
                    </div>
                  </div>

                  {items.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-gray-200 text-gray-500 font-bold uppercase">
                            <th className="py-2 px-2">#</th>
                            <th className="py-2 px-2">Item Description</th>
                            <th className="py-2 px-2 text-center">Qty</th>
                            <th className="py-2 px-2">Unit</th>
                            <th className="py-2 px-2 text-right">Price</th>
                            <th className="py-2 px-2 text-right">Total</th>
                            <th className="py-2 px-2 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {items.map((it, idx) => (
                            <tr key={idx}>
                              <td className="py-2 px-2 font-mono text-gray-400">{idx + 1}</td>
                              <td className="py-2 px-2">
                                <input
                                  type="text"
                                  value={it.name}
                                  onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                                  className="input py-1 text-xs"
                                  placeholder="Component name"
                                />
                              </td>
                              <td className="py-2 px-2 text-center">
                                <input
                                  type="number"
                                  min="1"
                                  value={it.qty}
                                  onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                                  className="input py-1 text-xs text-center w-16"
                                />
                              </td>
                              <td className="py-2 px-2">
                                <input
                                  type="text"
                                  value={it.unit}
                                  onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                                  className="input py-1 text-xs w-16"
                                />
                              </td>
                              <td className="py-2 px-2 text-right">
                                <input
                                  type="number"
                                  value={it.price}
                                  onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                                  className="input py-1 text-xs text-right w-24"
                                />
                              </td>
                              <td className="py-2 px-2 text-right font-bold text-gray-800">
                                {fmt(it.qty * it.price)}
                              </td>
                              <td className="py-2 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeRow(idx)}
                                  className="p-1 text-red-500 hover:text-red-700"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── View Mode: Saved History ── */}
        {viewMode === 'history' && (
          <div className="card p-5 sm:p-6 overflow-hidden">
            <h3 className="font-bold text-gray-900 text-base mb-4 border-b border-gray-100 pb-3">
              Saved Quotation History ({history.length} records)
            </h3>
            {history.length === 0 ? (
              <div className="py-12 text-center">
                <FileText size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium mb-3">No quotations saved to history yet.</p>
                <button
                  type="button"
                  onClick={() => setViewMode('builder')}
                  className="btn-primary py-2 px-4 text-xs"
                >
                  Create Your First Quotation
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 text-xs font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Est No.</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Customer Details</th>
                      <th className="py-3 px-4">Category & System</th>
                      <th className="py-3 px-4 text-right">Quoted Amount</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {history.map((q) => (
                      <tr key={q._id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4 font-mono font-bold text-brand-700">#{q.estimateNo}</td>
                        <td className="py-3 px-4 text-gray-500 text-xs">{q.date}</td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-gray-900">{q.customerName}</p>
                          <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                            {q.customerPhone && <span>{q.customerPhone}</span>}
                            {q.customerCity && <span>· {q.customerCity}</span>}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200">
                            {q.projectCategory || q.category} · {q.systemType || 'On-Grid'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-black text-gray-900">
                          {fmt(q.grandTotal)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => loadQuotation(q)}
                              className="px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 text-xs font-bold"
                            >
                              Load & Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteQuotation(q._id)}
                              className="p-1 rounded text-red-500 hover:bg-red-50"
                              title="Delete"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── High-Fidelity Printable Estimate Sheet (#print-invoice) ── */}
      {viewMode === 'builder' && (
        <div className="flex justify-center bg-gray-50 pb-16 print-invoice-wrapper">
          <div
            id="print-invoice"
            className="bg-white w-[210mm] min-h-[297mm] shadow-lg border border-gray-200 mx-auto text-black font-sans relative"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            {/* Top Red/Brand Header Banner */}
            <div
              className="print-header-bg text-white px-6 py-2 flex items-center justify-between text-[10px] font-bold"
              style={{ backgroundColor: ACCENT_COLOR }}
            >
              <div className="flex items-center gap-4">
                <span>📞 8736992133</span>
                <span>✉️ kalpanasolartradersinfo@gmail.com</span>
              </div>
              <div className="text-right">
                OFFICE ADD: 12 A Rajendra Nagar Naubasta Kanpur 208021
              </div>
            </div>

            {/* Dark Brand Block with Logo */}
            <div
              className="print-dark-bg text-white px-6 py-3.5 flex items-center justify-between shadow-sm"
              style={{ backgroundColor: DARK_GRAY }}
            >
              <div className="flex items-center gap-3.5">
                <img
                  src={logo}
                  alt="Kalpana Solar"
                  className="w-14 h-14 rounded-xl object-contain bg-white p-1 border border-white/20"
                  onError={(e) => { e.target.src = '/kalpana-logo.png'; }}
                />
                <div>
                  <h2 className="text-xl font-black tracking-tight leading-none text-white">KALPANA SOLAR</h2>
                  <p className="text-[9px] text-gray-300 mt-1 uppercase font-bold tracking-wider">
                    GSTIN: <span className="text-yellow-400">09BBDPY7262H1Z3</span> · State: 09-Uttar Pradesh
                  </p>
                  <p className="text-[9px] text-gray-300">Complete Solar Rooftop, Hybrid & Off-Grid Solutions</p>
                </div>
              </div>

              <div className="text-right">
                <h1 className="text-2xl font-black tracking-wider leading-none text-white italic">Solar System Quotation</h1>
                <p className="text-[11px] text-yellow-400 font-bold uppercase tracking-wider mt-1.5">
                  {projectCategory} · {systemType} System ({calculatedCapacityKW})
                </p>
                <p className="text-[10px] text-gray-300 font-semibold mt-0.5">Estimate No. #{estimateNo}</p>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="px-6 py-4 space-y-4">
              {/* Customer Info & Estimate Meta Box */}
              <div className="grid grid-cols-2 gap-4 p-3.5 rounded-xl border border-gray-200 bg-gray-50/60 text-xs">
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Quotation Prepared For:</p>
                  <p className="font-extrabold text-sm text-gray-900 mt-0.5">{customerName || '—'}</p>
                  <p className="text-gray-700 font-semibold mt-0.5">📞 {customerPhone || '—'}</p>
                  <p className="text-gray-600 mt-0.5 leading-snug">
                    📍 {customerAddress || '—'} {customerCity ? `(${customerCity})` : ''}
                  </p>
                </div>
                <div className="text-right flex flex-col justify-between">
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Quotation Details:</p>
                    <p className="font-bold text-gray-800 mt-0.5">Date: {estimateDate}</p>
                    <p className="font-bold text-gray-800">Estimate No: #{estimateNo}</p>
                    <p className="text-brand-700 font-bold mt-0.5">
                      Type: {projectCategory} ({systemType})
                    </p>
                  </div>
                  <p className="text-[10px] font-bold text-emerald-700">
                    Validity: 7 days from quotation date
                  </p>
                </div>
              </div>

              {/* ── Solar System Specifications Table (Section 2 & 5) ── */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-[11px] font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Sun size={14} className="text-brand-600" /> System Specifications & Bill of Materials
                  </h4>
                  <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                    Plant Capacity: {calculatedCapacityKW}
                  </span>
                </div>

                <table className="w-full text-[11px] border-collapse border border-gray-200">
                  <thead>
                    <tr className="print-header-bg text-white text-[9px] font-bold uppercase tracking-wider" style={{ backgroundColor: ACCENT_COLOR }}>
                      <th className="py-2 px-3 text-left w-[30%]">Equipment / Item</th>
                      <th className="py-2 px-3 text-left w-[42%]">Specification Details</th>
                      <th className="py-2 px-2 text-center w-[12%]">Quantity</th>
                      <th className="py-2 px-3 text-center w-[16%]">Warranty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-gray-800">
                    {/* Solar PV Modules */}
                    <tr className="bg-white">
                      <td className="py-2 px-3 font-bold text-gray-900">
                        Solar PV Modules
                        <span className="block text-[9px] text-gray-500 font-normal">Tier-1 High Efficiency Panels</span>
                      </td>
                      <td className="py-2 px-3 font-medium">
                        {panelCompanyType || 'Mono PERC Bifacial'} ({panelWattage || '550 W'})
                      </td>
                      <td className="py-2 px-2 text-center font-bold">{panelQty} Nos</td>
                      <td className="py-2 px-3 text-center font-bold text-brand-700 bg-brand-50/40">
                        {panelWarranty} Years
                      </td>
                    </tr>

                    {/* Solar Inverter */}
                    <tr className="bg-gray-50/40">
                      <td className="py-2 px-3 font-bold text-gray-900">
                        Solar Inverter
                        <span className="block text-[9px] text-gray-500 font-normal">Advanced MPPT Technology</span>
                      </td>
                      <td className="py-2 px-3 font-medium">
                        {inverterNameType || 'Grid-Tie MPPT'} ({inverterLoad || 'Standard'})
                      </td>
                      <td className="py-2 px-2 text-center font-bold">1 Set</td>
                      <td className="py-2 px-3 text-center font-bold text-brand-700 bg-brand-50/40">
                        {inverterWarranty} Years
                      </td>
                    </tr>

                    {/* Battery Bank (Conditional) */}
                    <tr className="bg-white">
                      <td className="py-2 px-3 font-bold text-gray-900">
                        Battery Storage
                        <span className="block text-[9px] text-gray-500 font-normal">Energy Backup Bank</span>
                      </td>
                      <td className="py-2 px-3 font-medium">
                        {isBatteryApplicable
                          ? `${batteryNameType} (${batteryCapacity})`
                          : 'Not Applicable (Grid-Tied Net Metering System)'}
                      </td>
                      <td className="py-2 px-2 text-center font-bold">
                        {isBatteryApplicable ? `${batteryQty} Nos` : 'N/A'}
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-brand-700 bg-brand-50/40">
                        {isBatteryApplicable ? `${batteryWarranty} Years` : 'N/A'}
                      </td>
                    </tr>

                    {/* Structure */}
                    <tr className="bg-gray-50/40">
                      <td className="py-2 px-3 font-bold text-gray-900">
                        Module Mounting Structure
                      </td>
                      <td className="py-2 px-3 font-medium">
                        {structureType} (Standard height 6–8 ft up to 2-floor roof)
                      </td>
                      <td className="py-2 px-2 text-center font-bold">1 Complete Set</td>
                      <td className="py-2 px-3 text-center font-semibold text-gray-400">—</td>
                    </tr>

                    {/* Wiring & BOS */}
                    <tr className="bg-white">
                      <td className="py-2 px-3 font-bold text-gray-900">
                        AC/DC Cabling & Balance of System
                        <span className="block text-[9px] text-gray-500 font-normal">Safety Earthing & Switchgear</span>
                      </td>
                      <td className="py-2 px-3 font-medium">
                        {wiringType} + ACDB / DCDB, SPD, MCB & Copper Earthing Kit
                      </td>
                      <td className="py-2 px-2 text-center font-bold">1 Complete Set</td>
                      <td className="py-2 px-3 text-center font-semibold text-gray-600">Standard 1 Yr</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* ── Section 4 & 5: Commercial Offer & Automatic 70/30 Payment Split ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                {/* Commercial Summary Box */}
                <div className="p-3.5 rounded-xl border-2 border-brand-500 bg-brand-50/40 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-brand-900 uppercase tracking-wider">Total Quoted System Cost</p>
                    <p className="text-2xl font-black text-brand-900 mt-0.5">{fmt(numericTotal)}</p>
                    <p className="text-[10px] text-brand-800 font-semibold mt-1">
                      (All-inclusive: System Cost, GST, Transportation & Installation)
                    </p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-brand-200 text-[10px] text-gray-700">
                    <span className="font-bold">In Words:</span>{' '}
                    <span className="italic font-extrabold text-gray-900">{numWords(numericTotal)}</span>
                  </div>
                </div>

                {/* 70% / 30% Payment Terms Split */}
                <div className="p-3.5 rounded-xl border border-gray-200 bg-white flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Automatic Payment Schedule</span>
                      <span className="text-brand-600 font-extrabold">70% / 30% Split</span>
                    </p>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center p-2 rounded-lg bg-gray-50 border border-gray-100">
                        <div>
                          <span className="font-bold text-gray-900 block">1. Advance Payment (70%)</span>
                          <span className="text-[9px] text-gray-500">Payable at project booking & order confirmation</span>
                        </div>
                        <span className="font-black text-brand-700 text-sm">{fmt(advancePayment70)}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-lg bg-gray-50 border border-gray-100">
                        <div>
                          <span className="font-bold text-gray-900 block">2. Balance Payment (30%)</span>
                          <span className="text-[9px] text-gray-500">Payable immediately after physical on-site installation</span>
                        </div>
                        <span className="font-black text-emerald-700 text-sm">{fmt(balancePayment30)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Section 3: Standard Inclusions & Terms Table ── */}
              <div>
                <h4 className="text-[11px] font-bold text-gray-900 uppercase tracking-wider mb-1.5">
                  Standard Inclusions & Technical Terms
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[10px] border border-gray-200 rounded-xl p-3 bg-gray-50/50">
                  <div className="space-y-1">
                    <p><strong className="text-gray-900">• GST:</strong> Included in the system cost.</p>
                    <p><strong className="text-gray-900">• Transportation:</strong> Included in the system cost.</p>
                    <p><strong className="text-gray-900">• Installation:</strong> Included in the system cost.</p>
                    <p><strong className="text-gray-900">• Civil Work:</strong> Included in the system cost.</p>
                  </div>
                  <div className="space-y-1">
                    <p><strong className="text-gray-900">• DISCOM & Paperwork:</strong> Extra charges will apply for DISCOM & cash-related paperwork.</p>
                    <p><strong className="text-gray-900">• Standard Height:</strong> Quoted cost is based on installation at a two-floor building height (6–8 ft structure size).</p>
                    <p><strong className="text-gray-900">• Additional Height:</strong> Additional charges apply for installation above standard 2nd-floor height.</p>
                    <p><strong className="text-gray-900">• Validity:</strong> Valid for 7 days from the quotation date.</p>
                  </div>
                </div>
              </div>

              {/* Bank Details & Signature Blocks */}
              <div className="pt-2 border-t border-gray-200 grid grid-cols-2 gap-4 text-[10px]">
                {/* Bank Account Details */}
                <div className="p-2.5 rounded-lg border border-gray-200 bg-gray-50/40">
                  <p className="font-bold text-gray-800 text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                    🏦 Bank Account for Payment (NEFT / RTGS / IMPS)
                  </p>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-gray-600">
                    <div>Beneficiary: <strong className="text-gray-900">KALPANA SOLAR TRADERS</strong></div>
                    <div>Bank: <strong className="text-gray-900">Canara Bank</strong></div>
                    <div>A/C No.: <strong className="font-mono text-gray-900">120038425487</strong></div>
                    <div>IFSC: <strong className="font-mono text-gray-900">CNRB0018744</strong></div>
                    <div>Branch: <strong className="text-gray-900">Kidwai nagar</strong></div>
                    <div>GST: <strong className="font-mono text-gray-900">09BBDPY7262H1Z3</strong></div>
                  </div>
                </div>

                {/* Signatures: Customer Acceptance & Kalpana Solar Signatory */}
                <div className="grid grid-cols-2 gap-2 text-center">
                  {/* Customer Acceptance */}
                  <div className="p-2 rounded-lg border border-dashed border-gray-300 flex flex-col justify-between h-20">
                    <p className="text-[9px] font-bold text-gray-500 uppercase">Customer Acceptance</p>
                    <div className="border-t border-gray-300 pt-1 text-[9px] text-gray-500">
                      Sign & Date
                    </div>
                  </div>

                  {/* Kalpana Solar Signatory */}
                  <div className="p-2 rounded-lg border border-gray-200 flex flex-col justify-between items-center h-20 bg-white">
                    <img
                      src={signature}
                      alt="Signature"
                      className="h-9 object-contain"
                      style={{ mixBlendMode: 'multiply' }}
                    />
                    <div className="border-t border-gray-200 w-full pt-0.5 text-[9px] font-bold text-gray-900 leading-tight">
                      For KALPANA SOLAR TRADERS
                      <span className="block text-[8px] text-gray-400 font-normal">Authorized Signatory</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div className="text-center text-[8px] text-gray-400 pt-1 border-t border-gray-100">
                Kalpana Solar · 12 A Rajendra Nagar Naubasta Kanpur 208021 · Phone: 8736992133 · Email: kalpanasolartradersinfo@gmail.com
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
