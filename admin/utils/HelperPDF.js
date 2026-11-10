import React, {useRef} from "react";
import dynamic from "next/dynamic";

const GeneratePDF = dynamic(() => import("./GeneratePDF"), {
    ssr: false,
  });

export const HelperPDF = ({ item }) => {
    const ref = useRef();
    
  return (
    <div className="hidden" ref={ref}>
      <img
        id="image"
        src="/invoice/invoice.jpg"
        width="300"
        height="200"
        className="hidden"
      />
      <span id="invoiceNo">{item?.id}</span>
      <span id="status">{item?.status}.</span>
      <span id="name">{item?.customer_details.customer_name}</span>
      <span id="phone">{item?.customer_details.phone_number}</span>
      <span id="address">{item?.customer_details.customer_address}</span>  
        {item &&
          item.order.map((item, i) => (
            <div key={i}>
              <h2 id={`item_0${++i}`}>{item.title}</h2>

              <span id={`item_0${i}_quantity`}>{item.quantity}kg</span>
              <span id={`item_0${i}_price`}>{item.price}.00</span>
              <span id={`item_0${i}_total_price`}>{item.total_price}.00/-</span>
            </div>
          ))}
        <h1 id="subTotal">{item?.totalPrice}.00/-</h1>
        <h1 id="shipping_type">(Home)</h1>
        <h1 id="shipping_cost">120.00/-</h1>
        <h1 id="discount">-{item?.discount}%</h1>
        <h1 id="total">{item?.customer_details?.salePrice}.00/-</h1>
        <GeneratePDF html={ref} disabled={disabled} />
    </div>
  );
};