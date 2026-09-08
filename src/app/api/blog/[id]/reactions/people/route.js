import { NextResponse } from 'next/server';
import { getCollection, ObjectId } from '@/lib/mongodb';

const VALID_TYPES = ['like', 'dislike', 'love', 'haha', 'wow', 'sad', 'angry'];

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid post ID.' }, { status: 400 });
    }

    const posts = await getCollection('blog_posts');
    const post = await posts.findOne({ _id: new ObjectId(id) }, { projection: { reactions: 1 } });
    if (!post) {
      return NextResponse.json({ success: false, message: 'Post not found.' }, { status: 404 });
    }

    const reactions = post.reactions || {};
    const seen = new Set();
    const row = [];
    for (const [type, emails] of Object.entries(reactions)) {
      if (!VALID_TYPES.includes(type) || !Array.isArray(emails)) continue;
      for (const email of emails) {
        if (!seen.has(email)) {
          seen.add(email);
          row.push({ email, type });
        }
      }
    }

    const emails = [...seen];
    const nameMap = {};
    const avatarMap = {};
    const roleMap = {};

    if (emails.length > 0) {
      const users = await getCollection('user');
      const userDocs = await users
        .find({ email: { $in: emails } }, { projection: { email: 1, name: 1, image: 1, role: 1 } })
        .toArray();
      for (const u of userDocs) {
        nameMap[u.email.toLowerCase()] = u.name || '';
        avatarMap[u.email.toLowerCase()] = u.image || '';
        roleMap[u.email.toLowerCase()] = u.role || '';
      }

      const missing = emails.filter((e) => !nameMap[e.toLowerCase()]);
      if (missing.length > 0) {
        const students = await getCollection('students');
        const studentDocs = await students
          .find({ email: { $in: missing } }, { projection: { email: 1, fullName: 1, profilePictureUrl: 1 } })
          .toArray();
        for (const s of studentDocs) {
          nameMap[s.email.toLowerCase()] = s.fullName || '';
          avatarMap[s.email.toLowerCase()] = s.profilePictureUrl || '';
        }

        const stillMissing = missing.filter((e) => !nameMap[e.toLowerCase()]);
        if (stillMissing.length > 0) {
          const alumni = await getCollection('alumni_directory');
          const alumniDocs = await alumni
            .find({ email: { $in: stillMissing } }, { projection: { email: 1, name: 1, profilePictureUrl: 1 } })
            .toArray();
          for (const a of alumniDocs) {
            nameMap[a.email.toLowerCase()] = a.name || '';
            avatarMap[a.email.toLowerCase()] = a.profilePictureUrl || '';
          }
        }
      }
    }

    const people = row.map(({ email, type }) => {
      const key = email.toLowerCase();
      return {
        email,
        type,
        name: nameMap[key] || email.split('@')[0],
        avatar: avatarMap[key] || '',
        role: roleMap[key] || '',
      };
    });

    return NextResponse.json({ success: true, people });
  } catch (error) {
    console.error('Error fetching reaction people:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}