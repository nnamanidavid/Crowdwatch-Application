import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import MapPage from './pages/MapPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import SubmitReportPage from './pages/SubmitReportPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/" element={
            <ProtectedRoute><MapPage /></ProtectedRoute>
          } />
          <Route path="/submit" element={
            <ProtectedRoute><SubmitReportPage /></ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
