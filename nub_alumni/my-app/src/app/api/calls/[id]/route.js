import { NextResponse } from "next/server";
import { getCollection, ObjectId } from "@/lib/mongodb";

// PATCH /api/calls/[id] - Update call status (answer, decline, end, signaling)
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, email, offer, answer, iceCandidate, status } = body;

    const calls = await getCollection("calls");
    let callId;
    try {
      callId = new ObjectId(id);
    } catch {
      return NextResponse.json({ message: "Invalid call ID" }, { status: 400 });
    }

    const call = await calls.findOne({ _id: callId });
    if (!call) {
      return NextResponse.json({ message: "Call not found" }, { status: 404 });
    }

    if (action === "answer") {
      await calls.updateOne(
        { _id: callId },
        { $set: { status: "connecting", updatedAt: new Date() } }
      );

      // Update ALL notifications for this call
      try {
        const notifications = await getCollection("notifications");
        await notifications.updateMany(
          { callId: id },
          { $set: { callStatus: "answered", read: true } }
        );
        // Update caller notification message
        await notifications.updateMany(
          { callId: id, type: "call_outgoing" },
          { $set: { message: `Call answered by ${call.calleeEmail.split("@")[0]}` } }
        );
      } catch (e) {}

      return NextResponse.json({ success: true, status: "connecting" });
    }

    if (action === "decline") {
      await calls.updateOne(
        { _id: callId },
        { $set: { status: "declined", updatedAt: new Date() } }
      );

      // Update ALL notifications for this call
      try {
        const notifications = await getCollection("notifications");
        await notifications.updateMany(
          { callId: id },
          {
            $set: {
              callStatus: "declined",
              message: `Call declined by ${email.split("@")[0]}`,
              read: true,
            },
          }
        );
      } catch (e) {}

      return NextResponse.json({ success: true, status: "declined" });
    }

    if (action === "end") {
      // Calculate call duration
      const now = new Date();
      const duration = Math.floor((now - call.createdAt) / 1000);
      const mins = Math.floor(duration / 60);
      const secs = duration % 60;
      const durationStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

      await calls.updateOne(
        { _id: callId },
        { $set: { status: "ended", duration, updatedAt: now } }
      );

      // Update ALL notifications for this call with duration
      try {
        const notifications = await getCollection("notifications");
        const statusText = call.status === "connected" ? `Call ended - ${durationStr}` : "Call ended";

        await notifications.updateMany(
          { callId: id, type: "call_incoming" },
          {
            $set: {
              callStatus: "ended",
              message: `${statusText} with ${call.callerEmail.split("@")[0]}`,
              callDuration: durationStr,
              read: true,
            },
          }
        );
        await notifications.updateMany(
          { callId: id, type: "call_outgoing" },
          {
            $set: {
              callStatus: "ended",
              message: `${statusText} with ${call.calleeEmail.split("@")[0]}`,
              callDuration: durationStr,
              read: true,
            },
          }
        );
      } catch (e) {}

      return NextResponse.json({ success: true, status: "ended", duration: durationStr });
    }

    if (action === "offer" && offer) {
      await calls.updateOne(
        { _id: callId },
        { $set: { offer, updatedAt: new Date() } }
      );
      return NextResponse.json({ success: true });
    }

    if (action === "answer-sdp" && answer) {
      await calls.updateOne(
        { _id: callId },
        { $set: { answer, updatedAt: new Date() } }
      );
      return NextResponse.json({ success: true });
    }

    if (action === "ice-candidate" && iceCandidate) {
      await calls.updateOne(
        { _id: callId },
        {
          $push: { iceCandidates: { email, candidate: iceCandidate } },
          $set: { updatedAt: new Date() },
        }
      );
      return NextResponse.json({ success: true });
    }

    if (action === "signal") {
      const updateFields = { updatedAt: new Date() };
      if (offer) updateFields.offer = offer;
      if (answer) {
        updateFields.answer = answer;
        updateFields.status = "connected";
      }
      if (status) updateFields.status = status;

      if (iceCandidate) {
        await calls.updateOne(
          { _id: callId },
          {
            $push: { iceCandidates: { email, candidate: iceCandidate } },
            $set: updateFields,
          }
        );
      } else {
        await calls.updateOne({ _id: callId }, { $set: updateFields });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Update call error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// GET /api/calls/[id] - Get call details (for signaling)
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    const calls = await getCollection("calls");
    let callId;
    try {
      callId = new ObjectId(id);
    } catch {
      return NextResponse.json({ message: "Invalid call ID" }, { status: 400 });
    }

    const call = await calls.findOne({ _id: callId });
    if (!call) {
      return NextResponse.json({ message: "Call not found" }, { status: 404 });
    }

    // Filter ICE candidates to only show other party's candidates
    const filteredCandidates = (call.iceCandidates || []).filter(
      (c) => c.email !== email
    );

    return NextResponse.json({
      call: {
        ...call,
        _id: call._id.toString(),
        iceCandidates: filteredCandidates,
      },
    });
  } catch (error) {
    console.error("Get call error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
