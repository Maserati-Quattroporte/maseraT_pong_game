import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Chat } from "../component/chat";
import { ChatType } from "../type/chat-type";
import TopBar from "../component/TopNavBar";
import { NavLink } from "react-router-dom";
import Button from "../component/button/Button";
import { socket } from "../App";
import { getCookie } from "../func/cookieFunc";

type DMInfoType = {
  targetNickname: string;
  message: ChatType[];
};

export function DM() {
  const { chatRoomId, targetId } = useParams();
  const [chats, setChats] = useState<ChatType[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(process.env.REACT_APP_API_URL + "chat/dm/" + chatRoomId, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + getCookie("token")
      }
    })
      .then(res => res.json())
      .then((dmInfo: DMInfoType) => {
        setChats(dmInfo.message);
        setTitle(dmInfo.targetNickname);
      });

    socket.emit("DM", { senderId: getCookie("id"), targetId });
  }, [chatRoomId, targetId]);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;

    socket.on("chat-room-message", (chatType: ChatType) => {
      setChats(curr => [...curr, chatType]);
    });
    return () => {
      socket.off("chat-room-message");
    };
  }, [chats]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

  const onClick = () => {
    if (message.length > 0) {
      socket.emit("chat-room-message", {
        chatRoomId,
        message,
        userId: getCookie("id")
      });
    }
    setMessage("");
  };

  const onEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onClick();
      setMessage("");
    }
  };

  return (
    <div className="h-full flex flex-col">
      <TopBar>
        <div className="content">
          <div className="content-box w-[550px] mr-3 my-5 relative rounded-none rounded-r-lg rounded-bl-lg">
            <div className="absolute top-[-30px] left-[-2px] border-main border-x-2 border-t-2 bg-white w-[60%] h-[31px] rounded-t-lg px-2 py-1 text-center">
              <div className="absolute left-5 cursor-pointer">
                <NavLink to="/chat">&lt;</NavLink>
              </div>
              <div>
                <span className="font-main text-main-text">
                  "{title}" 채팅방
                </span>
              </div>
            </div>
            <div className="w-full h-full flex flex-col justify-start items-center">
              <div
                ref={ref}
                className="w-[90%] h-[80%] border-main border-2 mt-7 p-1 font-main overflow-auto"
              >
                <ul>
                  {chats.map((chat, idx) => (
                    <Chat
                      key={idx}
                      nickname={chat.nickname}
                      message={chat.message}
                    />
                  ))}
                </ul>
              </div>
              <div className="w-[90%] flex justify-between mt-4">
                <input
                  onChange={onChange}
                  value={message}
                  type="text"
                  className="w-[85%] border-main border-2 rounded px-2 py-1 text-sm font-main"
                  onKeyPress={onEnter}
                />
                <div>
                  <Button
                    onClick={onClick}
                    tag="전송"
                    className="btn-sm py-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </TopBar>
    </div>
  );
}
