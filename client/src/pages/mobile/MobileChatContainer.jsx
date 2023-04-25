import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import UIfx from "uifx";
import senderAudio from "../../assets/can.mp3";
import acceptAudio from "../../assets/can2.mp3";
import axios from "axios";
import styled from "styled-components";
import { v4 as uuidv4 } from "uuid";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { io } from "socket.io-client";
import { host } from "../../api/index";
import ChatInput from "../../components/ChatInput";
import {
  sendMessageRoute,
  recieveMessageRoute,
  getFriendRequestRoute,
  beFriendsRoute,
  notBeFriendsRoute,
} from "../../api/index";

const MobileChatContainer = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // const [currentUser, setCurrentUser] = useState(undefined);
  // const [currentChat, setCurrentChat] = useState(undefined);
  const [currentUser, setCurrentUser] = useState(location.state?.currentUser);
  const [currentChat, setCurrentChat] = useState(location.state?.currentChat);

  const socket = io(host);

  const [messages, setMessages] = useState([]); //存储聊天记录的数组
  const [arrivalMessage, setArrivalMessage] = useState(null); //接受socket传过来的数据

  //一个变量
  const scrollRef = useRef();

  const senderBell = new UIfx(senderAudio, {
    volume: 0.4, // number between 0.0 ~ 1.0
    throttleMs: 100,
  });

  const acceptBell = new UIfx(acceptAudio, {
    volume: 0.4, // number between 0.0 ~ 1.0
    throttleMs: 100,
  });

  const toastOptions = {
    position: "bottom-right",
    autoClose: 8000,
    pauseOnHover: true,
    draggable: true,
    theme: "dark",
  };

  /*
  5个useEffect之间还有依赖关系
    0
    2 need 1 ,因为需要得到currentChat才能从数据库获取数据
    3 need 1 ,因为必须在服务器存储了socket的id后，才能发送和接受消息
    4 need 3 ,来负责消除useEffect执行两次的副作用，3会执行两次，4会监听3影响的arrivalMessage，
            但鉴于两次arrivalMessage的变化的值一样，所以只会执行第一次不会执行第二次即执行一次
    5 监听messages

    当触发handleSendMsg时，useEffect基本上处于监听或者基本上执行完一次的状态，
                          即 1已经被执行，服务器存储了socket的id可以发送和接受消息
  */
  //加载通信必需的数据;

  useEffect(() => {
    //在服务器存储socket的id，便于转发
    if (socket && currentUser) {
      // console.log("socket", socket);
      socket.emit("add-user", currentUser._id);
      // console.log(`${currentUser._id} = ${socket}`);
    }
  }, []);

  useEffect(() => {
    async function func() {
      const data = await JSON.parse(localStorage.getItem("profile"));
      if (!data) {
        navigate("/");
      } else if (!window.matchMedia("(max-width: 768px)").matches) {
        navigate("/");
      } else {
        //在服务器存储socket的id，便于转发
        // socket.emit("add-user", data._id);
        // console.log(`${data._id} = ${socket.id}`);
        // setCurrentUser(location.state.currentUser);
        // setCurrentChat(location.state.currentChat);
        // console.log("state ", location.state);
        // console.log("location", location);
        // return () => {
        //   socket.disconnect();
        // };
      }
    }
    func();
  }, []);

  //当刚进入对话的时候从数据库拉取历史对话数据
  useEffect(() => {
    async function func() {
      if (currentChat?.username === "SystemInfo") {
        const res = await axios.get(
          `${getFriendRequestRoute}/${currentUser.username}`
        );
        //打印响应信息
        // console.log("res", res);
        // console.log("res.data", res.data);
        //复用messages
        setMessages(res.data);
      } else {
        const response = await axios.post(recieveMessageRoute, {
          from: currentUser?._id,
          to: currentChat?._id,
        });
        setMessages(response.data);
      }
    }
    func();
  }, [currentUser]);

  //监听数据并保证只启用一个监听
  useEffect(() => {
    // console.log("islistern...");

    if (currentChat?.username === "SystemInfo") {
      if (socket) {
        // console.log("socket在线 socket", socket);
        socket.on("system_info", (sysinfo) => {
          const { info, data } = sysinfo;
          // console.log("infor data ", sysinfo);
          setArrivalMessage({ info, data });
        });
      }
    } else {
      socket.on("msg-recieve", (data) => {
        const { msg } = data;
        // console.log("currentChat._id ", currentChat._id);
        setArrivalMessage({ fromSelf: false, message: msg });
      });
    }
  }, [currentUser]);

  //如果通过socket获取到了数据，就将其追加到messages状态
  useEffect(() => {
    if (currentChat?.username === "SystemInfo") {
      if (arrivalMessage) {
        acceptBell.play();
        setMessages((prev) => [...prev, arrivalMessage]);
      }
    } else {
      if (arrivalMessage) {
        acceptBell.play();
        setMessages((prev) => [...prev, arrivalMessage]);
      }
    }
  }, [arrivalMessage]);

  //如果messages有变动，将滑块下移
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  //点击提交按钮，将对话内容推送到数据库，并推送socket
  // 在这个函数中可以获取到满足聊天的三要素: from(currentUser) to(currentChat) message(msg)
  const handleSendMsg = async (msg) => {
    senderBell.play();
    if (currentChat.username === "SystemInfo") {
    } else {
      socket.emit("send-msg", {
        to: currentChat._id,
        from: currentUser._id,
        msg,
      });
      await axios.post(sendMessageRoute, {
        from: currentUser._id,
        to: currentChat._id,
        message: msg,
      });

      const msgs = [...messages];
      msgs.push({ fromSelf: true, message: msg });
      setMessages(msgs);
    }
  };
  const handleAccept = async (message) => {
    //发送HTTP请求到数据库
    //将目标用户注册为好友
    //删除system数据库中的相关数据
    //使用toast显示操作成功
    // console.log("message", message);
    const res = await axios.post(`${beFriendsRoute}`, {
      userId: currentUser._id,
      friendId: message.data._id,
      userName: currentUser.username,
      friendName: message.data.username,
    });
    // console.log("res ", res);
    const data = res.data;
    if (!data.status) {
      toast.error(data.msg, toastOptions);
    } else {
      toast.success(data.msg, toastOptions);
      socket.emit("befriends", {
        toName: message.data.username,
        toId: message.data._id,
        friend: currentUser,
      });
      setTimeout(() => {
        //刷新页面
        window.location.reload();
      }, 1500);
    }
  };
  const handleReject = async (message) => {
    //发送HTTP请求到数据库
    //删除system数据库中的相关数据
    //使用toast显示操作成功
    console.log("message", message);
    const res = await axios.post(`${notBeFriendsRoute}`, {
      userId: currentUser._id,
      friendId: message.data._id,
      userName: currentUser.username,
    });
    // console.log("res ", res);
    const data = res.data;
    if (!data.status) {
      toast.error(data.msg, toastOptions);
    } else {
      toast.success(data.msg, toastOptions);
      setTimeout(() => {
        //刷新页面
        window.location.reload();
      }, 500);
    }
  };

  return (
    currentChat && (
      <Container>
        {/* {console.log("location.state ", location.state)} */}
        <div className="chat-header">
          <div className="user-details">
            <div className="avatar">
              <img
                src={`data:image/svg+xml;base64,${currentChat?.avatarImage}`}
                alt=""
              />
            </div>
            <div className="username">
              <h3>{currentChat?.username}</h3>
            </div>
          </div>
        </div>
        <div className="chat-messages">
          {messages.map((message) => {
            return (
              <div ref={scrollRef} key={uuidv4()}>
                {currentChat?.username === "SystemInfo" &&
                  message.info === "friendRequest" && (
                    <div className="friend-request-box">
                      <div className="user-info">
                        <img
                          src={`data:image/svg+xml;base64,${message.data.avatarImage}`}
                          alt="User Avatar"
                        />
                        <span className="username">
                          {message.data.username}
                        </span>
                      </div>
                      <div className="text-box">
                        <span>好友请求</span>
                      </div>
                      <div className="buttons">
                        <button
                          className="accept"
                          onClick={() => handleAccept(message)}
                        >
                          接受
                        </button>
                        <button
                          className="reject"
                          onClick={() => handleReject(message)}
                        >
                          拒绝
                        </button>
                      </div>
                    </div>
                  )}
                {currentChat.username === "SystemInfo" &&
                  message.info !== "friendRequest" && <div></div>}
                {currentChat.username !== "SystemInfo" && (
                  <div
                    className={`message ${
                      message.fromSelf ? "sended" : "recieved"
                    }`}
                  >
                    <div className="content ">
                      <p>{message.message}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <ChatInput handleSendMsg={handleSendMsg} />
        <ToastContainer />
      </Container>
    )
  );
};

export default MobileChatContainer;

const Container = styled.div`
  height: 100vh;
  width: 100vw;
  background-color: #131324;
  display: grid;
  grid-template-rows: 10% 80% 10%;
  gap: 0.1rem;
  overflow: hidden;
  @media screen and (min-width: 720px) and (max-width: 1080px) {
    grid-template-rows: 15% 70% 15%;
  }
  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 2rem;
    .user-details {
      display: flex;
      align-items: center;
      gap: 1rem;
      .avatar {
        img {
          height: 3rem;
        }
      }
      .username {
        h3 {
          color: white;
        }
      }
    }
  }
  .chat-messages {
    padding: 1rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow: auto;
    &::-webkit-scrollbar {
      width: 0.2rem;
      &-thumb {
        background-color: #ffffff39;
        width: 0.1rem;
        border-radius: 1rem;
      }
    }

    .message {
      display: flex;
      align-items: center;
      .content {
        max-width: 40%;
        overflow-wrap: break-word;
        padding: 1rem;
        font-size: 1.1rem;
        border-radius: 1rem;
        color: #d1d1d1;
        @media screen and (min-width: 720px) and (max-width: 1080px) {
          max-width: 70%;
        }
      }
    }
    .sended {
      justify-content: flex-end;
      .content {
        /* background-color: #4f04ff21; */
        background-color: #000080;
      }
    }
    .recieved {
      justify-content: flex-start;
      .content {
        /* background-color: #9900ff20; */
        background-color: #56368e;
      }
    }
    .friend-request-box {
      width: 60%;
      margin: 0 auto;
      border: 1px solid #163bcb;
      background-color: #4f04ff21;
      padding: 20px;
      .user-info {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
        img {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          margin-right: 10px;
        }
        .username {
          color: white;
        }
      }
      .text-box {
        margin-bottom: 10px;
        span {
          color: white;
        }
      }
      .buttons {
        .accept {
          padding: 10px;
          margin-left: 10px;
          background-color: #fff;
          border-radius: 5px;
          border: 1px solid #aaa;
          color: #333;
          cursor: pointer;
          &:active {
            background-color: gray;
            color: white;
          }
        }
        .reject {
          padding: 10px;
          margin-left: 10px;
          background-color: #fff;
          border-radius: 5px;
          border: 1px solid #aaa;
          color: #333;
          cursor: pointer;
          &:active {
            background-color: gray;
            color: white;
          }
        }
      }
    }
  }
`;
