const { storeCaptcha } = require("../controllers/captcha");

const router = require("express").Router();

router.post("/sendCaptcha", storeCaptcha);

module.exports = router;
