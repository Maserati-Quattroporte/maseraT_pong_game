import { useState, useEffect } from "react";
import { UserList } from "../component/list/user-list";
import { getCookie } from "../func/cookieFunc";
import { GameRoomList } from "../component/list/game-room-list";
import { socket } from "../App";
import { useNavigate } from "react-router-dom";
import { GameCreatePopup } from "../popup/game-create-popup";
import { MatchPopup } from "../popup/match-popup";
import TopBar from "../component/TopNavBar";
import PopupControl from "../popup/PopupControl";
import Button from "../component/button/Button";

export type GameRoomType = {
  id: number;
  title: string;
  isLadder: boolean;
  isStart: boolean;
};

export function GameMain() {
  const [gameRooms, setGameRooms] = useState<GameRoomType[]>([]);
  const navigate = useNavigate();
  const [openModal, setOpenModal] = useState(false);
  const [openLadderModal, setOpenLadderModal] = useState(false);

  useEffect(() => {
    fetch(process.env.REACT_APP_API_URL + "game/room", {
      method: "GET",
      headers: {
        Authorization: getCookie("token")
      }
    })
      .then(res => res.json())
      .then((gameRoom: GameRoomType[]) => setGameRooms(gameRoom));
  }, []);

  useEffect(() => {
    socket.on("game-room-create", (gameRoom: GameRoomType) => {
      setGameRooms(curr => [...curr, gameRoom]);
    });

    socket.on("game-room-join", ({ gameRoomId }: { gameRoomId: number }) => {
      navigate("/game/" + gameRoomId);
    });

    socket.on("game-room-destroy", ({ gameRoomId }: { gameRoomId: number }) => {
      setGameRooms(rooms => rooms.filter(room => room.id !== +gameRoomId));
    });

    socket.on(
      "change-state-game",
      ({ gameRoomId, isStart }: { gameRoomId: number; isStart: boolean }) => {
        setGameRooms(Rooms =>
          Rooms.map(room => {
            if (room.id === +gameRoomId) {
              room.isStart = isStart;
            }
            return room;
          })
        );
      }
    );

    return () => {
      socket.off("game-room-create");
      socket.off("game-room-join");
      socket.off("game-room-destroy");
      socket.off("match");
      socket.off("change-state-game");
    };
  }, [gameRooms, navigate]);

  return (
    <div className="h-full flex flex-col">
      <TopBar>
        <div className="content">
          <div className="content-box w-[550px] mr-3 my-5">
            <div className="w-[90%] flex justify-end pt-4 pb-4">
              <Button
                tag={"래더 매칭"}
                className="btn-sm px-4 tracking-widest text-sm mr-2"
                onClick={() => setOpenLadderModal(true)}
              />
              {openLadderModal && (
                <PopupControl
                  mainText={"래더 매칭"}
                  onClick={() => {
                    setOpenLadderModal(false);
                    socket.emit("cancel-match", { userId: getCookie("id") });
                  }}
                >
                  <MatchPopup setIsMatching={() => setOpenLadderModal(false)} />
                </PopupControl>
              )}
              <Button
                tag={"방생성"}
                className="btn-sm px-4 tracking-widest text-sm"
                onClick={() => setOpenModal(true)}
              />
              {openModal && (
                <PopupControl
                  mainText={"방생성"}
                  onClick={() => setOpenModal(false)}
                >
                  <GameCreatePopup />
                </PopupControl>
              )}
            </div>
            <div className="h-full">
              {gameRooms.map(gameRoom => (
                <GameRoomList
                  key={gameRoom.id}
                  id={gameRoom.id}
                  title={gameRoom.title}
                  isLadder={gameRoom.isLadder}
                  isStart={gameRoom.isStart}
                />
              ))}
            </div>
          </div>
          <div>
            <UserList isChatRoom={false} participants={null} />
          </div>
        </div>
      </TopBar>
    </div>
  );
}
