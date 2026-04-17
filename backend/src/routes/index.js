const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const studentRoutes = require('./studentRoutes');
const scoreRoutes = require('./scoreRoutes');
const profileRoutes = require('./profileRoutes');
const schoolRoutes = require('./schoolRoutes');
const majorRoutes = require('./majorRoutes');
const recommendationRoutes = require('./recommendationRoutes');
const chatRoutes = require('./chatRoutes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/students', studentRoutes);
router.use('/scores', scoreRoutes);
router.use('/profiles', profileRoutes);
router.use('/schools', schoolRoutes);
router.use('/majors', majorRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/chat', chatRoutes);

router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Zhiyuan API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      students: '/api/students',
      scores: '/api/scores',
      profiles: '/api/profiles',
      schools: '/api/schools',
      majors: '/api/majors',
      recommendations: '/api/recommendations',
      chat: '/api/chat'
    }
  });
});

module.exports = router;
