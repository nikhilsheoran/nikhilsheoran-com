"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDraggableWindow } from "@/lib/use-draggable-window";
import { getDesktopWindowBounds } from "@/lib/desktop-window";
import { WindowControls } from "@/app/_components/window-controls";
import {
  accountInfo,
  icloudServices,
  type IconKey,
} from "@/lib/settings-data";
import { IconBadge, NavChevronLeft, NavChevronRight } from "./settings/settings-icons";
import {
  AccountPanel,
  ICloudPanel,
  MediaPurchasesPanel,
  WiFiPanel,
  BluetoothPanel,
  GeneralPanel,
  SoftwareUpdatePanel,
  DisplayPanel,
  StoragePanel,
  AirdropPanel,
  AboutPanel,
} from "./settings/settings-panels";
import styles from "./settings-window.module.css";

export type SettingsScreen =
  | "account"
  | "wifi"
  | "bluetooth"
  | "general"
  | "about"
  | "icloud"
  | "media-purchases"
  | "software-update"
  | "display"
  | "storage"
  | "airdrop";

interface SettingsWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onActivate?: () => void;
  zIndex?: number;
}

const primarySidebarItems: { id: SettingsScreen; label: string; icon: IconKey }[] = [
  { id: "wifi", label: "Wi-Fi", icon: "wifi" },
  { id: "bluetooth", label: "Bluetooth", icon: "bluetooth" },
  { id: "general", label: "General", icon: "general" },
  { id: "about", label: "About This Mac", icon: "about" },
];

