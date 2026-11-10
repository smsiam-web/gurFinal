// utils/download-png.js
import * as htmlToImage from "html-to-image";
import download from "downloadjs";

/**
 * একটি DOM node কে PNG হিসেবে ডাউনলোড করে।
 * @param {HTMLElement} node
 * @param {string} fileName without path
 * @param {object} opts html-to-image options override
 */
export const downloadNodeAsPng = async (node, fileName, opts = {}) => {
  if (!node) return;
  // খুব লম্বা কন্টেন্ট হলে রেজোলিউশন ভালো রাখতে pixelRatio বাড়ালাম
  const blob = await htmlToImage.toBlob(node, {
    pixelRatio: 2,
    backgroundColor: "#ffffff",
    cacheBust: true,
    ...opts,
  });
  if (blob) download(blob, fileName.endsWith(".png") ? fileName : `${fileName}.png`, "image/png");
};

/**
 * কোনো কন্টেইনারের ভিতরের প্রতিটি child (যেমন প্রতিটি "তারিখ" সেকশন)
 * আলাদা আলাদা PNG হিসেবে ডাউনলোড করে।
 * @param {HTMLElement} container
 * @param {string} prefix
 * @param {string} childSelector CSS selector for splitting (default direct children)
 */
export const downloadChildrenAsPngs = async (
  container,
  prefix = "section",
  childSelector = ":scope > *"
) => {
  if (!container) return;
  const children = Array.from(container.querySelectorAll(childSelector));
  for (let i = 0; i < children.length; i++) {
    // বড় কন্টেন্ট হলে প্রতিটি child আলাদা ফাইল — ব্রাউজার canvas limit এড়াতে সাহায্য করে
    // ফাইল নাম: prefix-01.png, prefix-02.png ...
    const name = `${prefix}-${String(i + 1).padStart(2, "0")}.png`;
    // সামান্য স্ক্রলবার/শ্যাডো থাকলে margin/padding দিয়ে fine-tune করতে পারেন
    await downloadNodeAsPng(children[i], name);
  }
};
