import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import styled from "styled-components";
import { ToastContainer, toast } from "react-toastify";
import { io } from "socket.io-client";
import "react-toastify/dist/ReactToastify.css";
import {
  allUsersRoute,
  friendsRoute,
  friendRequestRoute,
  host,
} from "../../api/index";
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
  const [runOne, setRunOne] = useState(false); //让socketon befriends 只运行一次的标志变量
  const [arriveData, setArriveData] = useState(null);
  const inputRef = useRef(null); // 输入框的引用

  const socket = io(host);

  const toastOptions = {
    position: "top-right",
    autoClose: 8000,
    pauseOnHover: true,
    draggable: true,
    theme: "dark",
  };

  //点击搜索按钮出现的动作
  const handleDisplaySearch = () => {
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

        //设置了socket
        socket.emit("add-user", data._id);
        return () => socket.disconnect();
      }
    }
    func();
  }, []);

  useEffect(() => {
    if (socket) {
      if (!runOne) {
        // console.log("contacts0", contacts);
        socket.on("befriends", (friend) => {
          // console.log("显示添加的friend", friend);
          // console.log("contacts1", contacts);
          // console.log("contacts.length != 0", contacts.length != 0);
          setArriveData(friend);
          // console.log("contacts2", contacts);
        });
        setRunOne(true);
      }
    }
  });

  useEffect(() => {
    if (arriveData) {
      // console.log(" setContacts", contacts);
      setContacts([...contacts, arriveData]);
    }
  }, [arriveData]);

  //启用socket监听，监听befriend
  // useEffect(() => {
  //   if (socket) {
  //     if (contacts.length != 0) {
  //       if (!runOne) {
  //         console.log("contacts0", contacts);
  //         socket.on("befriends", (friend) => {
  //           console.log("显示添加的friend", friend);
  //           console.log("contacts1", contacts);
  //           console.log("contacts.length != 0", contacts.length != 0);
  //           setContacts([...contacts, friend]);
  //           console.log("contacts2", contacts);
  //         });
  //         setRunOne(true);
  //       }
  //     }
  //   }
  // });

  //判断用户是否有头像 ,请求好友数据
  useEffect(() => {
    async function func() {
      if (currentUser) {
        if (currentUser.isAvatarImageSet) {
          const data = await axios.get(`${friendsRoute}/${currentUser._id}`);
          setContacts(data.data);
          // console.log("contacts3", contacts);
        } else {
          navigate("/setAvatar");
        }
      }
    }
    func();
  }, [currentUser]);

  useEffect(() => {
    if (showSearch) {
      inputRef.current.focus();
    }
  }, [showSearch]);

  //选择聊天对象后
  const changeCurrentChat = (index, contact) => {
    setCurrentSelected(index);
    navigate("/MobileChatContainer", {
      state: {
        currentUser: currentUser,
        currentChat: contact,
        // makeFriend: handleMakeFriend,
      },
    });
  };

  //验证路由传递函数引用的可行性
  const handleMakeFriend = () => {
    console.log("handleMakeFriend is working ....");
    console.log("currentSelected ", currentSelected);
  };

  const handleEnter = async (e) => {
    if (e.keyCode === 13) {
      // alert(`enter ${e.target.value}`);
      //这里处理搜索到的内容
      const user = await JSON.parse(localStorage.getItem("profile"));
      const { data } = await axios.post(friendRequestRoute, {
        sender: user._id,
        to: e.target.value,
      });
      // console.log("res", data);
      if (!data.status) {
        // alert(data.msg);
        toast.error(data.msg, toastOptions);
      } else {
        toast.success(data.msg, toastOptions);
        //启动socket转发请求数据
        socket.emit("system_info", {
          info: "friendRequest",
          data: user,
          to: data.toId,
        });
        // console.log("socket send ", {
        //   info: "friendRequest",
        //   data: user,
        //   to: data.toId,
        // });
      }

      e.target.value = "";
      setShowSearch(false);
    }
  };
  return (
    <>
      {currentUserImage && (
        <Container>
          <div className="brand">
            <img src={Logo} alt="logo" />
            <h3>snappy</h3>
          </div>
          {/* {console.log("contacts4", contacts)} */}
          {/* {console.log("contacts.length != 0", contacts.length != 0)} */}
          <div className="contacts">
            {showSearch && (
              <input
                type="text"
                ref={inputRef}
                className="search"
                placeholder="Search"
                onKeyDown={handleEnter}
              />
            )}
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
            <button className="btn" onClick={handleDisplaySearch}>
              <BiUserPlus />
            </button>
          </div>
          <ToastContainer />
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
    } //设置搜索框样式
    .search {
      background-color: #ffffff35;
      min-height: 3rem;
      cursor: pointer;
      width: 93%;
      border-radius: 1rem;
      padding: 0.4rem;
      display: flex;
      gap: 1rem;
      align-items: center;
      transition: 0.5s ease-in-out;
      box-shadow: none;
      outline: none;

      background-color: #ffffff; /* 背景颜色 */
      color: #333333; /* 字体颜色 */
      border: 1px solid #cccccc; /* 边框颜色 */

      &:focus {
        border: 2px solid #9a86f3;
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
