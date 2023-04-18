import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import styled from "styled-components";
import { allUsersRoute } from "../../api/index";
import Logo from "../../assets/logo.svg";
import Logout from "../../components/Logout";
import Avatar from "../../components/Avatar";
import { BiUserPlus } from "react-icons/bi";

const MobileChat = () => {
  const navigate = useNavigate();

  const [contacts, setContacts] = useState([]); //好友数据，现在默认数据库中的用户都互为好友

  const [currentUser, setCurrentUser] = useState(undefined); //当前用户
  const [currentUserName, setCurrentUserName] = useState(undefined); //当前用户名
  const [currentUserImage, setCurrentUserImage] = useState(undefined); //当前用户头像

  const [currentSelected, setCurrentSelected] = useState(undefined); //选择的对话，存储的值为数组index
  const [showSearch, setShowSearch] = useState(false);

  //点击搜索按钮出现的动作
  const toggleSearch = () => {
    setShowSearch(!showSearch);
  };

  //判断用户是否登录
  useEffect(() => {
    async function func() {
      if (!localStorage.getItem("profile")) {
        navigate("/login");
      } else {
        const data = await JSON.parse(localStorage.getItem("profile"));
        setCurrentUser(data);
        setCurrentUserImage(data.avatarImage);
        setCurrentUserName(data.username);
      }
    }
    func();
  }, []);

  //判断用户是否有头像
  useEffect(() => {
    async function func() {
      if (currentUser) {
        if (currentUser.isAvatarImageSet) {
          const data = await axios.get(`${allUsersRoute}/${currentUser._id}`);
          setContacts(data.data);
        } else {
          navigate("/setAvatar");
        }
      }
    }
    func();
  }, [currentUser]);

  //选择聊天对象后
  const changeCurrentChat = (index, contact) => {
    setCurrentSelected(index);
    navigate("/MobileChatContainer", {
      state: {
        currentUser: currentUser,
        currentChat: contact,
        // makeFriend: handleMakeFriend,
        abc: "123",
      },
    });
  };

  //验证路由传递函数引用的可行性
  const handleMakeFriend = () => {
    console.log("handleMakeFriend is working ....");
    console.log("currentSelected ", currentSelected);
  };
  return (
    <>
      {currentUserImage && (
        <Container>
          <div className="brand">
            <img src={Logo} alt="logo" />
            <h3>snappy</h3>
          </div>
          <div className="contacts">
            {contacts.map((contact, index) => {
              return (
                <div
                  key={contact._id}
                  className={`contact ${
                    index === currentSelected ? "selected" : ""
                  }`}
                  onClick={() => changeCurrentChat(index, contact)}
                >
                  <div className="avatar">
                    <img
                      src={`data:image/svg+xml;base64,${contact.avatarImage}`}
                      alt=""
                    />
                  </div>
                  <div className="username">
                    <h3>{contact.username}</h3>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="current-user">
            <div className="avatar">
              <img
                src={`data:image/svg+xml;base64,${currentUserImage}`}
                alt="avatar"
              />
            </div>
            <div className="username">
              <h2>{currentUserName}</h2>
            </div>
            <Logout />
            <Avatar />
            <button className="btn">
              <BiUserPlus />
            </button>
          </div>
        </Container>
      )}
    </>
  );
};

export default MobileChat;

const Container = styled.div`
  height: 100vh;
  width: 100vw;
  display: grid;
  grid-template-rows: 10% 75% 15%;
  overflow: hidden;
  background-color: #080420;
  .brand {
    display: flex;
    align-items: center;
    gap: 1rem;
    justify-content: center;
    img {
      height: 2rem;
    }
    h3 {
      color: white;
      text-transform: uppercase;
    }
  }
  .contacts {
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: auto;
    gap: 0.8rem;
    &::-webkit-scrollbar {
      width: 0.2rem;
      &-thumb {
        background-color: #ffffff39;
        width: 0.1rem;
        border-radius: 1rem;
      }
    }
    .contact {
      background-color: #ffffff34;
      min-height: 5rem;
      cursor: pointer;
      width: 90%;
      border-radius: 0.2rem;
      padding: 0.4rem;
      display: flex;
      gap: 1rem;
      align-items: center;
      transition: 0.5s ease-in-out;
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
    .selected {
      background-color: #9a86f3;
    }
  }

  .current-user {
    background-color: #0d0d30;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 2rem;
    .avatar {
      img {
        height: 4rem;
        max-inline-size: 100%;
      }
    }
    .username {
      h2 {
        color: white;
      }
    }
    .btn {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 0.5rem;
      border-radius: 0.5rem;
      background-color: #9a86f3;
      border: none;
      cursor: pointer;
      svg {
        font-size: 1.3rem;
        color: #ebe7ff;
      }
    }

    /* @media screen and (min-width: 720px) and (max-width: 1080px) {
      gap: 0.5rem;
      .username {
        h2 {
          font-size: 1rem;
        }
      }
    } */
  }
`;
