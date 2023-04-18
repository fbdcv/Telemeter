import React, { useState, useEffect, useRef } from "react";

import styled from "styled-components";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import ChatInput from "./ChatInput";
import {
  sendMessageRoute,
  recieveMessageRoute,
  getFriendRequestRoute,
} from "../api/index";

const ChatContainer = ({ currentUser, currentChat, socket }) => {
  const [messages, setMessages] = useState([]); //存储聊天记录的数组
  const [arrivalMessage, setArrivalMessage] = useState(null); //接受socket传过来的数据
  const [runOne, setRunOne] = useState(false); //使客户端只启用一次监听

  //一个变量
  const scrollRef = useRef();

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

  //点击提交按钮，将对话内容推送到数据库，并推送socket
  // 在这个函数中可以获取到满足聊天的三要素: from(currentUser) to(currentChat) message(msg)
  const handleSendMsg = async (msg) => {
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
  };

  //监听数据并保证只启用一个监听
  useEffect(() => {
    if (!runOne) {
      if (socket.current) {
        socket.current.on("msg-recieve", (data) => {
          const { from, msg } = data;
          // console.log("from ", from);
          console.log("currentChat._id ", currentChat._id); //这个东西
          // console.log("from===currentChat._id ", from === currentChat._id);
          if (from === currentChat._id)
            setArrivalMessage({ fromSelf: false, message: msg, from });
        });
      }
      setRunOne(true);
    }
  }, [currentChat]);

  //如果通过socket获取到了数据，就将其追加到messages状态
  useEffect(() => {
    if (arrivalMessage && arrivalMessage.from === currentChat._id) {
      setMessages((prev) => [...prev, arrivalMessage]);
    }
  }, [arrivalMessage]);

  //如果messages有变动，将滑块下移
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        {/* <Logout /> */}
      </div>
      <div className="chat-messages">
        {messages.map((message) => {
          return (
            <div ref={scrollRef} key={uuidv4()}>
              <div
                className={`message ${
                  message.fromSelf ? "sended" : "recieved"
                }`}
              >
                <div className="content ">
                  <p>{message.message}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ChatInput handleSendMsg={handleSendMsg} />
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
        background-color: #4f04ff21;
      }
    }
    .recieved {
      justify-content: flex-start;
      .content {
        background-color: #9900ff20;
      }
    }
  }
`;

export default ChatContainer;
