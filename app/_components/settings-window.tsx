"use client";

import { useCallback, useMemo, useState } from "react";
import { useDraggableWindow, type WindowSize } from "@/lib/use-draggable-window";
import { WindowControls } from "@/app/_components/window-controls";
import styles from "./settings-window.module.css";

const MENU_BAR_HEIGHT = 32;
const DOCK_RESERVED_HEIGHT = 92;
const WINDOW_VISIBLE_EDGE = 140;
const WINDOW_VISIBLE_TOP = 64;

type SettingsScreen = "account" | "wifi" | "bluetooth" | "general" | "accessibility";

interface SettingsWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

const primarySidebarItems: { id: SettingsScreen; label: string; icon: string }[] = [
  { id: "wifi", label: "Wi-Fi", icon: "wifi" },
  { id: "bluetooth", label: "Bluetooth", icon: "bluetooth" },
  { id: "general", label: "General", icon: "general" },
  { id: "accessibility", label: "Accessibility", icon: "accessibility" },
];

const accountRowsPrimary = [
  { label: "Personal Information", icon: "person" },
  { label: "Sign-In & Security", icon: "shield" },
  { label: "Payment & Shipping", icon: "card" },
];

const accountRowsSecondary = [
  { label: "iCloud", icon: "cloud" },
  { label: "Family", icon: "family" },
  { label: "Media & Purchases", icon: "store" },
  { label: "Sign in with Apple", icon: "apple" },
];

const generalRows = [
  { label: "About", icon: "about" },
  { label: "Software Update", icon: "general" },
  { label: "Storage", icon: "storage" },
  { label: "AppleCare & Warranty", icon: "apple" },
  { label: "AirDrop & Handoff", icon: "network" },
  { label: "AutoFill & Passwords", icon: "card" },
  { label: "Date & Time", icon: "date" },
  { label: "Language & Region", icon: "language" },
];

const accessibilityRows = [
  { label: "Display", icon: "general" },
  { label: "Spoken Content", icon: "store" },
  { label: "VoiceOver", icon: "accessibility" },
  { label: "Zoom", icon: "network" },
  { label: "Motion", icon: "general" },
  { label: "Hearing", icon: "person" },
  { label: "Keyboard", icon: "general" },
  { label: "Pointer Control", icon: "general" },
];

const bluetoothDevices = [
  { name: "ZEB-SHEER B", status: "Connected", battery: "62%" },
  { name: "Bose Revolve SoundLink", status: "Not Connected", battery: null },
  { name: "JBL Flip 3", status: "Not Connected", battery: null },
  { name: "Keychron K2", status: "Not Connected", battery: null },
  { name: "Nikhil's AirPods Pro", status: "Not Connected", battery: null },
  { name: "Nikhil's Buds Air 5 Pro", status: "Not Connected", battery: null },
];

function ChevronIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
      <path
        d="M4.1 2.3L7.1 5.5L4.1 8.7"
        stroke="#B0B0B0"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BackChevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="none" aria-hidden>
      {direction === "left" ? (
        <path
          d="M7.4 1.7L2.2 7L7.4 12.3"
          stroke="#8F8F8F"
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M2.6 1.7L7.8 7L2.6 12.3"
          stroke="#B8B8B8"
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

function IconBadge({ icon }: { icon: string }) {
  const iconMap: Record<string, string> = {
    wifi: "W",
    bluetooth: "B",
    general: "G",
    accessibility: "A",
    network: "N",
    vpn: "V",
    battery: "BT",
    menu: "≡",
    siri: "S",
    desktop: "D",
    person: "ID",
    shield: "S",
    card: "P",
    cloud: "C",
    store: "M",
    apple: "A",
    about: "i",
    storage: "HD",
    date: "T",
    language: "L",
  };

  return (
    <span className={`${styles.iconBadge} ${styles[`iconBadge${icon}`] ?? ""}`} aria-hidden>
      {iconMap[icon] ?? "•"}
    </span>
  );
}

function Toggle({
  checked,
  onClick,
  offGray = false,
}: {
  checked: boolean;
  onClick: () => void;
  offGray?: boolean;
}) {
  return (
    <button
      type="button"
      data-window-drag-ignore
      onClick={onClick}
      className={`${styles.toggle} ${checked ? styles.toggleOn : ""} ${offGray ? styles.toggleGray : ""}`}
      aria-label={checked ? "Enabled" : "Disabled"}
    >
      <span className={`${styles.toggleThumb} ${checked ? styles.toggleThumbOn : ""}`} />
    </button>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <p className={styles.sectionHeading}>{children}</p>;
}

export function SettingsWindow({ isOpen, onClose }: SettingsWindowProps) {
  const getBounds = useCallback((windowSize: WindowSize) => {
    return {
      minX: -(windowSize.width - WINDOW_VISIBLE_EDGE),
      maxX: window.innerWidth - WINDOW_VISIBLE_EDGE,
      minY: MENU_BAR_HEIGHT + 8,
      maxY: window.innerHeight - DOCK_RESERVED_HEIGHT - WINDOW_VISIBLE_TOP,
    };
  }, []);

  const { windowRef, position, isDragging, handleDragStart } = useDraggableWindow({
    initialPosition: { x: 68, y: 44 },
    getBounds,
    disabled: !isOpen,
  });

  const [history, setHistory] = useState<SettingsScreen[]>(["account"]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [wifiEnabled, setWifiEnabled] = useState(true);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(true);

  const selectedScreen = history[historyIndex];
  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

  const title = useMemo(() => {
    if (selectedScreen === "account") return "Apple Account";
    if (selectedScreen === "wifi") return "Wi-Fi";
    if (selectedScreen === "bluetooth") return "Bluetooth";
    if (selectedScreen === "general") return "General";
    return "Accessibility";
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

  const goBack = useCallback(() => {
    if (!canGoBack) return;
    setHistoryIndex((current) => current - 1);
  }, [canGoBack]);

  const goForward = useCallback(() => {
    if (!canGoForward) return;
    setHistoryIndex((current) => current + 1);
  }, [canGoForward]);

  if (!isOpen) return null;

  return (
    <section
      ref={windowRef}
      className={styles.window}
      style={{
        width: "min(1240px, calc(100vw - 84px))",
        height: "min(760px, calc(100vh - 108px))",
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        willChange: isDragging ? "transform" : "auto",
      }}
    >
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTop} onPointerDown={handleDragStart}>
            <WindowControls onClose={onClose} />
          </div>

          <div className={styles.searchWrap}>
            <div className={styles.searchField} data-window-drag-ignore>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <circle cx="6.2" cy="6.2" r="4.7" stroke="#8E8E8E" strokeWidth="1.2" />
                <path d="M9.7 9.7L12.7 12.7" stroke="#8E8E8E" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <span>Search</span>
            </div>
          </div>

          <div className={styles.sidebarScroll}>
            <button
              type="button"
              data-window-drag-ignore
              onClick={() => navigateTo("account")}
              className={`${styles.accountRow} ${selectedScreen === "account" ? styles.accountRowActive : ""}`}
            >
              <span className={styles.accountAvatar}>NS</span>
              <span className={styles.accountMeta}>
                <span className={styles.accountName}>Nikhil Sheoran</span>
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
                  <span className={styles.sidebarItemLabel}>
                    <IconBadge icon={item.icon} />
                    <span>{item.label}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className={styles.content}>
          <header className={styles.contentHeader} onPointerDown={handleDragStart}>
            <div className={styles.navButtons}>
              <button
                type="button"
                data-window-drag-ignore
                onClick={goBack}
                disabled={!canGoBack}
                className={`${styles.navButton} ${!canGoBack ? styles.navButtonDisabled : ""}`}
                aria-label="Go back"
              >
                <BackChevron direction="left" />
              </button>
              <button
                type="button"
                data-window-drag-ignore
                onClick={goForward}
                disabled={!canGoForward}
                className={`${styles.navButton} ${!canGoForward ? styles.navButtonDisabled : ""}`}
                aria-label="Go forward"
              >
                <BackChevron direction="right" />
              </button>
            </div>
            <h1 className={styles.headerTitle}>{title}</h1>
          </header>

          <div className={styles.contentScroll}>
            {selectedScreen === "account" ? (
              <>
                <section className={styles.accountProfile}>
                  <div className={styles.accountProfileAvatar}>NS</div>
                  <p className={styles.accountProfileName}>Nikhil Sheoran</p>
                  <p className={styles.accountProfileEmail}>thenikhilsheoran@gmail.com</p>
                </section>

                <section className={styles.card}>
                  {accountRowsPrimary.map((item) => (
                    <button key={item.label} type="button" data-window-drag-ignore className={styles.cardRow}>
                      <span className={styles.cardRowLeft}>
                        <IconBadge icon={item.icon} />
                        <span>{item.label}</span>
                      </span>
                      <ChevronIcon />
                    </button>
                  ))}
                </section>

                <section className={styles.card}>
                  {accountRowsSecondary.map((item) => (
                    <button key={item.label} type="button" data-window-drag-ignore className={styles.cardRow}>
                      <span className={styles.cardRowLeft}>
                        <IconBadge icon={item.icon} />
                        <span>{item.label}</span>
                      </span>
                      <ChevronIcon />
                    </button>
                  ))}
                </section>

                <section className={styles.devicesSection}>
                  <SectionHeading>Devices</SectionHeading>
                  <div className={styles.card}>
                    <button type="button" data-window-drag-ignore className={styles.cardRow}>
                      <span className={styles.cardRowLeft}>
                        <span className={styles.deviceTile} />
                        <span>Nikhil&apos;s MacBook Pro</span>
                      </span>
                      <ChevronIcon />
                    </button>
                  </div>
                </section>
              </>
            ) : null}

            {selectedScreen === "wifi" ? (
              <>
                <section className={styles.card}>
                  <div className={styles.settingsHeaderRow}>
                    <span className={styles.settingsHeaderLeft}>
                      <IconBadge icon="wifi" />
                      <span>
                        <span className={styles.settingsHeaderTitle}>Wi-Fi</span>
                        <span className={styles.settingsHeaderText}>
                          Set up Wi-Fi to wirelessly connect your Mac to the internet.
                          <br />
                          Turn on Wi-Fi, then choose a network to join.
                          <span className={styles.learnMore}> Learn More...</span>
                        </span>
                      </span>
                    </span>
                    <Toggle checked={wifiEnabled} onClick={() => setWifiEnabled((value) => !value)} offGray />
                  </div>

                  {wifiEnabled ? (
                    <div className={styles.wifiConnectedRow}>
                      <div>
                        <p className={styles.wifiConnectedTitle}>BPGC-A_HOSTEL</p>
                        <p className={styles.wifiConnectedMeta}>
                          <span className={styles.dotGreen} /> Connected
                          <br />
                          <span className={styles.dotYellow} /> Unsecured Network
                        </p>
                      </div>
                      <button type="button" className={styles.inlineButton} data-window-drag-ignore>
                        Details...
                      </button>
                    </div>
                  ) : (
                    <div className={styles.wifiConnectedRow}>
                      <p className={styles.offLineText}>
                        <span className={styles.dotRed} /> Wi-Fi is off
                      </p>
                      <button type="button" className={styles.inlineButton} data-window-drag-ignore>
                        Details...
                      </button>
                    </div>
                  )}
                </section>

                {wifiEnabled ? (
                  <>
                    <SectionHeading>Personal Hotspots</SectionHeading>
                    <section className={styles.card}>
                      <div className={styles.cardRow}>
                        <span className={styles.cardRowLeft}>
                          <span>Nikhil Sheoran&apos;s iPhone</span>
                        </span>
                        <span className={styles.rowMeta}>Secure</span>
                      </div>
                    </section>

                    <SectionHeading>Known Network</SectionHeading>
                    <section className={styles.card}>
                      <div className={styles.cardRow}>
                        <span className={styles.cardRowLeft}>
                          <span className={styles.checkMark}>✓</span>
                          <span>BPGC-A_HOSTEL</span>
                        </span>
                        <span className={styles.rowMeta}>•••</span>
                      </div>
                    </section>

                    <SectionHeading>Other Networks</SectionHeading>
                    <section className={styles.card}>
                      <div className={styles.emptyNetworks}>No Networks</div>
                      <div className={styles.cardFooterRight}>
                        <button type="button" data-window-drag-ignore className={styles.inlineButton}>
                          Other...
                        </button>
                      </div>
                    </section>
                  </>
                ) : null}

                <section className={styles.card}>
                  <div className={styles.preferenceRow}>
                    <span>
                      <span className={styles.preferenceTitle}>Ask to join networks</span>
                      <span className={styles.preferenceText}>
                        Known networks will be joined automatically. If no known networks are available,
                        you will be notified of available networks.
                      </span>
                    </span>
                    <span className={styles.preferenceValue}>Notify</span>
                  </div>

                  {!wifiEnabled ? (
                    <div className={styles.preferenceRow}>
                      <span>
                        <span className={styles.preferenceTitle}>Ask to join hotspots</span>
                        <span className={styles.preferenceText}>
                          Allow this Mac to automatically discover nearby personal hotspots when no Wi-Fi
                          network is available.
                        </span>
                      </span>
                      <span className={styles.preferenceValue}>Automatic</span>
                    </div>
                  ) : null}
                </section>

                {!wifiEnabled ? (
                  <div className={styles.offFooterActions}>
                    <button type="button" data-window-drag-ignore className={styles.inlineButton}>
                      Advanced...
                    </button>
                    <button type="button" data-window-drag-ignore className={styles.helpButton}>
                      ?
                    </button>
                  </div>
                ) : null}
              </>
            ) : null}

            {selectedScreen === "bluetooth" ? (
              <>
                <section className={styles.card}>
                  <div className={styles.settingsHeaderRow}>
                    <span className={styles.settingsHeaderLeft}>
                      <IconBadge icon="bluetooth" />
                      <span>
                        <span className={styles.settingsHeaderTitle}>Bluetooth</span>
                        <span className={styles.settingsHeaderText}>
                          Connect to accessories you can use for activities such as streaming music,
                          typing, and gaming.
                          <span className={styles.learnMore}> Learn more...</span>
                        </span>
                      </span>
                    </span>
                    <Toggle
                      checked={bluetoothEnabled}
                      onClick={() => setBluetoothEnabled((value) => !value)}
                      offGray
                    />
                  </div>

                  <div className={styles.bluetoothNote}>
                    {bluetoothEnabled
                      ? 'This Mac is discoverable as "Nikhil\'s MacBook Pro" while Bluetooth Settings is open.'
                      : "AirDrop, AirPlay, Find My, and Location Services use Bluetooth."}
                  </div>
                </section>

                {bluetoothEnabled ? (
                  <>
                    <SectionHeading>My Devices</SectionHeading>
                    <section className={styles.card}>
                      {bluetoothDevices.map((device) => (
                        <div key={device.name} className={styles.cardRow}>
                          <span className={styles.cardRowLeft}>
                            <span className={styles.bluetoothDeviceIcon} />
                            <span>
                              <span className={styles.deviceName}>{device.name}</span>
                              <span className={styles.deviceStatus}>
                                {device.status}
                                {device.battery ? ` - ${device.battery}` : ""}
                              </span>
                            </span>
                          </span>
                          <button type="button" data-window-drag-ignore className={styles.infoButton}>
                            i
                          </button>
                        </div>
                      ))}
                    </section>
                  </>
                ) : (
                  <div className={styles.offFooterActions}>
                    <button type="button" data-window-drag-ignore className={styles.helpButton}>
                      ?
                    </button>
                  </div>
                )}
              </>
            ) : null}

            {selectedScreen === "general" ? (
              <>
                <section className={styles.generalHero}>
                  <span className={styles.generalHeroIcon}>
                    <IconBadge icon="general" />
                  </span>
                  <p className={styles.generalHeroTitle}>General</p>
                  <p className={styles.generalHeroText}>
                    Manage your overall setup and preferences for Mac, such as software updates, device
                    language, AirDrop, and more.
                  </p>
                </section>

                <section className={styles.card}>
                  {generalRows.map((item) => (
                    <button key={item.label} type="button" data-window-drag-ignore className={styles.cardRow}>
                      <span className={styles.cardRowLeft}>
                        <IconBadge icon={item.icon} />
                        <span>{item.label}</span>
                      </span>
                      <ChevronIcon />
                    </button>
                  ))}
                </section>
              </>
            ) : null}

            {selectedScreen === "accessibility" ? (
              <>
                <section className={styles.generalHero}>
                  <span className={styles.generalHeroIcon}>
                    <IconBadge icon="accessibility" />
                  </span>
                  <p className={styles.generalHeroTitle}>Accessibility</p>
                  <p className={styles.generalHeroText}>
                    Personalize vision, hearing, motor, and speech features to make your Mac easier to use.
                  </p>
                </section>

                <section className={styles.card}>
                  {accessibilityRows.map((item) => (
                    <button key={item.label} type="button" data-window-drag-ignore className={styles.cardRow}>
                      <span className={styles.cardRowLeft}>
                        <IconBadge icon={item.icon} />
                        <span>{item.label}</span>
                      </span>
                      <ChevronIcon />
                    </button>
                  ))}
                </section>
              </>
            ) : null}
          </div>
        </main>
      </div>
    </section>
  );
}
