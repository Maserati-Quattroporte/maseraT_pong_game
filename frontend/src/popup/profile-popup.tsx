import { useState, useEffect } from "react";
import { UserInfoType } from "../type/user-info-type";
import { getCookie } from "../func/cookieFunc";
import { Record } from "./record";
import { AchievementType } from "../type/achievement-type";
import { socket } from "../App";
import { NavigateFunction, useNavigate } from "react-router-dom";
import AchievementImg from "../component/achievementImg/AchievementImg";
import ConsecThree from "../img/consecThree.svg";
import FirstLogin from "../img/firstLogin.svg";
import FirstLose from "../img/firstLose.svg";
import FirstWin from "../img/firstWin.svg";
import ThirdWin from "../img/thirdWin.svg";
import Button from "../component/button/Button";

type Props = {
  userId: string;
};

export function ProfilePopup({ userId }: Props): JSX.Element {
  const [info, setInfo] = useState<UserInfoType>();
  const [isFriend, setIsFriend] = useState(false);
  const [isBlock, setIsBlock] = useState(false);
  const [achievement, setAchievement] = useState<AchievementType>({
    firstLogin: false,
    firstWin: false,
    firstLose: false,
    thirdWin: false,
    consecThree: false
  });

  const navigate: NavigateFunction = useNavigate();

  useEffect(() => {
    fetch(process.env.REACT_APP_API_URL + "user/info/" + userId, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + getCookie("token")
      }
    })
      .then(res => res.json())
      .then((user: UserInfoType) => {
        setInfo(user);
        setIsFriend(user.isFriend);
        setIsBlock(user.isBlocked);
      });

    fetch(process.env.REACT_APP_API_URL + "achievement/" + userId, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + getCookie("token")
      }
    })
      .then(res => res.json())
      .then((achievement: AchievementType) => setAchievement(achievement));

    socket.on(
      "DM",
      ({ chatRoomId, targetId }: { chatRoomId: number; targetId: number }) => {
        navigate("/DM/" + chatRoomId + "/" + targetId);
      }
    );

    return () => {
      socket.off("DM");
    };
  }, [userId, navigate]);

  const onAddFriend = () => {
    setIsFriend(true);
    fetch(process.env.REACT_APP_API_URL + "friend/", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + getCookie("token"),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ targetId: userId })
    });
  };

  const onAddBlock = () => {
    setIsBlock(true);
    fetch(process.env.REACT_APP_API_URL + "block/", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + getCookie("token"),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ targetId: userId })
    });
  };

  const onDeleteBlock = () => {
    setIsBlock(false);
    fetch(process.env.REACT_APP_API_URL + "block/", {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + getCookie("token"),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ targetId: userId })
    });
  };

  const onDMClick = (targetId: number) => {
    socket.emit("DM", { senderId: getCookie("id"), targetId });
  };

  return (
    <div className="w-[500px] h-[500px] pl-[10px]">
      {info ? (
        <div className="flex flex-col items-center">
          <img
            className="h-[200px] w-[200px] border-2 rounded-[50%] mb-2"
            src={process.env.REACT_APP_API_URL + info.profileImg}
            alt=""
          />
          <p className="text-2xl p-2 mb-2">{info.nickname}</p>
          <p className="text-lg mb-2">level: {Math.floor(info.level)}</p>
          <p className="text-lg mb-2 flex border-2 rounded-md px-2 py-1">
            {achievement.firstLogin ? (
              <AchievementImg
                alt={"첫 로그인"}
                src={FirstLogin}
                className="mr-2"
              />
            ) : null}
            {achievement.firstWin ? (
              <AchievementImg alt={"첫승"} src={FirstWin} className="mr-2" />
            ) : null}
            {achievement.thirdWin ? (
              <AchievementImg alt={"3승"} src={ThirdWin} className="mr-2" />
            ) : null}
            {achievement.firstLose ? (
              <AchievementImg alt={"첫패"} src={FirstLose} className="mr-2" />
            ) : null}
            {achievement.consecThree ? (
              <AchievementImg alt={"3연승"} src={ConsecThree} />
            ) : null}
          </p>
          <p>
            <span className="text-lg">전적: </span>
            <span>
              {info.personalWin}승 {info.personalLose}패
            </span>
          </p>
          <p className="pb-3">
            <span className="text-lg">레더 전적: </span>
            <span>
              {info.ladderWin}승 {info.ladderLose}패
            </span>
          </p>
          <Record userId={userId} />
          <div className="flex justify-evenly flex-row items-center">
            <Button
              tag={"친구 추가"}
              className={"btn-sm mr-2"}
              disabled={isFriend}
              onClick={onAddFriend}
            />
            <Button
              tag={"DM 보내기 "}
              className={"btn-sm mr-2"}
              onClick={e => onDMClick(+userId)}
            />
            {isBlock ? (
              <Button
                tag={"차단 해제"}
                className={"btn-sm mr-2"}
                onClick={onDeleteBlock}
              />
            ) : (
              <Button tag={"차단 하기"} onClick={onAddBlock} />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
