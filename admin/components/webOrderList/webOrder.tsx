import { useCallback, useEffect, useState } from "react";

type Product = {
  id: number;
  productId: number;
  name: string;
  quantity: number;
  total: string;
  sku?: string;
  image?: string;
};

type Order = {
  id: number;
  number: string;
  status: string;
  currency: string;
  total: string;
  dateCreated: string;
  paymentMethod: string;

  customer: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    postcode: string;
  };

  products: Product[];
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch("/api/woocommerce/orders", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch orders"
        );
      }

      setOrders(data.orders || []);
      setError("");
    } catch (error: any) {
      console.error(error);

      setError(
        error?.message || "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    const interval = setInterval(() => {
      fetchOrders();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchOrders]);


}