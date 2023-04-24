const { getAvatar } = require("../controllers/avatar");

const router = require("express").Router();

router.get("/getavatar/:random", getAvatar);

module.exports = router;
