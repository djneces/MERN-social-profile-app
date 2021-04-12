const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
//validation via express-validator
const { check, validationResult } = require('express-validator');

const User = require('../../models/User');

//@route POST api/users
//@desc Register user
//@access Public
router.post(
  '/',
  //validation rules in []
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength(6),
  ],
  async (req, res) => {
    //check for errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      //we get this response [{},{}] if the above don't match
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      //see if user exists
      //Model.findeOne - mongoose syntax
      let user = await User.findOne({ email });

      if (user) {
        //I send back same error format like above, so we get the same msg for react
        return res
          .status(400)
          .json({ errors: [{ msg: 'User already exists' }] });
      }
      //get users gravatar
      const avatar = gravatar.url(email, {
        //options size, rating, default
        s: '200',
        r: 'pg',
        d: 'mm',
      });

      //NEW user
      user = new User({
        name,
        email,
        avatar,
        password,
      });
      //encrypt password
      //salt 10 rounds
      //whatever returns promise, we need to put await in front of
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      //saving user in the DB
      await user.save();
      //after saving MongoDB gives us _id, which Mongoose takes as id => we can use user.id

      //return jsonwebtoken
      const payload = {
        user: {
          id: user.id,
        },
      };

      //we take user.id, the secret from default.json and sign with jwt
      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          //if no error we want to send the token
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;
