const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthController {
  async register(req, res) {
    try {
      const { username, email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ $or: [{ email }, { username }] });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Create new user
      const user = new User({
        username,
        email,
        password
      });

      await user.save();

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION }
      );

      res.status(201).json({
        message: 'User created successfully',
        token,
        user
      });
    } catch (error) {
      res.status(500).json({ message: 'Error creating user', error: error.message });
    }
  }

  async login(req, res) {
    try {
      const { username, password } = req.body;

      // Find user
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Validate password
      const isValid = await user.validatePassword(password);
      if (!isValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION }
      );

      res.json({
        message: 'Login successful',
        token,
        user
      });
    } catch (error) {
      res.status(500).json({ message: 'Error during login', error: error.message });
    }
  }

  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching profile', error: error.message });
    }
  }
}

module.exports = new AuthController();
