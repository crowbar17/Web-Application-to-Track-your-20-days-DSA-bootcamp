require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use((req, res, next) => {
  console.log(`👀 Browser requested: ${req.url}`);
  next();
});
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 1. Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("🔥 Connected to MongoDB successfully!"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// 2. Define the NEW Database Blueprint (Schema)
const stateSchema = new mongoose.Schema({
  userId: { type: String, default: "admin" }, 
  trackerData: { type: Object, default: {} }
}, { minimize: false }); 

const TrackerState = mongoose.model('TrackerState', stateSchema);

// 3. API Endpoint: GET /api/progress (Reads the entire state)
app.get('/api/progress', async (req, res) => {
  try {
    let userState = await TrackerState.findOne({ userId: "admin" });
    if (!userState) {
      userState = await TrackerState.create({ userId: "admin", trackerData: {} });
    }
    res.json(userState.trackerData);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch progress" });
  }
});

// 4. API Endpoint: POST /api/progress (Overwrites the state with new ticks)
app.post('/api/progress', async (req, res) => {
  try {
    const newState = req.body; 
    
    const updatedState = await TrackerState.findOneAndUpdate(
      { userId: "admin" },
      { trackerData: newState },
      { new: true, upsert: true } 
    );
    
    res.json({ message: "Progress saved to cloud!", data: updatedState.trackerData });
  } catch (error) {
    res.status(500).json({ error: "Failed to save progress" });
  }
});

// 5. Start the Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));