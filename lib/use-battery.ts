import { useEffect, useState } from "react";

export interface BatteryState {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
}

interface BatteryManagerWithPowerMode extends Readonly<BatteryState>, EventTarget {
  lowPowerMode?: boolean;
  powerSaveMode?: boolean;
}

interface NavigatorWithBattery extends Navigator {
  getBattery?: () => Promise<BatteryManagerWithPowerMode>;
}

export interface UseBatteryState extends BatteryState {
  isSupported: boolean;
  fetched: boolean;
  lowPowerMode: boolean;
}

const defaultBattery: BatteryState = {
  charging: false,
  chargingTime: 0,
  dischargingTime: 0,
  level: 1,
};

const defaultState: UseBatteryState = {
  ...defaultBattery,
  isSupported: false,
  fetched: false,
  lowPowerMode: false,
};

export function useBattery(): UseBatteryState {
  const [state, setState] = useState<UseBatteryState>({
    ...defaultState,
  });

  // Subscribes to Browser Battery API — setState in callbacks is the intended pattern
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const nav = navigator as NavigatorWithBattery;

    if (typeof nav.getBattery !== "function") {
      setState((currentState) => ({
        ...currentState,
        isSupported: false,
        fetched: true,
      }));
      return;
    }

    let isMounted = true;
    let battery: BatteryManagerWithPowerMode | null = null;

    const handleChange = () => {
      if (!isMounted || !battery) return;

      const lowPowerMode =
        typeof battery.powerSaveMode === "boolean"
          ? battery.powerSaveMode
          : typeof battery.lowPowerMode === "boolean"
            ? battery.lowPowerMode
            : false;

      setState({
        isSupported: true,
        fetched: true,
        level: battery.level,
        charging: battery.charging,
        dischargingTime: battery.dischargingTime,
        chargingTime: battery.chargingTime,
        lowPowerMode,
      });
    };

    nav
      .getBattery()
      .then((result) => {
        if (!isMounted) return;

        battery = result;
        battery.addEventListener("chargingchange", handleChange);
        battery.addEventListener("chargingtimechange", handleChange);
        battery.addEventListener("dischargingtimechange", handleChange);
        battery.addEventListener("levelchange", handleChange);
        handleChange();
      })
      .catch(() => {
        if (!isMounted) return;
        setState((currentState) => ({
          ...currentState,
          fetched: true,
          isSupported: false,
        }));
      });

    return () => {
      isMounted = false;
      if (!battery) return;
      battery.removeEventListener("chargingchange", handleChange);
      battery.removeEventListener("chargingtimechange", handleChange);
      battery.removeEventListener("dischargingtimechange", handleChange);
      battery.removeEventListener("levelchange", handleChange);
    };
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  return state;
}
