import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Wrap any page that requires login with this component.
// If the user isn't logged in, they get sent to /login automatically.
// The `replace` prop replaces the current history entry so pressing
// the back button doesn't loop back to the protected page.
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}
