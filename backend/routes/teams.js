const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const auth = require('../middleware/auth');

// @route   GET api/teams
// @desc    Get all teams
// @access  Public
router.get('/', async (req, res) => {
  try {
    const teams = await Team.find().sort({ name: 1 });
    res.json(teams);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/teams
// @desc    Create a team
// @access  Private
router.post('/', auth, async (req, res) => {
  const { name, players } = req.body;
  try {
    const newTeam = new Team({
      name,
      players: players || []
    });
    const team = await newTeam.save();
    res.json(team);
  } catch (err) {
    console.error(err.message);
    if(err.code === 11000) return res.status(400).json({ msg: 'Team already exists' });
    res.status(500).send('Server Error');
  }
});

module.exports = router;
