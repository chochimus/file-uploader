const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const prisma = require("../prismaClient");

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await prisma.getUserByUsername(username);
      if (!user) {
        return done(null, false, {
          message: "Incorrect username",
        });
      }
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return done(null, false, {
          message: "Incorrect password",
        });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.getUserById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

function protectRoute(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/log-in?next=" + encodeURI(req.url));
}

module.exports = {
  passport,
  protectRoute,
};
