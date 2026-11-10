// pages/api/orders/unlock.ts

import type {
  NextApiRequest,
  NextApiResponse,
} from "next";

import {
  db,
  timestamp,
} from "@/app/utils/firebase";

// =====================================================
// STATUS -> COLLECTION
// =====================================================

const STATUS_COLLECTIONS: Record<string, string> = {
  processing: "processing",
  incomplete: "incomplete",
  goodButNoResponse: "goodButNoResponse",
  noResponse: "noResponse",
  advancePayment: "advancePayment",
  onHold: "onHold",
  approved: "approved",
  delivery: "approved",
  cancel: "cancel",
};

// =====================================================
// NORMALIZE STATUS
// =====================================================

function normalizeStatus(
  status: string = ""
) {
  const value =
    String(status).trim();

  if (value === "on-hold") {
    return "onHold";
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
      message: "Method not allowed",
    });
  }

  try {
    const {
      orderID,
      userUID,
    } = req.body;

    if (!orderID) {
      return res.status(400).json({
        success: false,
        message: "orderID is required",
      });
    }

    if (!userUID) {
      return res.status(400).json({
        success: false,
        message: "userUID is required",
      });
    }

    const id =
      String(orderID);

    // =================================================
    // WEB ORDER
    // =================================================

    const webOrderRef =
      db
        .collection("webOrderList")
        .doc(id);

    const webOrderSnap =
      await webOrderRef.get();

    if (!webOrderSnap.exists) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found in webOrderList",
      });
    }

    const webOrderData =
      webOrderSnap.data() || {};

    // =================================================
    // CURRENT STATUS
    // =================================================

    const rawStatus =
      webOrderData.currentStatus ||
      webOrderData.internalStatus ||
      webOrderData.status ||
      "";

    const currentStatus =
      normalizeStatus(
        rawStatus
      );

    const statusCollection =
      STATUS_COLLECTIONS[
        currentStatus
      ];

    if (!statusCollection) {
      return res.status(400).json({
        success: false,
        message:
          `Unknown status: ${currentStatus}`,
      });
    }

    // =================================================
    // MERGED PROCESSING SUPPORT
    // =================================================

    let statusDocumentID =
      id;

    if (
      currentStatus === "processing" &&
      webOrderData.mergedInto
    ) {
      statusDocumentID =
        String(
          webOrderData.mergedInto
        );
    }

    const statusOrderRef =
      db
        .collection(
          statusCollection
        )
        .doc(
          statusDocumentID
        );

    // =================================================
    // TRANSACTION
    // =================================================

    const result =
      await db.runTransaction(
        async (transaction) => {
          const [
            freshWebSnap,
            freshStatusSnap,
          ] = await Promise.all([
            transaction.get(
              webOrderRef
            ),

            transaction.get(
              statusOrderRef
            ),
          ]);

          if (
            !freshWebSnap.exists
          ) {
            throw new Error(
              "WEB_ORDER_NOT_FOUND"
            );
          }

          if (
            !freshStatusSnap.exists
          ) {
            throw new Error(
              "STATUS_ORDER_NOT_FOUND"
            );
          }

          const webData =
            freshWebSnap.data() ||
            {};

          const statusData =
            freshStatusSnap.data() ||
            {};

          const webLock =
            webData.lock || {};

          const statusLock =
            statusData.lock || {};

          // ===========================================
          // অন্য user-এর lock release করতে দিব না
          // ===========================================

          if (
            webLock.isLocked === true &&
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
                webLock.lockedByUid,
              lockedByName:
                webLock.lockedByName ||
                "Another user",
            };
          }

          if (
            statusLock.isLocked === true &&
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
                statusLock.lockedByUid,
              lockedByName:
                statusLock.lockedByName ||
                "Another user",
            };
          }

          // ===========================================
          // যদি already unlocked থাকে
          // ===========================================

          const webAlreadyUnlocked =
            webLock.isLocked !== true;

          const statusAlreadyUnlocked =
            statusLock.isLocked !== true;

          if (
            webAlreadyUnlocked &&
            statusAlreadyUnlocked
          ) {
            return {
              success: true,
              alreadyUnlocked: true,
              orderID: id,
              status:
                currentStatus,
              statusCollection,
              statusDocumentID,
            };
          }

          // ===========================================
          // UNLOCK DATA
          // ===========================================

          const unlockData = {
            isLocked: false,

            lockedByUid: "",

            lockedByName: "",

            lockedAt: null,

            unlockedAt:
              timestamp,

            unlockedByUid:
              userUID,
          };

          // ===========================================
          // WEB ORDER UNLOCK
          // ===========================================

          transaction.set(
            webOrderRef,
            {
              lock:
                unlockData,
            },
            {
              merge: true,
            }
          );

          // ===========================================
          // CURRENT STATUS ORDER UNLOCK
          // ===========================================

          transaction.set(
            statusOrderRef,
            {
              lock:
                unlockData,
            },
            {
              merge: true,
            }
          );

          return {
            success: true,

            alreadyUnlocked:
              false,

            orderID:
              id,

            status:
              currentStatus,

            statusCollection,

            statusDocumentID,
          };
        }
      );

    if (!result.success) {
      return res
        .status(409)
        .json(result);
    }

    return res
      .status(200)
      .json({
        ...result,

        message:
          result.alreadyUnlocked
            ? "Order already unlocked"
            : "Order unlocked successfully",
      });
  } catch (
    error: any
  ) {
    console.error(
      "ORDER UNLOCK ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error?.message ||
        "Failed to unlock order",
    });
  }
}