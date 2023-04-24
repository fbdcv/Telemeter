import React, { useEffect, useState, useRef } from "react";
import styled from "styled-components";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Logo from "../assets/logo.svg";
import Logout from "./Logout";
import Avatar from "./Avatar";
import { BiUserPlus } from "react-icons/bi";
import { friendRequestRoute } from "../api/index";

export default function Contacts({ contacts, changeChat, socket, addContact }) {
  const [currentUserName, setCurrentUserName] = useState(undefined); //当前用户名
  const [currentUserImage, setCurrentUserImage] = useState(undefined); //当前用户头像
  const [currentSelected, setCurrentSelected] = useState(undefined); //选择的对话，存储的值为数组index
  const [showSearch, setShowSearch] = useState(false); //是否显示搜索框

  const [runOne, setRunOne] = useState(false); //让socketon befriends 只运行一次的标志变量

  const inputRef = useRef(null); // 输入框的引用

  const toastOptions = {
    position: "bottom-right",
    autoClose: 8000,
    pauseOnHover: true,
    draggable: true,
    theme: "dark",
  };

  //获取当前用户信息
  useEffect(() => {
    async function func() {
      const data = await JSON.parse(localStorage.getItem("profile"));
      setCurrentUserName(data.username);
      setCurrentUserImage(data.avatarImage);
    }
    func();
  }, []);

  useEffect(() => {
    if (showSearch) {
      inputRef.current.focus();
    }
  }, [showSearch]);

  //启用socket监听，监听befriend
  useEffect(() => {
    if (socket.current) {
      if (!runOne) {
        socket.current.on("befriends", (friend) => {
          // console.log("显示添加的friend", friend);
          addContact(friend);
        });
        setRunOne(true);
      }
    }
  });

  const changeCurrentChat = (index, contact) => {
    setCurrentSelected(index);
    changeChat(contact);
  };

  const handleDisplaySearch = () => {
    setShowSearch(!showSearch);
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
        socket.current.emit("system_info", {
          info: "friendRequest",
          data: user,
          to: data.toId,
        });
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
}
const Container = styled.div`
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
    //设置搜索框样式
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
    gap: 0.9rem;
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
    @media screen and (min-width: 720px) and (max-width: 1080px) {
      gap: 0.5rem;
      .username {
        h2 {
          font-size: 1rem;
        }
      }
    }
  }
`;
