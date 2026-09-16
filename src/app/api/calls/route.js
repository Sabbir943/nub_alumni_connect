import { NextResponse } from "next/server";
import { getCollection, ObjectId } from "@/lib/mongodb";
import { requireSession } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const { error, session } = await requireSession(request);
    if (error) return error;

    const body = await request.json();
    const { calleeEmail, callType } = body;
    const callerEmail = session.user.email;

    if (!calleeEmail) {
      return NextResponse.json({ message: "calleeEmail is required" }, { status: 400 });
    }

    const calls = await getCollection("calls");

    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    await calls.updateMany(
      { status: { $in: ["ringing", "connecting"] }, updatedAt: { $lt: twoMinutesAgo } },
      { $set: { status: "ended", updatedAt: new Date() } }
    );

    const activeCallCheck = await calls.findOne({
      $or: [
        { calleeEmail, status: { $in: ["ringing", "connecting", "connected"] }, updatedAt: { $gte: twoMinutesAgo } },
        { callerEmail: calleeEmail, status: { $in: ["ringing", "connecting", "connected"] }, updatedAt: { $gte: twoMinutesAgo } },
      ],
    });

    if (activeCallCheck) {
      return NextResponse.json({ message: "User is already in a call" }, { status: 409 });
    }

    const callerInCall = await calls.findOne({
      $or: [
        { callerEmail, status: { $in: ["ringing", "connecting", "connected"] }, updatedAt: { $gte: twoMinutesAgo } },
        { calleeEmail: callerEmail, status: { $in: ["ringing", "connecting", "connected"] }, updatedAt: { $gte: twoMinutesAgo } },
      ],
    });

    if (callerInCall) {
      return NextResponse.json({ message: "You are already in a call" }, { status: 409 });
    }

    const call = {
      callerEmail,
      calleeEmail,
      callType: callType || "video",
      status: "ringing",
      offer: null,
      answer: null,
      iceCandidates: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await calls.insertOne(call);

    try {
      const notifications = await getCollection("notifications");
      await notifications.insertOne({
        recipientEmail: calleeEmail,
        type: "call_incoming",
        actorEmail: callerEmail,
        actorName: session.user.name || callerEmail.split("@")[0],
        callType: callType || "video",
        message: `${session.user.name || callerEmail.split("@")[0]} is calling you (${callType || "video"})`,
        callId: result.insertedId.toString(),
        link: `/dashboard`,
        read: false,
        callStatus: "ringing",
        createdAt: new Date(),
      });
    } catch (e) {
      console.error("Call notification error:", e.message);
    }

    return NextResponse.json({
      success: true,
      callId: result.insertedId.toString(),
    });
  } catch (error) {
    console.error("Create call error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { error, session } = await requireSession(request);
    if (error) return error;

    const email = session.user.email;

    const calls = await getCollection("calls");

    const incomingCall = await calls.findOne({
      calleeEmail: email,
      status: "ringing",
    });

    const activeCall = await calls.findOne({
      $or: [
        { callerEmail: email, status: { $in: ["ringing", "connecting", "connected"] } },
        { calleeEmail: email, status: { $in: ["ringing", "connecting", "connected"] } },
      ],
    });

    const answeredCall = await calls.findOne({
      callerEmail: email,
      status: "connecting",
    });

    const endedCall = await calls.findOne({
      $or: [
        { callerEmail: email, status: { $in: ["ended", "declined", "missed"] } },
        { calleeEmail: email, status: { $in: ["ended", "declined", "missed"] } },
      ],
      updatedAt: { $gte: new Date(Date.now() - 10000) },
    });

    return NextResponse.json({
      incomingCall: incomingCall ? { ...incomingCall, _id: incomingCall._id.toString() } : null,
      activeCall: activeCall ? { ...activeCall, _id: activeCall._id.toString() } : null,
      answeredCall: answeredCall ? { ...answeredCall, _id: answeredCall._id.toString() } : null,
      endedCall: endedCall ? { ...endedCall, _id: endedCall._id.toString() } : null,
    });
  } catch (error) {
    console.error("Poll calls error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
