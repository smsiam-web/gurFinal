import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
};

export const singleCustomerSlice = createSlice({
  name: "singleCustomer",
  initialState,
  reducers: {
    updateSingleCustomer: (state, action) => {
      state.items = action.payload;
    },
  },
});

export const { updateSingleCustomer } = singleCustomerSlice.actions;
export const selectSingleCustomer = (state) => state.singleCustomer.items;

export default singleCustomerSlice.reducer;
