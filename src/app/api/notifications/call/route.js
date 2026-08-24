import { NextResponse } from "next/server";
import { getCollection, ObjectId } from "@/lib/mongodb";

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, notificationId, recipientEmail, callerEmail, callerName, callType, message } = body;

    const notifications = await getCollection("notifications");

    if (action === "create") {
      const db = await (await import("@/lib/mongodb")).getCollection("students");
      const alumniCol = await (await import("@/lib/mongodb")).getCollection("alumni_directory");
      const recipientStudent = await db.findOne({ email: recipientEmail });
      const messagingPath = recipientStudent
        ? "/dashboard/students/text-box"
        : "/dashboard/alumni/text";

      const doc = {
        recipientEmail,
        type: "call_incoming",
        actorEmail: callerEmail,
        actorName: callerName,
        callType: callType || "video",
        message: message || `${callerName} is calling you (${callType || "video"})`,
        link: `${messagingPath}?chatWith=${callerEmail}`,
        read: false,
        callStatus: "ringing",
        createdAt: new Date(),
      };

      const result = await notifications.insertOne(doc);
      return NextResponse.json({ success: true, notificationId: result.insertedId.toString() });
    }

    if (action === "update-status" && notificationId) {
      const updateFields = {};
      if (message) updateFields.message = message;
      if (body.callStatus) updateFields.callStatus = body.callStatus;
      if (body.link) updateFields.link = body.link;
      if (body.read !== undefined) updateFields.read = body.read;

      await notifications.updateOne(
        { _id: new ObjectId(notificationId) },
        { $set: updateFields }
      );
      return NextResponse.json({ success: true });
    }

    if (action === "mark-answered" && notificationId) {
      await notifications.updateOne(
        { _id: new ObjectId(notificationId) },
        { $set: { callStatus: "answered", read: true } }
      );
      return NextResponse.json({ success: true });
    }

    if (action === "mark-missed" && notificationId) {
      await notifications.updateOne(
        { _id: new ObjectId(notificationId) },
        { $set: { callStatus: "missed", message: message || "Missed call" } }
      );
      return NextResponse.json({ success: true });
    }

    if (action === "mark-ended" && notificationId) {
      await notifications.updateOne(
        { _id: new ObjectId(notificationId) },
        { $set: { callStatus: "ended", read: true } }
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Call notification error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
