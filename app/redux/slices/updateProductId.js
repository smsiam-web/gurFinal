import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
};

export const productIdUpdateSlice = createSlice({
  name: "productId",
  initialState,
  reducers: {
    updateProductId: (state, action) => {
      state.items = action.payload;
    },
  },
});

export const { updateProductId } = productIdUpdateSlice.actions;

export const selectUpdateProductId = (state) => state.productId.items;

export default productIdUpdateSlice.reducer;
