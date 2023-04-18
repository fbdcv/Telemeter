import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { io } from "socket.io-client";
import { allUsersRoute, host, friendsRoute } from "../api/index";
import Contacts from "../components/Contacts";
import Welcome from "../components/Welcome";
import ChatContainer from "../components/ChatContainer";

export default function Chat() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]); //好友数据，现在默认数据库中的用户都互为好友
  const [currentChat, setCurrentChat] = useState(undefined); //选择的对话，存储的是某个好友数据
  const [currentUser, setCurrentUser] = useState(undefined); //当前用户

  const socket = useRef(); //引入react引用（类似state但是值变化不会渲染组件）

  //判断用户是否登录
  useEffect(() => {
    async function func() {
      if (!localStorage.getItem("profile")) {
        navigate("/login");
      } else {
        setCurrentUser(await JSON.parse(localStorage.getItem("profile")));
      }
    }
    func();
  }, []);

  //判断用户是否有头像,请求好友数据
  useEffect(() => {
    async function func() {
      if (currentUser) {
        if (currentUser.isAvatarImageSet) {
          // const data = await axios.get(`${allUsersRoute}/${currentUser._id}`);
          const data = await axios.get(`${friendsRoute}/${currentUser._id}`);
          console.log("friends", data.data);
          setContacts(data.data);
        } else {
          navigate("/setAvatar");
        }
      }
    }
    func();
  }, [currentUser]);

  //在服务器存储socket的id，便于转发
  useEffect(() => {
    if (currentUser) {
      socket.current = io(host);
      socket.current.emit("add-user", currentUser._id);
    }
  }, [currentUser]);

  const handleChatChange = (chat) => {
    setCurrentChat(chat);
  };

  return (
    <>
      <Container>
        <div className="container">
          {/* 注意组件参数 */}
          <Contacts contacts={contacts} changeChat={handleChatChange} />

          {currentChat === undefined ? (
            <Welcome />
          ) : (
            <ChatContainer
              currentChat={currentChat}
              currentUser={currentUser}
              socket={socket}
            />
          )}
        </div>
      </Container>
    </>
  );
}

const Container = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
  align-items: center;
  background-color: #131324;
  .container {
    height: 85vh;
    width: 85vw;
    background-color: #00000076;
    display: grid;
    grid-template-columns: 25% 75%;
    @media screen and (min-width: 720px) and (max-width: 1080px) {
      grid-template-columns: 35% 65%;
    }
  }
`;
