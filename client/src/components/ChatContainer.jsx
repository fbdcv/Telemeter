import React, { useState, useEffect, useRef, useReducer } from "react";
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

import Draggable from "react-draggable";

import testMp4 from "../assets/1.mp4";

import { TbExchange } from "react-icons/tb";

import { ImPhoneHangUp } from "react-icons/im";

import Peer from "simple-peer";

const ChatContainer = ({ currentUser, currentChat, socket }) => {
  const [messages, setMessages] = useState([]); //存储聊天记录的数组
  const [arrivalMessage, setArrivalMessage] = useState(null); //接受socket传过来的数据
  const [runOne, setRunOne] = useState(false); //使客户端只启用一次监听
  const [isShowVideo, SetIsShowVideo] = useState(false); //是否按下VideoChat按钮

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();
  const [call, setCall] = useState({}); //记录对方的signal信息

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
        // console.log("res", res);
        // console.log("res.data", res.data);
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
          socket.current.on("system_info", (sysinfo) => {
            const { info, data } = sysinfo;
            setArrivalMessage({ info, data });
          });
        }
      } else {
        if (socket.current) {
          //监听文本数据
          socket.current.on("msg-recieve", (data) => {
            const { from, msg } = data;
            setArrivalMessage({
              fromSelf: false,
              message: msg,
              from,
              type: "text",
            });
          });
          //监听视频通话请求
          socket.current.on("callUser", (data) => {
            const { signal, from } = data;
            setCall({ signal: signal });
            setArrivalMessage({
              from,
              type: "videoChat",
            });
          });

          socket.current.on("callAccepted", (signal) => {
            console.log("设置获取到的对方的信令数据");
            console.log("signal2", signal);
            connectionRef.current.signal(signal);
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
        console.log(" arrivalMessage", arrivalMessage);
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
      msgs.push({ fromSelf: true, message: msg, type: "text" });
      setMessages(msgs);
    }
  };

  const handlePushVideo = () => {
    if (!isShowVideo) {
      //显示video窗口
      SetIsShowVideo(true);

      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((currentStream) => {
          myVideo.current.srcObject = currentStream;
          const stream = currentStream;
          //向对方发出callUser消息
          const peer = new Peer({ initiator: true, trickle: false, stream });
          console.log("stream", stream);

          // Peer对象初始化后就会生成信令数据并触发signal事件，处理信令数据
          peer.on("signal", (data) => {
            socket.current.emit("callUser", {
              userToCall: currentChat._id,
              signalData: data,
              from: currentUser._id,
              // name,
            });
          });

          peer.on("stream", (currentStream) => {
            userVideo.current.srcObject = currentStream;
          });

          // 监听 Simple-Peer 对象销毁事件，回调函数
          peer.on("close", () => {
            console.log("Peer destroyed");
            peer.removeAllListeners(); //移除所有监听器
            peer.destroy();
          });
          connectionRef.current = peer;

          // //等待answerUser响应
          // socket.current.on("callAccepted", (signal) => {
          //   // 对方接受了通讯请求
          //   // setCallAccepted(true);
          //   //设置获取到的对方的信令数据
          //   console.log("设置获取到的对方的信令数据");
          //   console.log("signal2", signal);
          //   peer.signal(signal);
          // });
        })
        .catch((error) => {
          console.log(error);
        });
    }
  };

  const handleExchange = () => {
    // 获取两个video元素
    const firstVideo = myVideo.current;
    const secondVideo = userVideo.current;

    // 保存它们的src属性值
    const firstSrc = firstVideo.srcObject;
    const secondSrc = secondVideo.srcObject;

    // 交换它们的src属性值
    firstVideo.srcObject = secondSrc;
    secondVideo.srcObject = firstSrc;
  };

  const handleHangup = () => {
    // 销毁当前的peer
    if (connectionRef.current) {
      // 销毁 Simple-Peer 对象

      window.location.reload();
    } else {
      console.error("peer is not defined");
    }

    //关闭video窗口
    SetIsShowVideo(false);
  };

  const handleAcceptVideoChat = () => {
    if (connectionRef.current) {
      //当前正在通话，不能接受视频视频请求
      alert("当前正在通话，不能接受视频视频请求");
    } else {
      //显示video窗口
      SetIsShowVideo(true);

      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((currentStream) => {
          myVideo.current.srcObject = currentStream;

          const stream = currentStream;
          console.log("stream", stream);
          const peer = new Peer({ initiator: false, trickle: false, stream });

          //向发送方发送信令数据
          peer.on("signal", (data) => {
            console.log("向发送方发送信令数据");
            socket.current.emit("answerCall", {
              signal: data,
              to: currentChat._id,
            });
          });

          //一旦双方建立连接，对方发送流，就会触发stream事件
          peer.on("stream", (currentStream) => {
            //存储对方的流
            console.log("存储了对方的流");
            userVideo.current.srcObject = currentStream;
          });

          // 监听 Simple-Peer 对象销毁事件，回调函数
          peer.on("close", () => {
            console.log("Peer destroyed");
            peer.removeAllListeners(); //移除所有监听器
          });

          //设置获取到的对方的信令数据
          peer.signal(call.signal);

          connectionRef.current = peer;
        })
        .catch((error) => {
          console.log(error);
        });
    }
  };

  const handleRejectVideoChat = () => {};

  const handleAcceptBeFriends = async (message) => {
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
      socket.current.emit("befriends", {
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

  const handleRejectBeFriends = async (message) => {
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
    <Container>
      <div className="chat-header">
        <div className="user-details">
          <div className="avatar">
            <img
              src={`data:image/svg+xml;base64,${currentChat.avatarImage}`}
              alt=""
            />
          </div>
          <div className="username">
            <h3>{currentChat.username}</h3>
          </div>
        </div>
      </div>
      <div className="chat-messages">
        {isShowVideo && (
          <Draggable
            bounds={{
              top: -35,
              left: 0,
              right: 850,
              bottom: 380,
            }}
            // bounds="parent"
            handle=".handle"
          >
            <div className="video-area">
              {/* <h1>hello</h1> */}
              <div className="video">
                <video
                  // className="video1"
                  className="handle"
                  playsInline
                  muted
                  // src={testMp4}
                  ref={userVideo}
                  autoPlay
                />
                <Draggable bounds="parent">
                  <video
                    className="video2"
                    playsInline
                    muted
                    // src={testMp4}
                    ref={myVideo}
                    autoPlay
                  />
                </Draggable>
              </div>
              <div className="video-button">
                <button onClick={handleExchange}>
                  <TbExchange />
                </button>
                <button onClick={handleHangup}>
                  <ImPhoneHangUp />
                </button>
              </div>
            </div>
          </Draggable>
        )}

        {messages.map((message) => {
          return (
            <div ref={scrollRef} key={uuidv4()}>
              {/* 如果用户是系统通知 */}
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
                        onClick={() => handleAcceptBeFriends(message)}
                      >
                        接受
                      </button>
                      <button
                        className="reject"
                        onClick={() => handleRejectBeFriends(message)}
                      >
                        拒绝
                      </button>
                    </div>
                  </div>
                )}
              {currentChat.username === "SystemInfo" &&
                message.info !== "friendRequest" && <div></div>}
              {/* 如果用户不是系统通知 */}
              {currentChat.username !== "SystemInfo" &&
                message.type === "text" && (
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
              {currentChat.username !== "SystemInfo" &&
                message.type === "videoChat" && (
                  <div className="video-chat-box">
                    <h1> 对方请求视频通话</h1>
                    <button onClick={handleAcceptVideoChat}>接受</button>
                  </div>
                )}
            </div>
          );
        })}
      </div>

      <ChatInput
        handleSendMsg={handleSendMsg}
        handlePushVideo={handlePushVideo}
      />
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
    .video-area {
      position: fixed;
      background-color: #56368e;
      width: 15vw;
      height: 25vh;
      border-radius: 0.8rem;
      .video {
        position: relative;
        video:first-of-type {
          /* 此处为选中div元素中的第一个video元素 */
          width: 15vw;
          height: 18vh;
          border: 1px solid #56368e;
          border-radius: 0.8rem;
        }
        .video2 {
          position: absolute;
          top: 12.5vh;
          left: 11.2vw;
          width: 25%;
          height: 25%;
          z-index: 1;
          border: 1px solid white;
        }
      }
      .video-button {
        display: flex;
        position: relative;
        overflow: hidden;
        justify-content: space-between;
        width: 90%;
        gap: 0vh;
        top: 3vh;
        left: 1vw;

        button {
          padding: 0.25rem 0.8rem;
          border-radius: 0.5rem;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: #9a86f3;
          border: none;
          svg {
            font-size: 1rem;
            color: #fdfdfd;
          }
          &:active {
            /* box-shadow: 3px 3px 5px 2px #3f17b0; */
            border: 2px solid white;
          }
        }
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
    .video-chat-box {
      width: 60%;
      margin: 0 auto;
      border: 1px solid #163bcb;
      background-color: #4f04ff21;
      padding: 20px;
      button {
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
`;

export default ChatContainer;
