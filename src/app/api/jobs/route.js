import { NextResponse } from 'next/server';
import { getCollection, serializeId } from '@/lib/mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const jobType = searchParams.get('jobType') || '';
    const workplaceType = searchParams.get('workplaceType') || '';
    const limit = Math.max(1, Math.min(200, parseInt(searchParams.get('limit') || '50')));
    const postedBy = searchParams.get('postedBy') || '';

    const collection = await getCollection('jobs');
    const filter = {};

    if (search) {
      const regex = { $options: 'i' };
      filter.$or = [
        { title: { $regex: search, ...regex } },
        { company: { $regex: search, ...regex } },
        { location: { $regex: search, ...regex } },
        { description: { $regex: search, ...regex } }
      ];
    }

    if (jobType) filter.jobType = jobType;
    if (workplaceType) filter.workplaceType = workplaceType;
    if (postedBy) filter.postedBy = postedBy;

    const jobs = await collection
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json({ success: true, jobs: serializeId(jobs), total: jobs.length });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      title, company, location, jobType, workplaceType,
      salaryRange, salary, applicationDeadline, applicationUrlOrEmail,
      description, requirements, skills, postedBy
    } = body;

    if (!title || !company) {
      return NextResponse.json({ success: false, message: "Title and Company are required." }, { status: 400 });
    }

    const collection = await getCollection('jobs');
    const newJob = {
      title, company,
      location: location || '',
      jobType: jobType || 'Full-time',
      workplaceType: workplaceType || 'On-site',
      salary: salary || salaryRange || '',
      applicationDeadline: applicationDeadline || '',
      applicationUrlOrEmail: applicationUrlOrEmail || '',
      description: description || '',
      requirements: requirements || '',
      skills: skills || [],
      postedBy: postedBy || 'Anonymous',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await collection.insertOne(newJob);
    return NextResponse.json({
      success: true,
      message: "Job posted successfully",
      job: { ...newJob, _id: result.insertedId.toString() }
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
