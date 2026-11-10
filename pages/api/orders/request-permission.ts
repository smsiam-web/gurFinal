import type {
  NextApiRequest,
  NextApiResponse,
} from "next";
import { db, timestamp } from "@/app/utils/firebase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
    });
  }

  try {
    const {
      orderID,
      requestedByUid,
      requestedByName,
    } = req.body;

    const ref = db
      .collection("webOrdersGur")
      .doc(String(orderID))
      .collection(
        "permissionRequests"
      )
      .doc(requestedByUid);

    await ref.set(
      {
        requestedByUid,
        requestedByName,

        status: "pending",

        requestedAt:
         timestamp,
      },
      {
        merge: true,
      }
    );

    return res.status(200).json({
      success: true,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Request failed",
    });
  }
}