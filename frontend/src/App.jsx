import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import ProtectedRoute from './components/ProtectedRoute'

import Login from './pages/auth/Login'

export const routeLoaders = {
  '/crm': () => import('./pages/crm/CRMDashboard'),
  '/crm/leads': () => import('./pages/crm/Leads'),
  '/crm/first-paid': () => import('./pages/crm/FirstPaid'),
  '/crm/pending-balance': () => import('./pages/crm/PendingBalance'),
  '/crm/leads/new': () => import('./pages/crm/NewLead'),
  '/crm/leads/:id': () => import('./pages/crm/LeadDetail'),
  '/crm/users': () => import('./pages/crm/Users'),
  '/crm/team': () => import('./pages/crm/Team'),
  '/crm/complaints': () => import('./pages/crm/Complaints'),
  '/crm/orders': () => import('./pages/crm/Orders'),
  '/crm/attendance': () => import('./pages/crm/Attendance'),
  '/stock': () => import('./pages/stock/StockDashboard'),
  '/stock/items': () => import('./pages/stock/StockItems'),
  '/stock/groups': () => import('./pages/stock/LoadGroups'),
  '/stock/voucher/add': () => import('./pages/stock/VoucherForm'),
  '/stock/vouchers': () => import('./pages/stock/VoucherList'),
  '/stock/vouchers/:id/preview': () => import('./pages/stock/VoucherPreview'),
  '/admin': () => import('./pages/admin/AdminDashboard'),
  '/admin/quotations': () => import('./pages/admin/AdminQuotations'),
};

export function preloadRoute(path) {
  const loader = routeLoaders[path];
  if (loader) {
    try { loader(); } catch {}
  }
}

const CRMDashboard = lazy(routeLoaders['/crm'])
const Leads = lazy(routeLoaders['/crm/leads'])
const NewLead = lazy(routeLoaders['/crm/leads/new'])
const LeadDetail = lazy(routeLoaders['/crm/leads/:id'])
const Users = lazy(routeLoaders['/crm/users'])
const Team = lazy(routeLoaders['/crm/team'])
const Complaints = lazy(routeLoaders['/crm/complaints'])
const Orders = lazy(routeLoaders['/crm/orders'])
const StockDashboard = lazy(routeLoaders['/stock'])
const StockItems = lazy(routeLoaders['/stock/items'])
const LoadGroups = lazy(routeLoaders['/stock/groups'])
const VoucherForm = lazy(routeLoaders['/stock/voucher/add'])
const VoucherList = lazy(routeLoaders['/stock/vouchers'])
const VoucherPreview = lazy(routeLoaders['/stock/vouchers/:id/preview'])
const AdminDashboard = lazy(routeLoaders['/admin'])
const AdminQuotations = lazy(routeLoaders['/admin/quotations'])
const Attendance = lazy(routeLoaders['/crm/attendance'])
const FirstPaid = lazy(routeLoaders['/crm/first-paid'])
const PendingBalance = lazy(routeLoaders['/crm/pending-balance'])

function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-gray-400">
      <div className="animate-spin rounded-full h-9 w-9 border-2 border-brand-200 border-t-brand-600 mb-2" />
      <span className="text-xs font-semibold text-gray-400">Loading...</span>
    </div>
  )
}

function LazyPage({ children, ...routeProps }) {
  return (
    <ProtectedRoute {...routeProps}>
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </ProtectedRoute>
  )
}

export default function App() {
  useEffect(() => {
    // When browser is idle, pre-warm core CRM routes so page transitions feel instant
    const preloadCommon = () => {
      routeLoaders['/crm']?.();
      routeLoaders['/crm/leads']?.();
      routeLoaders['/crm/first-paid']?.();
      routeLoaders['/crm/pending-balance']?.();
      routeLoaders['/admin/quotations']?.();
      routeLoaders['/crm/leads/new']?.();
    };

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(preloadCommon, { timeout: 2500 });
    } else {
      setTimeout(preloadCommon, 1200);
    }
  }, []);
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#111111',
            borderRadius: '14px',
            fontSize: '13.5px',
            fontWeight: '600',
            border: '1.5px solid #f0f0f0',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            padding: '12px 16px',
            maxWidth: '340px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#ffffff' } },
          error:   { iconTheme: { primary: '#f43f5e', secondary: '#ffffff' } },
        }}
      />
      <Routes>
        <Route path="/" element={<Navigate to="/crm" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/crm" element={<LazyPage><CRMDashboard /></LazyPage>} />
        <Route path="/crm/leads" element={<LazyPage><Leads /></LazyPage>} />
        <Route path="/crm/first-paid" element={<LazyPage><FirstPaid /></LazyPage>} />
        <Route path="/crm/pending-balance" element={<LazyPage><PendingBalance /></LazyPage>} />
        <Route path="/crm/leads/new" element={<LazyPage><NewLead /></LazyPage>} />
        <Route path="/crm/leads/:id" element={<LazyPage><LeadDetail /></LazyPage>} />
        <Route path="/crm/users" element={<LazyPage adminOnly><Users /></LazyPage>} />
        <Route path="/crm/team" element={<LazyPage teamView><Team /></LazyPage>} />
        <Route path="/crm/complaints" element={<LazyPage complaintsOnly><Complaints /></LazyPage>} />
        <Route path="/crm/orders" element={<LazyPage><Orders /></LazyPage>} />
        <Route path="/crm/attendance" element={<LazyPage><Attendance /></LazyPage>} />
        <Route path="/stock" element={<LazyPage stockOnly><StockDashboard /></LazyPage>} />
        <Route path="/stock/items" element={<LazyPage stockOnly><StockItems /></LazyPage>} />
        <Route path="/stock/groups" element={<LazyPage stockOnly><LoadGroups /></LazyPage>} />
        <Route path="/stock/voucher/add" element={<LazyPage stockOnly><VoucherForm type="ADD" /></LazyPage>} />
        <Route path="/stock/voucher/sell" element={<LazyPage stockOnly><VoucherForm type="SELL" /></LazyPage>} />
        <Route path="/stock/voucher/expense" element={<LazyPage stockOnly><VoucherForm type="EXPENSE" /></LazyPage>} />
        <Route path="/stock/vouchers" element={<LazyPage stockOnly><VoucherList /></LazyPage>} />
        <Route path="/stock/vouchers/:id/preview" element={<LazyPage stockOnly><VoucherPreview /></LazyPage>} />
        <Route path="/admin" element={<LazyPage adminOnly><AdminDashboard /></LazyPage>} />
        <Route path="/admin/quotations" element={<LazyPage quotationsOnly><AdminQuotations /></LazyPage>} />
        <Route path="/crm/quotations" element={<Navigate to="/admin/quotations" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
