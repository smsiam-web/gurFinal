import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
};

export const productValueSlice = createSlice({
  name: "productValue",
  initialState,
  reducers: {
    updateProductValue: (state, action) => {
      state.items = action.payload;
    },
  },
});

export const { updateProductValue } = productValueSlice.actions;
export const selectProductValue = (state) => state.productValue.items;

export default productValueSlice.reducer;
