import { createSlice } from "@reduxjs/toolkit";

// Safe JSON parser for localStorage
const getSavedAuth = () => {
  try {
    const item = localStorage.getItem("ss_auth");
    return item ? JSON.parse(item) : null;
  } catch (e) {
    console.error("Failed to parse ss_auth from localStorage:", e);
    localStorage.removeItem("ss_auth");
    return null;
  }
};

const saved = getSavedAuth();

const slice = createSlice({
  name: "auth",
  initialState: { 
    user: saved?.user || null, 
    token: saved?.token || null 
  },
  reducers: {
    loginSuccess: (s, a) => {
      if (!a.payload) return;
      s.user = a.payload.user || null;
      s.token = a.payload.token || null;
      
      try {
        localStorage.setItem("ss_auth", JSON.stringify({
          user: s.user,
          token: s.token
        }));
      } catch (e) {
        console.error("Failed to save auth to localStorage:", e);
      }
    },
    logout: (s) => {
      s.user = null;
      s.token = null;
      try {
        localStorage.removeItem("ss_auth");
      } catch (e) {}
    },
  },
});

export const { loginSuccess, logout } = slice.actions;
export default slice.reducer;