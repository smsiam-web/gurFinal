import { createSlice } from "@reduxjs/toolkit";

export const configSlice = createSlice({
  name: "config",
  initialState: {
    user: null,
  },
  reducers: {
    updateConfig: (state, action) => {
      state.user = action.payload;
    },
    clearConfig: (state) => {
      state.user = null;
    },
  },
});

export const { updateConfig, clearConfig } = configSlice.actions;

export const selectConfig = (state) => state.config.user;

export default configSlice.reducer;