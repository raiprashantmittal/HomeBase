import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [families, setFamilies] = useState([]);
  const [activeFamilyId, setActiveFamilyId] = useState(() =>
    localStorage.getItem('activeFamilyId')
  );
  const [dataVersion, setDataVersion] = useState(0);

  const bumpDataVersion = useCallback(() => setDataVersion((v) => v + 1), []);

  const refreshFamilies = useCallback(async () => {
    if (!user) return;
    const list = await api.getFamilies();
    setFamilies(list);
    if (!activeFamilyId && list.length > 0) {
      setActiveFamilyId(list[0]._id);
    }
  }, [user, activeFamilyId]);

  useEffect(() => {
    if (user) refreshFamilies();
  }, [user]);

  useEffect(() => {
    if (activeFamilyId) localStorage.setItem('activeFamilyId', activeFamilyId);
  }, [activeFamilyId]);

  const login = async (email, password) => {
    const { token, user: u } = await api.login({ email, password });
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
  };

  const register = async (name, email, password, phone) => {
    const { token, user: u } = await api.register({ name, email, password, phone });
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
  };

  const updateUser = (updatedFields) => {
    setUser((prev) => {
      const next = { ...prev, ...updatedFields };
      localStorage.setItem('user', JSON.stringify(next));
      return next;
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeFamilyId');
    setUser(null);
    setFamilies([]);
    setActiveFamilyId(null);
  };

  const activeFamily = families.find((f) => f._id === activeFamilyId) || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        updateUser,
        families,
        activeFamilyId,
        setActiveFamilyId,
        activeFamily,
        refreshFamilies,
        dataVersion,
        bumpDataVersion
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}