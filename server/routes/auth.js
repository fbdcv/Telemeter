const {
  register,
  login,
  setAvatar,
  getAllUsers,
  getFriends,
  beFriends,
  notBeFriends,
} = require("../controllers/users");

const router = require("express").Router();

router.post("/register", register);
router.post("/login", login);
router.post("/setavatar/:id", setAvatar);
router.get("/allusers/:id", getAllUsers);
router.get("/friends/:id", getFriends);
router.post("/beFriends", beFriends);
router.post("/notBeFriends", notBeFriends);

module.exports = router;
