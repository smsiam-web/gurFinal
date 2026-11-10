import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
};

export const productImgUpdateSlice = createSlice({
  name: "productImg",
  initialState,
  reducers: {
    updateProductImg: (state, action) => {
      state.items = action.payload;
    },
  },
});

export const { updateProductImg } = productImgUpdateSlice.actions;

export const selectProductImg = (state) => state.productImg.items;

export default productImgUpdateSlice.reducer;
