import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
};

export const staffSlice = createSlice({
  name: "staff",
  initialState,
  reducers: {
    updateStaff: (state, action) => {
      state.items = action.payload;
    },
  },
});

export const { updateStaff } = staffSlice.actions;
export const selectStaff = (state) => state.staff.items;

export default staffSlice.reducer;
