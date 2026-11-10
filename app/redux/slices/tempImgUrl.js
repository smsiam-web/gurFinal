import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
};

export const tempImgSlice = createSlice({
  name: "tempImgUrl",
  initialState,
  reducers: {
    updateTempImgUrl: (state, action) => {
      state.items = action.payload;
    },
  },
});

export const { updateTempImgUrl } = tempImgSlice.actions;

export const selectTempUrl = (state) => state.tempImgUrl.items;

export default tempImgSlice.reducer;