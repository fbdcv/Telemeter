const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const socket = require("socket.io");

const app = express();
require("dotenv").config();
const messageRoutes = require("./routes/messages");
const authRoutes = require("./routes/auth");
const systemRoutes = require("./routes/system");

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/system", systemRoutes);

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
    origin: "http://localhost:3000",
    // origin: "*",
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
  // console.log("------------------");
  // for (let [key, value] of global.onlineUsers) {
  //   console.log(`${key} = ${value}`);
  // }
  // console.log("------------------");

  //服务器中转数据 data中有三个属性from,to,msg
  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    //如果用户在线
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-recieve", data);
    }
  });
  socket.on("system_info", (sysinfo) => {
    const sendUserSocket = onlineUsers.get(sysinfo.to);
    const { info, data } = sysinfo;
    // console.log("to", sysinfo.to);
    // console.log("info", sysinfo.info);
    // console.log("data", sysinfo.data);

    //如果用户在线
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("system_info", { info, data });
    }
  });
  socket.on("befriends", (data) => {
    const { toId, toName, friend } = data;
    const sendUserSocket = onlineUsers.get(toId);
    // console.log("toId ,toName", data);
    //如果用户在线
    if (sendUserSocket) {
      //通知客户端刷新好友列表
      // console.log("通知客户端刷新好友列表");
      // console.log("socket 中转friend ", friend);
      socket.to(sendUserSocket).emit("befriends", friend);
    }
  });
});
