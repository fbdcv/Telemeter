import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import SetAvatar from "./pages/SetAvatar";

import Chat from "./pages/Chat";
import MobileChat from "./pages/mobile/MobileChat";
import MobileChatContainer from "./pages/mobile/MobileChatContainer";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/setAvatar" element={<SetAvatar />} />
        <Route path="/MobileChatContainer" element={<MobileChatContainer />} />
        {window.matchMedia("(max-width: 768px)").matches ? (
          // mobile
          <Route path="/" element={<MobileChat />} />
        ) : (
          //PC
          <Route path="/" element={<Chat />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
