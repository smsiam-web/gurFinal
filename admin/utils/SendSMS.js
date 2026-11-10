import fetch from 'node-fetch';

const sendSMS = async (values, invoice_str, config) => {
    const customer_name = values?.customer_name.split(" ").join("%20");
    const company_name = config[0]?.values.company_name.split(" ").join("%20");   
    const company_contact = config[0]?.values.company_contact;  
  try {
    const url = "https://api.sms.net.bd/sendsms";
    const apiKey = config[0]?.values.bulk_auth;
    const message = `Dear%20${customer_name},%20Your%20order%20has%20been%20successfully%20placed%20at%20${company_name}.%20Invoice%20No:%20${invoice_str}.%20Please%20keep%20BDT:%20${values?.salePrice}tk%20ready%20while%20receiving%20the%20parcel.%20Hotline:%20+88${company_contact}.%20Thanks%20for%20being%20with%20us.`;
    const to = values?.phone_number;

    const response = await fetch(url, {
      method: 'POST',
      body: new URLSearchParams({
        api_key: apiKey,
        msg: message,
        to: to,
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed with status: ${response.status}`);
    }

    const responseBody = await response.text();
    console.log(responseBody);
  } catch (error) {
    throw new Error(error);
  }
};

export default sendSMS;


  // const sendConfirmationMsg = (values, invoice_str) => {
  //   const customer_name = values?.customer_name.split(" ").join("%20");
  //   const msg = `Dear%20${customer_name},%20Your%20order%20has%20been%20successfully%20placed%20at%20Rajshahir%20Aam%20Wala.%20Invoice%20No:%20${invoice_str}.%20Please%20keep%20BDT:%20${values?.salePrice}tk%20ready%20while%20receiving%20the%20parcel.%20Hotline:%20+8801722166051.%20Thanks%20for%20being%20with%20us.`;
  //   const contact = values?.phone_number;

  //   const request = require("request");
  //   const options = {
  //     method: "POST",
  //     url: "https://api.sms.net.bd/sendsms",
  //     formData: {
  //       api_key: "Ew30IJbo8Pb7Kv74GKRh83P8tZ1SLDajm6807fkj",
  //       msg: msg,
  //       to: `88${contact}`,
  //     },
  //   };
  //   request(options, function (error, response) {
  //     if (error) throw new Error(error);
  //     console.log(response.body);
  //   });
  // };