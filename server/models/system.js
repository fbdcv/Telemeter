const mongoose = require("mongoose");
const systemSchema = mongoose.Schema(
  {
    info: String, //消息类型
    body: Object, //消息体，用于存放对象
    text: String, //用于存放提示信息
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("System", systemSchema);
