const { Router } = require("express");
const authController = require("../controllers/authController");
const authRouter = Router();

authRouter.get("/sign-up", authController.signupGet);
authRouter.post("/sign-up", authController.signupPost);
authRouter.get("/log-in", authController.loginGet);
authRouter.post("/log-in", authController.loginPost);
authRouter.get("/log-out", authController.logoutGet);

module.exports = authRouter;
