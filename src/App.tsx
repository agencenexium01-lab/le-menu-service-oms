import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import { ShieldCheck, Loader2 } from 'lucide-react';

import { AuthProvider, useAuth } from '../hooks/useAuth';
import { OnlineIndicator } from '../components/shared/OnlineIndicator';
import { AutoLogout } from '../components/shared/AutoLogout';
import { MaintenanceScreen } from '../components/shared/MaintenanceScreen';

// Import Next.js structure components using relative paths for the Vite build system
import LandingPage from '../app/page';
import ConnexionPage from '../app/(auth)/connexion/page';
import InscriptionPage from '../app/(auth)/inscription/page';
import ProConnexionPage from '../app/(pro)/pro/connexion/page';
import ProLayout from '../app/(pro)/pro/layout';
import ProprietaireDashboardPage from '../app/(pro)/pro/proprietaire/page';
import ProprietaireOrdersPage from '../app/(pro)/pro/proprietaire/commandes/page';
import ProprietaireBranchesPage from '../app/(pro)/pro/proprietaire/branches/page';
import ProprietaireEquipePage from '../app/(pro)/pro/proprietaire/equipe/page';
import ProprietaireRapportsPage from '../app/(pro)/pro/proprietaire/rapports/page';
import ChefPointDashboard from '../app/(pro)/pro/point/[branchId]/page';
import ChefPointOrdersPage from '../app/(pro)/pro/point/[branchId]/commandes/page';
import ChefPointOrderDetailPage from '../app/(pro)/pro/point/[branchId]/commandes/[id]/page';
import ChefPointCreateManualOrderPage from '../app/(pro)/pro/point/[branchId]/commandes/nouvelle/page';
import ChefPointCreateQuotePage from '../app/(pro)/pro/point/[branchId]/commandes/[id]/quote/page';
import ChefPointClientsPage from '../app/(pro)/pro/point/[branchId]/clients/page';

import AdminDashboardPage from '../app/(admin)/admin/page';
import AdminOrdersPage from '../app/(admin)/admin/orders/page';
import AdminOrderDetailPage from '../app/(admin)/admin/orders/[id]/page';
import AdminCreateQuotePage from '../app/(admin)/admin/orders/[id]/quote/page';
import AdminClientsPage from '../app/(admin)/admin/clients/page';
import AdminClientDetailPage from '../app/(admin)/admin/clients/[id]/page';
import ClientDashboardPage from '../app/(client)/client/page';
import ClientOrdersPage from '../app/(client)/client/orders/page';
import ClientNewOrderPage from '../app/(client)/client/orders/new/page';
import ClientOrderDetailPage from '../app/(client)/client/orders/[id]/page';
import ClientOrderConfirmationPage from '../app/(client)/client/orders/[id]/confirmation/page';
import NotFoundPage from '../app/not-found';
import AdminSetupPage from '../app/admin-setup/page';
import AdminLayout from '../app/(admin)/admin/layout';
import ClientLayout from '../app/(client)/client/layout';
import RootLayout from '../app/layout';

// Param wrappers since Next.js uses { params } props and React Router uses useParams hook
const AdminOrderDetailWrapper = () => {
  const { id } = useParams<{ id: string }>();
  return <AdminOrderDetailPage params={{ id: id || 'ORD-2026-992' }} />;
};

const AdminCreateQuoteWrapper = () => {
  const { id } = useParams<{ id: string }>();
  return <AdminCreateQuotePage params={{ id: id || 'ORD-2026-992' }} />;
};

const AdminClientDetailWrapper = () => {
  const { id } = useParams<{ id: string }>();
  return <AdminClientDetailPage params={{ id: id || 'CLI-048' }} />;
};

const ClientOrderDetailWrapper = () => {
  const { id } = useParams<{ id: string }>();
  return <ClientOrderDetailPage params={{ id: id || 'ORD-2026-992' }} />;
};

const ClientOrderConfirmationWrapper = () => {
  const { id } = useParams<{ id: string }>();
  return <ClientOrderConfirmationPage params={{ id: id || '' }} />;
};

// Rôles valides reconnus par l'application
const KNOWN_ROLES = ['super_admin', 'admin', 'chef_point', 'client'] as const;

