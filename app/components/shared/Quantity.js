import { BiPlus, BiMinus } from "react-icons/bi";

const Quantity = ({ decreaseQuantity, increaseQuantity, quantity }) => {
  return (
    <div className="flex border h-10 ">
      <button
        onClick={decreaseQuantity}
        className="w-10 bg-[#F5F5F5] flex items-center justify-center hover:h-bg-primary"
      >
        <BiMinus size={18} />
      </button>
      <div className="px-5 flex-grow flex items-center justify-center">
        {quantity || 1}
      </div>
      <button
        onClick={increaseQuantity}
        className="w-10 bg-[#F5F5F5] flex items-center justify-center hover:h-bg-greens"
      >
        <BiPlus size={20} />
      </button>
    </div>
  );
};

export default Quantity;
