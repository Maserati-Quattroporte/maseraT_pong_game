import { useState, useEffect } from "react";
import { socket } from "../App";
import { getCookie } from "../func/cookieFunc";
import Button from "../component/button/Button";

type Props = {
  setIsMatching: React.Dispatch<React.SetStateAction<boolean>>;
};

export function MatchPopup({ setIsMatching }: Props): JSX.Element {
  const [second, setSecond] = useState(0);
  const onClick = () => {
    socket.emit("cancel-match", { userId: getCookie("id") });
    setIsMatching(false);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setSecond(curr => curr + 1);
    }, 1000);

    socket.emit("match", { userId: getCookie("id") });

    return () => {
      clearInterval(interval);
    };
  }, []);
  return (
    <div className="w-[300px] h-[150px] flex flex-col justify-center items-center">
      <h1 className="text-xl my-8">{second} 초</h1>
      <Button tag={"매칭 취소"} onClick={onClick} />
    </div>
  );
}
