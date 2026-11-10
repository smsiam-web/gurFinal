import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
};

export const singleProductSlice = createSlice({
  name: "singleProduct",
  initialState,
  reducers: {
    updateSingleProduct: (state, action) => {
      state.items = action.payload;
    },
  },
});

export const { updateSingleProduct } = singleProductSlice.actions;
export const selectSingleProduct = (state) => state.singleProduct.items;

export default singleProductSlice.reducer;
