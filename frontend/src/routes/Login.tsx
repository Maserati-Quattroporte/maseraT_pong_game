import React, { useState, useEffect, useRef } from "react";
import { getCookie } from "../func/cookieFunc";
import { useNavigate } from "react-router-dom";
import { SecondAuthPopup } from "../popup/second-auth-popup";
import Button from "../component/button/Button";
import PopupControl from "../popup/PopupControl";

export function Login() {
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<File>();
  const [isSecondAuth, setIsSecondAuth] = useState(false);

  const [imgUrl, setImgUrl] = useState("");
  const [btnEnable, setBtnEnable] = useState(false);
  const [checkMsg, setCheckMsg] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(process.env.REACT_APP_API_URL + "user/info", {
      method: "GET",
      headers: {
        Authorization: "Bearer " + getCookie("token")
      }
    })
      .then(res => res.json())
      .then(
        (json: {
          nickname: string;
          profileImg: string;
          secondAuth: boolean;
          email: string;
        }) => {
          setNickname(json.nickname);
          setImgUrl(process.env.REACT_APP_API_URL + json.profileImg);
          setIsSecondAuth(json.secondAuth);
          setEmail(json.email);
        }
      );
  }, []);

  const imageInput = useRef<HTMLInputElement>(null);

  const onClick = () => {
    if (imageInput.current) imageInput.current.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImgUrl(URL.createObjectURL(e.target.files[0]));
      setProfile(e.target.files[0]);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCheckMsg("닉네임 중복 체크를 해주세요");
    setNickname(e.target.value);
  };

  const onCheckNickname = () => {
    fetch(process.env.REACT_APP_API_URL + "nickname/" + nickname, {
      method: "GET",
      headers: {
        Authorization: getCookie("token")
      }
    })
      .then(res => res.json())
      .then(({ isValidNickname }: { isValidNickname: boolean }) => {
        if (isValidNickname) {
          setBtnEnable(false);
          setCheckMsg("사용 가능한 닉네임입니다.");
        } else {
          setBtnEnable(true);
          setCheckMsg("사용 불가능한 닉네임입니다.");
        }
      });
  };

  const onProfileUpdate = () => {
    const data = new FormData();
    data.append("profile", profile);
    data.append("nickname", nickname);
    data.append("secondAuth", isSecondAuth);

    fetch(process.env.REACT_APP_API_URL + "user/info", {
      method: "PATCH",
      headers: {
        Authorization: "Bearer " + getCookie("token")
      },
      body: data
    });
    navigate("/game");
  };

  return (
    <div className="flex justify-center items-center">
      <div className="flex flex-col justify-evenly items-center h-[500px] w-[300px]">
        <div className="flex flex-col items-center w-full">
          <img
            className="h-[200px] w-[200px] border-2 rounded-[50%] mb-2"
            src={imgUrl}
            alt="profile"
            onClick={onClick}
          />
          <input
            type="file"
            style={{ display: "none" }}
            ref={imageInput}
            onChange={onFileChange}
            accept={"image/png, image/jpeg"}
          />
        </div>
        <div>
          <div className="flex flex-row">
            <input
              type="text"
              className="border-2 rounded"
              onChange={onInputChange}
              value={nickname}
            ></input>
            <Button
              tag={"중복 체크"}
              className={"btn-sm text-sm ml-1"}
              onClick={onCheckNickname}
            />
          </div>
          <h2 className="text-red-700 text-sm text-left">{checkMsg}</h2>
        </div>
        <div>
          <h3>이메일: {email}</h3>
          <Button
            tag={isSecondAuth ? "2차인증 비활성화" : "2차인증 활성화"}
            className={"btn-sm text-sm"}
            onClick={() => {
              setOpenModal(true);
            }}
          />
          {openModal && (
            <PopupControl
              mainText="2차인증"
              onClick={() => {
                setOpenModal(false);
              }}
            >
              <SecondAuthPopup
                onSecondAuth={() => {
                  setOpenModal(false);
                }}
                isSecondAuth={isSecondAuth}
                setIsSecondAuth={setIsSecondAuth}
              />
            </PopupControl>
          )}
        </div>
        <Button
          tag={"수정"}
          className={"btn-lg"}
          disabled={btnEnable}
          onClick={onProfileUpdate}
        />
      </div>
    </div>
  );
}
