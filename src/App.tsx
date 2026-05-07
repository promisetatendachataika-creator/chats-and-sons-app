import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CuttingList } from './pages/CuttingList';
import { AdminCatalog } from './pages/AdminCatalog';
import { AdminOrders } from './pages/AdminOrders';
import { Catalog } from './pages/Catalog';
import { MyOrders } from './pages/MyOrders';
import { Chat } from './pages/Chat';
import { CursorGlow } from './components/ui/CursorGlow';

function App() {
  return (
    <AuthProvider>
      <CursorGlow />
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* All authenticated users */}
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/catalog" element={<ProtectedRoute><Catalog /></ProtectedRoute>} />
          <Route path="/my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />

          {/* Admin only */}
          <Route path="/admin/catalog" element={<ProtectedRoute requiredRole="admin"><AdminCatalog /></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute requiredRole="admin"><AdminOrders /></ProtectedRoute>} />
          <Route path="/calculator" element={<ProtectedRoute requiredRole="admin"><CuttingList /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;