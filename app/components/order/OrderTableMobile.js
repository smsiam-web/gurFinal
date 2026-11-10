import Link from "next/link";
import { timeAgo } from "../../utils/helpers";
import { TbCurrencyTaka } from "react-icons/tb";

const OrderTableMobile = ({
  order_id,
  name,
  items,
  total,
  payment_success,
  created_at,
}) => {
  const copy = async (text) => {
    await navigator.clipboard.writeText(text);
    alert("Text copied");
  };
  return (
    <div className="md:hidden mb-5 border-b pb-5">
      <h3 className="truncate w-4/5">
        Order ID:{" "}
        <span className="cursor-pointer" onClick={() => copy(order_id)}>
          {order_id}
        </span>
      </h3>
      <p className="text-sm text-gray-500 mb-3">
        Ordered {timeAgo(created_at)} ago
      </p>
      {items.map((item, i) => (
        <Link key={i} href={`/products/${item.id}`}>
          <h3 className="cursor-pointer hover:text-primary text-sm font-bold text-title">
            {item?.name}{" "}
            <span className="text-sm text-gray-500">({item?.quantity}x)</span>
          </h3>
        </Link>
      ))}
      <p className="text-sm text-gray-500 mt-3">
        Payment:{" "}
        {payment_success ? (
          <span className="text-greens">Success</span>
        ) : (
          <span className="text-red-500">Failed</span>
        )}
      </p>
      <p className="text-sm text-gray-500">
        Status: <span className="text-primary font-semibold">Pending</span>
      </p>
      <p className="text-sm text-gray-500 mt-2 flex items-center">
        Total:{" "}
        <span className="text-green font-semibold flex items-center">
          {" "}
          <TbCurrencyTaka size={18} />
          {total}
        </span>
      </p>
    </div>
  );
};

export default OrderTableMobile;
