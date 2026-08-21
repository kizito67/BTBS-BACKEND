const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const userController = require("../controllers/user.controller");
const { protect } = require("../middleware/auth.middleware");
const validate = require("../middleware/validation.middleware");
const authValidator = require("../validators/auth.validation");
const upload = require("../middleware/upload.middleware");



router.post(
  "/profile/avatar",
  protect,
  upload.single("profilePicture"),
  authController.uploadProfilePicture
);
router.post("/forgot-password", validate, authValidator.forgotPasswordValidation, authController.forgotPassword);
router.post("/reset-password", validate, authValidator.resetPasswordValidation, authController.resetPassword);
router.post("/verify-reset-otp", authController.verifyResetOtp);
router.post("/register-commuter", validate, authValidator.commuterRegisterValidation, authController.registerCommuter);
router.post("/register-business", validate, authValidator.businessRegisterValidation, authController.registerBusiness);
router.post("/login", validate, authValidator.loginValidation, authController.loginUser);
router.post("/verify-otp", authValidator.verifyOtpValidation, authController.verifyOtp);
router.post("/resend-otp", authController.resendOtp);
router.post("/send-login-otp", authController.sendLoginOtp);
router.get("/profile", protect, authController.profile);
router.patch("/profile", protect, authController.updateProfile);
router.post(
  "/profile/avatar",
  protect,
  upload.single("profilePicture"),
  authController.uploadProfilePicture
);

module.exports = router;
