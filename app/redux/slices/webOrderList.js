import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
};

export const allWebOrderSlice = createSlice({
  name: "webOrderList",
  initialState,
  reducers: {
    updateWebOrderList : (state, action) => {
      state.items = action.payload;
    },
  },
});

export const { updateWebOrderList  } = allWebOrderSlice.actions;
export const selectWebOrderList = (state) => state.webOrderList.items;

export default allWebOrderSlice.reducer;
