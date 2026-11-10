import { AiOutlineRight, AiOutlineLeft } from "react-icons/ai";
// Slider Left Right
const LeftRight = ({ bg = "" }) => {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`rounded text-color ${
          bg ? `bg-${bg}` : "bg-gray-100"
        } hover:bg-primary transition-all duration-300 p-2 cursor-pointer`}
      >
        <AiOutlineLeft />
      </div>
      <div
        className={`rounded text-color ${
          bg ? `bg-${bg}` : "bg-gray-100"
        } hover:bg-primary transition-all duration-300 p-2 cursor-pointer`}
      >
        <AiOutlineRight />
      </div>
    </div>
  );
};

export default LeftRight;