function RequireAuth({ children, role }: { children: React.ReactNode; role: 'admin' | 'client' | 'pro' }) {
  const { user, userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 bg-[#0E1735] text-white">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500 mb-3" />
        <p className="text-xs font-mono text-slate-400">Contrôle des habilitations sécurisées...</p>
      </div>
    );
  }

  if (!user || !userProfile) {
    const targetRedirect = role === 'client' ? "/connexion" : "/pro/connexion";
    if (location.pathname === targetRedirect) return <>{children}</>;
    return <Navigate to={targetRedirect} state={{ from: location }} replace />;
  }

  if (!KNOWN_ROLES.includes(userProfile.role as any)) {
    console.error('[RequireAuth] Rôle utilisateur non reconnu:', userProfile.role, userProfile);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 bg-[#0E1735] text-white gap-3">
        <ShieldCheck className="h-8 w-8 text-rose-400" />
        <p className="text-sm font-bold">Rôle utilisateur non reconnu</p>
        <button
          type="button"
          onClick={() => logoutAndReload()}
          className="mt-2 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 border border-rose-500/30 rounded font-bold text-xs"
        >
          Se déconnecter
        </button>
      </div>
    );
  }

  const isPro = userProfile.role === 'super_admin' || userProfile.role === 'admin' || userProfile.role === 'chef_point';
  const isAdminRole = userProfile.role === 'super_admin' || userProfile.role === 'admin';

  if (role === 'client' && userProfile.role !== 'client') {
    const dest = userProfile.role === 'chef_point' ? `/pro/point/${userProfile.branchId}` : '/pro/proprietaire';
    if (location.pathname === dest || location.pathname.startsWith('/pro/')) return <>{children}</>;
    return <Navigate to={dest} replace />;
  }

  if (role === 'pro' && !isPro) {
    if (location.pathname === '/client') return <>{children}</>;
    return <Navigate to="/client" replace />;
  }

  if (role === 'admin' && !isAdminRole) {
    if (location.pathname === '/client') return <>{children}</>;
    return <Navigate to="/client" replace />;
  }

  return <>{children}</>;
}

function logoutAndReload() {
  window.localStorage?.clear?.();
  window.location.href = '/pro/connexion';
}

