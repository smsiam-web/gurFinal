import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
};

export const bulkOrderSlice = createSlice({
  name: "bulkOrder",
  initialState,
  reducers: {
    updateBulkOrder: (state, action) => {
      state.items = action.payload;
    },
  },
});

export const { updateBulkOrder } = bulkOrderSlice.actions;
export const selectBulkOrder = (state) => state.bulkOrder.items;

export default bulkOrderSlice.reducer;
