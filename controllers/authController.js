const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const UserModel = require('../models/UserModel');

router.get('/register', (req, res) => {
  res.render('register.ejs');
});

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new UserModel(username, hashedPassword);
    await user.save();
    res.redirect('/login');
  } catch (error) {
    res.status(500).send(`Registration failed. Error: ${error.message}`);
  }
});

router.get('/login', (req, res) => {
  res.render('login.ejs');
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await UserModel.findByUsername(username);
    if (user && await bcrypt.compare(password, user.password)) {
      req.session.isLoggedIn = true;
      req.session.username = user.username;
      res.redirect('/');
    } else {
      res.send('Invalid username or password');
    }
  } catch (error) {
    res.send('Error occurred during login');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error occurred during logout:', err);
    }
    res.redirect('/');
  });
});

module.exports = router;
