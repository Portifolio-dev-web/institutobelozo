import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, TOKEN_KEY } from "@/lib/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setUser(false);
      return;
    }
    api.get("/auth/me").then((r) => setUser(r.data)).catch(() => {
      localStorage.removeItem(TOKEN_KEY);
      setUser(false);
    });
  }, []);

  const handle = (data) => {
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    return data.user;
  };

  const login = useCallback(async (email, password) => handle((await api.post("/auth/login", { email, password })).data), []);
  const register = useCallback(async (payload) => handle((await api.post("/auth/register", payload)).data), []);
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(false);
  }, []);

  return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

export const isStaff = (u) => u && (u.role === "admin" || u.role === "professional");
