import { useState } from "react";
import draftToHtml from "draftjs-to-html";

const BODY = {
  blocks: [
    {
      key: "coa91",
      text: "গোপালভোগ আমের রাজা, ল্যাংড়া আমের পরেই গোপালভোগের স্থান। এই আমটি আকার গোলাকার এবং ওজনে ২০০ থেকে ৫০০ গ্রামের মধ্যে হয়। উন্নত প্রজাতির আম মৌসুমের শুরু থেকে মাঝামাঝি সময়ের মধ্যে পাওয়া যায়। অসাধারণ রং অতুলনীয় মিষ্টি স্বাদ গন্ধ যুক্ত। আমের খোসা একটু মোটা হয় যদিও আঁটি পাতলা হয়। বাংলাদেশ ও ভারতের কিছু অঞ্চলে এই গোপালভোগ উন্নত মানের আমের ফলন পাওয়া যায়। আমটির শুরুতে মুকুল আসে এবং জৈষ্ঠ্য মাসের মাঝামাঝি সময় এর ফল পাকতে শুরু করে। এটি প্রথমে কাঁচা অবস্থায় সবুজ এবং পাকলে হলুদ লালচে বর্ণের হয়। আসবি নাম হিসেবে এর পরিচিতি রয়েছে। মে মাসের শেষের দিক থেকে এর ফলন হয় । খুব অল্প সময় বাজারে থাকে। এই আমটি বাংলাদেশের প্রায় সব জেলাতেই পাওয়া যায়। ",
      type: "unstyled",
      depth: 0,
      inlineStyleRanges: [
        {
          offset: 0,
          length: 8,
          style: "color-rgb(235,107,86)",
        },
        {
          offset: 87,
          length: 3,
          style: "color-rgb(235,107,86)",
        },
        {
          offset: 96,
          length: 3,
          style: "color-rgb(235,107,86)",
        },
        {
          offset: 20,
          length: 8,
          style: "color-rgb(250,197,28)",
        },
        {
          offset: 119,
          length: 69,
          style: "color-rgb(84,172,210)",
        },
        {
          offset: 0,
          length: 8,
          style: "BOLD",
        },
        {
          offset: 0,
          length: 8,
          style: "fontfamily-Mulish, sans-serif",
        },
        {
          offset: 9,
          length: 636,
          style: "fontfamily-Mulish, sans-serif",
        },
        {
          offset: 9,
          length: 11,
          style: "color-rgb(102,102,102)",
        },
        {
          offset: 28,
          length: 59,
          style: "color-rgb(102,102,102)",
        },
        {
          offset: 90,
          length: 6,
          style: "color-rgb(102,102,102)",
        },
        {
          offset: 99,
          length: 20,
          style: "color-rgb(102,102,102)",
        },
        {
          offset: 188,
          length: 47,
          style: "color-rgb(102,102,102)",
        },
        {
          offset: 278,
          length: 367,
          style: "color-rgb(102,102,102)",
        },
        {
          offset: 235,
          length: 43,
          style: "color-rgb(97,189,109)",
        },
        {
          offset: 0,
          length: 8,
          style: "fontsize-medium",
        },
        {
          offset: 9,
          length: 636,
          style: "fontsize-medium",
        },
        {
          offset: 0,
          length: 8,
          style: "bgcolor-rgb(255,255,255)",
        },
        {
          offset: 9,
          length: 636,
          style: "bgcolor-rgb(255,255,255)",
        },
        {
          offset: 0,
          length: 8,
          style: "fontsize-24",
        },
      ],
      entityRanges: [],
      data: {},
    },
    {
      key: "c3oi1",
      text: "অর্ডার করতে কল করুন এই নাম্বার এ --",
      type: "unstyled",
      depth: 0,
      inlineStyleRanges: [],
      entityRanges: [],
      data: {},
    },
    {
      key: "eq5n4",
      text: "০১৩১৩১৪৭৫৩২",
      type: "unstyled",
      depth: 0,
      inlineStyleRanges: [
        {
          offset: 0,
          length: 11,
          style: "color-rgb(251,160,38)",
        },
        {
          offset: 0,
          length: 11,
          style: "bgcolor-rgb(255,255,255)",
        },
        {
          offset: 0,
          length: 11,
          style: "UNDERLINE",
        },
      ],
      entityRanges: [
        {
          offset: 0,
          length: 11,
          key: 0,
        },
      ],
      data: {},
    },
    {
      key: "7mq4t",
      text: "বা অ্যাপ থেকে অর্ডার করতে Order Now  বাটন এ ক্লিক  করুন।",
      type: "unstyled",
      depth: 0,
      inlineStyleRanges: [
        {
          offset: 26,
          length: 10,
          style: "bgcolor-rgb(71,85,119)",
        },
        {
          offset: 26,
          length: 10,
          style: "color-rgb(255,255,255)",
        },
        {
          offset: 44,
          length: 6,
          style: "color-rgb(44,130,201)",
        },
        {
          offset: 44,
          length: 5,
          style: "UNDERLINE",
        },
      ],
      entityRanges: [
        {
          offset: 26,
          length: 9,
          key: 1,
        },
        {
          offset: 44,
          length: 5,
          key: 2,
        },
      ],
      data: {},
    },
  ],
  entityMap: {
    0: {
      type: "LINK",
      mutability: "MUTABLE",
      data: {
        url: "tel:+8801313147532",
        targetOption: "_self",
      },
    },
    1: {
      type: "LINK",
      mutability: "MUTABLE",
      data: {
        url: "/checkout",
        targetOption: "_self",
      },
    },
    2: {
      type: "LINK",
      mutability: "MUTABLE",
      data: {
        url: "/checkout",
        targetOption: "_self",
      },
    },
  },
};
const Description = () => {
  const [local, setLocal] = useState(draftToHtml(BODY));

  return (
    <div className="sm:px-4 py-3 prose prose-sm max-w-none">
      <div className="preview" dangerouslySetInnerHTML={{ __html: local }} />
    </div>
  );
};

export default Description;
