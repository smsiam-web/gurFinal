import FooterCard from "../../FooterCard";
import { TbCurrencyTaka } from "react-icons/tb";
import { FaAngleDoubleRight, FaMinus } from "react-icons/fa";
import { BsPlusLg } from "react-icons/bs";
import Link from "next/link";
import ProductMoreInfo from "../ProductMoreInfo";
import Button from "../../shared/Button";
import Breadcrumb from "../../shared/Breadcrumb";
import * as Yup from "yup";
import { AppForm, FormBtn } from "../../shared/Form";
import QuantityFrom from "../QuantityFrom";
import { Tooltip, Rating } from "@mantine/core";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { selectProduct } from "@/app/redux/slices/productSlice";
import { useEffect, useState } from "react";
import { db } from "@/app/utils/firebase";

const validationSchema = Yup.object().shape({
  first_name: Yup.string().max(25).required().label("First name"),
  quantity: Yup.string().required().label("পরিমান নির্বাচন করুন"),
});

const ProductDetails = ({ disabled }) => {
  const Products = useSelector(selectProduct);
  const [product, setProduct] = useState(null);
  const [path, setPath] = useState(null);
  const router = useRouter();
  const aspath = router.query.slug;

  const { id, off_price, productImg, product_details, weight } =
    product?.i || "";

  const {
    product_description,
    available_from,
    parent_category,
    child_category,
    product_name,
    product_type,
    price,
    sale_price,
    unit,
    slug,
    product_tag,
    sku,
  } = product_details || "";

  useEffect(() => {
    if (id === aspath) return;
    setPath(id);
    setPath(aspath);
  }, [id]);

  console.log(path, id);
  useEffect(() => {
    Products?.map((i) => {
      console.log(path);
      if (i.id !== path) return;
      else {
        return db.collection("singleProduct").doc("singleProductHardId").set({
          i,
        });
      }
    });
  }, [path]);

  // Get products from firebase and update Redux
  useEffect(() => {
    const unSub = db.collection("singleProduct").onSnapshot((snap) => {
      snap.docs.map((doc) => {
        setProduct({
          ...doc.data(),
        });
      });
    });
    return () => {
      unSub();
    };
  }, []);

  const placeOrder = (values) => {
    // console.log(values);
  };

  return (
    <div className="py-6 sm:py-12 ">
      <div className="container">
        <div className="px-6 sm:px-10 py-8 sm:py-14 bg-white rounded-2xl">
          <div className="flex flex-wrap lg:flex-row flex-col lg:gap-0 gap-7">
            <div className="lg:w-2/5 w-full lg:border-r p-2">
              <img
                src={productImg?.urls}
                alt=""
                loading="lazy"
                className="rounded-lg"
              />
            </div>
            <div className="lg:w-2/5 w-full lg:px-10 pl-0">
              {/* <Breadcrumb /> */}
              <Breadcrumb />
              <h4 className="md:text-xl text-base font-bold mb-2 mt-5 text-orange">
                {product_type}
              </h4>
              <h1 className="text-title md:text-3xl text-xl font-semibold mb-2 sm:mb-3 xl:mb-5">
                {product_name}
              </h1>
              <span className="text-sub-title text-xs flex items-center gap-2">
                <Rating value={4.5} fractions={2} readOnly />{" "}
                <span>(1 customer review)</span>
              </span>
              <div className="my-3">
                <span className="text-sm text-sub-title mb-2 block">
                  {unit}
                </span>
                <div className="flex items-center gap-1">
                  <span
                    className={`text-xl flex items-center font-bold ${
                      price ? "text-orange" : "text-green"
                    }`}
                  >
                    <TbCurrencyTaka className="text-2xl font-bold" />
                    {sale_price}
                  </span>
                  {price && (
                    <span className="text-lg flex items-center line-through text-gray-400">
                      <TbCurrencyTaka className="text-xl font-bold" />
                      {price}
                    </span>
                  )}
                </div>
              </div>
              <div className="my-5 bg-[#EBFAE9] w-fit px-3 py-2 border border-[#82d45e] rounded-md">
                Availability:
                <span className="text-green ml-1 font-bold">
                  {available_from}
                </span>
              </div>
              <div className="border-t"></div>
              <AppForm
                initialValues={{
                  quantity: "",
                  first_name: "গোপালভোগ আম",
                }}
                onSubmit={placeOrder}
                validationSchema={validationSchema}
              >
                <div className="my-5 flex flex-col gap-5">
                  <div className="flex flex-col w-full justify-between gap-5">
                    <div className="flex flex-col">
                      <span className="text-sm pb-2 block text-sub-title">
                        আমের পরিমানঃ
                      </span>
                      <div className="-my-4">
                        <QuantityFrom />
                      </div>
                    </div>
                    {/* <Quantity /> */}
                    <div className="flex flex-col">
                      <span className="text-sm pb-2 block text-sub-title">
                        ক্যারেট সংখ্যাঃ
                      </span>
                      <div className="flex justify-between border rounded-md">
                        <button className="bg-[#f5f5f5] font-bold px-3 py-3 hover-primary text-sub-title">
                          <FaMinus />
                        </button>
                        <div className="px-5 flex-grow flex items-center justify-center">
                          {1}
                        </div>
                        <button className="bg-[#f5f5f5] px-3 py-3 font-bold hover-primary text-sub-title">
                          <BsPlusLg />
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* product button  */}
                  <div className="flex gap-3">
                    <div>
                      {!disabled ? (
                        <FormBtn title="Add to Cart" onClick={placeOrder} />
                      ) : (
                        <Tooltip
                          label="This Button/Action is Disable for Demo version"
                          withArrow
                          color="gray"
                          arrowSize={6}
                        >
                          <div>
                            <Button
                              title="Add to Cart"
                              className="bg-primary text-white"
                            />
                          </div>
                        </Tooltip>
                      )}
                    </div>
                    {!disabled ? (
                      <Link href={"/checkout"}>
                        <Button
                          title={"Order Now"}
                          className={"bg-black text-white"}
                        />
                      </Link>
                    ) : (
                      <Tooltip
                        label="This Button/Action is Disable for Demo version"
                        withArrow
                        color="gray"
                        arrowSize={6}
                      >
                        <div>
                          <Button
                            title={"Order Now"}
                            className={"bg-black text-white"}
                          />
                        </div>
                      </Tooltip>
                    )}
                  </div>
                </div>
              </AppForm>
              <div className="border-t my-7"></div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1">
                  <FaAngleDoubleRight className="text-greens text-xl" />
                  <p className="text-gray-900">
                    <span className="text-sub-title">কোয়ালিটিঃ</span>{" "}
                    {product_tag}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <FaAngleDoubleRight className="text-greens text-xl" />
                  <p className="text-gray-900">
                    <span className="text-sub-title">জাতঃ</span>{" "}
                    {child_category}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <FaAngleDoubleRight className="text-greens text-xl" />
                  <p className="text-gray-900">
                    <span className="text-sub-title">
                      রাজশাহী অঞ্চলের অন্যতম জনপ্রিয় আম
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <FaAngleDoubleRight className="text-greens text-xl" />
                  <p className="text-gray-900">
                    <span className="text-sub-title">
                      প্রতিটি আমের সাইজ প্রায় {slug} গ্রাম
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <FaAngleDoubleRight className="text-greens text-xl" />
                  <p className="text-gray-900">
                    <span className="text-sub-title">
                      প্রতি কেজিতে ৪-৬ টি আম
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <FaAngleDoubleRight className="text-greens text-xl" />
                  <p className="text-gray-900">
                    <span className="text-sub-title">
                      {product_description}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <FaAngleDoubleRight className="text-greens text-xl" />
                  <p className="text-gray-900">
                    <span className="text-sub-title">
                      অর্ডার করার ৪-৫ দিনের ভিতর কুরিয়ারের বুকিং করা হবে
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <FaAngleDoubleRight className="text-greens text-xl" />
                  <p className="text-gray-900">
                    <span className="text-sub-title">
                      যেকোন তথ্য জানতে কল করুন 01313147532
                    </span>
                  </p>
                </div>

                <p className="text-gray-900">
                  <span className="text-greens">Categories:</span>{" "}
                  {product_type}, {parent_category}, {product_name},{" "}
                  {product_tag}
                </p>
                <p className="text-gray-900">
                  <span className="text-sub-title">Tag:</span> {sku}
                </p>
              </div>
            </div>
            <div className="lg:w-1/5 w-full">
              <div className="bg-[#F3F3F3] px-5 py-7 rounded-md">
                <FooterCard
                  image="/icons/icon_rocket.svg"
                  title="Free Shipping"
                  subTitle="For all orders over BDT:2000/-"
                />
                <div className="border-t my-5"></div>
                <FooterCard
                  image="/icons/icon_reload.svg"
                  title="1 & 1 Returns"
                  subTitle="Cancellation after 1 day"
                />
                <div className="border-t my-5"></div>
                <FooterCard
                  image="/icons/icon_protect.svg"
                  title="Secure Payment"
                  subTitle="100% secure payments"
                />
              </div>
              <div className="bg-[#F3F3F3] px-5 mt-5 py-7 rounded-md">
                <p className="font-bold text-title">Hotline Order:</p>
                <span className="text-sub-title">
                  Mon - Fri: 7:00 am - 18:00PM
                </span>
                <p className="text-xl md:text-2xl font-bold text-title mt-5">
                  +880 1313-147532
                </p>
              </div>
            </div>
          </div>
        </div>

        <ProductMoreInfo />
      </div>
    </div>
  );
};

export default ProductDetails;