function RedirectIfAuthenticated({ children }: { children: React.ReactNode }) {
  const { user, userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (user && userProfile) {
    const isPro = userProfile.role === 'super_admin' || userProfile.role === 'admin' || userProfile.role === 'chef_point';
    if (isPro) {
      const dest = userProfile.role === 'chef_point' ? `/pro/point/${userProfile.branchId}` : "/pro/proprietaire";
      if (location.pathname === dest) return <>{children}</>;
      return <Navigate to={dest} replace />;
    }
    if (location.pathname === '/client') return <>{children}</>;
    return <Navigate to="/client" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const isMaintenanceMode = 
    (import.meta as any).env?.VITE_MAINTENANCE_MODE === 'true' || 
    (import.meta as any).env?.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';

  if (isMaintenanceMode) {
    return <MaintenanceScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50 text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Global Connectivity Status Indicators */}
      <OnlineIndicator />
      <AutoLogout />

      {/* Main content section */}
      <div className="flex-1">
        <Routes>
          {/* Core Landing Page */}
          <Route path="/" element={
            <RootLayout>
              <LandingPage />
            </RootLayout>
          } />
          
          <Route path="/login" element={<Navigate to="/connexion" replace />} />
          <Route path="/register" element={<Navigate to="/inscription" replace />} />

          {/* Client Authentications */}
          <Route path="/connexion" element={
            <RedirectIfAuthenticated>
              <RootLayout>
                <div className="max-w-7xl mx-auto px-4 py-6 w-full">
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 min-h-[50vh]">
                    <ConnexionPage />
                  </div>
                </div>
              </RootLayout>
            </RedirectIfAuthenticated>
          } />
          <Route path="/inscription" element={
            <RedirectIfAuthenticated>
              <RootLayout>
                <div className="max-w-7xl mx-auto px-4 py-6 w-full">
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 min-h-[50vh]">
                    <InscriptionPage />
                  </div>
                </div>
              </RootLayout>
            </RedirectIfAuthenticated>
          } />

          {/* Staff Authentications */}
          <Route path="/pro/connexion" element={
            <RedirectIfAuthenticated>
              <ProConnexionPage />
            </RedirectIfAuthenticated>
          } />
          
          {/* System Setup */}
          <Route path="/admin-setup" element={
            <RootLayout>
              <div className="max-w-7xl mx-auto px-4 py-6 w-full">
                <div className="bg-white border border-slate-200 rounded-3xl p-6 min-h-[50vh]">
                  <AdminSetupPage />
                </div>
              </div>
            </RootLayout>
          } />
          
          {/* Proprietère / Pro Centralised Routes */}
          <Route path="/pro/proprietaire" element={
            <RequireAuth role="pro">
              <ProLayout>
                <ProprietaireDashboardPage />
              </ProLayout>
            </RequireAuth>
          } />
          <Route path="/pro/proprietaire/commandes" element={
            <RequireAuth role="pro">
              <ProLayout>
                <ProprietaireOrdersPage />
              </ProLayout>
            </RequireAuth>
          } />
          <Route path="/pro/proprietaire/branches" element={
            <RequireAuth role="pro">
              <ProLayout>
                <ProprietaireBranchesPage />
              </ProLayout>
            </RequireAuth>
          } />
          <Route path="/pro/proprietaire/equipe" element={
            <RequireAuth role="pro">
              <ProLayout>
                <ProprietaireEquipePage />
              </ProLayout>
            </RequireAuth>
          } />
          <Route path="/pro/proprietaire/rapports" element={
            <RequireAuth role="pro">
              <ProLayout>
                <ProprietaireRapportsPage />
              </ProLayout>
            </RequireAuth>
          } />

          {/* Regional Succursale Point Routes */}
          <Route path="/pro/point/:branchId" element={
            <RequireAuth role="pro">
              <ProLayout>
                <ChefPointDashboard />
              </ProLayout>
            </RequireAuth>
          } />
          <Route path="/pro/point/:branchId/commandes" element={
            <RequireAuth role="pro">
              <ProLayout>
                <ChefPointOrdersPage />
              </ProLayout>
            </RequireAuth>
          } />
          <Route path="/pro/point/:branchId/commandes/nouvelle" element={
            <RequireAuth role="pro">
              <ProLayout>
                <ChefPointCreateManualOrderPage />
              </ProLayout>
            </RequireAuth>
          } />
          <Route path="/pro/point/:branchId/commandes/:id" element={
            <RequireAuth role="pro">
              <ProLayout>
                <ChefPointOrderDetailPage />
              </ProLayout>
            </RequireAuth>
          } />
          <Route path="/pro/point/:branchId/commandes/:id/quote" element={
            <RequireAuth role="pro">
              <ProLayout>
                <ChefPointCreateQuotePage />
              </ProLayout>
            </RequireAuth>
          } />
          <Route path="/pro/point/:branchId/clients" element={
            <RequireAuth role="pro">
              <ProLayout>
                <ChefPointClientsPage />
              </ProLayout> 
            </RequireAuth>
          } />

          {/* Admin Detail Actions Backwards Compatibility */}
          <Route path="/admin" element={<Navigate to="/pro/proprietaire" replace />} />
          <Route path="/admin/orders" element={<Navigate to="/pro/proprietaire/commandes" replace />} />
          
          <Route path="/admin/orders/:id" element={
            <RequireAuth role="admin">
              <AdminLayout>
                <AdminOrderDetailWrapper />
              </AdminLayout>
            </RequireAuth>
          } />
          <Route path="/admin/orders/:id/quote" element={
            <RequireAuth role="admin">
              <AdminLayout>
                <AdminCreateQuoteWrapper />
              </AdminLayout>
            </RequireAuth>
          } />
          <Route path="/admin/clients" element={
            <RequireAuth role="admin">
              <AdminLayout>
                <AdminClientsPage />
              </AdminLayout>
            </RequireAuth>
          } />
          <Route path="/admin/clients/:id" element={
            <RequireAuth role="admin">
              <AdminLayout>
                <AdminClientDetailWrapper />
              </AdminLayout>
            </RequireAuth>
          } />

          {/* Client Routes */}
          <Route path="/client" element={
            <RequireAuth role="client">
              <ClientLayout>
                <ClientDashboardPage />
              </ClientLayout>
            </RequireAuth>
          } />
          <Route path="/client/orders" element={
            <RequireAuth role="client">
              <ClientLayout>
                <ClientOrdersPage />
              </ClientLayout>
            </RequireAuth>
          } />
          <Route path="/client/orders/new" element={
            <RequireAuth role="client">
              <ClientLayout>
                <ClientNewOrderPage />
              </ClientLayout>
            </RequireAuth>
          } />
          <Route path="/client/orders/:id" element={
            <RequireAuth role="client">
              <ClientLayout>
                <ClientOrderDetailWrapper />
              </ClientLayout>
            </RequireAuth>
          } />
          <Route path="/client/orders/:id/confirmation" element={
            <RequireAuth role="client">
              <ClientLayout>
                <ClientOrderConfirmationWrapper />
              </ClientLayout>
            </RequireAuth>
          } />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}