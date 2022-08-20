import React, { useState } from "react";
import { socket } from "../App";
import { getCookie } from "../func/cookieFunc";
import Button from "../component/button/Button";

export function GameCreatePopup(): JSX.Element {
  const [title, setTitle] = useState("");
  const [check, setCheck] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.length < 13) setTitle(e.target.value);
  };

  const onClick = () => {
    socket.emit("game-room-join", {
      gameRoomId: 0,
      title,
      userId: getCookie("id"),
      isSpeedMode: check,
      isLadder: false
    });
  };

  const onCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCheck(curr => !curr);
  };

  return (
    <div className="w-[200px] h-[150px] flex flex-col justify-center items-center">
      <div className="flex flex-col my-4">
        <div className="mb-2">
          <label>방 제목</label>
          <input
            className="border-2 w-full rounded-md mb-2 mt-1"
            value={title}
            onChange={onChange}
          ></input>
        </div>
        <div className="flex justify-between">
          <label>스피드 모드</label>
          <input type="checkbox" onChange={onCheck} />
        </div>
      </div>
      <Button tag={"생성"} onClick={onClick} />
    </div>
  );
}
