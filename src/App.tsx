import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { PageLoader } from './components/ui/Loader';
import { ScrollToTop } from './components/ScrollToTop';

// Each page is downloaded only when someone opens it,
// so the first visit doesn't pay for admin screens or the calculator.
const named = <T extends Record<string, unknown>>(p: Promise<T>, key: keyof T) =>
  p.then((m) => ({ default: m[key] as React.ComponentType }));

const Login = lazy(() => named(import('./pages/Login'), 'Login'));
const Dashboard = lazy(() => named(import('./pages/Dashboard'), 'Dashboard'));
const Catalog = lazy(() => named(import('./pages/Catalog'), 'Catalog'));
const Projects = lazy(() => named(import('./pages/Projects'), 'Projects'));
const MyOrders = lazy(() => named(import('./pages/MyOrders'), 'MyOrders'));
const Chat = lazy(() => named(import('./pages/Chat'), 'Chat'));
const AdminCatalog = lazy(() => named(import('./pages/AdminCatalog'), 'AdminCatalog'));
const AdminOrders = lazy(() => named(import('./pages/AdminOrders'), 'AdminOrders'));
const CuttingList = lazy(() => named(import('./pages/CuttingList'), 'CuttingList'));

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Suspense
          fallback={
            <div className="min-h-dvh grid place-items-center bg-paper">
              <PageLoader />
            </div>
          }
        >
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Open to everyone: visitors can look around before creating an account */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/projects" element={<Projects />} />

            {/* Need an account */}
            <Route path="/my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />

            <Route path="/admin/catalog" element={<ProtectedRoute requiredRole="admin"><AdminCatalog /></ProtectedRoute>} />
            <Route path="/admin/orders" element={<ProtectedRoute requiredRole="admin"><AdminOrders /></ProtectedRoute>} />
            <Route path="/calculator" element={<ProtectedRoute requiredRole="admin"><CuttingList /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