export function SettingsWindow({ isOpen, onClose, onActivate, zIndex }: SettingsWindowProps) {
  const { windowRef, position, isDragging, handleDragStart } = useDraggableWindow({
    initialPosition: { x: 100, y: 60 },
    getBounds: getDesktopWindowBounds,
    disabled: !isOpen,
  });

  const [history, setHistory] = useState<SettingsScreen[]>(["account"]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [wifiEnabled, setWifiEnabled] = useState(true);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(true);
  const [icloudToggles, setIcloudToggles] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    icloudServices.forEach((s) => { init[s.label] = s.enabled; });
    return init;
  });

  const [brightness, setBrightness] = useState(100);
  const [autoBrightness, setAutoBrightness] = useState(true);
  const [trueTone, setTrueTone] = useState(true);
  const [handoff, setHandoff] = useState(true);
  const [airplayReceiver, setAirplayReceiver] = useState(true);
  const [autoUpdate, setAutoUpdate] = useState(true);

  useEffect(() => {
    document.documentElement.style.filter = `brightness(${brightness}%)`;
    return () => {
      document.documentElement.style.filter = "";
    };
  }, [brightness]);

  const selectedScreen = history[historyIndex];
  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

  const isAccountFamily =
    selectedScreen === "account" ||
    selectedScreen === "icloud" ||
    selectedScreen === "media-purchases";

  const title = useMemo(() => {
    const map: Record<SettingsScreen, string> = {
      account: "Apple Account",
      wifi: "Wi-Fi",
      bluetooth: "Bluetooth",
      general: "General",
      about: "About This Mac",
      icloud: "iCloud",
      "media-purchases": "Media & Purchases",
      "software-update": "Software Update",
      display: "Display",
      storage: "Storage",
      airdrop: "AirDrop & Handoff",
    };
    return map[selectedScreen];
  }, [selectedScreen]);

  const navigateTo = useCallback(
    (screen: SettingsScreen) => {
      if (screen === selectedScreen) return;
      const nextHistory = history.slice(0, historyIndex + 1);
      nextHistory.push(screen);
      setHistory(nextHistory);
      setHistoryIndex(nextHistory.length - 1);
    },
    [history, historyIndex, selectedScreen],
  );

  const goBack = useCallback(() => { if (canGoBack) setHistoryIndex((c) => c - 1); }, [canGoBack]);
  const goForward = useCallback(() => { if (canGoForward) setHistoryIndex((c) => c + 1); }, [canGoForward]);

  if (!isOpen) return null;

  const panelProps = { styles, navigateTo };

  return (
    <section
      ref={windowRef}
      className={styles.window}
      onPointerDownCapture={onActivate}
      style={{
        width: "min(860px, calc(100vw - 84px))",
        height: "min(640px, calc(100vh - 108px))",
        zIndex,
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        willChange: isDragging ? "transform" : "auto",
      }}
    >
      <div className={styles.shell}>
        {/* ===================== SIDEBAR ===================== */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTop} onPointerDown={handleDragStart}>
            <WindowControls onClose={onClose} windowName="System Settings" />
          </div>

          <div className={styles.sidebarScroll}>
            <button
              type="button"
              data-window-drag-ignore
              onClick={() => navigateTo("account")}
              className={`${styles.accountRow} ${isAccountFamily ? styles.accountRowActive : ""}`}
            >
              <span className={styles.accountAvatar}>
                <Image src={accountInfo.avatarPath} alt={accountInfo.name} width={36} height={36} className={styles.accountAvatarImg} />
              </span>
              <span className={styles.accountMeta}>
                <span className={styles.accountName}>{accountInfo.name}</span>
                <span className={styles.accountSub}>Apple Account</span>
              </span>
            </button>

            <div className={styles.sidebarGroup}>
              {primarySidebarItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  data-window-drag-ignore
                  onClick={() => navigateTo(item.id)}
                  className={`${styles.sidebarItem} ${selectedScreen === item.id ? styles.sidebarItemActive : ""}`}
                >
                  <IconBadge icon={item.icon} styles={styles} />
                  <span className={styles.sidebarItemLabel}>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ===================== CONTENT ===================== */}
        <main className={styles.content}>
          <header className={styles.contentHeader} onPointerDown={handleDragStart}>
            <div className={styles.navGroup}>
              <button
                type="button"
                data-window-drag-ignore
                onClick={goBack}
                disabled={!canGoBack}
                className={`${styles.navButton} ${!canGoBack ? styles.navButtonDisabled : ""}`}
                aria-label="Go back"
              >
                <NavChevronLeft />
              </button>
              <span className={styles.navSeparator} />
              <button
                type="button"
                data-window-drag-ignore
                onClick={goForward}
                disabled={!canGoForward}
                className={`${styles.navButton} ${!canGoForward ? styles.navButtonDisabled : ""}`}
                aria-label="Go forward"
              >
                <NavChevronRight />
              </button>
            </div>
            <h1 className={styles.headerTitle}>{title}</h1>
          </header>

          <div className={styles.contentScroll}>
            {selectedScreen === "account" && <AccountPanel {...panelProps} />}
            {selectedScreen === "icloud" && <ICloudPanel {...panelProps} icloudToggles={icloudToggles} setIcloudToggles={setIcloudToggles} />}
            {selectedScreen === "media-purchases" && <MediaPurchasesPanel {...panelProps} />}
            {selectedScreen === "wifi" && <WiFiPanel {...panelProps} wifiEnabled={wifiEnabled} setWifiEnabled={setWifiEnabled} />}
            {selectedScreen === "bluetooth" && <BluetoothPanel {...panelProps} bluetoothEnabled={bluetoothEnabled} setBluetoothEnabled={setBluetoothEnabled} />}
            {selectedScreen === "general" && <GeneralPanel {...panelProps} />}
            {selectedScreen === "software-update" && <SoftwareUpdatePanel {...panelProps} autoUpdate={autoUpdate} setAutoUpdate={setAutoUpdate} />}
            {selectedScreen === "display" && <DisplayPanel {...panelProps} brightness={brightness} setBrightness={setBrightness} autoBrightness={autoBrightness} setAutoBrightness={setAutoBrightness} trueTone={trueTone} setTrueTone={setTrueTone} />}
            {selectedScreen === "storage" && <StoragePanel {...panelProps} />}
            {selectedScreen === "airdrop" && <AirdropPanel {...panelProps} handoff={handoff} setHandoff={setHandoff} airplayReceiver={airplayReceiver} setAirplayReceiver={setAirplayReceiver} />}
            {selectedScreen === "about" && <AboutPanel {...panelProps} />}
          </div>
        </main>
      </div>
    </section>
  );
}
