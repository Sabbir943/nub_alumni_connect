import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const degree = searchParams.get('degree') || '';
    const graduationYear = searchParams.get('graduationYear') || '';
    const location = searchParams.get('location') || '';
    const sortBy = searchParams.get('sortBy') || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get('limit') || '6')));

    const pageNum = Math.max(1, page);
    const limitNum = limit;
    const skip = (pageNum - 1) * limitNum;

    const collection = await getCollection('alumni_directory');
    const filter = {};

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { skills: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { organization: { $regex: search, $options: 'i' } }
      ];
    }
    if (degree) filter.department = { $regex: degree, $options: 'i' };
    if (graduationYear) filter.graduationYear = { $regex: graduationYear, $options: 'i' };
    if (location) filter.location = { $regex: location, $options: 'i' };

    let sort = {};
    switch (sortBy) {
      case 'oldest': sort = { createdAt: 1 }; break;
      case 'name_asc': sort = { fullName: 1 }; break;
      case 'name_desc': sort = { fullName: -1 }; break;
      case 'year_asc': sort = { graduationYear: 1 }; break;
      case 'year_desc': sort = { graduationYear: -1 }; break;
      default: sort = { createdAt: -1 };
    }

    const total = await collection.countDocuments(filter);
    const profiles = await collection.find(filter).sort(sort).skip(skip).limit(limitNum).toArray();

    return NextResponse.json({
      profiles,
      pagination: {
        total,
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
        pageSize: limitNum,
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrevious: pageNum > 1
      }
    });
  } catch (error) {
    console.error("Error fetching alumni directory:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { fullName, email } = body;
    if (!email || !fullName) {
      return NextResponse.json({ message: "Full Name and Email are required." }, { status: 400 });
    }

    const collection = await getCollection('alumni_directory');
    const existing = await collection.findOne({ email });
    if (existing) {
      return NextResponse.json({ message: "Profile already exists. Use PATCH to update." }, { status: 409 });
    }

    const newProfile = { ...body, createdAt: new Date(), updatedAt: new Date() };
    const result = await collection.insertOne(newProfile);
    return NextResponse.json({
      message: "Alumni profile created",
      profileId: result.insertedId,
      profile: newProfile
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating alumni profile:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
