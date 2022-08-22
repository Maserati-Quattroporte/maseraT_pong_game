import { useParams } from "react-router";
import { useNavigate } from "react-router-dom";
import { GameProfile } from "../component/game-profile";
import { useEffect, useState } from "react";
import { socket } from "../App";
import { getCookie } from "../func/cookieFunc";
import { Game } from "../component/game";
import TopBar from "../component/TopNavBar";
import Button from "../component/button/Button";

export type GameUserType = {
  userId: number;
  nickname: string;
  profileImg: string;
  level: number;
  personalWin: number;
  personalLose: number;
  ladderWin: number;
  ladderLose: number;
  position: number;
};

type GameInfoType = {
  gameUser: GameUserType[];
  title: string;
  isLadder: boolean;
};

export function GameDetail(): JSX.Element {
  const { gameRoomId } = useParams();
  const [gameUsers, setGameUsers] = useState<GameUserType[]>([]);
  const [title, setTitle] = useState("");
  const [position, setPosition] = useState(2);
  const [start, setStart] = useState(false);
  const [isLadder, setIsLadder] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetch(process.env.REACT_APP_API_URL + "game/room/" + gameRoomId, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + getCookie("token")
      }
    })
      .then(res => {
        if (res.status !== 200) throw new Error();

        socket.emit("game-room-join", {
          gameRoomId,
          title: "",
          userId: getCookie("id"),
          isSpeedMode: false,
          isLadder: false
        });
        return res.json();
      })
      .then((gameInfo: GameInfoType) => {
        setGameUsers(gameInfo.gameUser);
        setTitle(gameInfo.title);
        gameInfo.gameUser.forEach(user => {
          if (user.userId === +getCookie("id")) {
            setPosition(user.position);
          }
        });
        setIsLadder(gameInfo.isLadder);
      })
      .catch(error => {
        navigate("/game");
        return;
      });

    return () => {
      socket.emit("game-room-leave", { gameRoomId, userId: getCookie("id") });
    };
  }, [gameRoomId, navigate]);

  useEffect(() => {
    socket.on("game-room-join", ({ gameUser }: { gameUser: GameUserType }) => {
      setGameUsers(currUsers =>
        currUsers.map(currUser => {
          if (currUser.position === gameUser.position) {
            currUser = gameUser;
          }
          return currUser;
        })
      );
    });

    socket.on("game-room-leave", ({ userId }: { userId: number }) => {
      setGameUsers(users =>
        users.map(user => {
          if (user.userId === +userId) {
            user.userId = 0;
            user.nickname = "";
            user.profileImg = "maserat.png";
            user.level = 0;
            user.personalWin = 0;
            user.personalLose = 0;
            user.ladderWin = 0;
            user.ladderLose = 0;
          }
          return user;
        })
      );
    });

    socket.on("end-game", (gameUserData: GameUserType[]) => {
      if (isLadder) {
        navigate("/game");
      } else {
        setGameUsers(currUsers =>
          currUsers.map(currUser => {
            if (currUser.position === 0) {
              currUser = gameUserData[0];
            } else if (currUser.position === 1) {
              currUser = gameUserData[1];
            }
            return currUser;
          })
        );

        setStart(false);
      }
    });

    if (isLadder && gameUsers[0].userId === +getCookie("id")) {
      socket.emit("start-game", { gameRoomId, isLadder });
    }

    return () => {
      socket.off("game-room-leave");
      socket.off("game-room-join");
      socket.off("end-game");
    };
  }, [gameUsers, gameRoomId, isLadder, navigate]);

  const onStart = () => {
    socket.emit("start-game", { gameRoomId, isLadder: false });
    setStart(true);
  };

  return (
    <div className="h-full flex flex-col">
      <TopBar>
        <div className="content flex-col">
          <h2>{title}</h2>
          <div className="flex">
            {gameUsers.length ? (
              <GameProfile
                userId={gameUsers[0].userId}
                nickname={gameUsers[0].nickname}
                profileImg={gameUsers[0].profileImg}
                level={Math.floor(gameUsers[0].level)}
                personalWin={gameUsers[0].personalWin}
                personalLose={gameUsers[0].personalLose}
                ladderWin={gameUsers[0].ladderWin}
                ladderLose={gameUsers[0].ladderLose}
                position={gameUsers[0].position}
              />
            ) : null}
            <Game position={position} gameRoomId={gameRoomId} start={start} />
            {gameUsers.length ? (
              <GameProfile
                userId={gameUsers[1].userId}
                nickname={gameUsers[1].nickname}
                profileImg={gameUsers[1].profileImg}
                level={Math.floor(gameUsers[1].level)}
                personalWin={gameUsers[1].personalWin}
                personalLose={gameUsers[1].personalLose}
                ladderWin={gameUsers[1].ladderWin}
                ladderLose={gameUsers[1].ladderLose}
                position={gameUsers[1].position}
              />
            ) : null}
          </div>
          {gameUsers.length &&
          gameUsers[0].userId === +getCookie("id") &&
          !isLadder ? (
            <Button
              tag={"게임 시작"}
              onClick={onStart}
              disabled={
                gameUsers.length && !start
                  ? gameUsers[0].userId === 0 || gameUsers[1].userId === 0
                  : true
              }
            />
          ) : null}
        </div>
      </TopBar>
    </div>
  );
}
