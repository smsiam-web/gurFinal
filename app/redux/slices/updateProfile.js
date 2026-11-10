import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
};

export const profileUpdateSlice = createSlice({
  name: "updateProfile",
  initialState,
  reducers: {
    updateProfile: (state, action) => {
      state.items = action.payload;
    },
  },
});

export const { updateProfile } = profileUpdateSlice.actions;

export const selectProfileUpdate = (state) => state.updateProfile.items;

export default profileUpdateSlice.reducer;
