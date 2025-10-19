const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json()); // parse application/json
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Mongoose schema & model
const submissionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  score: { type: Number, required: true },
  weight: { type: Number, required: true },
  result: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Submission = mongoose.model('Submission', submissionSchema);

// Basic index route (serves index.html from static)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// POST /calcScore - receive a single submission, compute weight/result and save
app.post('/calcScore', async (req, res) => {
  try {
    const nameRaw = (req.body.name || '').toString();
    const scoreRaw = req.body.score;

    if (!nameRaw || scoreRaw === undefined) {
      return res.status(400).json({ error: 'Missing name or score in request body' });
    }

    const name = nameRaw.trim().toUpperCase();
    const score = Number(scoreRaw);
    if (Number.isNaN(score) || score < 0) {
      return res.status(400).json({ error: 'Score must be a valid non-negative number' });
    }

    // Determine weight: names starting with 'MR' get higher weight
    const weight = name.startsWith('MR') ? 0.7 : 0.3;
    const result = score * weight;

    const doc = new Submission({ name, score, weight, result });
    await doc.save();

    // Return the saved document and the updated aggregated stats
    const agg = await Submission.aggregate([
      {
        $group: {
          _id: null,
          totalWeighted: { $sum: '$result' },
          totalWeight: { $sum: '$weight' },
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = agg[0] || { totalWeighted: 0, totalWeight: 0, count: 0 };
    const finalScore = stats.totalWeight > 0 ? stats.totalWeighted / stats.totalWeight : 0;

    res.json({ submission: doc, stats: { count: stats.count, finalScore } });
  } catch (err) {
    console.error('Error in /calcScore POST:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /scores - return all submissions and aggregated final score
app.get('/scores', async (req, res) => {
  try {
    const submissions = await Submission.find().sort({ createdAt: -1 }).limit(500);
    const agg = await Submission.aggregate([
      {
        $group: {
          _id: null,
          totalWeighted: { $sum: '$result' },
          totalWeight: { $sum: '$weight' },
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = agg[0] || { totalWeighted: 0, totalWeight: 0, count: 0 };
    const finalScore = stats.totalWeight > 0 ? stats.totalWeighted / stats.totalWeight : 0;

    res.json({ submissions, stats: { count: stats.count, finalScore } });
  } catch (err) {
    console.error('Error in /scores GET:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });