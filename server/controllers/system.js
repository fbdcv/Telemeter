const System = require("../models/system");
const User = require("../models/users");

module.exports.friendRequest = async (req, res, next) => {
  try {
    const { sender, to } = req.body;
    const toCheck = await User.findOne({ username: to });
    const hasCheck = await System.findOne({ body: { sender, to } });
    if (!toCheck) {
      return res.json({
        status: false,
        msg: "The requested user does not exist",
      });
    }
    if (hasCheck) {
      return res.json({
        status: false,
        msg: "No frequent operation",
      });
    }
    res.json({
      status: true,
      msg: "The request has been sent",
    });
    await System.create({
      info: "friendRequest",
      body: { sender, to },
      text: "friendRequest",
    });
  } catch (ex) {
    next(ex);
  }
};

module.exports.getFriendRequest = async (req, res, next) => {
  try {
    const { username } = req.params;
    const data = await System.find({
      info: "friendRequest",
      "body.to": username,
    });
    res.json(data);
  } catch (ex) {
    next(ex);
  }
};
