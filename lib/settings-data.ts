// ---------------------------------------------------------------------------
// Settings app data — real system information + portfolio data
// ---------------------------------------------------------------------------

export const macInfo = {
  modelName: "MacBook Pro 14-inch",
  modelNumber: "MX2J3HN/A",
  chip: "Apple M4 Pro",
  cores: "14-core (10P + 4E)",
  memory: "24 GB",
  storage: "1 TB SSD",
  storageUsed: "690.84 GB",
  storageFree: "303.82 GB",
  os: "macOS Tahoe 26.0",
  osBuild: "25A354",
  serialNumber: "D7N99D***JL", // partially masked
  firmwareVersion: "13822.1.2",
  display: "14.2-inch Liquid Retina XDR",
  displayResolution: "3024 × 1964 Retina",
  batteryHealth: "Normal (89%)",
  batteryCycles: 391,
};

export const accountInfo = {
  name: "Nikhil Sheoran",
  initials: "NS",
  email: "thenikhilsheoran@gmail.com",
  avatarPath: "/nikhil.jpg",
  appleId: "thenikhilsheoran@gmail.com",
  device: "Nikhil's MacBook Pro",
  birthday: "February 22, 2006",
  twitterHandle: "_nikhilsheoran",
  twitterUrl: "https://twitter.com/_nikhilsheoran",
};

// Account rows — iCloud and Media only (Sign-In & Security removed)
export const accountRowsPrimary: never[] = [];

export const accountRowsSecondary = [
  { label: "iCloud", icon: "cloud" as const },
  { label: "Media & Purchases", icon: "store" as const },
];

// Apple ID devices (real data from screenshot)
export const appleDevices = [
  { name: "Nikhil's MacBook Pro", subtitle: "This MacBook Pro 14\"", type: "mac" as const },
  { name: "Nikhil Sheoran's iPhone", subtitle: "iPhone 14 Pro", type: "iphone" as const },
  { name: "Nikhil's Apple Watch", subtitle: "Apple Watch Series 10", type: "watch" as const },
];

export const wifiInfo = {
  networkName: "BPGC-A_HOSTEL",
  ipAddress: "10.30.14.70",
  subnetMask: "255.255.0.0",
  router: "10.30.0.1",
  dns: ["8.8.8.8", "8.8.4.4"],
  security: "WPA2 Personal",
  secured: false,
  hotspotName: "Nikhil Sheoran's iPhone",
  knownNetworks: ["BPGC-A_HOSTEL"],
};

export const bluetoothDevices = [
  { name: "ZEB-SHEER B", status: "Connected" as const, battery: "62%", type: "headset" },
  { name: "Nikhil's AirPods Pro", status: "Not Connected" as const, battery: null, type: "headphones" },
  { name: "Nikhil's AirPods Pro 2", status: "Not Connected" as const, battery: null, type: "headphones" },
  { name: "Nikhil's Apple Watch", status: "Not Connected" as const, battery: null, type: "watch" },
  { name: "Keychron K2", status: "Not Connected" as const, battery: null, type: "keyboard" },
  { name: "Bose Revolve SoundLink", status: "Not Connected" as const, battery: null, type: "speaker" },
  { name: "JBL Flip 3", status: "Not Connected" as const, battery: null, type: "speaker" },
  { name: "Nikhil's Buds Air 5 Pro", status: "Not Connected" as const, battery: null, type: "headset" },
  { name: "soundcore Q20i", status: "Not Connected" as const, battery: null, type: "headphones" },
  { name: "Tribit StormBox Flow", status: "Not Connected" as const, battery: null, type: "speaker" },
];

// General rows — Software Update, Display, Storage, AirDrop & Handoff only
export const generalRows = [
  { label: "Software Update", icon: "softwareupdate" as const },
  { label: "Display", icon: "general" as const },
  { label: "Storage", icon: "storage" as const },
  { label: "AirDrop & Handoff", icon: "network" as const },
];

// Accessibility rows — removed entirely
export const accessibilityRows: never[] = [];

