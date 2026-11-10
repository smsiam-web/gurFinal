// lib/mapToSteadfast.ts
import type { SteadfastCreateOrderReq } from "./steadfast";

// আপনার normalized order থেকে দরকারি ফিল্ড ম্যাপ
export function mapOrderToSteadfastPayload(order: any): SteadfastCreateOrderReq {
  return {
    cod_amount: order?.totals?.grand ?? 0,
    invoice: order?.orderID || order?.merchant_order_id || "",
    note: order?.notes || "",
    recipient_name: order?.customer?.name || "",
    recipient_phone: order?.customer?.phone || "",
    recipient_address: order?.shipping_address?.street || "",
  };
}
