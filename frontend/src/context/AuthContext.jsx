import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";
import { STAFF_ROLES } from "../utils/constants";
// import { parseSync } from "vite";


const AuthContext =createContext(null)

export function AuthProvider({children}){

  const [user, setUser] = useState(()=>{
 const stored = localStorage.getItem("ucms_user")
 return stored ?JSON.parse(stored):null
    })

const [loading, setLoading] = useState(true);

useEffect(()=>{
    const token = localStorage.getItem("ucms_token")
    if(!token){
        setLoading(false)
        return
    }
    api
      .get("/auth/me")
      .then(({ data }) => {
        setUser(data.user);
        localStorage.setItem("ucms_user", JSON.stringify(data.user));
      })
      .catch(() => {
        setUser(null);
        localStorage.removeItem("ucms_token");
        localStorage.removeItem("ucms_user");
      })
      .finally(() => setLoading(false));
},[])


 const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("ucms_token", data.token);
    localStorage.setItem("ucms_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

   const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    localStorage.setItem("ucms_token", data.token);
    localStorage.setItem("ucms_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

   const logout = () => {
    localStorage.removeItem("ucms_token");
    localStorage.removeItem("ucms_user");
    setUser(null);
  };

  const isStaff = user ? STAFF_ROLES.includes(user.role) : false;

    return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isStaff }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);





