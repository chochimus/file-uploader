const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const prisma = require("../prismaClient");

const signupGet = (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect("/homepage");
  } else {
    res.render("sign-up");
  }
};

const signupValidate = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username required")
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters long")
    .isLength({ max: 20 })
    .withMessage("Username must be no more than 20 characters long")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username must only contain letters, numbers, or underscores")
    .escape(),
  body("password")
    .notEmpty()
    .withMessage("Password required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .isLength({ max: 32 })
    .withMessage("Password must be less than 32 characters long")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[\W_]/) // This regex checks for any special character
    .withMessage("Password must contain at least one special character"),
  body("confirm-password")
    .custom((value, { req }) => value === req.body.password)
    .withMessage("Passwords do not match"),
];

const signupPost = [
  signupValidate,
  async (req, res, next) => {
    const errors = await validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).render("sign-up", {
        errors: errors.array(),
      });
    }
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      const user = await prisma.createUser(username, hashedPassword);
      // Redirect or respond with success
      res.redirect("/log-in");
    } catch (err) {
      res.render("sign-up", {
        errors: [
          {
            msg: "Username already taken. Please choose another one.",
            path: "username",
          },
        ],
      });
    }
  },
];

const loginGet = (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect("/homepage");
  } else {
    res.render("log-in", {
      errors: req.flash(),
    });
  }
};

const loginPost = passport.authenticate("local", {
  failureRedirect: "/log-in",
  successRedirect: "/homepage",
  failureFlash: true,
});

const logoutGet = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
};

module.exports = {
  signupGet,
  signupPost,
  loginGet,
  loginPost,
  logoutGet,
};
