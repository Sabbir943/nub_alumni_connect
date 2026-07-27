const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Nub_alumni_connect:ssCAhZQN7ow18mER@cluster0.pf04c6g.mongodb.net/?appName=Cluster0';
const DB_NAME = process.env.DB_NAME || 'nub_alumni';

function serializeId(doc) {
  if (!doc) return doc;
  if (Array.isArray(doc)) return doc.map(serializeId);
  return { ...doc, _id: doc._id?.toString?.() || doc._id };
}

let studentsCollection;
let alumniCollection;
let jobsCollection;
let messagesCollection;

async function connectDB() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    studentsCollection = db.collection('students');
    alumniCollection = db.collection('alumni_directory');
    jobsCollection = db.collection('jobs');
    messagesCollection = db.collection('messages');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function findProfileByEmail(email) {
  const student = await studentsCollection.findOne({ email });
  if (student) return { ...student, _source: 'student' };
  const alumni = await alumniCollection.findOne({ email });
  if (alumni) return { ...alumni, _source: 'alumni_directory' };
  return null;
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

// ==================== ALUMNI DIRECTORY ROUTES ====================

app.get('/api/alumni-directory/check/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const profile = await alumniCollection.findOne({ email });
    res.json({ exists: !!profile, profile: profile || null });
  } catch (error) {
    console.error("Error checking alumni profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get('/api/alumni-directory/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const profile = await alumniCollection.findOne({ email });
    if (!profile) return res.status(404).json({ message: "Alumni profile not found" });
    res.json({ profile });
  } catch (error) {
    console.error("Error fetching alumni profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post('/api/alumni-directory', async (req, res) => {
  try {
    const { fullName, email } = req.body;
    if (!email || !fullName) return res.status(400).json({ message: "Full Name and Email are required." });
    const existing = await alumniCollection.findOne({ email });
    if (existing) return res.status(409).json({ message: "Profile already exists. Use PATCH to update." });
    const newProfile = { ...req.body, createdAt: new Date(), updatedAt: new Date() };
    const result = await alumniCollection.insertOne(newProfile);
    res.status(201).json({ message: "Alumni profile created", profileId: result.insertedId, profile: newProfile });
  } catch (error) {
    console.error("Error creating alumni profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.patch('/api/alumni-directory/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const updateData = { ...req.body };
    delete updateData.email;
    delete updateData._id;
    delete updateData.createdAt;
    updateData.updatedAt = new Date();
    const result = await alumniCollection.findOneAndUpdate(
      { email }, { $set: updateData }, { returnDocument: 'after' }
    );
    res.json({ message: "Alumni profile updated", profile: result });
  } catch (error) {
    console.error("Error updating alumni profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get('/api/alumni-directory', async (req, res) => {
  try {
    const { search = '', degree = '', graduationYear = '', location = '', sortBy = 'newest', page = '1', limit = '6' } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(50, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;
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
    const total = await alumniCollection.countDocuments(filter);
    const profiles = await alumniCollection.find(filter).sort(sort).skip(skip).limit(limitNum).toArray();
    res.json({
      profiles,
      pagination: { total, totalPages: Math.ceil(total / limitNum), currentPage: pageNum, pageSize: limitNum, hasNext: pageNum < Math.ceil(total / limitNum), hasPrevious: pageNum > 1 }
    });
  } catch (error) {
    console.error("Error fetching alumni directory:", error);
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

// GET /api/follow/following/:email (List all profiles this user follows)
app.get('/api/follow/following/:email', async (req, res) => {
  try {
    await ensureFollowsCollection();
    const { email } = req.params;

    const followDocs = await followsCollection
      .find({ followerEmail: email })
      .sort({ createdAt: -1 })
      .toArray();

    const followedEmails = followDocs.map((doc) => doc.targetEmail);
    if (followedEmails.length === 0) {
      return res.json({ following: [] });
    }

    const profiles = await Promise.all(
      followedEmails.map((e) => findProfileByEmail(e))
    );

    res.json({ following: profiles.filter(Boolean) });
  } catch (error) {
    console.error("Error fetching following list:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/follow/followers/:email (List all followers of this user)
app.get('/api/follow/followers/:email', async (req, res) => {
  try {
    await ensureFollowsCollection();
    const { email } = req.params;

    const followDocs = await followsCollection
      .find({ targetEmail: email })
      .sort({ createdAt: -1 })
      .toArray();

    const followerEmails = followDocs.map((doc) => doc.followerEmail);
    if (followerEmails.length === 0) {
      return res.json({ followers: [] });
    }

    const profiles = await Promise.all(
      followerEmails.map((e) => findProfileByEmail(e))
    );

    res.json({ followers: profiles.filter(Boolean) });
  } catch (error) {
    console.error("Error fetching followers list:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/follow/stats/:email (Follower & Following counts)
app.get('/api/follow/stats/:email', async (req, res) => {
  try {
    await ensureFollowsCollection();
    const { email } = req.params;

    const [followersCount, followingCount] = await Promise.all([
      followsCollection.countDocuments({ targetEmail: email }),
      followsCollection.countDocuments({ followerEmail: email })
    ]);

    res.json({ followers: followersCount, following: followingCount });
  } catch (error) {
    console.error("Error fetching follow stats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ==================== MESSAGE ROUTES ====================

// GET /api/messages/unread-summary/:email (Get unread message counts)
app.get('/api/messages/unread-summary/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const pipeline = [
      { $match: { receiverEmail: email, read: false } },
      { $group: { _id: '$senderEmail', count: { $sum: 1 } } }
    ];
    const results = await messagesCollection.aggregate(pipeline).toArray();
    const unreadCounts = {};
    let totalUnread = 0;
    results.forEach((r) => {
      unreadCounts[r._id] = r.count;
      totalUnread += r.count;
    });
    res.json({ success: true, unreadCounts, totalUnread });
  } catch (error) {
    console.error("Error fetching unread summary:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// GET /api/messages/conversation (Fetch conversation between two users)
app.get('/api/messages/conversation', async (req, res) => {
  try {
    const { user1, user2 } = req.query;
    if (!user1 || !user2) {
      return res.status(400).json({ success: false, message: "user1 and user2 are required" });
    }

    const messages = await messagesCollection
      .find({
        $or: [
          { senderEmail: user1, receiverEmail: user2 },
          { senderEmail: user2, receiverEmail: user1 }
        ]
      })
      .sort({ createdAt: 1 })
      .toArray();

    // Mark messages as read
    await messagesCollection.updateMany(
      { senderEmail: user2, receiverEmail: user1, read: false },
      { $set: { read: true } }
    );

    res.json({ success: true, messages });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// POST /api/messages/send (Send a message)
app.post('/api/messages/send', async (req, res) => {
  try {
    const { senderEmail, receiverEmail, text } = req.body;
    if (!senderEmail || !receiverEmail || !text) {
      return res.status(400).json({ success: false, message: "senderEmail, receiverEmail, and text are required" });
    }

    const newMessage = {
      senderEmail,
      receiverEmail,
      text,
      read: false,
      createdAt: new Date().toISOString()
    };

    const result = await messagesCollection.insertOne(newMessage);
    res.status(201).json({ success: true, message: { ...newMessage, _id: result.insertedId } });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ==================== JOB ROUTES ====================

// GET /api/jobs (List jobs with optional filters)
app.get('/api/jobs', async (req, res) => {
  try {
    const { search = '', jobType = '', workplaceType = '', limit = '50', postedBy = '' } = req.query;
    const limitNum = Math.max(1, Math.min(200, parseInt(limit)));
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

    if (jobType) {
      filter.jobType = jobType;
    }

    if (workplaceType) {
      filter.workplaceType = workplaceType;
    }

    if (postedBy) {
      filter.postedBy = postedBy;
    }

    const jobs = await jobsCollection
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .toArray();

    res.json({ success: true, jobs: serializeId(jobs), total: jobs.length });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// GET /api/jobs/:id (Get single job by ID)
app.get('/api/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid job ID" });
    }
    const job = await jobsCollection.findOne({ _id: new ObjectId(id) });
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }
    res.json({ success: true, job: serializeId(job) });
  } catch (error) {
    console.error("Error fetching job:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// POST /api/jobs (Create a job)
app.post('/api/jobs', async (req, res) => {
  try {
    const {
      title, company, location, jobType, workplaceType,
      salaryRange, salary, applicationDeadline, applicationUrlOrEmail,
      description, requirements, skills, postedBy
    } = req.body;

    if (!title || !company) {
      return res.status(400).json({ success: false, message: "Title and Company are required." });
    }

    const newJob = {
      title,
      company,
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

    const result = await jobsCollection.insertOne(newJob);
    res.status(201).json({ success: true, message: "Job posted successfully", job: { ...newJob, _id: result.insertedId.toString() } });
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});


// PATCH /api/jobs/:id (Update a job)
app.patch('/api/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Fix: Validate ID format first
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid job ID" });
    }

    let updateData = { ...req.body };

    delete updateData._id;
    delete updateData.createdAt;
    updateData.updatedAt = new Date().toISOString();

    if (updateData.salaryRange) {
      updateData.salary = updateData.salary || updateData.salaryRange;
      delete updateData.salaryRange;
    }

    const updatedResult = await jobsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    // ✅ Fix: Safely handle both MongoDB Driver v5 (updatedResult.value) and v6 (updatedResult)
    const jobData = updatedResult?.value || updatedResult;

    if (!jobData) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    res.json({ success: true, message: "Job updated successfully", job: serializeId(jobData) });
  } catch (error) {
    console.error("Error updating job:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// DELETE /api/jobs/:id (Delete a job)
app.delete('/api/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await jobsCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    res.json({ success: true, message: "Job deleted successfully" });
  } catch (error) {
    console.error("Error deleting job:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ==================== START SERVER ====================

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});
