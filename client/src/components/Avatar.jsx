import React from "react";
import { useNavigate } from "react-router-dom";
import { BiUser } from "react-icons/bi";
import styled from "styled-components";
export default function Avatar() {
  const navigate = useNavigate();
  const handleClick = async () => {
    navigate("/setAvatar");
  };
  return (
    <Button onClick={handleClick}>
      <BiUser />
    </Button>
  );
}

const Button = styled.button`
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
`;
