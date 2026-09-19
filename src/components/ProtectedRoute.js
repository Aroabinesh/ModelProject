import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const isAuthenticated = Boolean(localStorage.getItem('authToken'));
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default ProtectedRoute;
