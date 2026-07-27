import { NextResponse } from 'next/server';
import { getCollection, serializeId, ObjectId } from '@/lib/mongodb';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid job ID" }, { status: 400 });
    }

    const collection = await getCollection('jobs');
    const job = await collection.findOne({ _id: new ObjectId(id) });
    if (!job) {
      return NextResponse.json({ success: false, message: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, job: serializeId(job) });
  } catch (error) {
    console.error("Error fetching job:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid job ID" }, { status: 400 });
    }

    const updateData = await request.json();
    delete updateData._id;
    delete updateData.createdAt;
    updateData.updatedAt = new Date().toISOString();

    if (updateData.salaryRange) {
      updateData.salary = updateData.salary || updateData.salaryRange;
      delete updateData.salaryRange;
    }

    const collection = await getCollection('jobs');
    const updatedResult = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    const jobData = updatedResult?.value || updatedResult;
    if (!jobData) {
      return NextResponse.json({ success: false, message: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Job updated successfully", job: serializeId(jobData) });
  } catch (error) {
    console.error("Error updating job:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const collection = await getCollection('jobs');
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, message: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Job deleted successfully" });
  } catch (error) {
    console.error("Error deleting job:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
