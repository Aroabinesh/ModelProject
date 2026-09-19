import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import WorkOrdersPage from './pages/WorkOrders/WorkOrdersPage';
import WorkOrderWizard from './pages/WorkOrders/WorkOrderWizard';
import WorkOrderViewPage from './pages/WorkOrders/WorkOrderViewPage';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/work-orders" element={<WorkOrdersPage />} />
          <Route path="/work-orders/new" element={<WorkOrderWizard />} />
          <Route path="/work-orders/:id/wizard" element={<WorkOrderWizard />} />
          <Route path="/work-orders/:id/view" element={<WorkOrderViewPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
