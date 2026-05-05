export const desktopApps = [
  {
    id: "finder",
    name: "Finder",
    icon: "/icons/finder.png",
    route: "/finder",
    dock: true,
    defaultRunning: true,
    finderAppName: "Finder.app",
    finderAppSize: "28 MB",
  },
  {
    id: "notes",
    name: "Notes",
    icon: "/icons/notes.png",
    route: "/notes",
    dock: true,
    defaultRunning: true,
    finderAppName: "Notes.app",
    finderAppSize: "14 MB",
  },
  {
    id: "system-settings",
    name: "System Settings",
    icon: "/icons/settings.png",
    route: "/system-settings",
    dock: true,
    defaultRunning: false,
    finderAppName: "Settings.app",
    finderAppSize: "6 MB",
  },
  {
    id: "music",
    name: "Music",
    icon: "/icons/music.png",
    route: "/music",
    dock: true,
    defaultRunning: true,
    finderAppName: "Music.app",
    finderAppSize: "52 MB",
  },
  {
    id: "tv",
    name: "TV",
    icon: "/icons/tv.png",
    route: "/tv",
    dock: true,
    defaultRunning: false,
    finderAppName: "TV.app",
    finderAppSize: "38 MB",
  },
] as const;

export type DesktopApp = (typeof desktopApps)[number];
export type DesktopAppId = DesktopApp["id"];

export const desktopAppIds = desktopApps.map((app) => app.id) as DesktopAppId[];

export const desktopAppById: Record<DesktopAppId, DesktopApp> = Object.fromEntries(
  desktopApps.map((app) => [app.id, app]),
) as Record<DesktopAppId, DesktopApp>;

export function isDesktopAppId(appId: string): appId is DesktopAppId {
  return appId in desktopAppById;
}

export function getDesktopAppName(appId: string): string {
  return isDesktopAppId(appId) ? desktopAppById[appId].name : "Finder";
}
