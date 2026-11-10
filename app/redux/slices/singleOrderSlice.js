import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
};

export const singleOrderSlice = createSlice({
  name: "singleOrder",
  initialState,
  reducers: {
    updateSingleOrder: (state, action) => {
      state.items = action.payload;
    },
  },
});

export const { updateSingleOrder } = singleOrderSlice.actions;
export const selectSingleOrder = (state) => state.singleOrder.items;

export default singleOrderSlice.reducer;
