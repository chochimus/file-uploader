const express = require("express");
const session = require("express-session");
const passport = require("passport");
const path = require("node:path");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const app = express();
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");
const { PrismaClient } = require("@prisma/client");
const indexRouter = require("./routes/indexRouter");
const authRouter = require("./routes/authRouter");
const flash = require("connect-flash");

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    store: new PrismaSessionStore(new PrismaClient(), {
      checkPeriod: 2 * 60 * 1000,
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.session());
require("./config/passport");
app.use(flash());

app.use("/", indexRouter);
app.use("/", authRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.statusCode || 500).send(err);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
