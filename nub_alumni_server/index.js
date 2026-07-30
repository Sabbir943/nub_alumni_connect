const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;
const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("Error: MONGODB_URI is not defined in .env file");
  process.exit(1);
}

app.use(cors());
app.use(express.json());

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let alumniCollection;
let followsCollection;
let jobsCollection;

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Successfully connected to MongoDB!");

    const db = client.db("nub_alumni");
    alumniCollection = db.collection("alumni_directory");
    followsCollection = db.collection("follows");
    jobsCollection = db.collection("jobs");

    // Database Indexes
    await alumniCollection.createIndex({ email: 1 }, { unique: true });
    await alumniCollection.createIndex({ studentId: 1 }, { unique: true });
    await followsCollection.createIndex({ followerEmail: 1, targetEmail: 1 }, { unique: true });
    await followsCollection.createIndex({ targetEmail: 1 });
    await followsCollection.createIndex({ followerEmail: 1 });
    
    await jobsCollection.createIndex({ createdAt: -1 });

    // Health check
    app.get('/', (req, res) => {
      res.send('Server is running!');
    });

    // ==================== ALUMNI DIRECTORY ROUTES ====================

    // GET /api/alumni-directory/check/:email
    app.get('/api/alumni-directory/check/:email', async (req, res) => {
      try {
        const { email } = req.params;
        const profile = await alumniCollection.findOne({ email });

        if (profile) {
          res.json({ exists: true, profile });
        } else {
          res.json({ exists: false, profile: null });
        }
      } catch (error) {
        console.error("Error checking profile:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // POST /api/alumni-directory
    app.post('/api/alumni-directory', async (req, res) => {
      try {
        const {
          fullName,
          email,
          profilePictureUrl,
          graduationYear,
          degree,
          studentId,
          currentLocation,
          organization,
          jobTitle,
          linkedinUrl,
          bio,
          contactNumber,
          skills,
          facebookUrl,
          twitterUrl
        } = req.body;

        if (!email || !fullName) {
          return res.status(400).json({ message: "Email and Full Name are required" });
        }

        const existingProfile = await alumniCollection.findOne({ email });
        if (existingProfile) {
          return res.status(409).json({ message: "Profile already exists. Use PATCH to update." });
        }

        if (studentId) {
          const existingStudentId = await alumniCollection.findOne({ studentId });
          if (existingStudentId) {
            return res.status(409).json({ message: "Student ID is already registered." });
          }
        }

        const newProfile = {
          fullName,
          email,
          profilePictureUrl: profilePictureUrl || "",
          graduationYear: graduationYear ? Number(graduationYear) : null,
          degree: degree || "",
          studentId: studentId || "",
          currentLocation: currentLocation || "",
          organization: organization || "",
          jobTitle: jobTitle || "",
          linkedinUrl: linkedinUrl || "",
          bio: bio || "",
          contactNumber: contactNumber || "",
          skills: skills || "",
          facebookUrl: facebookUrl || "",
          twitterUrl: twitterUrl || "",
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const result = await alumniCollection.insertOne(newProfile);

        res.status(201).json({
          message: "Alumni profile created successfully",
          profileId: result.insertedId,
          profile: newProfile
        });
      } catch (error) {
        console.error("Error creating profile:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // PATCH /api/alumni-directory/:email
    app.patch('/api/alumni-directory/:email', async (req, res) => {
      try {
        const { email } = req.params;
        const updateData = req.body;

        const existingProfile = await alumniCollection.findOne({ email });
        if (!existingProfile) {
          return res.status(404).json({ message: "Profile not found" });
        }

        if (updateData.studentId && updateData.studentId !== existingProfile.studentId) {
          const studentIdTaken = await alumniCollection.findOne({
            studentId: updateData.studentId,
            email: { $ne: email }
          });
          if (studentIdTaken) {
            return res.status(409).json({ message: "Student ID is already in use by another profile." });
          }
        }

        delete updateData.email;
        delete updateData._id;
        delete updateData.createdAt;

        updateData.updatedAt = new Date();

        if (updateData.graduationYear) {
          updateData.graduationYear = Number(updateData.graduationYear);
        }

        const result = await alumniCollection.findOneAndUpdate(
          { email },
          { $set: updateData },
          { returnDocument: 'after' }
        );

        res.json({
          message: "Profile updated successfully",
          profile: result
        });
      } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // GET /api/alumni-directory
    app.get('/api/alumni-directory', async (req, res) => {
      try {
        const {
          search,
          degree,
          graduationYear,
          location,
          organization,
          sortBy = 'newest',
          page = 1,
          limit = 6
        } = req.query;

        let query = {};

        if (search) {
          query.$or = [
            { fullName: { $regex: search, $options: 'i' } },
            { organization: { $regex: search, $options: 'i' } },
            { jobTitle: { $regex: search, $options: 'i' } },
            { skills: { $regex: search, $options: 'i' } }
          ];
        }

        if (degree) query.degree = degree;
        if (graduationYear) query.graduationYear = Number(graduationYear);
        if (location) query.currentLocation = { $regex: location, $options: 'i' };
        if (organization) query.organization = { $regex: organization, $options: 'i' };

        let sort = {};
        switch (sortBy) {
          case 'oldest': sort = { createdAt: 1 }; break;
          case 'name_asc': sort = { fullName: 1 }; break;
          case 'name_desc': sort = { fullName: -1 }; break;
          case 'year_asc': sort = { graduationYear: 1 }; break;
          case 'year_desc': sort = { graduationYear: -1 }; break;
          case 'newest':
          default: sort = { createdAt: -1 }; break;
        }

        const currentPage = Math.max(1, Number(page));
        const pageSize = Math.max(1, Math.min(50, Number(limit)));
        const skip = (currentPage - 1) * pageSize;

        const total = await alumniCollection.countDocuments(query);
        const totalPages = Math.ceil(total / pageSize);

        const profiles = await alumniCollection
          .find(query)
          .sort(sort)
          .skip(skip)
          .limit(pageSize)
          .toArray();

        res.json({
          profiles,
          pagination: {
            total,
            totalPages,
            currentPage,
            pageSize,
            hasNext: currentPage < totalPages,
            hasPrevious: currentPage > 1
          }
        });
      } catch (error) {
        console.error("Error fetching profiles:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // GET /api/alumni-directory/:email
    app.get('/api/alumni-directory/:email', async (req, res) => {
      try {
        const { email } = req.params;
        const profile = await alumniCollection.findOne({ email });

        if (!profile) {
          return res.status(404).json({ message: "Profile not found" });
        }

        res.json({ profile });
      } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // DELETE /api/alumni-directory/:email
    app.delete('/api/alumni-directory/:email', async (req, res) => {
      try {
        const { email } = req.params;
        const result = await alumniCollection.deleteOne({ email });

        if (result.deletedCount === 0) {
          return res.status(404).json({ message: "Profile not found" });
        }

        res.json({ message: "Profile deleted successfully" });
      } catch (error) {
        console.error("Error deleting profile:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // ==================== FOLLOW ROUTES ====================

    app.post('/api/follow', async (req, res) => {
      try {
        const { followerEmail, targetEmail } = req.body;

        if (!followerEmail || !targetEmail) {
          return res.status(400).json({ message: 'followerEmail and targetEmail are required' });
        }

        if (followerEmail === targetEmail) {
          return res.status(400).json({ message: 'You cannot follow yourself' });
        }

        const follower = await alumniCollection.findOne({ email: followerEmail });
        if (!follower) return res.status(404).json({ message: 'Follower profile not found' });

        const target = await alumniCollection.findOne({ email: targetEmail });
        if (!target) return res.status(404).json({ message: 'Target profile not found' });

        const existing = await followsCollection.findOne({ followerEmail, targetEmail });
        if (existing) return res.status(409).json({ message: 'Already following this user' });

        await followsCollection.insertOne({
          followerEmail,
          targetEmail,
          createdAt: new Date()
        });

        res.status(201).json({ message: 'Followed successfully', isFollowing: true });
      } catch (error) {
        console.error('Error following user:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });

    app.delete('/api/follow', async (req, res) => {
      try {
        const { followerEmail, targetEmail } = req.body;

        if (!followerEmail || !targetEmail) {
          return res.status(400).json({ message: 'followerEmail and targetEmail are required' });
        }

        const result = await followsCollection.deleteOne({ followerEmail, targetEmail });

        if (result.deletedCount === 0) {
          return res.status(404).json({ message: 'Follow relationship not found' });
        }

        res.json({ message: 'Unfollowed successfully', isFollowing: false });
      } catch (error) {
        console.error('Error unfollowing user:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });

    app.get('/api/follow/status', async (req, res) => {
      try {
        const { followerEmail, targetEmail } = req.query;

        if (!followerEmail || !targetEmail) {
          return res.status(400).json({ message: 'followerEmail and targetEmail are required' });
        }

        const follow = await followsCollection.findOne({ followerEmail, targetEmail });
        res.json({ isFollowing: !!follow });
      } catch (error) {
        console.error('Error checking follow status:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });

    app.get('/api/follow/followers/:email', async (req, res) => {
      try {
        const { email } = req.params;
        const followers = await followsCollection.find({ targetEmail: email }).sort({ createdAt: -1 }).toArray();
        const followerEmails = followers.map((f) => f.followerEmail);
        const profiles = await alumniCollection.find({ email: { $in: followerEmails } }).toArray();

        res.json({ followers: profiles, count: profiles.length });
      } catch (error) {
        console.error('Error fetching followers:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });

    app.get('/api/follow/following/:email', async (req, res) => {
      try {
        const { email } = req.params;
        const following = await followsCollection.find({ followerEmail: email }).sort({ createdAt: -1 }).toArray();
        const followingEmails = following.map((f) => f.targetEmail);
        const profiles = await alumniCollection.find({ email: { $in: followingEmails } }).toArray();

        res.json({ following: profiles, count: profiles.length });
      } catch (error) {
        console.error('Error fetching following:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });

    app.get('/api/follow/stats/:email', async (req, res) => {
      try {
        const { email } = req.params;
        const followersCount = await followsCollection.countDocuments({ targetEmail: email });
        const followingCount = await followsCollection.countDocuments({ followerEmail: email });

        res.json({ followers: followersCount, following: followingCount });
      } catch (error) {
        console.error('Error fetching follow stats:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });

    // ==================== JOB POSTING ROUTES ====================

    // POST /api/jobs
    app.post('/api/jobs', async (req, res) => {
      try {
        const {
          title,
          company,
          location,
          jobType,
          workplaceType,
          salaryRange,
          applicationDeadline,
          applicationUrlOrEmail,
          description,
          requirements,
          skills,
          postedBy,
        } = req.body;

        if (!title || !company || !location || !applicationUrlOrEmail || !description) {
          return res.status(400).json({
            success: false,
            message: 'Please fill out all required fields (*)',
          });
        }

        const newJob = {
          title,
          company,
          location,
          jobType: jobType || 'Full-time',
          workplaceType: workplaceType || 'On-site',
          salaryRange: salaryRange || 'Negotiable',
          applicationDeadline: applicationDeadline || null,
          applicationUrlOrEmail,
          description,
          requirements: requirements || '',
          skills: Array.isArray(skills) ? skills : [],
          postedBy: postedBy || 'Anonymous Alumni',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = await jobsCollection.insertOne(newJob);

        res.status(201).json({
          success: true,
          message: 'Job circular created successfully!',
          jobId: result.insertedId,
          data: newJob,
        });
      } catch (error) {
        console.error('Error posting job:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
      }
    });

    // GET /api/jobs
    app.get('/api/jobs', async (req, res) => {
      try {
        const { search, jobType, workplaceType, page = 1, limit = 10 } = req.query;

        let query = {};

        if (search) {
          query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { company: { $regex: search, $options: 'i' } },
            { skills: { $elemMatch: { $regex: search, $options: 'i' } } },
          ];
        }

        if (jobType && jobType !== 'All') query.jobType = jobType;
        if (workplaceType && workplaceType !== 'All') query.workplaceType = workplaceType;

        const currentPage = Math.max(1, Number(page));
        const pageSize = Math.max(1, Math.min(50, Number(limit)));
        const skip = (currentPage - 1) * pageSize;

        const total = await jobsCollection.countDocuments(query);
        const jobs = await jobsCollection
          .find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(pageSize)
          .toArray();

        res.json({
          success: true,
          jobs,
          pagination: {
            total,
            totalPages: Math.ceil(total / pageSize),
            currentPage,
            pageSize,
          },
        });
      } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
      }
    });

    // GET /api/jobs/:id
    app.get('/api/jobs/:id', async (req, res) => {
      try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ success: false, message: 'Invalid Job ID format' });
        }

        const job = await jobsCollection.findOne({ _id: new ObjectId(id) });

        if (!job) {
          return res.status(404).json({ success: false, message: 'Job circular not found' });
        }

        res.json({ success: true, job });
      } catch (error) {
        console.error('Error fetching single job:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
      }
    });

    // DELETE /api/jobs/:id
    app.delete('/api/jobs/:id', async (req, res) => {
      try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ success: false, message: 'Invalid Job ID format' });
        }

        const result = await jobsCollection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
          return res.status(404).json({ success: false, message: 'Job not found' });
        }

        res.json({ success: true, message: 'Job post deleted successfully' });
      } catch (error) {
        console.error('Error deleting job:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
      }
    });

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error);
  }
}

run().catch(console.dir);