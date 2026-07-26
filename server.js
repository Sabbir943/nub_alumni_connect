const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Nub_alumni_connect:ssCAhZQN7ow18mER@cluster0.pf04c6g.mongodb.net/?appName=Cluster0';
const DB_NAME = 'nub_alumni';

let studentsCollection;

async function connectDB() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    studentsCollection = db.collection('students');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// ==================== STUDENT DIRECTORY ROUTES ====================

// GET /api/students/check/:email (Check if profile exists)
app.get('/api/students/check/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const profile = await studentsCollection.findOne({ email });
    res.json({ exists: !!profile, profile: profile || null });
  } catch (error) {
    console.error("Error checking student profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/students (Create Student Profile)
app.post('/api/students', async (req, res) => {
  try {
    const {
      fullName,
      email,
      studentId,
      department,
      semester,
      batch,
      phone,
      profilePictureUrl,
      githubUrl,
      linkedinUrl,
      skills,
      bio,
      location
    } = req.body;

    if (!email || !fullName || !studentId) {
      return res.status(400).json({ message: "Full Name, Email, and Student ID are required." });
    }

    const existingEmail = await studentsCollection.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ message: "Profile already exists. Use PATCH to update." });
    }

    const existingId = await studentsCollection.findOne({ studentId });
    if (existingId) {
      return res.status(409).json({ message: "Student ID is already registered." });
    }

    const newStudent = {
      fullName,
      email,
      studentId,
      department: department || "",
      semester: semester || "",
      batch: batch || "",
      phone: phone || "",
      profilePictureUrl: profilePictureUrl || "",
      githubUrl: githubUrl || "",
      linkedinUrl: linkedinUrl || "",
      skills: skills || "",
      bio: bio || "",
      location: location || "",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await studentsCollection.insertOne(newStudent);
    res.status(201).json({
      message: "Student profile created successfully",
      profileId: result.insertedId,
      profile: newStudent
    });
  } catch (error) {
    console.error("Error creating student profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/students/:email (Get Single Student Profile)
app.get('/api/students/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const profile = await studentsCollection.findOne({ email });

    if (!profile) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    res.json({ profile });
  } catch (error) {
    console.error("Error fetching student profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PATCH /api/students/:email (Update Student Profile)
app.patch('/api/students/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const updateData = req.body;

    const existingProfile = await studentsCollection.findOne({ email });
    if (!existingProfile) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    if (updateData.studentId && updateData.studentId !== existingProfile.studentId) {
      const studentIdTaken = await studentsCollection.findOne({
        studentId: updateData.studentId,
        email: { $ne: email }
      });
      if (studentIdTaken) {
        return res.status(409).json({ message: "Student ID is already in use by another student." });
      }
    }

    delete updateData.email;
    delete updateData._id;
    delete updateData.createdAt;

    updateData.updatedAt = new Date();

    const result = await studentsCollection.findOneAndUpdate(
      { email },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    res.json({
      message: "Student profile updated successfully",
      profile: result
    });
  } catch (error) {
    console.error("Error updating student profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/student-directory (Browse with filtering, search, pagination)
app.get('/api/student-directory', async (req, res) => {
  try {
    const {
      search = '',
      degree = '',
      graduationYear = '',
      location = '',
      sortBy = 'newest',
      page = '1',
      limit = '6'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(50, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

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

    const total = await studentsCollection.countDocuments(filter);
    const profiles = await studentsCollection
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .toArray();

    const totalPages = Math.ceil(total / limitNum);

    res.json({
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
    res.status(500).json({ message: "Internal server error" });
  }
});

// ==================== FOLLOW ROUTES ====================

let followsCollection;

async function ensureFollowsCollection() {
  if (!followsCollection) {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    followsCollection = db.collection('follows');
  }
}

app.get('/api/follow/status', async (req, res) => {
  try {
    await ensureFollowsCollection();
    const { followerEmail, targetEmail } = req.query;
    const follow = await followsCollection.findOne({ followerEmail, targetEmail });
    res.json({ isFollowing: !!follow });
  } catch (error) {
    console.error("Error checking follow status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post('/api/follow', async (req, res) => {
  try {
    await ensureFollowsCollection();
    const { followerEmail, targetEmail } = req.body;
    if (!followerEmail || !targetEmail) {
      return res.status(400).json({ message: "followerEmail and targetEmail are required" });
    }
    const existing = await followsCollection.findOne({ followerEmail, targetEmail });
    if (existing) {
      return res.status(409).json({ message: "Already following" });
    }
    await followsCollection.insertOne({ followerEmail, targetEmail, createdAt: new Date() });
    res.status(201).json({ message: "Followed successfully" });
  } catch (error) {
    console.error("Error following:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.delete('/api/follow', async (req, res) => {
  try {
    await ensureFollowsCollection();
    const { followerEmail, targetEmail } = req.body;
    await followsCollection.deleteOne({ followerEmail, targetEmail });
    res.json({ message: "Unfollowed successfully" });
  } catch (error) {
    console.error("Error unfollowing:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ==================== START SERVER ====================

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});
