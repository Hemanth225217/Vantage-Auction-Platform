import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => setUser(res.data.data))
      .catch(() => {
        localStorage.removeItem('token');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, ...userData } = res.data.data;
    localStorage.setItem('token', token);
    setUser(userData);
    toast.success(`Welcome back, ${userData.name.split(' ')[0]}!`);
    return userData;
  };

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    const { token, ...userData } = res.data.data;
    localStorage.setItem('token', token);
    setUser(userData);
    toast.success(`Welcome to Vantage, ${userData.name.split(' ')[0]}!`);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast.success('Signed out');
  };

  const updateUser = (partial) => {
    setUser((prev) => ({ ...prev, ...partial }));
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
