const mongoose = require("mongoose");
const System = require("../models/system");
const User = require("../models/users");

module.exports.friendRequest = async (req, res, next) => {
  try {
    const { sender, to } = req.body;
    const toCheck = await User.findOne({ username: to });
    // console.log("to ", to);
    // console.log("sender ", sender);
    // console.log("toCheck ", toCheck);
    const hasCheck = await System.findOne({ body: { sender, to } });
    let isself = null;
    if (!toCheck) {
      return res.json({
        status: false,
        msg: "The requested user does not exist",
      });
    } else {
      isself = await User.findOne({
        _id: sender,
        friends: toCheck._id.toString(),
      });
    }
    //如果to是自己或者好友或者SystemInfo回复错误
    if (sender === toCheck._id.toString()) {
      return res.json({
        status: false,
        msg: "The target of a friend request cannot be yourself",
      });
    }
    if (to === "SystemInfo") {
      return res.json({
        status: false,
        msg: "The target of a friend request cannot be SystemInfo",
      });
    }
    //如果to的对象是自己好友
    if (isself) {
      return res.json({
        status: false,
        msg: "The target of a friend request has been your friend",
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
      toId: toCheck._id.toString(),
    });
    // console.log("toId", toCheck._id.toString());
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
    //查询好友请求
    const friendRequestData = await System.find({
      info: "friendRequest",
      "body.to": username,
    });
    //处理要响应的数据
    const data = [];
    for (let i = 0; i < friendRequestData.length; i++) {
      const e = await User.findOne({ _id: friendRequestData[i].body.sender });
      const x = { info: "friendRequest", data: e };
      data.push(x);
    }

    res.json(data);
  } catch (ex) {
    next(ex);
  }
};
