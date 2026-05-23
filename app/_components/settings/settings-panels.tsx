"use client";

import Image from "next/image";
import { useState } from "react";
import {
  macInfo,
  accountInfo,
  accountRowsSecondary,
  wifiInfo,
  bluetoothDevices,
  generalRows,
  appleDevices,
  icloudServices,
  icloudStorage,
  subscriptions,
  storageCategories,
  storageSegments,
} from "@/lib/settings-data";
import {
  IconBadge,
  ChevronIcon,
  DeviceIcon,
  XIcon,
  BluetoothDeviceIcon,
  AppleLogoLarge,
} from "./settings-icons";
import type { SettingsScreen } from "../settings-window";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------
export function Toggle({ checked, onClick, styles }: { checked: boolean; onClick: () => void; styles: Record<string, string> }) {
  return (
    <button
      type="button"
      data-window-drag-ignore
      onClick={onClick}
      className={`${styles.toggle} ${checked ? styles.toggleOn : ""}`}
      aria-label={checked ? "Enabled" : "Disabled"}
    >
      <span className={`${styles.toggleThumb} ${checked ? styles.toggleThumbOn : ""}`} />
    </button>
  );
}

export function SectionHeading({ children, styles }: { children: React.ReactNode; styles: Record<string, string> }) {
  return <p className={styles.sectionHeading}>{children}</p>;
}

