import type {
  NextApiRequest,
  NextApiResponse,
} from "next";

import {
  db,
  timestamp,
} from "@/app/utils/firebase";

// =====================================================
// INTERNAL STATUS -> FIREBASE COLLECTION
// =====================================================
//
// আপনার actual collection name অনুযায়ী এখানে রাখবেন
//

const STATUS_COLLECTIONS: Record<string, string> = {
  processing: "processing",

  incomplete: "incomplete",

  goodButNoResponse:
    "goodButNoResponse",

  noResponse:
    "noResponse",

  advancePayment:
    "advancePayment",

  onHold:
    "onHold",

  approved:
    "approved",

  delivery:
    "approved",

  cancel:
    "cancel",
};

// =====================================================
// NORMALIZE STATUS
// =====================================================

function normalizeStatus(
  status: string = ""
) {
  const value =
    String(status).trim();

  // WooCommerce style
  if (value === "on-hold") {
    return "onHold";
  }

  // যদি কোথাও delivery use করেন
  if (value === "delivery") {
    return "delivery";
  }

  return value;
}

// =====================================================
// MAIN HANDLER
// =====================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message:
        "Method not allowed",
    });
  }

  try {
    const {
      orderID,
      userUID,
      userName,
    } = req.body;

    // ===================================================
    // VALIDATION
    // ===================================================

    if (!orderID) {
      return res.status(400).json({
        success: false,
        message:
          "orderID is required",
      });
    }

    if (!userUID) {
      return res.status(400).json({
        success: false,
        message:
          "userUID is required",
      });
    }

    if (!userName) {
      return res.status(400).json({
        success: false,
        message:
          "userName is required",
      });
    }

    const id =
      String(orderID);

    console.log(
      "================================"
    );

    console.log(
      "LOCK REQUEST"
    );

    console.log(
      "Order ID:",
      id
    );

    console.log(
      "User UID:",
      userUID
    );

    console.log(
      "User Name:",
      userName
    );

    console.log(
      "================================"
    );

    // ===================================================
    // WEB ORDER LIST
    // ===================================================

    const webOrderRef =
      db
        .collection(
          "webOrderList"
        )
        .doc(id);

    const webOrderSnap =
      await webOrderRef.get();

    if (!webOrderSnap.exists) {
      return res.status(404).json({
        success: false,

        message:
          "Order not found in webOrderList",

        orderID:
          id,
      });
    }

    const webOrderData =
      webOrderSnap.data() ||
      {};

    // ===================================================
    // CURRENT INTERNAL STATUS
    //
    // priority:
    //
    // currentStatus
    // internalStatus
    // status
    // ===================================================

    const rawStatus =
      webOrderData.currentStatus ||
      webOrderData.internalStatus ||
      webOrderData.status ||
      "";

    const currentStatus =
      normalizeStatus(
        rawStatus
      );

    console.log(
      "Current Status:",
      currentStatus
    );

    // ===================================================
    // FIND STATUS COLLECTION
    // ===================================================

    const statusCollection =
      STATUS_COLLECTIONS[
        currentStatus
      ];

    if (!statusCollection) {
      return res.status(400).json({
        success: false,

        message:
          `Unknown order status: ${currentStatus}`,

        orderID:
          id,

        currentStatus,
      });
    }

    // ===================================================
    // HANDLE MERGED PROCESSING ORDER
    //
    // যদি same phone order merge হয়ে থাকে:
    //
    // webOrderList/302
    // mergedInto: "301"
    //
    // processing document হবে:
    // processing/301
    // ===================================================

    let statusDocumentID =
      id;

    if (
      currentStatus ===
        "processing" &&
      webOrderData.mergedInto
    ) {
      statusDocumentID =
        String(
          webOrderData.mergedInto
        );
    }

    // ===================================================
    // CURRENT STATUS DOCUMENT
    // ===================================================

    const statusOrderRef =
      db
        .collection(
          statusCollection
        )
        .doc(
          statusDocumentID
        );

    // ===================================================
    // TRANSACTION
    // ===================================================

    const result =
      await db.runTransaction(
        async (
          transaction
        ) => {
          // =============================================
          // ALL READS FIRST
          // =============================================

          const freshWebSnap =
            await transaction.get(
              webOrderRef
            );

          const freshStatusSnap =
            await transaction.get(
              statusOrderRef
            );

          // =============================================
          // WEB ORDER MISSING
          // =============================================

          if (
            !freshWebSnap.exists
          ) {
            throw new Error(
              "WEB_ORDER_NOT_FOUND"
            );
          }

          // =============================================
          // STATUS ORDER MISSING
          // =============================================

          if (
            !freshStatusSnap.exists
          ) {
            throw new Error(
              `STATUS_ORDER_NOT_FOUND:${statusCollection}/${statusDocumentID}`
            );
          }

          const freshWebData =
            freshWebSnap.data() ||
            {};

          const freshStatusData =
            freshStatusSnap.data() ||
            {};

          const webLock =
            freshWebData.lock ||
            {};

          const statusLock =
            freshStatusData.lock ||
            {};

          // =============================================
          // CHECK WEB ORDER LOCK
          // =============================================

          if (
            webLock.isLocked ===
              true &&
            webLock.lockedByUid &&
            webLock.lockedByUid !==
              userUID
          ) {
            return {
              success: false,

              locked: true,

              source:
                "webOrderList",

              lockedByUid:
                webLock
                  .lockedByUid,

              lockedByName:
                webLock
                  .lockedByName ||
                "Another user",
            };
          }

          // =============================================
          // CHECK STATUS COLLECTION LOCK
          // =============================================

          if (
            statusLock.isLocked ===
              true &&
            statusLock.lockedByUid &&
            statusLock.lockedByUid !==
              userUID
          ) {
            return {
              success: false,

              locked: true,

              source:
                statusCollection,

              lockedByUid:
                statusLock
                  .lockedByUid,

              lockedByName:
                statusLock
                  .lockedByName ||
                "Another user",
            };
          }

          // =============================================
          // SAME USER ALREADY OWNS BOTH
          // =============================================

          const webOwnedByUser =
            webLock.isLocked ===
              true &&
            webLock.lockedByUid ===
              userUID;

          const statusOwnedByUser =
            statusLock.isLocked ===
              true &&
            statusLock.lockedByUid ===
              userUID;

          if (
            webOwnedByUser &&
            statusOwnedByUser
          ) {
            return {
              success: true,

              alreadyOwned:
                true,

              locked:
                true,

              lockedByUid:
                userUID,

              lockedByName:
                userName,

              orderID:
                id,

              webOrderDocumentID:
                id,

              status:
                currentStatus,

              statusCollection,

              statusDocumentID,
            };
          }

          // =============================================
          // COMMON LOCK DATA
          // =============================================

          const lockData = {
            isLocked: true,

            lockedByUid:
              userUID,

            lockedByName:
              userName,

            lockedAt:
              timestamp,
          };

          // =============================================
          // LOCK WEB ORDER LIST
          // =============================================

          transaction.set(
            webOrderRef,

            {
              lock:
                lockData,
            },

            {
              merge: true,
            }
          );

          // =============================================
          // LOCK CURRENT STATUS COLLECTION
          // =============================================

          transaction.set(
            statusOrderRef,

            {
              lock:
                lockData,
            },

            {
              merge: true,
            }
          );

          // =============================================
          // SUCCESS
          // =============================================

          return {
            success: true,

            alreadyOwned:
              false,

            locked:
              true,

            lockedByUid:
              userUID,

            lockedByName:
              userName,

            orderID:
              id,

            webOrderDocumentID:
              id,

            status:
              currentStatus,

            statusCollection,

            statusDocumentID,
          };
        }
      );

    // ===================================================
    // ANOTHER USER LOCKED
    // ===================================================

    if (!result.success) {
      return res
        .status(409)
        .json(result);
    }

    // ===================================================
    // SUCCESS
    // ===================================================

    console.log(
      `Order #${id} locked successfully`
    );

    console.log(
      `webOrderList/${id}`
    );

    console.log(
      `${statusCollection}/${statusDocumentID}`
    );

    return res
      .status(200)
      .json(result);
  } catch (
    error: any
  ) {
    console.error(
      "ORDER LOCK ERROR:",
      error
    );

    const message =
      error?.message ||
      "Failed to lock order";

    // ===================================================
    // STATUS DOCUMENT MISSING
    // ===================================================

    if (
      message.startsWith(
        "STATUS_ORDER_NOT_FOUND:"
      )
    ) {
      return res
        .status(404)
        .json({
          success: false,

          message:
            "Order exists in webOrderList but current status collection document was not found.",

          detail:
            message.replace(
              "STATUS_ORDER_NOT_FOUND:",
              ""
            ),
        });
    }

    // ===================================================
    // WEB ORDER MISSING
    // ===================================================

    if (
      message ===
      "WEB_ORDER_NOT_FOUND"
    ) {
      return res
        .status(404)
        .json({
          success: false,

          message:
            "Order not found in webOrderList",
        });
    }

    return res
      .status(500)
      .json({
        success: false,

        message,
      });
  }
}