import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
};

export const allOrderSlice = createSlice({
  name: "allOrder",
  initialState,
  reducers: {
    updateAllOrder: (state, action) => {
      state.items = action.payload;
    },
  },
});

export const { updateAllOrder } = allOrderSlice.actions;
export const selectAllOrder = (state) => state.allOrder.items;

export default allOrderSlice.reducer;
