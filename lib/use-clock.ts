import { useEffect, useState } from "react";

const ONE_MINUTE_IN_MS = 60_000;

export function useClock(): Date {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setTime(new Date());
    }, ONE_MINUTE_IN_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return time;
}
