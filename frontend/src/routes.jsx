import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

import Sidebar  from './components/common/Sidebar';
import Topbar   from './components/common/Navbar';
import PerfilPanel    from './components/cuenta/PerfilPanel';
import MobileDashNav  from './components/common/MobileDashNav';
import { ProfilePanelProvider } from './context/ProfilePanelContext';

const Landing               = lazy(() => import('./pages/public/Landing'));
const Login                 = lazy(() => import('./components/auth/Login'));
const Register              = lazy(() => import('./components/auth/Register'));
const Dashboard             = lazy(() => import('./components/dashboard/Dashboard'));
const ClimaWidget           = lazy(() => import('./components/clima/ClimaWidget'));
const GestionCultivosIoT    = lazy(() => import('./components/cultivos/GestionCultivosIoT'));
const CalculadoraInsumos    = lazy(() => import('./components/insumos/CalculadoraInsumos'));
const DeteccionPlagas       = lazy(() => import('./components/plagas/DeteccionPlagas'));
const PrediccionCosecha     = lazy(() => import('./components/prediccion/PrediccionCosecha'));
const AlmanaqueBristol      = lazy(() => import('./components/almanaque/AlmanaqueBristol'));
const AsesoriaEspecializada = lazy(() => import('./components/asesoria/AsesoriaEspecializada'));
const Marketplace           = lazy(() => import('./components/marketplace/Marketplace'));
const InformesPanel         = lazy(() => import('./components/informes/InformesPanel'));
const SensoresDashboard     = lazy(() => import('./components/sensores/SensoresDashboard'));
const DispositivosPanel     = lazy(() => import('./components/dispositivos/DispositivosPanel'));
const AdminPanel            = lazy(() => import('./components/admin/AdminPanel'));
const AutoLogin             = lazy(() => import('./pages/AutoLogin'));

const ADMIN_ROLES = ['superadmin', 'admin'];

const Loader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Cargando...</p>
    </div>
  </div>
);

const DashboardLayout = ({ children }) => (
  <ProfilePanelProvider>
    <div className="panel-tight h-screen flex overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">{children}</main>
      </div>
      <PerfilPanel />
      <MobileDashNav />
    </div>
  </ProfilePanelProvider>
);

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Loader />;
  if (!isAuthenticated) {
    const wasLogout = sessionStorage.getItem('intentional_logout');
    if (wasLogout) sessionStorage.removeItem('intentional_logout');
    return <Navigate to={wasLogout ? '/' : '/login'} replace />;
  }
  return <DashboardLayout>{children}</DashboardLayout>;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <Loader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!ADMIN_ROLES.includes(user?.rol)) return <Navigate to="/dashboard" replace />;
  return <DashboardLayout>{children}</DashboardLayout>;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Loader />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => (
  <Suspense fallback={<Loader />}>
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      <Route path="/dashboard"    element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/clima"        element={<ProtectedRoute><ClimaWidget /></ProtectedRoute>} />
      <Route path="/cultivos"     element={<ProtectedRoute><GestionCultivosIoT /></ProtectedRoute>} />
      <Route path="/insumos"      element={<ProtectedRoute><CalculadoraInsumos /></ProtectedRoute>} />
      <Route path="/plagas"       element={<ProtectedRoute><DeteccionPlagas /></ProtectedRoute>} />
      <Route path="/prediccion"   element={<ProtectedRoute><PrediccionCosecha /></ProtectedRoute>} />
      <Route path="/almanaque"    element={<ProtectedRoute><AlmanaqueBristol /></ProtectedRoute>} />
      <Route path="/asesoria"     element={<ProtectedRoute><AsesoriaEspecializada /></ProtectedRoute>} />
      <Route path="/marketplace"  element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
      <Route path="/monitoreo"    element={<ProtectedRoute><SensoresDashboard /></ProtectedRoute>} />
      <Route path="/informes"     element={<ProtectedRoute><InformesPanel /></ProtectedRoute>} />
      <Route path="/dispositivos" element={<ProtectedRoute><DispositivosPanel /></ProtectedRoute>} />

      <Route path="/admin"      element={<AdminRoute><AdminPanel /></AdminRoute>} />
      <Route path="/superadmin" element={<Navigate to="/admin" replace />} />

      <Route path="/auto-login" element={<AutoLogin />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
);

export default AppRoutes;
