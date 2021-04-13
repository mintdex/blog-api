const express = require('express');

const router = express.Router();
const authController = require('../controllers/authController');
const { route } = require('./users');

/* POST log in */
router.post('/log-in', authController.log_in);

module.exports = router;
