import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

export async function GET() {
  try {
    const alumni = await getCollection('alumni_directory');
    const students = await getCollection('students');
    const jobs = await getCollection('jobs');
    const users = await getCollection('user');
    const notices = await getCollection('notices');
    const events = await getCollection('events');

    const [totalAlumni, totalStudents, totalJobs, totalUsers, totalNotices, totalEvents] = await Promise.all([
      alumni.countDocuments(),
      students.countDocuments(),
      jobs.countDocuments(),
      users.countDocuments(),
      notices.countDocuments(),
      events.countDocuments(),
    ]);

    const recentAlumni = await alumni.find({}, { projection: { fullName: 1, email: 1, createdAt: 1 } })
      .sort({ createdAt: -1 }).limit(5).toArray();

    const recentStudents = await students.find({}, { projection: { fullName: 1, email: 1, createdAt: 1 } })
      .sort({ createdAt: -1 }).limit(5).toArray();

    const recentUsers = await users.find({}, { projection: { name: 1, email: 1, role: 1, createdAt: 1 } })
      .sort({ createdAt: -1 }).limit(5).toArray();

    const roleBreakdown = await users.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]).toArray();

    return NextResponse.json({
      stats: {
        totalAlumni,
        totalStudents,
        totalJobs,
        totalUsers,
        totalNotices,
        totalEvents,
        roles: roleBreakdown.reduce((acc, r) => { acc[r._id || 'Unknown'] = r.count; return acc; }, {}),
      },
      recentActivity: [
        ...recentAlumni.map(a => ({ type: 'alumni', name: a.fullName, email: a.email, date: a.createdAt })),
        ...recentStudents.map(s => ({ type: 'student', name: s.fullName, email: s.email, date: s.createdAt })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10),
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
