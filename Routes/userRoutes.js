const router = require("express").Router();
const {
  registerUser,
  login,
  logout,
  refreshAccessToken,
  changePassword,
  updateAccountDetails,
  updateUserAvatar,
  updateCoverImage,
  getUserChanelProfile,
  getWatchedHistory,
} = require("../controller/userController");
const multerMiddleware = require("../middleware/multerMiddleware");
const jwtVerify = require("../middleware/authMiddleware");
router.post(
  "/register",
  multerMiddleware.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

router.post("/login", login);
router.post("/logout", jwtVerify, logout);
router.post("/refresh-token", refreshAccessToken);
router.post("/change-password", jwtVerify, changePassword);
router.patch("/updateAccount", jwtVerify, updateAccountDetails);
router.patch(
  "/avatar",
  jwtVerify,
  multerMiddleware.single("avatar"),
  updateUserAvatar
);
router.patch(
  "/coverImage",
  jwtVerify,
  multerMiddleware.single("coverImage"),
  updateCoverImage
);
router.get("/channel/:userName", jwtVerify, getUserChanelProfile);
router.get("/watchHistory", jwtVerify, getWatchedHistory);
module.exports = router;
