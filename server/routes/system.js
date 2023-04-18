const { friendRequest, getFriendRequest } = require("../controllers/system");

const router = require("express").Router();

router.post("/friendRequest", friendRequest);
router.get("/getFriendRequest/:username", getFriendRequest);

module.exports = router;
