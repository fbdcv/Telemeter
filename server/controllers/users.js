const User = require("../models/users");
const System = require("../models/system");
const bcryptjs = require("bcryptjs");

module.exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const usernameCheck = await User.findOne({ username });
    if (usernameCheck)
      return res.json({ msg: "Username already used", status: false });
    const emailCheck = await User.findOne({ email });
    if (emailCheck)
      return res.json({ msg: "Email already used", status: false });
    const hashedPassword = await bcryptjs.hash(password, 10);
    const user = await User.create({
      email,
      username,
      password: hashedPassword,
    });
    const SystemInfo = await User.findOne({ username: "SystemInfo" });
    console.log(" SystemInfo._id", SystemInfo._id);
    console.log(" user._id", user._id);
    await User.findByIdAndUpdate(
      user._id,
      {
        $addToSet: {
          friends: SystemInfo._id,
        },
      },
      { new: true }
    );
    const userNopassword = await User.findOne({ username }, { password: 0 }); //返回的数据剔除password
    return res.json({ status: true, user: userNopassword }); //根据网页的storage显示，password并未被剔除，这里是有一个bug
  } catch (ex) {
    next(ex);
  }
};

module.exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user)
      return res.json({ msg: "Incorrect Username or Password", status: false });
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid)
      return res.json({ msg: "Incorrect Username or Password", status: false });

    const userNopassword = await User.findOne({ username }, { password: 0 });
    return res.json({ status: true, user: userNopassword });
  } catch (ex) {
    next(ex);
  }
};

module.exports.setAvatar = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const avatarImage = req.body.image;
    const userData = await User.findByIdAndUpdate(
      userId,
      {
        isAvatarImageSet: true,
        avatarImage,
      },
      { new: true }
    );
    return res.json({
      isSet: userData.isAvatarImageSet,
      image: userData.avatarImage,
    });
  } catch (ex) {
    next(ex);
  }
};

module.exports.getAllUsers = async (req, res, next) => {
  try {
    //在User集合中筛选除了符合参数id的数据的其他数据
    const users = await User.find({ _id: { $ne: req.params.id } }).select([
      "email",
      "username",
      "avatarImage",
      "_id",
    ]);
    return res.json(users);
  } catch (ex) {
    next(ex);
  }
};

module.exports.getFriends = async (req, res, next) => {
  try {
    const data = await User.findOne({ _id: req.params.id }).select(["friends"]);
    const friends = data.friends;
    console.log("friends", friends);
    const result = [];
    for (let i = 0; i < friends.length; i++) {
      const x = await User.findOne({ _id: friends[i] }).select([
        "email",
        "username",
        "avatarImage",
        "_id",
      ]);
      result.push(x);
    }
    console.log("friends", friends);
    return res.json(result);
  } catch (ex) {
    next(ex);
  }
};

module.exports.beFriends = async (req, res, next) => {
  try {
    const { userId, friendId, userName } = req.body;
    console.log("userId", userId);
    console.log("friendId", friendId);
    console.log("userName", userName);

    const sender = friendId;
    const to = userName;
    await User.findByIdAndUpdate(
      userId,
      {
        $addToSet: {
          friends: friendId,
        },
      },
      { new: true }
    );
    await User.findByIdAndUpdate(
      friendId,
      {
        $addToSet: {
          friends: userId,
        },
      },
      { new: true }
    );

    console.log("sender", sender);
    console.log("to", to);
    await System.deleteOne({ info: "friendRequest", body: { sender, to } });

    return res.json({
      status: true,
      msg: "Succeeded in adding a friend",
    });
  } catch (ex) {
    next(ex);
  }
};

module.exports.notBeFriends = async (req, res, next) => {
  try {
    const { userId, friendId, userName } = req.body;
    console.log("userId", userId);
    console.log("friendId", friendId);
    console.log("userName", userName);

    const sender = friendId;
    const to = userName;
    console.log("sender", sender);
    console.log("to", to);
    await System.deleteOne({ info: "friendRequest", body: { sender, to } });

    return res.json({
      status: true,
      msg: "Succeeded in rejecting the friend request",
    });
  } catch (ex) {
    next(ex);
  }
};
