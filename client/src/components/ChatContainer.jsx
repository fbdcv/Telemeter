import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import UIfx from "uifx";
import senderAudio from "../assets/can.mp3";
import acceptAudio from "../assets/can2.mp3";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ChatInput from "./ChatInput";
import {
  sendMessageRoute,
  recieveMessageRoute,
  getFriendRequestRoute,
  beFriendsRoute,
  notBeFriendsRoute,
} from "../api/index";

const ChatContainer = ({ currentUser, currentChat, socket }) => {
  const [messages, setMessages] = useState([]); //存储聊天记录的数组
  const [arrivalMessage, setArrivalMessage] = useState(null); //接受socket传过来的数据
  const [runOne, setRunOne] = useState(false); //使客户端只启用一次监听

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

  //当选择对话的时候从数据库拉取历史对话数据
  useEffect(() => {
    async function func() {
      if (currentChat.username === "SystemInfo") {
        const res = await axios.get(
          `${getFriendRequestRoute}/${currentUser.username}`
        );
        //打印响应信息
        console.log("res", res);
        console.log("res.data", res.data);
        //复用messages
        setMessages(res.data);
      } else {
        const response = await axios.post(recieveMessageRoute, {
          from: currentUser._id,
          to: currentChat._id,
        });
        setMessages(response.data);
      }
    }
    func();
  }, [currentChat]);

  //监听数据并保证只启用一个监听
  useEffect(() => {
    if (!runOne) {
      if (currentChat.username === "SystemInfo") {
        console.log("currentChat.username === SystemInfo");
        if (socket.current) {
          console.log("socket在线");
          socket.current.on("system_info", (sysinfo) => {
            const { info, data } = sysinfo;
            console.log("infor data ", sysinfo);
            setArrivalMessage({ info, data });
          });
        }
      } else {
        if (socket.current) {
          socket.current.on("msg-recieve", (data) => {
            const { from, msg } = data;
            // console.log("from ", from);
            console.log("currentChat._id ", currentChat._id); //这个东西
            // console.log("from===currentChat._id ", from === currentChat._id);
            // if (from === currentChat._id)
            setArrivalMessage({ fromSelf: false, message: msg, from });
          });
        }
      }
      setRunOne(true);
    }
  }, [currentChat]);

  //如果通过socket获取到了数据，就将其追加到messages状态
  useEffect(() => {
    if (currentChat.username === "SystemInfo") {
      if (arrivalMessage) {
        acceptBell.play();
        setMessages((prev) => [...prev, arrivalMessage]);
      }
    } else {
      if (arrivalMessage && arrivalMessage.from === currentChat._id) {
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
      socket.current.emit("send-msg", {
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
    console.log("message", message);
    const res = await axios.post(`${beFriendsRoute}`, {
      userId: currentUser._id,
      friendId: message.data._id,
      userName: currentUser.username,
      friendName: message.data.username,
    });
    console.log("res ", res);
    const data = res.data;
    if (!data.status) {
      toast.error(data.msg, toastOptions);
    } else {
      toast.success(data.msg, toastOptions);
      socket.current.emit("befriends", {
        toName: message.data.username,
        toId: message.data._id,
        friend: currentUser,
      });
      setTimeout(() => {
        //刷新页面
        window.location.reload();
      }, 500);
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
    console.log("res ", res);
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
    <Container>
      <div className="chat-header">
        <div className="user-details">
          <div className="avatar">
            <img
              src={`data:image/svg+xml;base64,${currentChat.avatarImage}`}
              alt=""
            />
          </div>
          {console.log("messages ", messages)}
          <div className="username">
            <h3>{currentChat.username}</h3>
          </div>
        </div>
        {/* <Logout /> */}
      </div>
      <div className="chat-messages">
        {messages.map((message) => {
          return (
            <div ref={scrollRef} key={uuidv4()}>
              {currentChat.username === "SystemInfo" &&
                message.info === "friendRequest" && (
                  <div className="friend-request-box">
                    <div className="user-info">
                      <img
                        src={`data:image/svg+xml;base64,${message.data.avatarImage}`}
                        alt="User Avatar"
                      />
                      <span className="username">{message.data.username}</span>
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
  );
};

const Container = styled.div`
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
      border: 1px solid #ccc;
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

export default ChatContainer;
