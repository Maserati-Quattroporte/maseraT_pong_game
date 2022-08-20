import { Record } from "./record";
import { useState, useEffect } from "react";
import { UserInfoType } from "../type/user-info-type";
import { getCookie } from "../func/cookieFunc";
import { Link } from "react-router-dom";
import { AchievementType } from "../type/achievement-type";
import AchievementImg from "../component/achievementImg/AchievementImg";
import ConsecThree from "../img/consecThree.svg";
import FirstLogin from "../img/firstLogin.svg";
import FirstLose from "../img/firstLose.svg";
import FirstWin from "../img/firstWin.svg";
import ThirdWin from "../img/thirdWin.svg";
import Button from "../component/button/Button";

export function MyProfilePopup(): JSX.Element {
  const [info, setInfo] = useState<UserInfoType>();
  const [achievement, setAchievement] = useState<AchievementType>({
    firstLogin: false,
    firstWin: false,
    firstLose: false,
    thirdWin: false,
    consecThree: false
  });

  useEffect(() => {
    fetch(process.env.REACT_APP_API_URL + "user/info", {
      method: "GET",
      headers: {
        Authorization: "Bearer " + getCookie("token")
      }
    })
      .then(res => res.json())
      .then((json: UserInfoType) => setInfo(json));

    fetch(process.env.REACT_APP_API_URL + "achievement/", {
      method: "GET",
      headers: {
        Authorization: "Bearer " + getCookie("token")
      }
    })
      .then(res => res.json())
      .then((json: AchievementType) => setAchievement(json));
  }, []);

  return (
    <div className="w-[500px] h-[500px] pl-[10px] flex justify-center items-center">
      {info ? (
        <div className="flex flex-col items-center">
          <img
            className="h-[200px] w-[200px] border-2 rounded-[50%] mb-2"
            src={process.env.REACT_APP_API_URL + info.profileImg}
            alt=""
          />
          <p className="text-2xl p-2 mb-2">{info.nickname}</p>
          <p className="text-lg mb-2">level:{Math.floor(info.level)}</p>
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
          <Record userId={""} />
          <Link to="/login">
            <Button tag={"프로필 수정"} />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
