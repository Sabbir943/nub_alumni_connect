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

    const collection = await getCollection('students');
    const filter = {};

    if (search) {
      const regex = { $options: 'i' };
      filter.$or = [
        { fullName: { $regex: search, ...regex } },
        { studentId: { $regex: search, ...regex } },
        { skills: { $regex: search, ...regex } },
        { department: { $regex: search, ...regex } },
        { bio: { $regex: search, ...regex } }
      ];
    }

    if (degree) {
      filter.department = { $regex: degree, $options: 'i' };
    }

    if (graduationYear) {
      filter.$or = [
        ...(filter.$or || []),
        { batch: { $regex: graduationYear, $options: 'i' } },
        { semester: { $regex: graduationYear, $options: 'i' } }
      ];
    }

    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    let sort = {};
    switch (sortBy) {
      case 'oldest': sort = { createdAt: 1 }; break;
      case 'name_asc': sort = { fullName: 1 }; break;
      case 'name_desc': sort = { fullName: -1 }; break;
      case 'year_asc': sort = { semester: 1 }; break;
      case 'year_desc': sort = { semester: -1 }; break;
      default: sort = { createdAt: -1 };
    }

    const total = await collection.countDocuments(filter);
    const profiles = await collection
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .toArray();

    const totalPages = Math.ceil(total / limitNum);

    return NextResponse.json({
      profiles,
      pagination: {
        total,
        totalPages,
        currentPage: pageNum,
        pageSize: limitNum,
        hasNext: pageNum < totalPages,
        hasPrevious: pageNum > 1
      }
    });
  } catch (error) {
    console.error("Error fetching student directory:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
