import React, { useRef, useEffect } from "react";
import { useBarcode } from "next-barcode";

const BarcodeComponent = ({ value, onImageReady }) => {
  const { inputRef } = useBarcode({
    value,
    options: {
      background: "#FFFFFF",
      displayValue: false,
      width: 3,
      height: 80,
    },
  });

  useEffect(() => {
    if (inputRef.current) {
      const svgElement = inputRef.current;

      // Serialize the SVG element to a string
      const svgData = new XMLSerializer().serializeToString(svgElement);

      // Convert SVG string to a Blob
      const svgBlob = new Blob([svgData], {
        type: "image/svg+xml;charset=utf-8",
      });

      // Create a URL for the Blob
      const url = URL.createObjectURL(svgBlob);

      // Load the SVG into an Image
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const base64Image = canvas.toDataURL("image/png");

          // Call the callback with the base64 image
          onImageReady(base64Image);

          // Cleanup the URL object
          URL.revokeObjectURL(url);
        }
      };
      img.src = url;
    }
  }, [inputRef, onImageReady]);

  return <svg ref={inputRef} />;
};

export default BarcodeComponent;
