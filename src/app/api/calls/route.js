import { NextResponse } from "next/server";
import { getCollection, ObjectId } from "@/lib/mongodb";

// POST /api/calls - Initiate a call
export async function POST(request) {
  try {
    const body = await request.json();
    const { callerEmail, calleeEmail, callType } = body;

    if (!callerEmail || !calleeEmail) {
      return NextResponse.json({ message: "Missing emails" }, { status: 400 });
    }

    const calls = await getCollection("calls");

    // Check if callee is already in a call
    const existingCall = await calls.findOne({
      $or: [
        { calleeEmail, status: { $in: ["ringing", "connecting", "connected"] } },
        { callerEmail: calleeEmail, status: { $in: ["ringing", "connecting", "connected"] } },
        { callerEmail: calleeEmail, callerEmail: calleeEmail, status: { $in: ["ringing", "connecting", "connected"] } },
      ],
    });

    if (existingCall) {
      return NextResponse.json({ message: "User is already in a call" }, { status: 409 });
    }

    // Check if caller is already in a call
    const callerInCall = await calls.findOne({
      $or: [
        { callerEmail, status: { $in: ["ringing", "connecting", "connected"] } },
        { calleeEmail: callerEmail, status: { $in: ["ringing", "connecting", "connected"] } },
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

    // Create notifications for BOTH users
    try {
      const notifications = await getCollection("notifications");

      // Notification for callee (incoming call)
      await notifications.insertOne({
        recipientEmail: calleeEmail,
        type: "call_incoming",
        actorEmail: callerEmail,
        actorName: callerEmail.split("@")[0],
        callType: callType || "video",
        message: `${callerEmail.split("@")[0]} is calling you (${callType || "video"})`,
        callId: result.insertedId.toString(),
        link: `/dashboard/alumni/text?chatWith=${callerEmail}`,
        read: false,
        callStatus: "ringing",
        createdAt: new Date(),
      });

      // Notification for caller (outgoing call)
      await notifications.insertOne({
        recipientEmail: callerEmail,
        type: "call_outgoing",
        actorEmail: calleeEmail,
        actorName: calleeEmail.split("@")[0],
        callType: callType || "video",
        message: `Calling ${calleeEmail.split("@")[0]} (${callType || "video"})`,
        callId: result.insertedId.toString(),
        link: `/dashboard/alumni/text?chatWith=${calleeEmail}`,
        read: true,
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

// GET /api/calls?email=xxx - Poll for incoming calls
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ message: "Email required" }, { status: 400 });
    }

    const calls = await getCollection("calls");

    // Find active call where this user is the callee
    const incomingCall = await calls.findOne({
      calleeEmail: email,
      status: "ringing",
    });

    // Find any active call involving this user
    const activeCall = await calls.findOne({
      $or: [
        { callerEmail: email, status: { $in: ["ringing", "connecting", "connected"] } },
        { calleeEmail: email, status: { $in: ["ringing", "connecting", "connected"] } },
      ],
    });

    // Check for call answer (if user is caller and callee answered)
    const answeredCall = await calls.findOne({
      callerEmail: email,
      status: "connecting",
    });

    // Check for call ended or declined
    const endedCall = await calls.findOne({
      $or: [
        { callerEmail: email, status: { $in: ["ended", "declined", "missed"] } },
        { calleeEmail: email, status: { $in: ["ended", "declined", "missed"] } },
      ],
      updatedAt: { $gte: new Date(Date.now() - 10000) },
    });

    return NextResponse.json({
      incomingCall: incomingCall
        ? {
            ...incomingCall,
            _id: incomingCall._id.toString(),
          }
        : null,
      activeCall: activeCall
        ? {
            ...activeCall,
            _id: activeCall._id.toString(),
          }
        : null,
      answeredCall: answeredCall
        ? {
            ...answeredCall,
            _id: answeredCall._id.toString(),
          }
        : null,
      endedCall: endedCall
        ? {
            ...endedCall,
            _id: endedCall._id.toString(),
          }
        : null,
    });
  } catch (error) {
    console.error("Poll calls error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
