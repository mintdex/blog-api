const express = require('express');

const router = express.Router();
const userController = require('../controllers/userController');

/* GET users listing. */
router.get('/', userController.get_users_list);

// POST new user
router.post('/add', userController.validateInput, userController.create_user_post);

// GET user by id
router
  .route('/:id')
  .get(userController.get_user_by_id)
  .put(userController.validateInput, userController.update_user_put)
  .delete(userController.delete_user);

module.exports = router;
