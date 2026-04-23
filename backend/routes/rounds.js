const express = require('express');
const router = express.Router();
const Round = require('../models/Round');
const auth = require('../middleware/auth');

// @route   GET api/rounds
// @desc    Get all rounds
// @access  Public
router.get('/', async (req, res) => {
  try {
    const rounds = await Round.find();
    res.json(rounds);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/rounds
// @desc    Create a round
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const newRound = new Round({ name: req.body.name });
    const round = await newRound.save();
    res.json(round);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
