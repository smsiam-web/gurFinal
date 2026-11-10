// pages/api/woocommerce/order.ts

import type {
  NextApiRequest,
  NextApiResponse,
} from "next";

import {
  db,
  timestamp,
} from "@/app/utils/firebase";
import { getCustomerRating } from "@/lib/customerRating";


// =====================================================
// COUNTER REFERENCE
// =====================================================

const counterRef = db.doc(
  "counters/orderStatusSummary"
);

// =====================================================
// SAFE NUMBER
// =====================================================

function safeNumber(value: any) {
  const number = Number(value || 0);

  return Number.isNaN(number)
    ? 0
    : number;
}

// =====================================================
// PHONE NORMALIZER
//
// সব phone:
//
// +8801712345678
// 8801712345678
// 1712345678
//
// convert হবে:
//
// 01712345678
// =====================================================

function normalizePhone(
  phone: string = ""
) {
  let value = String(phone)
    .replace(/\D/g, "")
    .trim();

  if (!value) {
    return "";
  }

  // 8801712345678 -> 01712345678
  if (
    value.startsWith("880") &&
    value.length === 13
  ) {
    value =
      "0" + value.slice(3);
  }

  // 1712345678 -> 01712345678
  if (
    value.startsWith("1") &&
    value.length === 10
  ) {
    value =
      "0" + value;
  }

  return value;
}

// =====================================================
// MONEY TO NUMBER
// =====================================================

function moneyNumber(value: any) {
  const number = Number(value || 0);

  return Number.isNaN(number)
    ? 0
    : number;
}

// =====================================================
// MERGE PRODUCTS
//
// একই productId + sku + name হলে:
//
// quantity যোগ হবে
// total যোগ হবে
//
// আলাদা product হলে নতুন item add হবে
// =====================================================

function mergeProducts(
  oldProducts: any[] = [],
  newProducts: any[] = []
) {
  const productMap =
    new Map<string, any>();

  const addProduct = (
    product: any
  ) => {
    const key = [
      product?.productId || "",
      product?.sku || "",
      product?.name || "",
    ].join("_");

    if (
      !productMap.has(key)
    ) {
      productMap.set(key, {
        ...product,

        quantity:
          Number(
            product?.quantity || 0
          ),

        total:
          String(
            moneyNumber(
              product?.total
            )
          ),
      });

      return;
    }

    const existing =
      productMap.get(key);

    existing.quantity =
      Number(
        existing?.quantity || 0
      ) +
      Number(
        product?.quantity || 0
      );

    existing.total =
      String(
        moneyNumber(
          existing?.total
        ) +
          moneyNumber(
            product?.total
          )
      );

    productMap.set(
      key,
      existing
    );
  };

  oldProducts.forEach(
    addProduct
  );

  newProducts.forEach(
    addProduct
  );

  return Array.from(
    productMap.values()
  );
}

// =====================================================
// FALLBACK RATIO
//
// Courier API fail করলেও order save বন্ধ হবে না
// =====================================================

function getFallbackRatio(
  phone: string,
  message: string
) {
  return {
    success: false,

    phone,

    overall: {
      success: 0,
      total: 0,
      rate: 0,
    },

    pathao: {
      success: 0,
      total: 0,
      rate: 0,
      error: message,
    },

    steadfast: {
      success: 0,
      total: 0,
      rate: 0,
      error: message,
    },
  };
}

// =====================================================
// MAIN HANDLER
// =====================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // ===================================================
  // ONLY GET
  // ===================================================

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message:
        "Method not allowed",
    });
  }

  try {
    // =================================================
    // WOOCOMMERCE ENV
    // =================================================

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
      return res.status(500).json({
        success: false,

        message:
          "WooCommerce environment variables missing",
      });
    }

    // =================================================
    // AUTH
    // =================================================

    const auth =
      Buffer.from(
        `${consumerKey}:${consumerSecret}`
      ).toString(
        "base64"
      );

    // =================================================
    // FETCH PROCESSING ORDERS
    // =================================================

    const wooResponse =
      await fetch(
        `${wooUrl}/wp-json/wc/v3/orders?status=processing&per_page=100&orderby=date&order=desc`,
        {
          method: "GET",

          headers: {
            Authorization:
              `Basic ${auth}`,

            "Content-Type":
              "application/json",
          },
        }
      );

    const wooOrders =
      await wooResponse.json();

    if (!wooResponse.ok) {
      console.error(
        "WooCommerce API Error:",
        wooOrders
      );

      return res
        .status(
          wooResponse.status
        )
        .json({
          success: false,

          message:
            wooOrders?.message ||
            "Failed to fetch WooCommerce orders",

          error:
            wooOrders,
        });
    }

    // =================================================
    // FORMAT ORDERS
    // =================================================

    const orders =
      wooOrders.map(
        (order: any) => {
          const phone =
            normalizePhone(
              order.billing?.phone ||
                ""
            );

          return {
            id:
              order.id,

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

              phone,

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
                (
                  item: any
                ) => ({
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
        }
      );

    console.log(
      "===================================="
    );

    console.log(
      "PROCESSING ORDERS:",
      orders.length
    );

    console.log(
      "===================================="
    );

    // =================================================
    // RESULTS
    // =================================================

    const savedOrders: any[] =
      [];

    const mergedOrders: any[] =
      [];

    const duplicateOrders: any[] =
      [];

    const failedOrders: any[] =
      [];

    // =================================================
    // PROCESS ORDERS
    // =================================================

    for (
      const orderData of orders
    ) {
      const orderID =
        String(
          orderData.id
        );

      const phone =
        normalizePhone(
          orderData
            ?.customer
            ?.phone ||
            ""
        );

      try {
        console.log(
          `Processing WooCommerce Order #${orderID}`
        );

        // ===============================================
        // FETCH CUSTOMER RATIO
        //
        // Transaction-এর বাইরে করতে হবে
        // কারণ external API transaction-এর মধ্যে
        // call করা উচিত না
        // ===============================================

        let ratioData: any;

        if (phone) {
          try {
            ratioData =
              await getCustomerRating(
                phone
              );

            console.log(
              `Ratio fetched for ${phone}:`,
              ratioData
            );
          } catch (
            ratioError: any
          ) {
            console.error(
              `Ratio error for ${phone}:`,
              ratioError
            );

            ratioData =
              getFallbackRatio(
                phone,

                ratioError?.message ||
                  "Customer ratio failed"
              );
          }
        } else {
          ratioData =
            getFallbackRatio(
              "",

              "Customer phone missing"
            );
        }

        // ===============================================
        // FINAL ORDER DATA
        //
        // Ratio এখন order-এর ভিতরে attach
        // ===============================================

        const finalOrderData = {
          ...orderData,

          customer: {
            ...orderData.customer,

            phone,
          },

          ratio:
            ratioData,
        };

        // ===============================================
        // FIRESTORE REFERENCES
        // ===============================================

        const allRef =
          db
            .collection(
              "webOrderList"
            )
            .doc(
              orderID
            );

        const processingRef =
          db
            .collection(
              "processing"
            )
            .doc(
              orderID
            );

        // ===============================================
        // PHONE INDEX
        //
        // Document ID:
        //
        // processingPhoneIndex/01712345678
        // ===============================================

        const phoneIndexRef =
          phone
            ? db
                .collection(
                  "processingPhoneIndex"
                )
                .doc(
                  phone
                )
            : null;

        // ===============================================
        // FIRESTORE TRANSACTION
        // ===============================================

        const transactionResult =
          await db.runTransaction(
            async (tx) => {
              // =========================================
              // ALL READS FIRST
              // =========================================

              const allSnap =
                await tx.get(
                  allRef
                );

              const processingSnap =
                await tx.get(
                  processingRef
                );

              const counterSnap =
                await tx.get(
                  counterRef
                );

              let phoneIndexSnap:
                | any
                | null =
                null;

              if (
                phoneIndexRef
              ) {
                phoneIndexSnap =
                  await tx.get(
                    phoneIndexRef
                  );
              }

              // =========================================
              // DUPLICATE ORDER ID
              // =========================================

              if (
                allSnap.exists ||
                processingSnap.exists
              ) {
                return {
                  type:
                    "duplicate-id",

                  orderID,
                };
              }

              // =========================================
              // COUNTER DATA
              // =========================================

              const counterData =
                counterSnap.exists
                  ? counterSnap.data() ||
                    {}
                  : {};

              // =========================================
              // PHONE ALREADY EXISTS IN PROCESSING
              // =========================================

              if (
                phone &&
                phoneIndexRef &&
                phoneIndexSnap?.exists
              ) {
                const phoneIndexData =
                  phoneIndexSnap.data() ||
                  {};

                const existingOrderID =
                  String(
                    phoneIndexData
                      ?.orderID ||
                      ""
                  );

                // =======================================
                // অন্য processing order same phone
                // =======================================

                if (
                  existingOrderID &&
                  existingOrderID !==
                    orderID
                ) {
                  const existingProcessingRef =
                    db
                      .collection(
                        "processing"
                      )
                      .doc(
                        existingOrderID
                      );

                  const existingProcessingSnap =
                    await tx.get(
                      existingProcessingRef
                    );

                  // =====================================
                  // EXISTING PROCESSING ORDER FOUND
                  // =====================================

                  if (
                    existingProcessingSnap.exists
                  ) {
                    const oldData =
                      existingProcessingSnap.data() ||
                      {};

                    // ===================================
                    // MERGE PRODUCTS
                    // ===================================

                    const mergedProducts =
                      mergeProducts(
                        oldData.products ||
                          [],

                        finalOrderData.products ||
                          []
                      );

                    // ===================================
                    // MERGED ORDER IDs
                    // ===================================

                    const oldMergedIDs =
                      Array.isArray(
                        oldData
                          .mergedOrderIDs
                      )
                        ? oldData
                            .mergedOrderIDs
                        : [
                            String(
                              oldData.id ||
                                existingOrderID
                            ),
                          ];

                    const mergedOrderIDs =
                      Array.from(
                        new Set([
                          ...oldMergedIDs.map(
                            String
                          ),

                          orderID,
                        ])
                      );

                    // ===================================
                    // ORDER NUMBERS
                    // ===================================

                    const oldOrderNumbers =
                      Array.isArray(
                        oldData
                          .orderNumbers
                      )
                        ? oldData
                            .orderNumbers
                        : [
                            String(
                              oldData.number ||
                                existingOrderID
                            ),
                          ];

                    const orderNumbers =
                      Array.from(
                        new Set([
                          ...oldOrderNumbers.map(
                            String
                          ),

                          String(
                            finalOrderData.number ||
                              orderID
                          ),
                        ])
                      );

                    // ===================================
                    // MERGED DATA
                    //
                    // IMPORTANT:
                    //
                    // Customer/name/address old থাকবে
                    //
                    // Products merge হবে
                    //
                    // Ratio latest হবে
                    // ===================================

                    const mergedData = {
                      ...oldData,

                      customer:
                        oldData.customer,

                      products:
                        mergedProducts,

                      ratio:
                        ratioData,

                      mergedOrderIDs,

                      orderNumbers,

                      mergedOrdersCount:
                        mergedOrderIDs.length,

                      total:
                        String(
                          moneyNumber(
                            oldData.total
                          ) +
                            moneyNumber(
                              finalOrderData.total
                            )
                        ),

                      shipping_total:
                        String(
                          moneyNumber(
                            oldData.shipping_total
                          ) +
                            moneyNumber(
                              finalOrderData.shipping_total
                            )
                        ),

                      updatedAt:
                        timestamp,
                    };

                    // ===================================
                    // UPDATE EXISTING PROCESSING ORDER
                    // ===================================

                    tx.set(
                      existingProcessingRef,

                      mergedData,

                      {
                        merge:
                          true,
                      }
                    );

                    // ===================================
                    // SAVE NEW ORDER IN ALL LIST
                    //
                    // Original order আলাদাভাবে থাকবে
                    // ===================================

                    tx.set(
                      allRef,

                      {
                        ...finalOrderData,

                        mergedInto:
                          existingOrderID,

                        mergedByPhone:
                          true,

                        mergedAt:
                          timestamp,
                      }
                    );

                    // ===================================
                    // COUNTER
                    //
                    // processing unchanged
                    // all +1
                    // ===================================

                    tx.set(
                      counterRef,

                      {
                        processing:
                          safeNumber(
                            counterData
                              .processing
                          ),

                        incomplete:
                          safeNumber(
                            counterData
                              .incomplete
                          ),

                        goodButNoResponse:
                          safeNumber(
                            counterData
                              .goodButNoResponse
                          ),

                        noResponse:
                          safeNumber(
                            counterData
                              .noResponse
                          ),

                        advancePayment:
                          safeNumber(
                            counterData
                              .advancePayment
                          ),

                        onHold:
                          safeNumber(
                            counterData
                              .onHold
                          ),

                        approved:
                          safeNumber(
                            counterData
                              .approved
                          ),

                        cancel:
                          safeNumber(
                            counterData
                              .cancel
                          ),

                        webOrderList:
                          safeNumber(
                            counterData
                              .webOrderList
                          ) + 1,

                        updatedAt:
                          timestamp,
                      },

                      {
                        merge:
                          true,
                      }
                    );

                    return {
                      type:
                        "phone-merged",

                      orderID,

                      mergedInto:
                        existingOrderID,

                      phone,
                    };
                  }

                  // =====================================
                  // PHONE INDEX BROKEN
                  //
                  // index আছে কিন্তু processing order নাই
                  //
                  // old index delete করে নতুন order save
                  // =====================================

                  tx.delete(
                    phoneIndexRef
                  );
                }
              }

              // =========================================
              // NEW PROCESSING ORDER
              // =========================================

              tx.set(
                allRef,

                {
                  ...finalOrderData,

                  createdAt:
                    timestamp,

                  updatedAt:
                    timestamp,
                }
              );

              tx.set(
                processingRef,

                {
                  ...finalOrderData,

                  mergedOrderIDs: [
                    orderID,
                  ],

                  orderNumbers: [
                    String(
                      finalOrderData.number ||
                        orderID
                    ),
                  ],

                  mergedOrdersCount:
                    1,

                  createdAt:
                    timestamp,

                  updatedAt:
                    timestamp,
                }
              );

              // =========================================
              // PHONE INDEX
              // =========================================

              if (
                phone &&
                phoneIndexRef
              ) {
                tx.set(
                  phoneIndexRef,

                  {
                    phone,

                    orderID,

                    createdAt:
                      timestamp,

                    updatedAt:
                      timestamp,
                  }
                );
              }

              // =========================================
              // COUNTER
              //
              // New processing card:
              //
              // processing +1
              // all +1
              // =========================================

              tx.set(
                counterRef,

                {
                  processing:
                    safeNumber(
                      counterData
                        .processing
                    ) + 1,

                  incomplete:
                    safeNumber(
                      counterData
                        .incomplete
                    ),

                  goodButNoResponse:
                    safeNumber(
                      counterData
                        .goodButNoResponse
                    ),

                  noResponse:
                    safeNumber(
                      counterData
                        .noResponse
                    ),

                  advancePayment:
                    safeNumber(
                      counterData
                        .advancePayment
                    ),

                  onHold:
                    safeNumber(
                      counterData
                        .onHold
                    ),

                  approved:
                    safeNumber(
                      counterData
                        .approved
                    ),

                  cancel:
                    safeNumber(
                      counterData
                        .cancel
                    ),

                  webOrderList:
                    safeNumber(
                      counterData
                        .webOrderList
                    ) + 1,

                  updatedAt:
                    timestamp,
                },

                {
                  merge:
                    true,
                }
              );

              return {
                type:
                  "new",

                orderID,

                phone,
              };
            }
          );

        // ===============================================
        // HANDLE TRANSACTION RESULT
        // ===============================================

        if (
          transactionResult.type ===
          "new"
        ) {
          console.log(
            `New Order #${orderID} saved`
          );

          savedOrders.push({
            orderID,

            phone,

            ratio:
              ratioData,
          });
        }

        if (
          transactionResult.type ===
          "phone-merged"
        ) {
          console.log(
            `Order #${orderID} merged into #${transactionResult.mergedInto}`
          );

          mergedOrders.push({
            orderID,

            mergedInto:
              transactionResult
                .mergedInto,

            phone,

            ratio:
              ratioData,
          });
        }

        if (
          transactionResult.type ===
          "duplicate-id"
        ) {
          console.log(
            `Duplicate Order ID #${orderID}`
          );

          duplicateOrders.push({
            orderID,
          });
        }

        // ===============================================
        // UPDATE WOOCOMMERCE STATUS
        //
        // Firebase success / duplicate হওয়ার পরে
        //
        // processing -> on-hold
        // ===============================================

        const statusResponse =
          await fetch(
            `${wooUrl}/wp-json/wc/v3/orders/${orderID}`,
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

        const statusData =
          await statusResponse.json();

        if (
          !statusResponse.ok
        ) {
          console.error(
            `WooCommerce status update failed #${orderID}:`,
            statusData
          );

          failedOrders.push({
            orderID,

            firebaseProcessed:
              true,

            wooStatusUpdated:
              false,

            error:
              statusData,
          });

          continue;
        }

        console.log(
          `WooCommerce #${orderID}: processing -> ${statusData.status}`
        );
      } catch (
        error: any
      ) {
        console.error(
          `Order #${orderID} ERROR:`,
          error
        );

        failedOrders.push({
          orderID,

          error:
            error?.message ||
            String(error),
        });
      }
    }

    // =================================================
    // FINAL RESPONSE
    // =================================================

    return res.status(200).json({
      success: true,

      fetched:
        orders.length,

      newOrders:
        savedOrders.length,

      mergedOrdersCount:
        mergedOrders.length,

      duplicateIDs:
        duplicateOrders.length,

      failed:
        failedOrders.length,

      savedOrders,

      mergedOrders,

      duplicateOrders,

      failedOrders,
    });
  } catch (
    error: any
  ) {
    console.error(
      "ORDER FETCH ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error?.message ||
        "Failed to fetch orders",
    });
  }
}