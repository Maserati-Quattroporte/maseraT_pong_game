import { ChatRoomList } from "../component/chat-room-list";
import { useState, useEffect } from "react";
import { ChatRoomInfo } from "../type/chat-room-info";
import { socket } from "../App";
import { useNavigate } from "react-router-dom";
import { Popup } from "reactjs-popup";
// import "reactjs-popup/dist/index.css";
import { ChatCreatePopup } from "../popup/chat-create-popup";

export function ChatMain() {
  const [rooms, setRooms] = useState<ChatRoomInfo[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:3000/chat/room", {
      method: "GET"
    })
      .then(res => res.json())
      .then(json => {
        setRooms(json);
      });

    socket.on("chat-room-join", (chatRoomInfo: ChatRoomInfo) => {
      navigate("/chat/" + chatRoomInfo.chatRoomId);
    });
    return () => {
      socket.off("chat-room-join");
    };
  }, [navigate]);

  useEffect(() => {
    socket.on("chat-room-create", (chatRoomInfo: ChatRoomInfo) => {
      setRooms(curr => {
        return [...curr, chatRoomInfo];
      });
    });

    socket.on("chat-room-destroy", ({ chatRoomId }) => {
      setRooms(curr =>
        curr.filter(idx => {
          return idx.chatRoomId !== +chatRoomId;
        })
      );
    });

    return () => {
      socket.off("chat-room-create");
      socket.off("chat-room-destroy");
    };
  }, [rooms]);

  return (
    <div>
      <h1>chatroom</h1>
      <Popup trigger={<button> 방생성 </button>} position="right center">
        <ChatCreatePopup />
      </Popup>
      {rooms.map(room => {
        return (
          <ChatRoomList
            key={room.chatRoomId}
            chatRoomId={room.chatRoomId}
            title={room.title}
            isPassword={room.isPassword}
          />
        );
      })}
    </div>
  );
}