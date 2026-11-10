import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
};

export const idSlice = createSlice({
  name: "id",
  initialState,
  reducers: {
    updateAddId: (state, action) => {
      state.items = action.payload;
    },
  },
});

export const { updateAddId } = idSlice.actions;

export const selectId = (state) => state.id.items;

export default idSlice.reducer;
