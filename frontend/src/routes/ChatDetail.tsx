import React from "react";
import { useParams, useNavigate, NavLink } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { ChatParticipantType } from "../type/chat-participant-type";
import { Chat } from "../component/chat";
import { ChatType } from "../type/chat-type";
import { socket } from "../App";
import { getCookie } from "../func/cookieFunc";
import { UserList } from "../component/list/user-list";
import { Authority } from "../type/enum/authority.enum";
import TopBar from "../component/TopNavBar";
import Button from "../component/button/Button";
import { RequestGamePopup } from "../popup/request-game-popup";

export type ReqGameType = {
  nickname: string;
  isSpeedMode: boolean;
  targetId: number;
};

type ChatRoomDetailType = {
  title: string;
  chatParticipant: ChatParticipantType[];
};

export function ChatDetail(): JSX.Element {
  const { chatRoomId } = useParams();
  const [participants, setParticipants] = useState<ChatParticipantType[]>([]);
  const [title, setTitle] = useState("");
  const [chats, setChats] = useState<ChatType[]>([]);
  const [message, setMessage] = useState("");
  const [reqGame, setReqGame] = useState<ReqGameType>();
  const [isGame, setIsGame] = useState(false);

  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRoomId) {
      localStorage.setItem("chatRoomId", chatRoomId);
    }

    fetch(process.env.REACT_APP_API_URL + "chat/room/" + chatRoomId, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + getCookie("token")
      }
    })
      .then(res => {
        if (res.status !== 200) throw new Error();

        socket.emit("chat-room-join", {
          chatRoomId,
          userId: getCookie("id")
        });
        return res.json();
      })
      .then((detail: ChatRoomDetailType) => {
        const check = detail.chatParticipant?.filter(
          part => part.userId === +getCookie("id")
        );
        if (!check) {
          navigate("/chat");
        }
        setParticipants(detail.chatParticipant);
        detail.chatParticipant?.forEach(participant => {
          if (participant.userId === +getCookie("id")) {
            localStorage.setItem("authority", String(participant.authority));
          }
        });
        setTitle(detail.title);
      })
      .catch(() => {
        navigate("/chat");
      });

    socket.on("request-game", (data: ReqGameType) => {
      setIsGame(true);
      setReqGame(data);
    });

    socket.on("game-room-join", ({ gameRoomId }: { gameRoomId: number }) => {
      navigate("/game/" + gameRoomId);
    });

    socket.on("response-game", ({ g }) => {});

    return () => {
      socket.emit("chat-room-leave", { chatRoomId, userId: getCookie("id") });
      localStorage.removeItem("authority");
      socket.off("request-game");
      socket.off("response-game");
      socket.off("game-room-join");
    };
  }, [chatRoomId, navigate]);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chats]);

  useEffect(() => {
    socket.on(
      "chat-room-leave",
      ({ nickname, userId }: { nickname: string; userId: number }) => {
        setParticipants(curr =>
          curr.filter(idx => {
            return idx.userId !== userId;
          })
        );

        setChats(curr => {
          return [
            ...curr,
            { nickname: "", message: nickname + "(이)가 나갔습니다" }
          ];
        });
      }
    );

    socket.on("chat-room-message", (chatType: ChatType) => {
      setChats(curr => [...curr, chatType]);
    });

    socket.on("chat-room-join", (participant: ChatParticipantType) => {
      setParticipants(curr => {
        return [
          ...curr,
          {
            nickname: participant.nickname,
            userId: participant.userId,
            authority: participant.authority
          }
        ];
      });

      setChats(curr => {
        return [
          ...curr,
          {
            nickname: "",
            message: participant.nickname + "(이)가 입장했습니다."
          }
        ];
      });
    });

    socket.on(
      "chat-room-set-admin",
      ({ userId, authority }: { userId: number; authority: Authority }) => {
        if (userId === +getCookie("id")) {
          localStorage.setItem("authority", String(authority));
        }

        setParticipants(curr => {
          curr.forEach(participant => {
            if (+participant.userId === userId)
              participant.authority = authority;
          });
          curr.sort((a, b) => b.authority - a.authority);
          return [...curr];
        });
      }
    );

    socket.on("chat-room-kick", ({ targetId }: { targetId: string }) => {
      if (targetId === getCookie("id")) {
        navigate("/chat");
      }
      setParticipants(curr => curr.filter(c => c.userId !== +targetId));
    });

    socket.on("chat-room-setting", ({ title }) => {
      setTitle(title);
    });

    return () => {
      socket.off("chat-room-leave");
      socket.off("chat-room-message");
      socket.off("chat-room-join");
      socket.off("chat-room-set-admin");
      socket.off("chat-room-kick");
    };
  }, [participants, chats, navigate]);

  const onClick = () => {
    if (message.length <= 0) return;
    socket.emit("chat-room-message", {
      chatRoomId,
      userId: getCookie("id"),
      message
    });
    setMessage("");
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
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
                  "{title}" 제목의 채팅방
                </span>
              </div>
            </div>
            <div className="w-full h-full flex flex-col justify-start items-center">
              <div
                className="w-[90%] h-[80%] border-main border-2 mt-7 p-1 font-main overflow-auto"
                ref={scrollRef}
              >
                <ul>
                  {chats.map((chat, index) => {
                    return (
                      <Chat
                        key={index}
                        nickname={chat.nickname}
                        message={chat.message}
                      />
                    );
                  })}
                </ul>
              </div>
              <div className="w-[90%] flex justify-between mt-4">
                <input
                  type="text"
                  className="w-[85%] border-main border-2 rounded px-2 py-1 text-sm font-main"
                  onChange={onChange}
                  value={message}
                  onKeyPress={onEnter}
                />
                <div>
                  <Button
                    tag="전송"
                    className="btn-sm py-1"
                    onClick={onClick}
                  />
                </div>
              </div>
            </div>
          </div>
          <div>
            <UserList
              isChatRoom={true}
              participants={participants}
              chatRoomId={chatRoomId}
            />
          </div>
          {isGame ? (
            <RequestGamePopup game={reqGame} setIsGame={setIsGame} />
          ) : null}
        </div>
      </TopBar>
    </div>
  );
}
