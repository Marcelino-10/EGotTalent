const express = require('express');  // Configures the Express application, sets up middleware for JSON and URL-encoded data parsing, serves static files, defines a Mongoose schema and model for submissions, and establishes API endpoints for calculating scores and retrieving aggregated results. It also handles MongoDB connection and server startup.
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

/**
 * Serves the 'index.html' file from the root directory when the application's root endpoint is accessed via a GET request.
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

/**
 * Handles POST requests to '/calcScore'. It validates incoming submission data (name and score), calculates a weighted score based on the name prefix ('MR' gives higher weight), saves the submission to MongoDB, and returns the newly saved submission along with aggregated statistics (total weighted score, total weight, and count) and a calculated final score.
 */
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

/**
 * Handles GET requests to '/scores'. It fetches the 500 most recent submissions from MongoDB, calculates aggregated statistics (total weighted score, total weight, and count) using MongoDB's aggregation framework, and returns both the recent submissions and the calculated final score.
 */
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

  /**
   * This callback function is executed upon a successful connection to MongoDB. It logs a confirmation message and then starts the Express application's server, making it listen on the specified port.
   */
  .then(() => {
    console.log('Connected to MongoDB');

    /**
     * This callback function is executed once the Express application begins listening on the specified port. It logs a message to the console indicating that the server is running and provides the URL where it can be accessed.
     */
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });