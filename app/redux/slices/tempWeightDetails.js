import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
};

export const tempWeightDetails = createSlice({
  name: "weightDetails",
  initialState,
  reducers: {
    updateWeightDetails: (state, action) => {
      state.items = action.payload;
    },
  },
});

export const { updateWeightDetails } = tempWeightDetails.actions;

export const selectWeightDetails = (state) => state.weightDetails.items;

export default tempWeightDetails.reducer;
