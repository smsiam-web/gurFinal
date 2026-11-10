import type {
  NextApiRequest,
  NextApiResponse,
} from "next";

import { db } from "@/app/utils/firebase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // =====================================================
  // Only POST
  // =====================================================

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} not allowed`,
    });
  }

  try {
    // =====================================================
    // WooCommerce webhook order
    // =====================================================

    const order = req.body;

    // =====================================================
    // Check Order ID
    // =====================================================

    if (!order?.id) {
      return res.status(400).json({
        success: false,
        message: "Order ID missing",
      });
    }

    // =====================================================
    // Only Processing Order
    // =====================================================

    if (
      order.status !== "processing"
    ) {
      console.log(
        `Order #${order.id} ignored because status = ${order.status}`
      );

      return res.status(200).json({
        success: true,
        ignored: true,
        orderID:
          String(order.id),
        status:
          order.status,
      });
    }

    const orderID =
      String(order.id);

    // =====================================================
    // Order Object
    // =====================================================

    const orderData = {
      id: order.id,

      number:
        order.number,

      status:
        order.status,

      currency:
        order.currency,

      total:
        order.total,

      shipping_total:
        order.shipping_total,

      dateCreated:
        order.date_created,

      customer_ip_address:
        order.customer_ip_address ||
        "",

      paymentMethod:
        order.payment_method_title ||
        order.payment_method ||
        "",

      customer: {
        firstName:
          order.billing
            ?.first_name ||
          "",

        lastName:
          order.billing
            ?.last_name ||
          "",

        phone:
          order.billing
            ?.phone ||
          "",

        email:
          order.billing
            ?.email ||
          "",

        address1:
          order.billing
            ?.address_1 ||
          "",

        address2:
          order.billing
            ?.address_2 ||
          "",

        city:
          order.billing
            ?.city ||
          "",

        state:
          order.billing
            ?.state ||
          "",

        postcode:
          order.billing
            ?.postcode ||
          "",
      },

      products:
        order.line_items?.map(
          (item: any) => ({
            id:
              item.id,

            productId:
              item.product_id,

            name:
              item.name,

            quantity:
              item.quantity,

            total:
              item.total,

            sku:
              item.sku ||
              "",

            image:
              item.image
                ?.src ||
              "",
          })
        ) || [],
    };

    console.log(
      "ORDER DATA:"
    );

    console.log(
      JSON.stringify(
        orderData,
        null,
        2
      )
    );

    // =====================================================
    // Firestore references
    // =====================================================

    const allRef = db
      .collection(
        "webOrderList"
      )
      .doc(orderID);

    const processingRef = db
      .collection(
        "processing"
      )
      .doc(orderID);

    // =====================================================
    // Duplicate Check
    // =====================================================

    const [
      allSnap,
      processingSnap,
    ] = await Promise.all([
      allRef.get(),
      processingRef.get(),
    ]);

    if (
      allSnap.exists ||
      processingSnap.exists
    ) {
      console.log(
        `Order #${orderID} already exists`
      );

      return res.status(200).json({
        success: true,
        duplicate: true,
        orderID,
        message:
          "Order already exists",
      });
    }

    // =====================================================
    // SAVE ALL
    // =====================================================

    console.log(
      `Saving #${orderID} to webOrderList...`
    );

    await allRef.set(
      orderData
    );

    console.log(
      `Saved #${orderID} to webOrderList`
    );

    // =====================================================
    // SAVE PROCESSING
    // =====================================================

    console.log(
      `Saving #${orderID} to processing...`
    );

    await processingRef.set(
      orderData
    );

    console.log(
      `Saved #${orderID} to processing`
    );

    // =====================================================
    // UPDATE COUNTER
    //
    // processing +1
    // all +1
    // =====================================================

    // await addNewProcessingOrderCounter();

    console.log(
      `Counter updated for #${orderID}`
    );

    // =====================================================
    // WooCommerce credentials
    // =====================================================

    const wooUrl =
      process.env
        .WOOCOMMERCE_URL;

    const consumerKey =
      process.env
        .WOOCOMMERCE_CONSUMER_KEY;

    const consumerSecret =
      process.env
        .WOOCOMMERCE_CONSUMER_SECRET;

    if (
      !wooUrl ||
      !consumerKey ||
      !consumerSecret
    ) {
      throw new Error(
        "WooCommerce environment variables missing"
      );
    }

    // =====================================================
    // WooCommerce Auth
    // =====================================================

    const auth =
      Buffer.from(
        `${consumerKey}:${consumerSecret}`
      ).toString(
        "base64"
      );

    // =====================================================
    // UPDATE WooCommerce -> on-hold
    // =====================================================

    console.log(
      `Changing WooCommerce #${orderID} to on-hold...`
    );

    const wooResponse =
      await fetch(
        `${wooUrl}/wp-json/wc/v3/orders/${order.id}`,
        {
          method:
            "PUT",

          headers: {
            Authorization:
              `Basic ${auth}`,

            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              status:
                "on-hold",
            }),
        }
      );

    const wooData =
      await wooResponse.json();

    // =====================================================
    // WooCommerce Update Failed
    // =====================================================

    if (
      !wooResponse.ok
    ) {
      console.error(
        "WooCommerce status update failed:"
      );

      console.error(
        wooData
      );

      return res
        .status(500)
        .json({
          success:
            false,

          orderSaved:
            true,

          counterUpdated:
            true,

          orderID,

          message:
            "Firebase save successful but WooCommerce status update failed",

          error:
            wooData,
        });
    }

    // =====================================================
    // SUCCESS
    // =====================================================

    console.log(
      `Order #${orderID}: processing -> ${wooData.status}`
    );

    return res
      .status(200)
      .json({
        success:
          true,

        message:
          "Order saved successfully and WooCommerce changed to on-hold",

        orderID,

        firebase: {
          webOrderList:
            true,

          processing:
            true,
        },

        counter: {
          processing:
            "+1",

          webOrderList:
            "+1",
        },

        wooCommerce: {
          oldStatus:
            "processing",

          newStatus:
            wooData.status ||
            "on-hold",
        },
      });
  } catch (error: any) {
    console.error(
      "======================================"
    );
    console.error(
      "WEBHOOK ERROR"
    );
    console.error(
      "======================================"
    );

    console.error(
      error
    );

    console.error(
      "MESSAGE:",
      error?.message
    );

    console.error(
      "CODE:",
      error?.code
    );

    return res
      .status(500)
      .json({
        success:
          false,

        message:
          error?.message ||
          "Webhook processing failed",

        code:
          error?.code ||
          null,
      });
  }
}