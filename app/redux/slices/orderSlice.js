import { daysInMonth } from "@/admin/utils/helpers";
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
};

export const orderSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    updateOrder: (state, action) => {
      state.items = action.payload;
    },
  },
});

export const { updateOrder } = orderSlice.actions;
export const selectOrder = (state) => state.orders.items;

export const selectOrdersTotalPrice = (state) =>
  state.orders.items
    .map((x) => x?.customer_details?.salePrice)
    .reduce((a, b) => a + b, 0);

export const selectOrdersThisMonthTotallPrice = (state) =>
  state.orders.items
    .map((x) => {
      const orderDate = x.timestamp?.toDate();
      const toDay = new Date();
      if (
        (orderDate.getMonth() === toDay.getMonth() &&
          orderDate.getFullYear()) === toDay.getFullYear()
      ) {
        return x?.customer_details.salePrice;
      } else {
        return 0;
      }
    })
    .reduce((a, b) => a + b, 0);
export const selectOrdersThisMonthTotallOrder = (state) =>
  state.orders.items
    .map((x) => {
      const orderDate = x.timestamp?.toDate();
      const toDay = new Date();
      if (
        (orderDate.getMonth() === toDay.getMonth() &&
          orderDate.getFullYear()) === toDay.getFullYear()
      ) {
        return 1;
      } else {
        return 0;
      }
    })
    .reduce((a, b) => a + b, 0);

//Last 7 Days Totall Order count:
export const selectOrdersTodayTotallOrder = (state) =>
  state.orders.items
    .map((x) => {
      const orderDate = x.timestamp?.toDate();
      const toDay = new Date();
      if (
        (orderDate?.getDate() === toDay.getDate() &&
          orderDate.getMonth() === toDay.getMonth() &&
          orderDate.getFullYear()) === toDay.getFullYear()
      ) {
        return 1;
      } else {
        return 0;
      }
    })
    .reduce((a, b) => a + b, 0);

export const selectOrdersYesterdayTotallOrder = (state) =>
  state.orders.items
    .map((x) => {
      const orderDate = x.timestamp?.toDate();
      const toDay = new Date();
      if (
        (orderDate?.getDate() === toDay.getDate() - 1 &&
          orderDate.getMonth() === toDay.getMonth() &&
          orderDate.getFullYear()) === toDay.getFullYear()
      ) {
        return 1;
      } else {
        return 0;
      }
    })
    .reduce((a, b) => a + b, 0);
export const Last7DaysTotallOrder = (state) => {
  let i = 0;
  const arr = [];
  for (i; i < 7; i++) {
    let v = state.orders.items
      .map((x) => {
        const orderDate = x.timestamp?.toDate();
        const today = new Date();
        if (
          (today.getDate() - i > 1 &&
            orderDate?.getDate() === today.getDate() - i &&
            orderDate.getMonth() === today.getMonth() &&
            orderDate.getFullYear()) === today.getFullYear()
        ) {
          return 1;
        } else if (
          today.getDate() - i < 1 && 
          today.getMonth() - 1 === orderDate.getMonth() && 
          (orderDate.getDate() === ((daysInMonth(today.getMonth() - 1, today.getFullYear()) + today.getDate()) - i)) 
        ) {
           return 1;
          }          
         else {
          return 0;
        }
      })
      .reduce((a, b) => a + b, 0);
    arr.push(v);
  }
  return arr.reverse();
};

//Last 7 Days Totall Price count:
export const selectOrdersTodayTotallPrice = (state) =>
  state.orders.items
    .map((x) => {
      const orderDate = x.timestamp?.toDate();
      const toDay = new Date();
      if (
        (orderDate?.getDate() === toDay.getDate() &&
          orderDate.getMonth() === toDay.getMonth() &&
          orderDate.getFullYear()) === toDay.getFullYear()
      ) {
        return x?.customer_details.salePrice;
      } else {
        return 0;
      }
    })
    .reduce((a, b) => a + b, 0);
export const selectOrdersYesterdayTotallPrice = (state) =>
  state.orders.items
    .map((x) => {
      const orderDate = x.timestamp?.toDate();
      const toDay = new Date();
      if (
        (orderDate?.getDate() === toDay.getDate() - 1 &&
          orderDate.getMonth() === toDay.getMonth() &&
          orderDate.getFullYear()) === toDay.getFullYear()
      ) {
        return x?.customer_details.salePrice;
      } else {
        return 0;
      }
    })
    .reduce((a, b) => a + b, 0);

export const Last7DaysTotallPrice = (state) => {
  let i = 0;
  const arr = [];
  for (i; i < 7; i++) {
    let v = state.orders.items
      .map((x) => {
        const orderDate = x.timestamp?.toDate();
        const today = new Date();
        if (
          (today.getDate() - i > 1 &&
            orderDate?.getDate() === today.getDate() - i &&
            orderDate.getMonth() === today.getMonth() &&
            orderDate.getFullYear()) === today.getFullYear()
        ) {
          return x?.customer_details.salePrice;
        } else if (
          today.getDate() - i < 1 && 
          today.getMonth() - 1 === orderDate.getMonth() && 
          (orderDate.getDate() === ((daysInMonth(today.getMonth() - 1, today.getFullYear()) + today.getDate()) - i)) 
        ) {
           return x?.customer_details.salePrice;
          }          
         else {
          return 0;
        }
      })
      .reduce((a, b) => a + b, 0);
    arr.push(v);
  }
  return arr.reverse();
};

export const selectTotalOrders = (state) =>
  state.orders.items.map(() => 1).reduce((a, b) => a + b, 0);
export const selectPendingOrders = (state) =>
  state.orders.items
    .map((x) => x?.status === "Pending" && 1)
    .reduce((a, b) => a + b, 0);
export const selectProcessingOrders = (state) =>
  state.orders.items
    .map((x) => x?.status === "Processing" && 1)
    .reduce((a, b) => a + b, 0);
export const selectShippedOrders = (state) =>
  state.orders.items
    .map((x) => x?.status === "Shipped" && 1)
    .reduce((a, b) => a + b, 0);
export const selectDeliveredOrders = (state) =>
  state.orders.items
    .map((x) => x?.status === "Delivered" && 1)
    .reduce((a, b) => a + b, 0);
export const selectCancelledOrders = (state) =>
  state.orders.items
    .map((x) => x?.status === "Cancelled" && 1)
    .reduce((a, b) => a + b, 0);

export default orderSlice.reducer;
