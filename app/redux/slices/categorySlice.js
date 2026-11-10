import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
};

export const categorySlice = createSlice({
  name: "category",
  initialState,
  reducers: {
    updateCategory: (state, action) => {
      state.items = action.payload;
    },
  },
});

export const { updateCategory } = categorySlice.actions;
export const selectCategory = (state) => state.category.items;

export default categorySlice.reducer;