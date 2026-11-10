import React from "react";
import FooterCard from "../components/FooterCard";
import Link from "next/link";
import Image from "next/image";

const Footer = () => {
  return (
    <div className="bg-white border-t text-mid">
      <div className="container">
        {/* footer infos */}
        <div className="flex flex-wrap justify-between items-center gap-8 border-b py-12">
          <FooterCard
            image="/icons/icon_rocket.svg"
            title="Free Shipping"
            subTitle="For all orders over $200"
          />
          <FooterCard
            image="/icons/icon_reload.svg"
            title="1 & 1 Returns"
            subTitle="Cancellation after 1 day"
          />
          <FooterCard
            image="/icons/icon_protect.svg"
            title="100% Secure Payment"
            subTitle="Gurantee secure payments"
          />
          <FooterCard
            image="/icons/icon_support.svg"
            title="24/7 Dedicated Support"
            subTitle="Anywhere & anytime"
          />
          <FooterCard
            image="/icons/icon_tag.svg"
            title="Daily Offers"
            subTitle="Discount up to 70% OFF"
          />
        </div>
        {/* footer widgets */}
        <div className="flex flex-wrap pt-20 pb-12 border-b items-stretch justify-between transition-all">
          <div className="max-w-sm xl:max-w-md mb-12">
            <h4 className="footer-title">
              রাজশাহীর আম ওয়ালা - একটি বিশ্বস্তার নাম{" "}
            </h4>
            <div className="flex flex-col gap-3">
              <p className="pb-6">
                The famous mangoes of Rajshahi are sold on this page. After
                ordering, the mangoes are
              </p>
              {/* contact  */}
              <Link href="tel:+8801837666008" className="mb-4">
                <div className="flex gap-3 items-stretch">
                  <img
                    src="/icons/phone.svg"
                    alt="phone"
                    className="w-4 pb-6"
                  />
                  <div>
                    <p>Hotline 24/7:</p>
                    <span className="font-bold">(+880) 1313-147532</span>
                  </div>
                </div>
              </Link>
              {/* address  */}
              <div className="flex gap-3 items-center">
                <img src="/icons/home.svg" alt="phone" className="w-4" />
                <address>নওহাটা, পবা, রাজশাহী(6213), বাংলাদেশ</address>
              </div>
              {/* email  */}
              <Link href="mailto:rajshahiraamwala@gmail.com">
                <div className="flex gap-3 items-center">
                  <img src="/icons/envelop.svg" alt="phone" className="w-4" />
                  <p>rajshahiraamwala@gmail.com</p>
                </div>
              </Link>
            </div>
          </div>
          {/* links */}
          <div className="flex flex-wrap gap-8 items-stretch md:justify-between max-w-[500px] md:w-full mb-12">
            <div>
              <h4 className="footer-title">Useful Links</h4>
              <div className="flex flex-col gap-4 text-base">
                <Link href={"/about-us-new"} legacyBehavior>
                 About Us
                </Link>
                <Link href={"/contact-us-new"} legacyBehavior>
                  Contact
                </Link>
                <Link href={"/faqs"} legacyBehavior>
                  Help Center
                </Link>
                <Link href={"/become-a-vendor"} legacyBehavior>
                 Career
                </Link>
                <Link href={"/refund-return"} legacyBehavior>
                 Policy
                </Link>
                <Link href={"/flash-sale"} legacyBehavior>
                 Flash Sale
                </Link>
                <Link href={"/order-tracking"} legacyBehavior>
                 Order Tracking
                </Link>
                <Link href={"/contact-us-new"} legacyBehavior>
                 Sitemap
                </Link>
              </div>
            </div>
            <div className="">
              <h4 className="footer-title">Help Center</h4>
              <div className="flex flex-col gap-4 text-base">
                <Link href={"/terms-of-service"} legacyBehavior>
                  Payments
                </Link>
                <Link href={"/shipping"} legacyBehavior>
                  Shipping
                </Link>
                <Link href={"/contact-us-new"} legacyBehavior>
                 Product Returns
                </Link>
                <Link href={"/faqs"} legacyBehavior>
                FAQ
                </Link>
                <Link href={"/checkout"} legacyBehavior>
                 Checkout
                </Link>
                <Link href={"/refund-return"} legacyBehavior>
                 Other Issues
                </Link>
              </div>
            </div>
            <div className="">
              <h4 className="footer-title">Farmart Business</h4>
              <div className="flex flex-col gap-4 text-base">
                <Link href={"/store-listing"} legacyBehavior>
                  Sell On Farmart
                </Link>
                <Link href={"/shipping"} legacyBehavior>
                  Affiliate Program
                </Link>
                <Link href={"/shop-all-brands"} legacyBehavior>
                  Our Suppliers
                </Link>
                <Link href={"/flash-sell"} legacyBehavior>
                  Accessibility
                </Link>
                <Link href={"/contact-us-new"} legacyBehavior>
                  Advertise With Us
                </Link>
              </div>
            </div>
          </div>
          {/* subscribe  */}
          <div className="max-w-sm">
            <h4 className="footer-title">Farmart Newsletter</h4>
            <p className="pb-6">
              Register now to get updates on promotions and coupns. Don’t worry!
              We not spam
            </p>
            <div className="flex rounded-[3px] max-w-full overflow-hidden">
              <div className="flex border p-3 w-fit">
                <img
                  src="/icons/envelop_dark.svg"
                  alt="envelop_icon"
                  className="px-3 hidden sm:block"
                />
                <input
                  type="email"
                  placeholder="Your email..."
                  className="placeholder:text-sm focus:outline-0"
                />
              </div>
              <button className="bg-primary text-title px-5 text-sm text-center font-bold">
                Subscribe
              </button>
            </div>
          </div>
        </div>
        {/* footer bottom */}
        <footer className="py-9 gap-4 flex xl:flex-row flex-col justify-between">
          {/* copyright  */}
          <h4>
            ©{new Date().getFullYear()}{" "}
            <Link
              href="mailto:smsiam696@gmail.com"
              className="font-bold"
              target={"blank"}
              rel={"noreferrer"}
            >
              SM.Devware
            </Link>{" "}
            All rights reserved.
          </h4>
          {/* payment icons  */}
          <Image
            src="/images/footer-new-payment.png"
            alt="payment_icons"
            width={345} height={345}
          />
          {/* all social links */}
          <div className="flex gap-6 items-center">
            <h6>Stay connected:</h6>
            <Link href={"#"} legacyBehavior>
                <Image
                  src="/icons/facebook.svg"
                  width={12} height={12}
                  alt="facebook_logo"
                  className="w-3"
                />
       
            </Link>
            <Link href={"#"} legacyBehavior>
             
                <Image
                width={16} height={16}
                  src="/icons/twitter.svg"
                  alt="twitter_logo"
                />
             
            </Link>
            <Link href={"#"} legacyBehavior>

                <Image
                width={16} height={16}
                  src="/icons/instagram.svg"
                  alt="instagram_logo"

                />
           
            </Link>
            <Link href={"#"} legacyBehavior>

                <Image
                width={16} height={16}
                  src="/icons/pinterest.svg"
                  alt="pinterest_logo"
                
                />
           
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Footer;
