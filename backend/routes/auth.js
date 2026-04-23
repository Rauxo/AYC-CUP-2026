const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// @route   POST api/auth/login
// @desc    Authenticate admin & get token
// @access  Public
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    const payload = {
      user: {
        role: 'admin'
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5 days' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } else {
    res.status(400).json({ msg: 'Invalid Credentials' });
  }
});

// @route   GET api/auth/me
// @desc    Verify admin token
// @access  Private
const auth = require('../middleware/auth');
router.get('/me', auth, (req, res) => {
  res.json({ role: req.user.role });
});

module.exports = router;