// iCloud services with icon keys (all real/active)
export const icloudServices = [
  { label: "iCloud Drive", icon: "cloud" as const, enabled: true },
  { label: "Photos", icon: "photos" as const, enabled: true },
  { label: "Mail", icon: "mail" as const, enabled: true },
  { label: "Contacts", icon: "contacts" as const, enabled: true },
  { label: "Calendars", icon: "calendar" as const, enabled: true },
  { label: "Reminders", icon: "reminders" as const, enabled: true },
  { label: "Safari", icon: "safari" as const, enabled: true },
  { label: "Notes", icon: "notes" as const, enabled: true },
  { label: "Messages", icon: "messages" as const, enabled: true },
  { label: "Find My Mac", icon: "findmy" as const, enabled: true },
  { label: "Siri", icon: "siri" as const, enabled: true },
  { label: "Home", icon: "home" as const, enabled: true },
  { label: "Freeform", icon: "freeform" as const, enabled: true },
];

// iCloud storage
export const icloudStorage = {
  plan: "iCloud+ 200 GB",
  used: 134,
  total: 200,
};

// Sign-In & Security rows
export const securityRows = [
  { label: "Two-Factor Authentication", icon: "shield" as const, value: "On" },
  { label: "Trusted Phone Number", icon: "phone" as const, value: "+91 ••••••7890" },
  { label: "Password", icon: "lock" as const, value: "••••••••••" },
  { label: "Recovery Key", icon: "key" as const, value: "Enabled" },
];

// Media & Purchases subscriptions — all inactive/not subscribed
export const subscriptions = [
  { label: "Apple Music", icon: "applemusic" as const, detail: "Family Plan", active: false },
  { label: "Apple TV+", icon: "appletv" as const, detail: "Not subscribed", active: false },
  { label: "Apple Arcade", icon: "arcade" as const, detail: "Not subscribed", active: false },
];

// Storage breakdown categories (real-ish data from screenshot inspiration)
export const storageCategories = [
  { label: "Applications", value: "Calculating…", color: "#a0a0a0" },
  { label: "Documents", value: "85.75 GB", color: "#e05a2b" },
  { label: "iCloud Drive", value: "6.4 MB", color: "#3fa5ff" },
  { label: "Mail", value: "11.3 MB", color: "#3fa5ff" },
  { label: "Messages", value: "228.6 MB", color: "#30c750" },
  { label: "Music Creation", value: "3.08 GB", color: "#f5a623" },
  { label: "Photos", value: "47.9 MB", color: "#ff9f50" },
  { label: "Other Users & Shared", value: "4.73 GB", color: "#f5a623" },
  { label: "macOS", value: "38.41 GB", color: "#8e8e93" },
  { label: "System Data", value: "Calculating…", color: "#a0a0a0" },
];

// Storage bar segments (ordered, for the color bar visualization)
export const storageSegments = [
  { label: "Documents", pct: 12.4, color: "#e05a2b" },
  { label: "Other Users & Shared", pct: 0.7, color: "#f5a623" },
  { label: "Music Creation", pct: 0.4, color: "#f5a623" },
  { label: "macOS", pct: 5.5, color: "#8e8e93" },
  { label: "Free", pct: 43.9, color: "#dcdcdc" },
];

export type IconKey =
  | "wifi"
  | "bluetooth"
  | "general"
  | "accessibility"
  | "about"
  | "person"
  | "shield"
  | "card"
  | "cloud"
  | "store"
  | "apple"
  | "network"
  | "storage"
  | "date"
  | "language"
  | "softwareupdate"
  // iCloud service icons
  | "photos"
  | "mail"
  | "contacts"
  | "calendar"
  | "reminders"
  | "safari"
  | "notes"
  | "messages"
  | "findmy"
  | "siri"
  | "home"
  | "freeform"
  // security
  | "phone"
  | "lock"
  | "key"
  // media
  | "applemusic"
  | "appletv"
  | "arcade";
