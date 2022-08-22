import React, { useState } from "react";
import ReactDOM from "react-dom";
import { Authority } from "../type/enum/authority.enum";
import { getCookie } from "../func/cookieFunc";
import { socket } from "../App";
import { ChatPopupType } from "../type/chat-popup-type";
import { Dispatch, SetStateAction } from "react";
import { ProfilePopup } from "./profile-popup";
import Button from "../component/button/Button";
import PopupControl from "./PopupControl";

type userProps = {
  user: ChatPopupType;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
};

export function ChatPopup({ user, setIsOpen }: userProps): JSX.Element {
  // id -> target id
  const { id, authority } = user;
  const chatRoomId = localStorage.getItem("chatRoomId")
    ? localStorage.getItem("chatRoomId")
    : 0;
  const myAuthority = localStorage.getItem("authority");
  const [openModal, setOpenModal] = useState(false);
  const portalDiv = document.getElementById("portal") as HTMLElement;

  // 내 프로필 넣기
  if (id === +getCookie("id")) return <div></div>;

  const onSetAdmin = () => {
    const isAdmin: boolean = Authority.ADMIN !== authority;

    socket.emit("chat-room-set-admin", {
      chatRoomId: chatRoomId,
      isAdmin,
      userId: id
    });
    setIsOpen(false);
  };

  const onKick = () => {
    socket.emit("chat-room-kick", {
      targetId: id,
      chatRoomId
    });
    setIsOpen(false);
  };

  const onBan = () => {
    socket.emit("chat-room-ban", {
      targetId: id,
      chatRoomId
    });
    setIsOpen(false);
  };

  const style = "w-[100px] btn-sm my-1";

  const onChatBlock = () => {
    socket.emit("chat-block", { targetId: id });
    setIsOpen(false);
  };

  const onRequestGame = (isSpeedMode: boolean) => {
    socket.emit("request-game", {
      userId: getCookie("id"),
      targetId: id,
      isSpeedMode
    });
    setIsOpen(false);
  };

  return ReactDOM.createPortal(
    <>
      <button
        className="fixed top-0 left-0 right-0 bottom-0 bg-[rgba(0,0,0,.1)] z-[1000]"
        onClick={() => setIsOpen(false)}
      ></button>
      <div className="fixed top-[50%] left-[55%] translate-x-[-55%] translate-y-[-50%] z-[1000]">
        <div className="flex flex-col items-center border-2 py-2 px-4 border-main rounded-md bg-white">
          {/* <h1 className="text-center mb-2 text-lg py-3 px-2">{name}</h1> */}
          {myAuthority && +myAuthority >= Authority.OWNER ? (
            <Button
              className={style}
              tag={
                authority === Authority.ADMIN ? "관리자 해임" : "관리자 임명"
              }
              onClick={onSetAdmin}
            />
          ) : null}
          {myAuthority &&
          +myAuthority >= Authority.ADMIN &&
          +myAuthority > authority ? (
            <Button className={style} tag={"강퇴"} onClick={onKick} />
          ) : null}
          {myAuthority &&
          +myAuthority >= Authority.ADMIN &&
          +myAuthority > authority ? (
            <Button className={style} tag={"입장 금지"} onClick={onBan} />
          ) : null}
          {myAuthority &&
          +myAuthority >= Authority.ADMIN &&
          +myAuthority > authority ? (
            <Button className={style} tag={"채팅 금지"} onClick={onChatBlock} />
          ) : null}
          <Button
            className={style}
            tag={"프로필"}
            onClick={() => setOpenModal(true)}
          />
          {openModal && (
            <PopupControl
              mainText="프로필 보기"
              onClick={() => {
                setIsOpen(false);
                setOpenModal(false);
              }}
            >
              <ProfilePopup userId={id} />
            </PopupControl>
          )}{" "}
          <Button
            className={style}
            tag={"게임 신청"}
            onClick={e => onRequestGame(false)}
          />
          <Button
            className={style}
            tag={"스피드 게임 신청"}
            onClick={e => onRequestGame(true)}
          />
        </div>
      </div>
    </>,
    portalDiv
  );
}
