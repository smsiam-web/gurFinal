import Link from "next/link";
import { AiOutlineSearch } from "react-icons/ai";

const Search = () => {
  return (
    <div className="bg-gray-100 p-4 rounded-lg lg:flex items-center gap-2 xl:min-w-[550px] 2xl:min-w-[650px] mx-4 hidden">
      <select name="product_cat" className="outline-none bg-transparent">
        <option value="0">All Categories</option>
        <option className="level-0" value="mango">
          রাজশাহীর আম--
        </option>
        <option className="level-1" value="m_gp">
          &nbsp;&nbsp;&nbsp;গোপালভোগ
        </option>
        <option className="level-1" value="m_lng">
          &nbsp;&nbsp;&nbsp;ল্যাংড়া
        </option>
        <option className="level-1" value="m_hms">
          &nbsp;&nbsp;&nbsp;হিমসাগর
        </option>
        <option className="level-1" value="m_arp">
          &nbsp;&nbsp;&nbsp;আম্রপালি
        </option>
        <option className="level-0" value="mango">
          রংপুর এর আম--
        </option>
        <option className="level-1" value="m_arp">
          &nbsp;&nbsp;&nbsp;হাড়িভাঙ্গা
        </option>
        <option className="level-0" value="mango">
          লিচু--
        </option>
        <option className="level-1" value="m_arp">
          &nbsp;&nbsp;&nbsp;চায়না ৩ লিচু
        </option>
        <option className="level-1" value="m_arp">
          &nbsp;&nbsp;&nbsp;বোম্বাই লিচু
        </option>
        <option className="level-0" value="Gur">
          খেজুরের গুড়--
        </option>
        <option className="level-1" value="g_dna">
          &nbsp;&nbsp;&nbsp;ঝোলা (দানাগুর)
        </option>
        <option className="level-1" value="hot-drinks">
          &nbsp;&nbsp;&nbsp;ঝোলা (লিকুইড গুড়)
        </option>
        <option className="level-1" value="tea-coffee">
          &nbsp;&nbsp;&nbsp;পাটালি গুড় (পাটা)
        </option>
        <option className="level-1" value="water">
          &nbsp;&nbsp;&nbsp;পাটালি গুড় (গোল)
        </option>
        <option className="level-0" value="foodcupboard">
          মধু
        </option>
        <option className="level-1" value="breakfast-cereals">
          &nbsp;&nbsp;&nbsp;প্রাকৃতিক চাকের মধু
        </option>
        <option className="level-1" value="chocolate-sweets">
          &nbsp;&nbsp;&nbsp;চাষকৃত মধু
        </option>
      </select>
      <input
        type="text"
        placeholder="I'm searching for..."
        className="outline-none bg-transparent border-l border-gray-400 px-4 flex-1"
      />
      <Link href="/">
        <AiOutlineSearch className="text-2xl text-sub-title" />
      </Link>
    </div>
  );
};

export default Search;
