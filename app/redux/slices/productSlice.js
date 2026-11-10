import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
};

export const productSlice = createSlice({
  name: "product",
  initialState,
  reducers: {
    updateProduct: (state, action) => {
      state.items = action.payload;
    },
  },
});

export const { updateProduct } = productSlice.actions;
export const selectProduct = (state) => state.product.items;

export default productSlice.reducer;
