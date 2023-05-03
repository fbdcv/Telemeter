const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const socket = require("socket.io");

const app = express();
require("dotenv").config();
const messageRoutes = require("./routes/messages");
const authRoutes = require("./routes/auth");
const systemRoutes = require("./routes/system");
const avatarRoutes = require("./routes/avatar");
const captchaRoutes = require("./routes/captcha");

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/system", systemRoutes);
app.use("/api/avatar", avatarRoutes);
app.use("/api/captcha", captchaRoutes);

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB Connetion Successfull");
  })
  .catch((err) => {
    console.log(err.message);
  });

const server = app.listen(process.env.PORT, () => {
  console.log(`Server started on port ${process.env.PORT}....`);
});

const io = socket(server, {
  cors: {
    // origin: "http://localhost:3000",
    origin: "*",
    credentials: true,
  },
  pingInterval: 10000, // 每隔 10 秒发送一个心跳包
  pingTimeout: 120000, // 设置 2 分钟没有收到任何数据时判断客户端离线
});

//创建映射，存储在线用户对应的socket的id
global.onlineUsers = new Map();

io.on("connection", (socket) => {
  global.chatSocket = socket;
  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
  });

  console.log("---------onlineUsers-----------");
  onlineUsers.forEach((value, key) => {
    console.log(`${key} = ${value}`);
  });
  console.log("-------------------------------");

  //服务器中转消息数据 data中有三个属性
  //{from(socket.id),to(String),msg(String)}
  // {发送方，接受方，消息内容}
  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-recieve", data);
    }
  });

  //服务器中转系统通知 sysinfo中有三个属性
  //{to(User._id),info(String),data(User)}
  //{接受方，消息类型，数据体}
  socket.on("system_info", (sysinfo) => {
    const sendUserSocket = onlineUsers.get(sysinfo.to);
    const { info, data } = sysinfo;
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("system_info", { info, data });
    }
  });

  //服务器中转接受好友响应 data中有三个属性
  //{toName(String),toId(User._id),friend(User)}
  //{接收响应方的名字，接收响应方的Id，好友数据}
  socket.on("befriends", (data) => {
    const { toId, toName, friend } = data;
    const sendUserSocket = onlineUsers.get(toId);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("befriends", friend);
    }
  });

  //转发发送方的信令数据和其他信息
  //{ userToCall(User._id), signalData(signal), from(User._id) }
  socket.on("callUser", ({ userToCall, signalData, from }) => {
    // console.log("userToCall", userToCall);
    // console.log("signalData", signalData);
    // console.log(" from", from);
    const sendUserSocket = onlineUsers.get(userToCall);
    io.to(sendUserSocket).emit("callUser", { signal: signalData, from });
  });

  //转发接受方的信令数据
  //{to(User._id),signal(signal)}
  socket.on("answerCall", (data) => {
    console.log("answerCall");
    console.log("data.to", data.to);
    const sendUserSocket = onlineUsers.get(data.to);
    console.log("sendUserSocket", sendUserSocket);
    io.to(sendUserSocket).emit("callAccepted", data.signal);
  });
});
