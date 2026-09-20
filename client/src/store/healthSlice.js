import { createSlice } from "@reduxjs/toolkit";

const initial = {
  facilities: [],
  medicines: [],
  diagnostics: [],
  appointments: [],
  loaded: false,
};

const slice = createSlice({
  name: "health",
  initialState: initial,
  reducers: {
    setHealthData: (s, a) => {
      if (a.payload && typeof a.payload === "object") {
        Object.assign(s, a.payload, { loaded: true });
      } else {
        s.loaded = true;
      }
    },
    addAppointment: (s, a) => {
      if (a.payload) {
        if (!Array.isArray(s.appointments)) {
          s.appointments = [];
        }
        s.appointments.push(a.payload);
      }
    },
  },
});

export const { setHealthData, addAppointment } = slice.actions;
export default slice.reducer;