function BrightnessSlider({ value, onChange, styles }: { value: number; onChange: (v: number) => void; styles: Record<string, string> }) {
  return (
    <div className={styles.brightnessSliderWrap}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden className={styles.brightnessIcon}>
        <circle cx="7" cy="7" r="2.5" stroke="#888" strokeWidth="1.2" />
        <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.8 2.8l1.1 1.1M10.1 10.1l1.1 1.1M10.1 2.8l-1.1 1.1M3.9 10.1l-1.1 1.1" stroke="#888" strokeWidth="1.1" strokeLinecap="round" />
      </svg>
      <input
        type="range"
        min={20}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        data-window-drag-ignore
        className={styles.brightnessRange}
        style={{
          background: `linear-gradient(90deg, #1669d4 0%, #1669d4 ${((value - 20) / 80) * 100}%, #d0d0d0 ${((value - 20) / 80) * 100}%)`,
        }}
        aria-label="Brightness"
      />
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden className={styles.brightnessIconLg}>
        <circle cx="9" cy="9" r="3.5" stroke="#555" strokeWidth="1.3" />
        <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.2 3.2l1.4 1.4M13.4 13.4l1.4 1.4M13.4 3.2l-1.4 1.4M4.6 13.4l-1.4 1.4" stroke="#555" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function AirdropToggle({ styles }: { styles: Record<string, string> }) {
  const [mode, setMode] = useState<"contacts" | "everyone" | "off">("contacts");
  return (
    <div className={styles.airdropPicker}>
      {(["off", "contacts", "everyone"] as const).map((m) => (
        <button
          key={m}
          type="button"
          data-window-drag-ignore
          className={`${styles.airdropPickerBtn} ${mode === m ? styles.airdropPickerBtnActive : ""}`}
          onClick={() => setMode(m)}
        >
          {m === "off" ? "No One" : m === "contacts" ? "Contacts Only" : "Everyone"}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panel props
// ---------------------------------------------------------------------------
interface PanelProps {
  styles: Record<string, string>;
  navigateTo: (screen: SettingsScreen) => void;
}

// ---------------------------------------------------------------------------
// Account Panel
// ---------------------------------------------------------------------------
export function AccountPanel({ styles, navigateTo }: PanelProps) {
  return (
    <>
      <section className={styles.accountProfile}>
        <div className={styles.accountProfileAvatarWrap}>
          <Image src={accountInfo.avatarPath} alt={accountInfo.name} width={94} height={94} className={styles.accountProfileAvatar} />
        </div>
        <p className={styles.accountProfileName}>{accountInfo.name}</p>
        <p className={styles.accountProfileEmail}>{accountInfo.email}</p>

        <div className={styles.accountPersonalRow}>
          <span className={styles.accountBirthday}>Born {accountInfo.birthday}</span>
          <a
            href={accountInfo.twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.xLink}
            data-window-drag-ignore
            aria-label="X (Twitter) profile"
          >
            <XIcon />
            <span>@{accountInfo.twitterHandle}</span>
          </a>
        </div>
      </section>

      <section className={styles.card}>
        {accountRowsSecondary.map((item) => (
          <button
            key={item.label}
            type="button"
            data-window-drag-ignore
            className={styles.cardRow}
            onClick={() => navigateTo(item.label === "iCloud" ? "icloud" : "media-purchases")}
          >
            <span className={styles.cardRowLeft}>
              <IconBadge icon={item.icon} styles={styles} />
              <span>{item.label}</span>
            </span>
            <ChevronIcon />
          </button>
        ))}
      </section>

      <section className={styles.devicesSection}>
        <SectionHeading styles={styles}>Devices</SectionHeading>
        <div className={styles.card}>
          {appleDevices.map((device) => (
            <div key={device.name} className={styles.cardRow}>
              <span className={styles.cardRowLeft}>
                <DeviceIcon type={device.type} styles={styles} />
                <span>
                  <span className={styles.deviceName}>{device.name}</span>
                  <span className={styles.deviceStatus}>{device.subtitle}</span>
                </span>
              </span>
              <ChevronIcon />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

// ---------------------------------------------------------------------------
// iCloud Panel
// ---------------------------------------------------------------------------
export function ICloudPanel({ styles, icloudToggles, setIcloudToggles }: PanelProps & { icloudToggles: Record<string, boolean>; setIcloudToggles: React.Dispatch<React.SetStateAction<Record<string, boolean>>> }) {
  const usedPct = Math.round((icloudStorage.used / icloudStorage.total) * 100);
  return (
    <>
      <section className={styles.generalHero}>
        <span className={styles.generalHeroIcon}>
          <IconBadge icon="cloud" size="lg" styles={styles} />
        </span>
        <p className={styles.generalHeroTitle}>iCloud</p>
        <p className={styles.generalHeroText}>
          iCloud keeps your photos, documents, and data in sync across all your Apple devices.
        </p>

        <div className={styles.icloudHeroStorage}>
          <div className={styles.icloudHeroStorageTop}>
            <span className={styles.icloudHeroStorageLabel}>{icloudStorage.used} GB of {icloudStorage.total} GB used</span>
            <span className={styles.icloudHeroStoragePlan}>{icloudStorage.plan}</span>
          </div>
          <div className={styles.icloudBar}>
            <div className={styles.icloudBarFill} style={{ width: `${usedPct}%` }} />
          </div>
        </div>
      </section>

      <SectionHeading styles={styles}>Apps Using iCloud</SectionHeading>
      <section className={styles.card}>
        {icloudServices.map((svc) => (
          <div key={svc.label} className={styles.cardRow}>
            <span className={styles.cardRowLeft}>
              <IconBadge icon={svc.icon} styles={styles} />
              <span>{svc.label}</span>
            </span>
            <Toggle
              checked={icloudToggles[svc.label] ?? svc.enabled}
              onClick={() => setIcloudToggles((prev) => ({ ...prev, [svc.label]: !prev[svc.label] }))}
              styles={styles}
            />
          </div>
        ))}
      </section>
    </>
  );
}

// ---------------------------------------------------------------------------
// Media & Purchases Panel
// ---------------------------------------------------------------------------
export function MediaPurchasesPanel({ styles }: PanelProps) {
  return (
    <>
      <section className={styles.generalHero}>
        <span className={styles.generalHeroIcon}>
          <IconBadge icon="store" size="lg" styles={styles} />
        </span>
        <p className={styles.generalHeroTitle}>Media &amp; Purchases</p>
        <p className={styles.generalHeroText}>
          Manage your Apple subscriptions and purchases across all your devices.
        </p>
      </section>

      <SectionHeading styles={styles}>Subscriptions</SectionHeading>
      <section className={styles.card}>
        {subscriptions.map((sub) => (
          <div key={sub.label} className={styles.cardRow}>
            <span className={styles.cardRowLeft}>
              <IconBadge icon={sub.icon} styles={styles} />
              <span>
                <span className={styles.deviceName}>{sub.label}</span>
                <span className={styles.deviceStatus}>{sub.detail}</span>
              </span>
            </span>
            <span className={styles.valueGray}>—</span>
          </div>
        ))}
      </section>

      <SectionHeading styles={styles}>Sharing</SectionHeading>
      <section className={styles.card}>
        <div className={styles.cardRow}>
          <span className={styles.cardRowLeft}>
            <IconBadge icon="person" styles={styles} />
            <span>Family Sharing</span>
          </span>
          <span className={styles.valueGray}>On</span>
        </div>
      </section>
    </>
  );
}

// ---------------------------------------------------------------------------
// Wi-Fi Panel
// ---------------------------------------------------------------------------
export function WiFiPanel({ styles, wifiEnabled, setWifiEnabled }: PanelProps & { wifiEnabled: boolean; setWifiEnabled: React.Dispatch<React.SetStateAction<boolean>> }) {
  return (
    <>
      <section className={styles.card}>
        <div className={styles.settingsHeaderRow}>
          <span className={styles.settingsHeaderLeft}>
            <IconBadge icon="wifi" styles={styles} />
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
          <Toggle checked={wifiEnabled} onClick={() => setWifiEnabled((v) => !v)} styles={styles} />
        </div>

        {wifiEnabled ? (
          <div className={styles.wifiConnectedRow}>
            <div>
              <p className={styles.wifiConnectedTitle}>{wifiInfo.networkName}</p>
              <p className={styles.wifiConnectedMeta}>
                <span className={styles.dotGreen} /> Connected · {wifiInfo.ipAddress}
                <br />
                <span className={styles.dotYellow} /> Unsecured Network
              </p>
            </div>
          </div>
        ) : (
          <div className={styles.wifiConnectedRow}>
            <p className={styles.offLineText}><span className={styles.dotRed} /> Wi-Fi is off</p>
          </div>
        )}
      </section>

      {wifiEnabled && (
        <>
          <SectionHeading styles={styles}>Personal Hotspots</SectionHeading>
          <section className={styles.card}>
            <div className={styles.cardRow}>
              <span className={styles.cardRowLeft}>
                <span>{wifiInfo.hotspotName}</span>
              </span>
              <span className={styles.rowMeta}>Secure</span>
            </div>
          </section>

          <SectionHeading styles={styles}>Known Networks</SectionHeading>
          <section className={styles.card}>
            {wifiInfo.knownNetworks.map((n) => (
              <div key={n} className={styles.cardRow}>
                <span className={styles.cardRowLeft}>
                  <span className={styles.checkMark}>✓</span>
                  <span>{n}</span>
                </span>
              </div>
            ))}
          </section>
        </>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Bluetooth Panel
// ---------------------------------------------------------------------------
export function BluetoothPanel({ styles, bluetoothEnabled, setBluetoothEnabled }: PanelProps & { bluetoothEnabled: boolean; setBluetoothEnabled: React.Dispatch<React.SetStateAction<boolean>> }) {
  return (
    <>
      <section className={styles.card}>
        <div className={styles.settingsHeaderRow}>
          <span className={styles.settingsHeaderLeft}>
            <IconBadge icon="bluetooth" styles={styles} />
            <span>
              <span className={styles.settingsHeaderTitle}>Bluetooth</span>
              <span className={styles.settingsHeaderText}>
                Connect to accessories you can use for activities such as streaming music,
                typing, and gaming.
                <span className={styles.learnMore}> Learn more...</span>
              </span>
            </span>
          </span>
          <Toggle checked={bluetoothEnabled} onClick={() => setBluetoothEnabled((v) => !v)} styles={styles} />
        </div>
        <div className={styles.bluetoothNote}>
          {bluetoothEnabled
            ? `This Mac is discoverable as "${accountInfo.device}" while Bluetooth Settings is open.`
            : "AirDrop, AirPlay, Find My, and Location Services use Bluetooth."}
        </div>
      </section>

      {bluetoothEnabled && (
        <>
          <SectionHeading styles={styles}>My Devices</SectionHeading>
          <section className={styles.card}>
            {bluetoothDevices.map((device) => (
              <div key={device.name} className={styles.cardRow}>
                <span className={styles.cardRowLeft}>
                  <BluetoothDeviceIcon type={device.type} styles={styles} />
                  <span>
                    <span className={styles.deviceName}>{device.name}</span>
                    <span className={`${styles.deviceStatus} ${device.status === "Connected" ? styles.deviceStatusConnected : ""}`}>
                      {device.status}{device.status === "Connected" && device.battery ? ` · ${device.battery}` : ""}
                    </span>
                  </span>
                </span>
              </div>
            ))}
          </section>
        </>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// General Panel
// ---------------------------------------------------------------------------
export function GeneralPanel({ styles, navigateTo }: PanelProps) {
  return (
    <>
      <section className={styles.generalHero}>
        <span className={styles.generalHeroIcon}>
          <IconBadge icon="general" size="lg" styles={styles} />
        </span>
        <p className={styles.generalHeroTitle}>General</p>
        <p className={styles.generalHeroText}>
          Manage your Mac&apos;s software updates, display, storage, and connectivity.
        </p>
      </section>
      <section className={styles.card}>
        {generalRows.map((item) => {
          const dest: SettingsScreen =
            item.label === "Software Update" ? "software-update"
            : item.label === "Display" ? "display"
            : item.label === "Storage" ? "storage"
            : "airdrop";
          return (
            <button
              key={item.label}
              type="button"
              data-window-drag-ignore
              className={styles.cardRow}
              onClick={() => navigateTo(dest)}
            >
              <span className={styles.cardRowLeft}>
                <IconBadge icon={item.icon} styles={styles} />
                <span>{item.label}</span>
              </span>
              <ChevronIcon />
            </button>
          );
        })}
      </section>
    </>
  );
}

// ---------------------------------------------------------------------------
// Software Update Panel
// ---------------------------------------------------------------------------
export function SoftwareUpdatePanel({ styles, autoUpdate, setAutoUpdate }: PanelProps & { autoUpdate: boolean; setAutoUpdate: React.Dispatch<React.SetStateAction<boolean>> }) {
  return (
    <>
      <section className={styles.generalHero}>
        <span className={styles.generalHeroIcon}>
          <IconBadge icon="softwareupdate" size="lg" styles={styles} />
        </span>
        <p className={styles.generalHeroTitle}>Software Update</p>
        <p className={styles.generalHeroText}>
          macOS Tahoe 26.0 is up to date.
        </p>
      </section>
      <section className={styles.card}>
        <div className={styles.aboutSpecRow}>
          <span className={styles.aboutSpecLabel}>macOS Version</span>
          <span className={styles.aboutSpecValue}>{macInfo.os}</span>
        </div>
        <div className={styles.aboutSpecRow}>
          <span className={styles.aboutSpecLabel}>Build</span>
          <span className={styles.aboutSpecValue}>{macInfo.osBuild}</span>
        </div>
        <div className={`${styles.aboutSpecRow} ${styles.aboutSpecRowLast}`}>
          <span className={styles.aboutSpecLabel}>Last Checked</span>
          <span className={styles.aboutSpecValue}>Today</span>
        </div>
      </section>
      <section className={styles.card}>
        <div className={styles.cardRow}>
          <span className={styles.cardRowLeft}>
            <IconBadge icon="softwareupdate" styles={styles} />
            <span>Automatically keep my Mac up to date</span>
          </span>
          <Toggle checked={autoUpdate} onClick={() => setAutoUpdate((v) => !v)} styles={styles} />
        </div>
      </section>
    </>
  );
}

// ---------------------------------------------------------------------------
// Display Panel
// ---------------------------------------------------------------------------
export function DisplayPanel({ styles, brightness, setBrightness, autoBrightness, setAutoBrightness, trueTone, setTrueTone }: PanelProps & {
  brightness: number; setBrightness: React.Dispatch<React.SetStateAction<number>>;
  autoBrightness: boolean; setAutoBrightness: React.Dispatch<React.SetStateAction<boolean>>;
  trueTone: boolean; setTrueTone: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <>
      <section className={styles.generalHero}>
        <span className={styles.generalHeroIcon}>
          <IconBadge icon="general" size="lg" styles={styles} />
        </span>
        <p className={styles.generalHeroTitle}>Display</p>
        <p className={styles.generalHeroText}>
          Adjust brightness and display settings for your {macInfo.display}.
        </p>
      </section>
      <section className={styles.card}>
        <div className={styles.preferenceRow}>
          <span>
            <span className={styles.preferenceTitle}>Brightness</span>
          </span>
          <BrightnessSlider value={brightness} onChange={setBrightness} styles={styles} />
        </div>
        <div className={styles.cardRow}>
          <span className={styles.cardRowLeft}>
            <span>Automatically adjust brightness</span>
          </span>
          <Toggle checked={autoBrightness} onClick={() => setAutoBrightness((v) => !v)} styles={styles} />
        </div>
        <div className={styles.cardRow}>
          <span className={styles.cardRowLeft}>
            <span>True Tone</span>
          </span>
          <Toggle checked={trueTone} onClick={() => setTrueTone((v) => !v)} styles={styles} />
        </div>
      </section>
      <section className={styles.card}>
        <div className={styles.aboutSpecRow}>
          <span className={styles.aboutSpecLabel}>Display</span>
          <span className={styles.aboutSpecValue}>{macInfo.display}</span>
        </div>
        <div className={`${styles.aboutSpecRow} ${styles.aboutSpecRowLast}`}>
          <span className={styles.aboutSpecLabel}>Resolution</span>
          <span className={styles.aboutSpecValue}>{macInfo.displayResolution}</span>
        </div>
      </section>
    </>
  );
}

// ---------------------------------------------------------------------------
// Storage Panel
// ---------------------------------------------------------------------------
export function StoragePanel({ styles }: PanelProps) {
  return (
    <>
      <section className={styles.storageHero}>
        <div className={styles.storageHeroHeader}>
          <span className={styles.storageHeroTitle}>Macintosh HD</span>
          <span className={styles.storageHeroMeta}>{macInfo.storageUsed} of {macInfo.storage} used</span>
        </div>
        <div className={styles.storageMacBar}>
          {storageSegments.map((seg) => (
            <div
              key={seg.label}
              className={styles.storageMacBarSegment}
              style={{ width: `${seg.pct}%`, background: seg.color }}
              title={seg.label}
            />
          ))}
        </div>
        <div className={styles.storageLegend}>
          {storageSegments.filter((s) => s.label !== "Free").map((seg) => (
            <span key={seg.label} className={styles.storageLegendItem}>
              <span className={styles.storageLegendDot} style={{ background: seg.color }} />
              {seg.label}
            </span>
          ))}
          <span className={styles.storageLegendItem}>
            <span className={styles.storageLegendDot} style={{ background: "#dcdcdc", border: "1px solid #c0c0c0" }} />
            Free ({macInfo.storageFree})
          </span>
        </div>
      </section>

      <SectionHeading styles={styles}>Recommendations</SectionHeading>
      <section className={styles.card}>
        <div className={styles.storageRecommendRow}>
          <span className={styles.storageRecommendIcon}>
            <IconBadge icon="cloud" styles={styles} />
          </span>
          <span className={styles.storageRecommendText}>
            <span className={styles.storageRecommendTitle}>Store in iCloud</span>
            <span className={styles.storageRecommendDesc}>Store all files in iCloud Drive and save space by keeping only recent files on this Mac.</span>
          </span>
          <button type="button" data-window-drag-ignore className={styles.inlineButton}>Store in iCloud…</button>
        </div>
        <div className={styles.storageRecommendRow}>
          <span className={styles.storageRecommendIcon}>
            <IconBadge icon="appletv" styles={styles} />
          </span>
          <span className={styles.storageRecommendText}>
            <span className={styles.storageRecommendTitle}>Optimize Storage</span>
            <span className={styles.storageRecommendDesc}>Save space by automatically removing movies and TV shows you&apos;ve already watched.</span>
          </span>
          <button type="button" data-window-drag-ignore className={styles.inlineButton}>Optimize…</button>
        </div>
      </section>

      <section className={styles.card}>
        {storageCategories.map((cat, i) => (
          <div key={cat.label} className={`${styles.storageCatRow} ${i === storageCategories.length - 1 ? styles.storageCatRowLast : ""}`}>
            <span className={styles.storageCatDot} style={{ background: cat.color }} />
            <span className={styles.storageCatLabel}>{cat.label}</span>
            <span className={styles.storageCatValue}>{cat.value}</span>
          </div>
        ))}
      </section>
    </>
  );
}

// ---------------------------------------------------------------------------
// AirDrop Panel
// ---------------------------------------------------------------------------
export function AirdropPanel({ styles, handoff, setHandoff, airplayReceiver, setAirplayReceiver }: PanelProps & {
  handoff: boolean; setHandoff: React.Dispatch<React.SetStateAction<boolean>>;
  airplayReceiver: boolean; setAirplayReceiver: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <>
      <section className={styles.generalHero}>
        <span className={styles.generalHeroIcon}>
          <IconBadge icon="network" size="lg" styles={styles} />
        </span>
        <p className={styles.generalHeroTitle}>AirDrop &amp; Handoff</p>
        <p className={styles.generalHeroText}>
          Share wirelessly with nearby Apple devices and hand off work between devices seamlessly.
        </p>
      </section>
      <section className={styles.card}>
        <div className={styles.cardRow}>
          <span className={styles.cardRowLeft}>
            <IconBadge icon="network" styles={styles} />
            <span>
              <span className={styles.preferenceTitle} style={{ display: "block" }}>AirDrop</span>
              <span className={styles.settingsHeaderText}>Allow others to discover and share with you.</span>
            </span>
          </span>
          <AirdropToggle styles={styles} />
        </div>
        <div className={styles.cardRow}>
          <span className={styles.cardRowLeft}>
            <IconBadge icon="general" styles={styles} />
            <span>Handoff</span>
          </span>
          <Toggle checked={handoff} onClick={() => setHandoff((v) => !v)} styles={styles} />
        </div>
        <div className={styles.cardRow}>
          <span className={styles.cardRowLeft}>
            <IconBadge icon="general" styles={styles} />
            <span>AirPlay Receiver</span>
          </span>
          <Toggle checked={airplayReceiver} onClick={() => setAirplayReceiver((v) => !v)} styles={styles} />
        </div>
      </section>
    </>
  );
}

// ---------------------------------------------------------------------------
// About Panel
// ---------------------------------------------------------------------------
export function AboutPanel({ styles }: PanelProps) {
  return (
    <>
      <section className={styles.aboutHero}>
        <span className={styles.aboutAppleLogo}><AppleLogoLarge /></span>
        <p className={styles.aboutModelName}>{macInfo.modelName}</p>
        <p className={styles.aboutOS}>{macInfo.os}</p>
        <p className={styles.aboutBuild}>Build {macInfo.osBuild}</p>
      </section>

      <section className={styles.card}>
        <div className={styles.aboutSpecRow}>
          <span className={styles.aboutSpecLabel}>Chip</span>
          <span className={styles.aboutSpecValue}>{macInfo.chip}</span>
        </div>
        <div className={styles.aboutSpecRow}>
          <span className={styles.aboutSpecLabel}>Cores</span>
          <span className={styles.aboutSpecValue}>{macInfo.cores}</span>
        </div>
        <div className={styles.aboutSpecRow}>
          <span className={styles.aboutSpecLabel}>Memory</span>
          <span className={styles.aboutSpecValue}>{macInfo.memory}</span>
        </div>
        <div className={styles.aboutSpecRow}>
          <span className={styles.aboutSpecLabel}>Storage</span>
          <span className={styles.aboutSpecValue}>{macInfo.storage}</span>
        </div>
        <div className={styles.aboutSpecRow}>
          <span className={styles.aboutSpecLabel}>Display</span>
          <span className={styles.aboutSpecValue}>{macInfo.display}</span>
        </div>
        <div className={styles.aboutSpecRow}>
          <span className={styles.aboutSpecLabel}>Resolution</span>
          <span className={styles.aboutSpecValue}>{macInfo.displayResolution}</span>
        </div>
        <div className={styles.aboutSpecRow}>
          <span className={styles.aboutSpecLabel}>Model Number</span>
          <span className={styles.aboutSpecValue}>{macInfo.modelNumber}</span>
        </div>
        <div className={`${styles.aboutSpecRow} ${styles.aboutSpecRowLast}`}>
          <span className={styles.aboutSpecLabel}>Serial Number</span>
          <span className={styles.aboutSpecValue}>{macInfo.serialNumber}</span>
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.aboutSpecRow}>
          <span className={styles.aboutSpecLabel}>Battery Condition</span>
          <span className={styles.aboutSpecValue}>{macInfo.batteryHealth}</span>
        </div>
        <div className={`${styles.aboutSpecRow} ${styles.aboutSpecRowLast}`}>
          <span className={styles.aboutSpecLabel}>Battery Cycles</span>
          <span className={styles.aboutSpecValue}>{macInfo.batteryCycles} cycles</span>
        </div>
      </section>
    </>
  );
}
