const bwipjs = require('bwip-js');


async function generateBarcodeImageLink(text) {
  return new Promise((resolve, reject) => {
    const options = {
      bcid: 'code128', // You can use other barcode types as well
      text,
      scale: 3, // Adjust the scale as needed
      includetext: true,
    };

    bwipjs.toBuffer(options, (err, buffer) => {
      if (err) {
        reject(err);
      } else {
        const base64 = buffer.toString('base64');
        const imageLink = `data:image/png;base64,${base64}`;
        resolve(imageLink);
      }
    });
  });
}

export default generateBarcodeImageLink;
