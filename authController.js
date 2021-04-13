const jwt = require('jsonwebtoken');
const _ = require('lodash');

const adminAccount = {
  username: 'imsohandsome',
  password: 'agree',
};

// Handle log in request on POST
exports.log_in = async (req, res) => {
  const userInput = req.body;

  if (_.isEqual(userInput, adminAccount)) {
    const token = jwt.sign(userInput, 'secret', { expiresIn: '60m' });
    return res.json({ message: "You're IN!", token });
  } else {
    return res.json({ message: 'Wrong!!!!!!!' });
  }
};

// Authenticate user token
exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token === null) return res.json({ message: 'Invalid token', status: 401 });

  jwt.verify(token, 'secret', (err, user) => {
    if (err) return res.sendStatus(403);

    req.user = user;

    next();
  });
};
