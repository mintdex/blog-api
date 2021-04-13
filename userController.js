const { body, validationResult } = require('express-validator');
const md5 = require('md5');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const Redis = require('ioredis');
const redis = new Redis();

// GET all user
exports.get_users_list = async (req, res) => {
  try {
    // Retrieve all keys from Redis
    const keys = await redis.keys('*');

    // Retrive each user by id asynchrously
    const usersList = await Promise.all(
      keys.map(async (key) => {
        const userAccount = await redis.hgetall(key);
        return { [key]: userAccount };
      })
    );

    res.json(usersList);
  } catch (err) {
    if (err) throw err;
  }
};

// GET user by id
exports.get_user_by_id = async (req, res) => {
  try {
    const id = req.params.id;

    const user = await redis.hgetall(id);

    if (_.isEmpty(user)) {
      res.json({ message: 'User not found' });
    } else {
      res.json({ id, userAccout: user });
    }
  } catch (err) {
    if (err) throw err;
  }
};

// Validate user input
exports.validateInput = [
  body('firstname', 'First name must be spectified').trim().notEmpty().escape(),
  body('lastname', 'Last name must be spectified').trim().notEmpty().escape(),
  body('email', 'You need to be specify an Email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password atleast 8 characters').escape(),
  body('age', 'Age must be specified')
    .trim()
    .notEmpty()
    .isNumeric()
    .withMessage('Age must contain only numbers')
    .escape(),
  (req, res, next) => {
    // Extract errors after validation
    const result = validationResult(req);

    if (!result.isEmpty()) {
      // Send back errors to user
      return res.json(
        result.errors.map((err) => {
          return err.msg;
        })
      );
    }
    next();
  },
];
// CREATE new user on POST
exports.create_user_post = async (req, res) => {
  // Hash password
  let hash;
  try {
    hash = await bcrypt.hash(req.body.password, 10);
  } catch (err) {
    throw err;
  }
  // Generate unique id for each user based on email address
  const email = req.body.email;
  const id = md5(email);

  // Validate successful. Create user object in array to save into Redis
  const user = [
    'email',
    email,
    'firstname',
    req.body.firstname,
    'lastname',
    req.body.lastname,
    'password',
    hash,
    'age',
    req.body.age,
  ];

  try {
    const userAlreadyExists = await isUserExisted(id);

    if (userAlreadyExists) {
      return res.end(JSON.stringify({ message: 'User already exists!', id }));
    }

    const result = await redis.hmset(id, user);
    console.log('Added to Redis: ' + result);

    const userAccount = await redis.hgetall(id);
    res.json({ message: 'Added Successfully!', id, userAccount });
  } catch (err) {
    if (err) throw err;
  }
};

// UPDATE user account on PUT
exports.update_user_put = async (req, res) => {
  const id = req.params.id;
  const userAccount = req.body;
  try {
    if (await isUserExisted(id)) {
      const result = await redis.hmset(id, userAccount);
      console.log(result);

      const updatedUser = await redis.hgetall(id);
      return res.json({ message: 'User updated', id, updatedUser });
    } else {
      return res.json({ message: 'User not existed' });
    }
  } catch (err) {
    if (err) throw err;
  }
};

// DELETE user account on delete
exports.delete_user = async (req, res) => {
  const id = req.params.id;

  try {
    if (await isUserExisted(id)) {
      const result = await redis.del(id);
      if (result) {
        return res.json({ message: 'User deleted' });
      } else {
        return res.json({ message: 'Something Wrong happened' });
      }
    } else {
      return res.json({ message: 'User not existed' });
    }
  } catch (err) {
    if (err) throw err;
  }
};

// Check if a key (a user) is already exists in Redis
const isUserExisted = async (id) => {
  try {
    const isExisted = await redis.exists(id);

    return isExisted === 1;
  } catch (err) {
    if (err) throw err;
  }
};
