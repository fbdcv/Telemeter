const Avatar = require("../models/avatar");

module.exports.getAvatar = async (req, res, next) => {
  try {
    const { random } = req.params;
    //计算公共的svg头像数量
    const count = await Avatar.countDocuments({ type: "svg", ispublic: true });
    //获取index
    const index = random % count;

    //选取第index个头像返回
    const data = await Avatar.findOne({}).skip(index).limit(1);

    res.json(data);
  } catch (ex) {
    next(ex);
  }
};
