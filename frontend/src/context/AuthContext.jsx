import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth.service';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authService.isLoggedIn()) {
      api.get('/auth/me')
        .then(({ data }) => setUser(data.user))
        .catch(() => authService.logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setUser(data.user);
    return data;
  };

  const signup = async (email, password, username) => {
    const data = await authService.signup(email, password, username);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    setUser(null);
    authService.logout();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
