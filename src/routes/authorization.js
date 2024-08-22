import express from "express";
import authorization from "../controller/authorization.js";
import verifyToken from "../middleware/jwt.js";
import logs from "../../src/helpers/functions.js";
import auth from "../../src/middleware/jwt.js";

const router = express.Router();

router.post("/login", authorization.login);
router.post("/logout", authorization.logout);
router.post(
  "/get-user-detail",
  verifyToken.verifyToken,
  authorization.getUserDetail
);
router.post(
  "/change-password",
  verifyToken.adminauthenticateToken,
  authorization.changePassword
);
router.post("/refresh-token", authorization.refreshToken);
router.post("/forgot-password", authorization.forgotPassword);
router.post("/reset-password", authorization.changeForgotPassword);
router.post("/link-expired", authorization.checkLinkExpiry);
router.post('/updateOnFirstLogin',authorization.changePasswordOnFirstLogin);
router.post('/send-admin-otp',authorization.sendAdminOTP);
router.post('/verify-admin-otp', authorization.verifyAdminOTP);
export default router;
