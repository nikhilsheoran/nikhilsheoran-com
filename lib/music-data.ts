// ---------------------------------------------------------------------------
// Static music catalog — real Apple Music preview URLs + artwork
// iTunes artwork URLs: replace "100x100bb.jpg" with "400x400bb.jpg" for hi-res
// All data sourced from iTunes Search/Lookup API (itunes.apple.com)
// ---------------------------------------------------------------------------

export interface Song {
  id: string;
  title: string;
  artist: string;
  albumId: string;
  albumTitle: string;
  artworkUrl: string;
  previewUrl: string;
  durationMs: number;
  trackNumber: number;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  year: number;
  artworkUrl: string;
  songIds: string[];
  genre: string;
}

export interface Artist {
  id: string;
  name: string;
  artworkUrl: string;
  albumIds: string[];
}

// ---------------------------------------------------------------------------
// Helper to upscale iTunes artwork
// ---------------------------------------------------------------------------
function art(url: string, size = 400) {
  return url.replace("100x100bb.jpg", `${size}x${size}bb.jpg`);
}

// ---------------------------------------------------------------------------
// Raw artwork base URLs (100px from API, upscaled via art())
// ---------------------------------------------------------------------------
const ART = {
  // Albums
  judaa1:
    "https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/37/7b/ab/377bab5f-00f9-02bc-0c0c-f7b3b1936c07/8902633270060.jpg/100x100bb.jpg",
  judaa2:
    "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/43/eb/d4/43ebd4da-efb7-744a-e048-c5a951707c1e/859711927829_cover.jpg/100x100bb.jpg",
  judaa3ch1:
    "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/51/4c/61/514c6139-25e3-a94b-23fc-ca6224ea6caf/68c532fd-7dcf-4d5a-bf4c-a9a89c4618e2.jpg/100x100bb.jpg",
  judaa3ch2:
    "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/b5/ee/f9/b5eef903-4b2d-2a46-89d0-f8c9d499284f/2fa3fd19-a492-4679-aa8c-3cae6935f5e2.jpg/100x100bb.jpg",
  pbx1: "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/0c/a2/53/0ca25374-100d-1362-9a8c-d3f253423982/8903431696588_cover.jpg/100x100bb.jpg",
  fourme:
    "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/c2/ce/a0/c2cea088-dbde-43db-346f-e536058fdcfb/5063483978438_cover.jpg/100x100bb.jpg",
  fouryou:
    "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/fc/bc/64/fcbc6417-8a88-7b5e-4490-8f53e537ffb0/859770181552_cover.jpg/100x100bb.jpg",
  age19:
    "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/6c/51/90/6c5190fd-4a2c-6197-114c-392e30bb3a7f/3615937368016.jpg/100x100bb.jpg",
  shatterme:
    "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/fb/db/c3/fbdbc388-221a-0f90-9599-f14ab2c2d871/796745103723_cover.tif/100x100bb.jpg",
  moosetape:
    "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/97/69/58/976958ae-725e-bd41-6755-f0921c697840/810063889609_cover.jpg/100x100bb.jpg",
  aforarjan2:
    "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/2d/ae/71/2dae710b-3a86-23d1-2629-621712e8338e/8905285240214.jpg/100x100bb.jpg",
  // Singles / misc album art used for standalone songs
  darklove:
    "https://is1-ssl.mzstatic.com/image/thumb/Music123/v4/3c/ce/cb/3ccecba1-52f8-3aef-29c7-29a5c6a64b14/cover.jpg/100x100bb.jpg",
  backbone:
    "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/a2/f5/43/a2f5431a-dc34-9f5f-bb9c-6337bfa322ee/886446309828.jpg/100x100bb.jpg",
  carolbells:
    "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/a0/62/98/a06298d3-7311-946a-0e5f-adcbef7458d1/18CRGIM06446.rgb.jpg/100x100bb.jpg",
  soch: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/ff/e3/bd/ffe3bdfa-ecaa-85ba-99d4-dd3c89b1c945/8902894354905_cover.jpg/100x100bb.jpg",
  onmyway:
    "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/c1/f1/3e/c1f13e56-448d-00f0-96d6-45fd50f97f40/886447612866.jpg/100x100bb.jpg",
  cheemay:
    "https://is1-ssl.mzstatic.com/image/thumb/Music123/v4/0c/7b/78/0c7b7857-e443-ecdb-fa86-b3ec43968863/cover.jpg/100x100bb.jpg",
};

// ---------------------------------------------------------------------------
// Songs
// ---------------------------------------------------------------------------
export const songs: Song[] = [
  // ── Sidhu Moosewala — PBX 1 ──────────────────────────────────────────────
  {
    id: "1439435009",
    title: "Intro",
    artist: "Sidhu Moose Wala",
    albumId: "pbx1",
    albumTitle: "PBX 1",
    artworkUrl: art(ART.pbx1),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/2e/30/f1/2e30f1cc-1537-a99a-5928-76083865ef16/mzaf_14683581708543264050.plus.aac.p.m4a",
    durationMs: 30503,
    trackNumber: 1,
  },
  {
    id: "1439435011",
    title: "Jaat Da Muqabala",
    artist: "Sidhu Moose Wala",
    albumId: "pbx1",
    albumTitle: "PBX 1",
    artworkUrl: art(ART.pbx1),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/07/3f/d0/073fd066-5c3d-eba7-164c-1871e2c8bf9a/mzaf_4533023776739096788.plus.aac.p.m4a",
    durationMs: 204360,
    trackNumber: 2,
  },
  {
    id: "1439435012",
    title: "Death Route",
    artist: "Sidhu Moose Wala",
    albumId: "pbx1",
    albumTitle: "PBX 1",
    artworkUrl: art(ART.pbx1),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/48/30/04/483004d9-920a-76e8-5e45-ad25518faf12/mzaf_14519051228192333109.plus.aac.p.m4a",
    durationMs: 217521,
    trackNumber: 3,
  },
  {
    id: "1439435013",
    title: "Dawood",
    artist: "Sidhu Moose Wala",
    albumId: "pbx1",
    albumTitle: "PBX 1",
    artworkUrl: art(ART.pbx1),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/8d/28/ba/8d28ba1c-8f7f-cb27-dc10-3eeac90cc33b/mzaf_10126445668422200121.plus.aac.p.m4a",
    durationMs: 197103,
    trackNumber: 4,
  },
  {
    id: "1439435016",
    title: "Badfella",
    artist: "Sidhu Moose Wala",
    albumId: "pbx1",
    albumTitle: "PBX 1",
    artworkUrl: art(ART.pbx1),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/a9/94/92/a9949291-9462-8d6a-9459-669bdb4e93cb/mzaf_5474475053152849199.plus.aac.p.m4a",
    durationMs: 217532,
    trackNumber: 5,
  },
  {
    id: "1439435017",
    title: "Kala Chashma - Skit",
    artist: "Sidhu Moose Wala",
    albumId: "pbx1",
    albumTitle: "PBX 1",
    artworkUrl: art(ART.pbx1),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/99/a7/0f/99a70fe2-bde3-c03b-5202-694b3391c5ce/mzaf_9950529920509954696.plus.aac.p.m4a",
    durationMs: 25171,
    trackNumber: 6,
  },
  {
    id: "1439435018",
    title: "Selfmade",
    artist: "Sidhu Moose Wala",
    albumId: "pbx1",
    albumTitle: "PBX 1",
    artworkUrl: art(ART.pbx1),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/44/b6/ee/44b6ee77-913c-cb91-50d9-9d41b7ee8e2f/mzaf_17986090003588034776.plus.aac.p.m4a",
    durationMs: 179513,
    trackNumber: 7,
  },
  {
    id: "1439435019",
    title: "I'm Better Now - Skit",
    artist: "Sidhu Moose Wala",
    albumId: "pbx1",
    albumTitle: "PBX 1",
    artworkUrl: art(ART.pbx1),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/db/b2/05/dbb2056d-6860-725e-9e67-8337caf5ac12/mzaf_6798367706501665149.plus.aac.p.m4a",
    durationMs: 90024,
    trackNumber: 8,
  },
  {
    id: "1439435020",
    title: "I'm Better Now",
    artist: "Sidhu Moose Wala",
    albumId: "pbx1",
    albumTitle: "PBX 1",
    artworkUrl: art(ART.pbx1),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/8f/2c/c6/8f2cc602-8137-1a97-b879-984897b9eee8/mzaf_5059257802037630350.plus.aac.p.m4a",
    durationMs: 265754,
    trackNumber: 9,
  },
  {
    id: "1439435142",
    title: "Devil - Skit",
    artist: "Sidhu Moose Wala",
    albumId: "pbx1",
    albumTitle: "PBX 1",
    artworkUrl: art(ART.pbx1),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/2e/6e/5b/2e6e5bd7-c570-33e6-6a6f-c380b879c013/mzaf_2895013259466261081.plus.aac.p.m4a",
    durationMs: 78838,
    trackNumber: 10,
  },
  {
    id: "1439435143",
    title: "Devil",
    artist: "Sidhu Moose Wala",
    albumId: "pbx1",
    albumTitle: "PBX 1",
    artworkUrl: art(ART.pbx1),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/5f/6c/e9/5f6ce9e1-8e52-d3c1-ee2e-429de0fdbfd2/mzaf_1381727702811917993.plus.aac.p.m4a",
    durationMs: 245524,
    trackNumber: 11,
  },
  {
    id: "1439435144",
    title: "Trend",
    artist: "Sidhu Moose Wala",
    albumId: "pbx1",
    albumTitle: "PBX 1",
    artworkUrl: art(ART.pbx1),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/1d/61/63/1d61636c-bde0-6421-ba13-441345a987d0/mzaf_2093551291692912954.plus.aac.p.m4a",
    durationMs: 221818,
    trackNumber: 12,
  },
  {
    id: "1439435145",
    title: "Outro",
    artist: "Sidhu Moose Wala",
    albumId: "pbx1",
    albumTitle: "PBX 1",
    artworkUrl: art(ART.pbx1),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/3b/ee/52/3bee5238-13ee-a2e4-0096-49c13b1f8081/mzaf_4028263489486054622.plus.aac.p.m4a",
    durationMs: 31925,
    trackNumber: 13,
  },

  // ── Sidhu Moosewala — Moosetape ───────────────────────────────────────────
  {
    id: "1826848586",
    title: "Moosetape (Intro)",
    artist: "Sidhu Moose Wala",
    albumId: "moosetape",
    albumTitle: "Moosetape",
    artworkUrl: art(ART.moosetape),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/9e/b7/f3/9eb7f30d-4e6d-5e34-1ffb-b641bad8bafa/mzaf_9494449376487112753.plus.aac.p.m4a",
    durationMs: 92000,
    trackNumber: 1,
  },
  {
    id: "1826848589",
    title: "Bitch I'm Back",
    artist: "Sidhu Moose Wala",
    albumId: "moosetape",
    albumTitle: "Moosetape",
    artworkUrl: art(ART.moosetape),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/cb/f8/24/cbf824f3-938d-f3ad-94a3-8fb1d5791b4b/mzaf_13994756475127091382.plus.aac.p.m4a",
    durationMs: 230400,
    trackNumber: 2,
  },
  {
    id: "1826848594",
    title: "Burberry",
    artist: "Sidhu Moose Wala",
    albumId: "moosetape",
    albumTitle: "Moosetape",
    artworkUrl: art(ART.moosetape),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/4e/b7/4b/4eb74ba9-7361-c1e0-0e09-9167fe1d9cb4/mzaf_17749556387250687823.plus.aac.p.m4a",
    durationMs: 203444,
    trackNumber: 3,
  },
  {
    id: "1826848600",
    title: "Racks and Rounds (feat. Sikander Kahlon)",
    artist: "Sidhu Moose Wala",
    albumId: "moosetape",
    albumTitle: "Moosetape",
    artworkUrl: art(ART.moosetape),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/4a/da/31/4ada3194-4332-588e-f2e3-fe822e47111a/mzaf_486730075223620360.plus.aac.p.m4a",
    durationMs: 225000,
    trackNumber: 4,
  },
  {
    id: "1826848602",
    title: "US (feat. Raja Kumari)",
    artist: "Sidhu Moose Wala",
    albumId: "moosetape",
    albumTitle: "Moosetape",
    artworkUrl: art(ART.moosetape),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/91/2c/03/912c032f-710a-8fef-e4ff-0ba97b236f94/mzaf_7292433938322786301.plus.aac.p.m4a",
    durationMs: 230069,
    trackNumber: 5,
  },
  {
    id: "1826848605",
    title: "Moosedrilla (feat. DIVINE)",
    artist: "Sidhu Moose Wala",
    albumId: "moosetape",
    albumTitle: "Moosetape",
    artworkUrl: art(ART.moosetape),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/13/70/e1/1370e1be-6f9b-3501-4720-84fe1cd9b3c9/mzaf_16936905648936058244.plus.aac.p.m4a",
    durationMs: 232174,
    trackNumber: 6,
  },
  {
    id: "1826848609",
    title: "Boo Call (Skit)",
    artist: "Sidhu Moose Wala",
    albumId: "moosetape",
    albumTitle: "Moosetape",
    artworkUrl: art(ART.moosetape),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/cc/aa/0b/ccaa0bb2-7374-1e22-dc2c-c06e0d5ac322/mzaf_11515148667208843330.plus.aac.p.m4a",
    durationMs: 43153,
    trackNumber: 7,
  },
  {
    id: "1826848610",
    title: "Brown Shortie (feat. Sonam Bajwa)",
    artist: "Sidhu Moose Wala",
    albumId: "moosetape",
    albumTitle: "Moosetape",
    artworkUrl: art(ART.moosetape),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/7c/fb/e4/7cfbe48c-1d8c-4a53-59c1-da32a2010594/mzaf_5297758832904150043.plus.aac.p.m4a",
    durationMs: 208000,
    trackNumber: 8,
  },
  {
    id: "1826848675",
    title: "Aroma",
    artist: "Sidhu Moose Wala",
    albumId: "moosetape",
    albumTitle: "Moosetape",
    artworkUrl: art(ART.moosetape),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/60/c9/68/60c968c7-c62c-edc7-4692-48ce185f0db6/mzaf_15750177632075456851.plus.aac.p.m4a",
    durationMs: 256910,
    trackNumber: 9,
  },
  {
    id: "1826848679",
    title: "Real One (Skit)",
    artist: "Sidhu Moose Wala",
    albumId: "moosetape",
    albumTitle: "Moosetape",
    artworkUrl: art(ART.moosetape),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/f5/a1/e2/f5a1e285-ee30-e040-5451-5c594ada7fa9/mzaf_17133587994916238520.plus.aac.p.m4a",
    durationMs: 44000,
    trackNumber: 10,
  },
  {
    id: "1826848681",
    title: "GOAT",
    artist: "Sidhu Moose Wala",
    albumId: "moosetape",
    albumTitle: "Moosetape",
    artworkUrl: art(ART.moosetape),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/9c/e3/3d/9ce33de0-db5b-1faa-f64a-591b623a129a/mzaf_11254392829962088992.plus.aac.p.m4a",
    durationMs: 214884,
    trackNumber: 11,
  },
  {
    id: "1826848682",
    title: "Sidhu Son",
    artist: "Sidhu Moose Wala",
    albumId: "moosetape",
    albumTitle: "Moosetape",
    artworkUrl: art(ART.moosetape),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/5e/41/eb/5e41eba9-8007-58fd-80b8-2028b429b595/mzaf_15397293948131158322.plus.aac.p.m4a",
    durationMs: 217143,
    trackNumber: 12,
  },
  {
    id: "1826848683",
    title: "Chacha Huu (Skit)",
    artist: "Sidhu Moose Wala",
    albumId: "moosetape",
    albumTitle: "Moosetape",
    artworkUrl: art(ART.moosetape),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/80/01/17/80011764-fdc2-5244-7790-80452880c6de/mzaf_7198612132125946739.plus.aac.p.m4a",
    durationMs: 46000,
    trackNumber: 13,
  },
  {
    id: "1826848685",
    title: "Me and My Girlfriend",
    artist: "Sidhu Moose Wala",
    albumId: "moosetape",
    albumTitle: "Moosetape",
    artworkUrl: art(ART.moosetape),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/33/a7/63/33a763c5-9142-f742-9f2d-6301b19f28f3/mzaf_12455453623252242465.plus.aac.p.m4a",
    durationMs: 203544,
    trackNumber: 14,
  },
  {
    id: "1826848687",
    title: "These Days (feat. Bohemia)",
    artist: "Sidhu Moose Wala",
    albumId: "moosetape",
    albumTitle: "Moosetape",
    artworkUrl: art(ART.moosetape),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/7a/d1/48/7ad148fb-ad84-b2f5-458d-bfe86d9fe851/mzaf_1649891492448840391.plus.aac.p.m4a",
    durationMs: 209231,
    trackNumber: 15,
  },
  {
    id: "1826848689",
    title: "Ultimatum (Intro)",
    artist: "Sidhu Moose Wala",
    albumId: "moosetape",
    albumTitle: "Moosetape",
    artworkUrl: art(ART.moosetape),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/40/d6/22/40d62204-41eb-bf15-ccfa-38e5acd5bb88/mzaf_12623148744456491018.plus.aac.p.m4a",
    durationMs: 90353,
    trackNumber: 16,
  },
  {
    id: "1826848690",
    title: "Signed to God",
    artist: "Sidhu Moose Wala",
    albumId: "moosetape",
    albumTitle: "Moosetape",
    artworkUrl: art(ART.moosetape),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/f9/e5/21/f9e52183-00f4-444e-1d37-9bc67aebc9fc/mzaf_12151287642508562648.plus.aac.p.m4a",
    durationMs: 147742,
    trackNumber: 17,
  },
  {
    id: "1826848698",
    title: "Invincible (feat. Stefflon Don)",
    artist: "Sidhu Moose Wala & Stefflon Don",
    albumId: "moosetape",
    albumTitle: "Moosetape",
    artworkUrl: art(ART.moosetape),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/8d/d3/f0/8dd3f077-9c0a-4b49-5aac-b60cc407e3a0/mzaf_5290029699693266924.plus.aac.p.m4a",
    durationMs: 244444,
    trackNumber: 18,
  },
  {
    id: "1826848691",
    title: "Regret",
    artist: "Sidhu Moose Wala",
    albumId: "moosetape",
    albumTitle: "Moosetape",
    artworkUrl: art(ART.moosetape),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/90/f9/3a/90f93a54-82e2-6f04-c443-2091f62cff6d/mzaf_1194569702174237276.plus.aac.p.m4a",
    durationMs: 311429,
    trackNumber: 19,
  },
  {
    id: "1826848692",
    title: "Pind Hood Damn Good (RMG Intro)",
    artist: "Sidhu Moose Wala",
    albumId: "moosetape",
    albumTitle: "Moosetape",
    artworkUrl: art(ART.moosetape),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/0d/78/6c/0d786c01-f319-62f6-7127-88b47a8e4c6e/mzaf_9711016017441529261.plus.aac.p.m4a",
    durationMs: 75000,
    trackNumber: 20,
  },
  {
    id: "1826848694",
    title: "Malwa Block",
    artist: "Sidhu Moose Wala",
    albumId: "moosetape",
    albumTitle: "Moosetape",
    artworkUrl: art(ART.moosetape),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/45/0b/34/450b349a-74c4-fd6b-7c94-bc8cbed6b1c4/mzaf_7435262019463281522.plus.aac.p.m4a",
    durationMs: 239294,
    trackNumber: 21,
  },
  {
    id: "1826848696",
    title: "B & W",
    artist: "Sidhu Moose Wala",
    albumId: "moosetape",
    albumTitle: "Moosetape",
    artworkUrl: art(ART.moosetape),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/2f/3c/e6/2f3ce6b9-671f-5ea5-e78a-081fe4668663/mzaf_13077879748589624642.plus.aac.p.m4a",
    durationMs: 245455,
    trackNumber: 22,
  },
  {
    id: "1826848697",
    title: "Celebrity Killer (feat. Tion Wayne)",
    artist: "Sidhu Moose Wala",
    albumId: "moosetape",
    albumTitle: "Moosetape",
    artworkUrl: art(ART.moosetape),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/ce/dd/03/cedd03af-7daf-1b18-9555-50a452d60b93/mzaf_5113662040081768649.plus.aac.p.m4a",
    durationMs: 203333,
    trackNumber: 23,
  },
  {
    id: "1826848912",
    title: "Amli Talk (Skit)",
    artist: "Sidhu Moose Wala",
    albumId: "moosetape",
    albumTitle: "Moosetape",
    artworkUrl: art(ART.moosetape),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/62/70/43/6270432a-f8b2-c023-11d8-9df2727ee723/mzaf_7656907311536068599.plus.aac.p.m4a",
    durationMs: 44000,
    trackNumber: 24,
  },
  {
    id: "1826848914",
    title: "G-Shit (feat. Blockboi Twitch)",
    artist: "Sidhu Moose Wala",
    albumId: "moosetape",
    albumTitle: "Moosetape",
    artworkUrl: art(ART.moosetape),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/63/4a/d4/634ad4bb-a0a7-b861-a3ff-9839ef7d2ce7/mzaf_13173176164293641179.plus.aac.p.m4a",
    durationMs: 233571,
    trackNumber: 25,
  },
  {
    id: "1826848919",
    title: "Built Different",
    artist: "Sidhu Moose Wala",
    albumId: "moosetape",
    albumTitle: "Moosetape",
    artworkUrl: art(ART.moosetape),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/50/65/a5/5065a585-a114-8628-9ba3-d3eefef2d317/mzaf_13907869109544680674.plus.aac.p.m4a",
    durationMs: 247579,
    trackNumber: 26,
  },
  {
    id: "1826848921",
    title: "Trial Day (Skit)",
    artist: "Sidhu Moose Wala",
    albumId: "moosetape",
    albumTitle: "Moosetape",
    artworkUrl: art(ART.moosetape),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/03/e2/1c/03e21cbf-a91b-13e7-b6fc-851fad45d936/mzaf_4499813154339887918.plus.aac.p.m4a",
    durationMs: 119000,
    trackNumber: 27,
  },
  {
    id: "1826848924",
    title: "Calaboose",
    artist: "Sidhu Moose Wala",
    albumId: "moosetape",
    albumTitle: "Moosetape",
    artworkUrl: art(ART.moosetape),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/4e/da/7e/4eda7e4d-1fa2-e9c6-5467-904e6b7862fa/mzaf_6683231983349278643.plus.aac.p.m4a",
    durationMs: 243227,
    trackNumber: 28,
  },
  {
    id: "1826848925",
    title: "Facts (Skit)",
    artist: "Sidhu Moose Wala",
    albumId: "moosetape",
    albumTitle: "Moosetape",
    artworkUrl: art(ART.moosetape),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/70/06/c4/7006c4da-01f0-636b-4f19-08993d377ee9/mzaf_6359147837105657078.plus.aac.p.m4a",
    durationMs: 71500,
    trackNumber: 29,
  },
  {
    id: "1826848930",
    title: "295",
    artist: "Sidhu Moose Wala",
    albumId: "moosetape",
    albumTitle: "Moosetape",
    artworkUrl: art(ART.moosetape),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/dd/be/4d/ddbe4df8-03cf-cfbe-8e45-8bac05526453/mzaf_8111191194757426543.plus.aac.p.m4a",
    durationMs: 270000,
    trackNumber: 30,
  },
  {
    id: "1826849048",
    title: "IDGAF (feat. Morrisson)",
    artist: "Sidhu Moose Wala",
    albumId: "moosetape",
    albumTitle: "Moosetape",
    artworkUrl: art(ART.moosetape),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/c6/1f/0c/c61f0ccf-2406-c170-dec1-30e8bfeb5f47/mzaf_8322791623611234801.plus.aac.p.m4a",
    durationMs: 176842,
    trackNumber: 31,
  },
  {
    id: "1826849050",
    title: "Power",
    artist: "Sidhu Moose Wala",
    albumId: "moosetape",
    albumTitle: "Moosetape",
    artworkUrl: art(ART.moosetape),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/dd/8c/31/dd8c31b2-e60a-9033-fb36-57ef1d0effbe/mzaf_3417371223519704680.plus.aac.p.m4a",
    durationMs: 228000,
    trackNumber: 32,
  },

  // ── Karan Aujla — Four Me EP ──────────────────────────────────────────────
  {
    id: "1753101068",
    title: "IDK HOW",
    artist: "Karan Aujla",
    albumId: "fourme",
    albumTitle: "Four Me",
    artworkUrl: art(ART.fourme),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/5f/38/bf/5f38bf56-4f9c-0f3b-48a8-3b894b383cb8/mzaf_11299441282135004372.plus.aac.p.m4a",
    durationMs: 175556,
    trackNumber: 1,
  },
  {
    id: "1753101069",
    title: "Who They?",
    artist: "Karan Aujla & YEAH PROOF",
    albumId: "fourme",
    albumTitle: "Four Me",
    artworkUrl: art(ART.fourme),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/f4/1d/8e/f41d8e24-a27a-1712-ff46-082016f37efb/mzaf_12004953369108907708.plus.aac.p.m4a",
    durationMs: 203409,
    trackNumber: 2,
  },
  {
    id: "1753101077",
    title: "Antidote",
    artist: "Karan Aujla",
    albumId: "fourme",
    albumTitle: "Four Me",
    artworkUrl: art(ART.fourme),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/83/fd/0a/83fd0a07-7fc9-e07e-520f-ce8ca4327acc/mzaf_14841514026491120213.plus.aac.p.m4a",
    durationMs: 187333,
    trackNumber: 3,
  },
  {
    id: "1753101463",
    title: "Y.D.G",
    artist: "Karan Aujla & YEAH PROOF",
    albumId: "fourme",
    albumTitle: "Four Me",
    artworkUrl: art(ART.fourme),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/4e/aa/b0/4eaab001-d481-9bce-ecd3-11cbfb210a3b/mzaf_5963655609452342455.plus.aac.p.m4a",
    durationMs: 171752,
    trackNumber: 4,
  },

  // ── Karan Aujla — Four You EP ─────────────────────────────────────────────
  {
    id: "1859550758",
    title: "Fallin Apart",
    artist: "Karan Aujla & Ikky",
    albumId: "fouryou",
    albumTitle: "Four You",
    artworkUrl: art(ART.fouryou),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/d3/5a/06/d35a0601-498e-0509-e02d-d8813ae8669b/mzaf_1742394590866445951.plus.aac.p.m4a",
    durationMs: 198000,
    trackNumber: 1,
  },
  {
    id: "1859550748",
    title: "52 Bars",
    artist: "Karan Aujla",
    albumId: "fouryou",
    albumTitle: "Four You",
    artworkUrl: art(ART.fouryou),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/52/c9/1c/52c91c69-352d-cb4e-3706-265dc01067d0/mzaf_17387125942915601585.plus.aac.p.m4a",
    durationMs: 214024,
    trackNumber: 2,
  },
  {
    id: "1859550751",
    title: "Take It Easy",
    artist: "Karan Aujla",
    albumId: "fouryou",
    albumTitle: "Four You",
    artworkUrl: art(ART.fouryou),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/7d/75/bd/7d75bd28-f8bc-cc20-1ee9-a28b9daceb41/mzaf_2863142868365039296.plus.aac.p.m4a",
    durationMs: 210361,
    trackNumber: 3,
  },
  {
    id: "1859550762",
    title: "YEAH NAAH",
    artist: "Karan Aujla",
    albumId: "fouryou",
    albumTitle: "Four You",
    artworkUrl: art(ART.fouryou),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/a1/44/b0/a144b082-8515-2242-4112-25b7a4499c83/mzaf_13631255533908778166.plus.aac.p.m4a",
    durationMs: 182375,
    trackNumber: 4,
  },

  // ── Jass Manak — Age 19 ───────────────────────────────────────────────────
  {
    id: "1760569286",
    title: "Manaka Da Munda",
    artist: "Jass Manak",
    albumId: "age19",
    albumTitle: "Age 19",
    artworkUrl: art(ART.age19),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/98/52/89/985289b8-e73b-440f-005d-1f224eff8d07/mzaf_11562832331208322999.plus.aac.p.m4a",
    durationMs: 151652,
    trackNumber: 1,
  },
  {
    id: "1760569287",
    title: "Girlfriend",
    artist: "Jass Manak",
    albumId: "age19",
    albumTitle: "Age 19",
    artworkUrl: art(ART.age19),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/6b/18/11/6b181161-c0b4-64cf-8f92-5a28b305d673/mzaf_9014796324508689648.plus.aac.p.m4a",
    durationMs: 187765,
    trackNumber: 2,
  },
  {
    id: "1760569294",
    title: "Viah",
    artist: "Jass Manak",
    albumId: "age19",
    albumTitle: "Age 19",
    artworkUrl: art(ART.age19),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/76/e1/d0/76e1d097-2f74-7c99-d460-a91654956b27/mzaf_4817086170091422215.plus.aac.p.m4a",
    durationMs: 162441,
    trackNumber: 3,
  },
  {
    id: "1760569298",
    title: "Chehra Tera",
    artist: "Jass Manak",
    albumId: "age19",
    albumTitle: "Age 19",
    artworkUrl: art(ART.age19),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/d1/07/d8/d107d812-400b-f7cc-f116-26ca00b4cbe4/mzaf_3347207250466437870.plus.aac.p.m4a",
    durationMs: 195543,
    trackNumber: 4,
  },
  {
    id: "1760569299",
    title: "Kalli Ho Gai",
    artist: "Jass Manak",
    albumId: "age19",
    albumTitle: "Age 19",
    artworkUrl: art(ART.age19),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/fe/5d/08/fe5d0876-0043-7a17-aa18-0bd6a893c729/mzaf_1810547721823127896.plus.aac.p.m4a",
    durationMs: 156923,
    trackNumber: 5,
  },
  {
    id: "1760569302",
    title: "Moonroof",
    artist: "Jass Manak",
    albumId: "age19",
    albumTitle: "Age 19",
    artworkUrl: art(ART.age19),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/67/e1/0d/67e10d86-f93c-8e78-60c2-f04cbf78cf39/mzaf_11815360948996982303.plus.aac.p.m4a",
    durationMs: 167701,
    trackNumber: 6,
  },
  {
    id: "1760569304",
    title: "Kali Range",
    artist: "Jass Manak",
    albumId: "age19",
    albumTitle: "Age 19",
    artworkUrl: art(ART.age19),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/1c/9e/4e/1c9e4ee0-1e3b-9bb3-9951-33048d65be65/mzaf_5815781869322884943.plus.aac.p.m4a",
    durationMs: 191403,
    trackNumber: 7,
  },
  {
    id: "1760569308",
    title: "Tere Naal",
    artist: "Jass Manak",
    albumId: "age19",
    albumTitle: "Age 19",
    artworkUrl: art(ART.age19),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/e2/b7/31/e2b73157-7cd5-37a2-1a84-e5b1b810f8de/mzaf_17385005785468738114.plus.aac.p.m4a",
    durationMs: 218035,
    trackNumber: 8,
  },
  {
    id: "1760569729",
    title: "Age 19",
    artist: "Jass Manak",
    albumId: "age19",
    albumTitle: "Age 19",
    artworkUrl: art(ART.age19),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/b7/4d/56/b74d5678-f81c-0803-4e86-d5fab42bc369/mzaf_958003119315117500.plus.aac.p.m4a",
    durationMs: 189022,
    trackNumber: 9,
  },

  // ── Lindsey Stirling — Shatter Me ────────────────────────────────────────
  {
    id: "844250541",
    title: "Beyond the Veil",
    artist: "Lindsey Stirling",
    albumId: "shatterme",
    albumTitle: "Shatter Me",
    artworkUrl: art(ART.shatterme),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/33/04/0e/33040efd-7446-bace-4eb9-d7902c2707ee/mzaf_6961016577358056764.plus.aac.p.m4a",
    durationMs: 254861,
    trackNumber: 1,
  },
  {
    id: "844250559",
    title: "Mirror Haus",
    artist: "Lindsey Stirling",
    albumId: "shatterme",
    albumTitle: "Shatter Me",
    artworkUrl: art(ART.shatterme),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/ff/1a/df/ff1adf9b-74a4-81c1-2671-041997e47d9d/mzaf_16478526106027865626.plus.aac.p.m4a",
    durationMs: 235616,
    trackNumber: 2,
  },
  {
    id: "844250572",
    title: "V-Pop",
    artist: "Lindsey Stirling",
    albumId: "shatterme",
    albumTitle: "Shatter Me",
    artworkUrl: art(ART.shatterme),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/05/b9/15/05b915ad-539f-b6d3-b339-83c2e45f7308/mzaf_15012702390163284009.plus.aac.p.m4a",
    durationMs: 225811,
    trackNumber: 3,
  },
  {
    id: "844250590",
    title: "Shatter Me (feat. Lzzy Hale)",
    artist: "Lindsey Stirling",
    albumId: "shatterme",
    albumTitle: "Shatter Me",
    artworkUrl: art(ART.shatterme),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/a4/2d/d7/a42dd7ec-930a-a9db-f4e2-7ee902712e4c/mzaf_11317603533354772809.plus.aac.p.m4a",
    durationMs: 280803,
    trackNumber: 4,
  },
  {
    id: "844250599",
    title: "Heist",
    artist: "Lindsey Stirling",
    albumId: "shatterme",
    albumTitle: "Shatter Me",
    artworkUrl: art(ART.shatterme),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/b6/39/b2/b639b29a-a713-47a0-bc1e-d715f6092452/mzaf_2678759139384108434.plus.aac.p.m4a",
    durationMs: 206843,
    trackNumber: 5,
  },
  {
    id: "844250689",
    title: "Night Vision",
    artist: "Lindsey Stirling",
    albumId: "shatterme",
    albumTitle: "Shatter Me",
    artworkUrl: art(ART.shatterme),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/6a/dc/b0/6adcb0a7-a949-b569-b4da-dfec3874059f/mzaf_6239827068772386820.plus.aac.p.m4a",
    durationMs: 220145,
    trackNumber: 6,
  },
  {
    id: "844250747",
    title: "Take Flight",
    artist: "Lindsey Stirling",
    albumId: "shatterme",
    albumTitle: "Shatter Me",
    artworkUrl: art(ART.shatterme),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/52/c9/13/52c913d1-92b1-1f6b-0b21-0904f81cee36/mzaf_14731161907773583409.plus.aac.p.m4a",
    durationMs: 264266,
    trackNumber: 7,
  },
  {
    id: "844250817",
    title: "Ascendance",
    artist: "Lindsey Stirling",
    albumId: "shatterme",
    albumTitle: "Shatter Me",
    artworkUrl: art(ART.shatterme),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/ef/42/3f/ef423fca-9830-3401-908f-b3e9e8e1b958/mzaf_4149792478629727967.plus.aac.p.m4a",
    durationMs: 266231,
    trackNumber: 8,
  },
  {
    id: "844251976",
    title: "We Are Giants (feat. Dia Frampton)",
    artist: "Lindsey Stirling",
    albumId: "shatterme",
    albumTitle: "Shatter Me",
    artworkUrl: art(ART.shatterme),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/75/30/71/7530714f-174d-2cda-9acf-ffbff3542d4b/mzaf_7072909357790722013.plus.aac.p.m4a",
    durationMs: 223977,
    trackNumber: 9,
  },
  {
    id: "844252047",
    title: "Swag",
    artist: "Lindsey Stirling",
    albumId: "shatterme",
    albumTitle: "Shatter Me",
    artworkUrl: art(ART.shatterme),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/d7/f0/56/d7f0567e-9106-8798-4917-186823ecd2dc/mzaf_3201230496657223840.plus.aac.p.m4a",
    durationMs: 190189,
    trackNumber: 11,
  },
  {
    id: "844252055",
    title: "Master of Tides",
    artist: "Lindsey Stirling",
    albumId: "shatterme",
    albumTitle: "Shatter Me",
    artworkUrl: art(ART.shatterme),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/1b/25/87/1b258762-e9b7-160a-fe1b-ed87eb3e7bb5/mzaf_7765223216055439155.plus.aac.p.m4a",
    durationMs: 261724,
    trackNumber: 12,
  },
  {
    id: "844250616",
    title: "Roundtable Rival",
    artist: "Lindsey Stirling",
    albumId: "shatterme",
    albumTitle: "Shatter Me",
    artworkUrl: art(ART.shatterme),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/f0/16/66/f0166653-8416-4c78-8c43-df8f13032438/mzaf_16517175390325603906.plus.aac.p.m4a",
    durationMs: 203294,
    trackNumber: 10,
  },

  // ── Amrinder Gill — Judaa 1 (listed as "Judda" on iTunes) ────────────────
  {
    id: "1426290360",
    title: "Asi Gabru Punjabi",
    artist: "Amrinder Gill",
    albumId: "judaa1",
    albumTitle: "Judaa 1",
    artworkUrl: art(ART.judaa1),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/86/30/27/863027e9-aa9d-2848-52bc-c6e02a7287e6/mzaf_5245509353953978629.plus.aac.p.m4a",
    durationMs: 228493,
    trackNumber: 1,
  },
  {
    id: "1426290362",
    title: "Judaa",
    artist: "Amrinder Gill",
    albumId: "judaa1",
    albumTitle: "Judaa 1",
    artworkUrl: art(ART.judaa1),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/76/23/ac/7623ac4b-8923-35db-8154-8af93c9c2ec6/mzaf_9036161060896707906.plus.aac.p.m4a",
    durationMs: 329770,
    trackNumber: 2,
  },
  {
    id: "1426290363",
    title: "Ki Samjiye",
    artist: "Amrinder Gill",
    albumId: "judaa1",
    albumTitle: "Judaa 1",
    artworkUrl: art(ART.judaa1),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/d6/37/12/d637126b-a8bd-cb42-6c20-5b9a1d204954/mzaf_11650756119930067211.plus.aac.p.m4a",
    durationMs: 284813,
    trackNumber: 3,
  },
  {
    id: "1426290364",
    title: "Ki Samjiye (Unplugged)",
    artist: "Amrinder Gill",
    albumId: "judaa1",
    albumTitle: "Judaa 1",
    artworkUrl: art(ART.judaa1),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/e7/fa/fa/e7fafa43-aad1-79f9-6365-ab144871d9f8/mzaf_157053361680191302.plus.aac.p.m4a",
    durationMs: 267285,
    trackNumber: 4,
  },
  {
    id: "1426290797",
    title: "Mirza",
    artist: "Amrinder Gill",
    albumId: "judaa1",
    albumTitle: "Judaa 1",
    artworkUrl: art(ART.judaa1),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/9b/9a/04/9b9a04b9-3b6a-d5a1-e299-a966abd57f0d/mzaf_5124686045108984322.plus.aac.p.m4a",
    durationMs: 195265,
    trackNumber: 5,
  },
  {
    id: "1426290816",
    title: "Mitran Da Dil",
    artist: "Amrinder Gill",
    albumId: "judaa1",
    albumTitle: "Judaa 1",
    artworkUrl: art(ART.judaa1),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/72/05/94/720594e1-ac78-7710-9619-ea2fc3c74293/mzaf_2516413665630935576.plus.aac.p.m4a",
    durationMs: 268408,
    trackNumber: 6,
  },
  {
    id: "1426290819",
    title: "Naajra",
    artist: "Amrinder Gill",
    albumId: "judaa1",
    albumTitle: "Judaa 1",
    artworkUrl: art(ART.judaa1),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/c8/cd/f0/c8cdf0fe-72e2-f30e-8685-df9033b55d96/mzaf_8212425966540669413.plus.aac.p.m4a",
    durationMs: 261825,
    trackNumber: 7,
  },
  {
    id: "1426290820",
    title: "Tere Raah",
    artist: "Amrinder Gill",
    albumId: "judaa1",
    albumTitle: "Judaa 1",
    artworkUrl: art(ART.judaa1),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/92/0b/87/920b871a-4827-d10e-33a4-2a6feea75ac6/mzaf_9740644028249691969.plus.aac.p.m4a",
    durationMs: 192810,
    trackNumber: 8,
  },
  {
    id: "1426290973",
    title: "Tere Utte",
    artist: "Amrinder Gill",
    albumId: "judaa1",
    albumTitle: "Judaa 1",
    artworkUrl: art(ART.judaa1),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/40/54/e8/4054e899-cb8b-c5fa-ce39-4486934576b3/mzaf_313819066771906622.plus.aac.p.m4a",
    durationMs: 248555,
    trackNumber: 9,
  },

  // ── Amrinder Gill — Judaa 2 ───────────────────────────────────────────────
  {
    id: "806210364",
    title: "Mera Deewanapan",
    artist: "Dr Zeus & Amrinder Gill",
    albumId: "judaa2",
    albumTitle: "Judaa 2",
    artworkUrl: art(ART.judaa2),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/dd/09/da/dd09da68-2f6e-845a-7ac8-ee516c546f3d/mzaf_9360792228181793448.plus.aac.p.m4a",
    durationMs: 242573,
    trackNumber: 1,
  },
  {
    id: "806210365",
    title: "Salera Rang",
    artist: "Dr Zeus & Amrinder Gill",
    albumId: "judaa2",
    albumTitle: "Judaa 2",
    artworkUrl: art(ART.judaa2),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/ee/8d/82/ee8d8297-533e-ec69-ad30-8a47d28b66f1/mzaf_15640227251182064061.plus.aac.p.m4a",
    durationMs: 186394,
    trackNumber: 2,
  },
  {
    id: "806210369",
    title: "Judaa 2",
    artist: "Bilal Saeed & Amrinder Gill",
    albumId: "judaa2",
    albumTitle: "Judaa 2",
    artworkUrl: art(ART.judaa2),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/95/17/23/9517234d-2a7f-91f8-6789-f8e8084eaacf/mzaf_15872318732769216740.plus.aac.p.m4a",
    durationMs: 248504,
    trackNumber: 3,
  },
  {
    id: "806210371",
    title: "Naam Gabhru Da",
    artist: "Dr Zeus & Amrinder Gill",
    albumId: "judaa2",
    albumTitle: "Judaa 2",
    artworkUrl: art(ART.judaa2),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/48/f5/41/48f541a3-d091-f104-5e05-dc722b96c5f1/mzaf_14575045825164449409.plus.aac.p.m4a",
    durationMs: 210091,
    trackNumber: 4,
  },
  {
    id: "806210373",
    title: "Dairy",
    artist: "Dr Zeus & Amrinder Gill",
    albumId: "judaa2",
    albumTitle: "Judaa 2",
    artworkUrl: art(ART.judaa2),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/54/df/b8/54dfb883-ec88-aca6-b8eb-e14e1a7ee973/mzaf_3136249045733335148.plus.aac.p.m4a",
    durationMs: 252372,
    trackNumber: 5,
  },
  {
    id: "806210374",
    title: "Pendu (feat. Young Fateh)",
    artist: "Dr Zeus & Amrinder Gill",
    albumId: "judaa2",
    albumTitle: "Judaa 2",
    artworkUrl: art(ART.judaa2),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/8b/18/0f/8b180f4a-f5fc-5887-c877-9aea9e673a18/mzaf_5053047596991226781.plus.aac.p.m4a",
    durationMs: 160988,
    trackNumber: 6,
  },
  {
    id: "806210377",
    title: "Judaa 2 (U-Mix)",
    artist: "Bilal Saeed & Amrinder Gill",
    albumId: "judaa2",
    albumTitle: "Judaa 2",
    artworkUrl: art(ART.judaa2),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/81/cd/d8/81cdd8b8-204c-64b4-37b9-3f7910ee2b13/mzaf_10386603626726881029.plus.aac.p.m4a",
    durationMs: 246739,
    trackNumber: 7,
  },
  {
    id: "806210384",
    title: "Babul",
    artist: "Dr Zeus & Amrinder Gill",
    albumId: "judaa2",
    albumTitle: "Judaa 2",
    artworkUrl: art(ART.judaa2),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/c5/cc/57/c5cc5760-4371-8a4d-e593-8e6e374ebb2a/mzaf_13519651308970727204.plus.aac.p.m4a",
    durationMs: 268392,
    trackNumber: 8,
  },
  {
    id: "806210385",
    title: "Lutti Jaa (feat. Young Fateh)",
    artist: "Dr Zeus & Amrinder Gill",
    albumId: "judaa2",
    albumTitle: "Judaa 2",
    artworkUrl: art(ART.judaa2),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/d8/a6/ed/d8a6eda8-b3bd-3848-bdde-82a2ef3718a7/mzaf_12799982489445272349.plus.aac.p.m4a",
    durationMs: 169843,
    trackNumber: 9,
  },
  {
    id: "806210542",
    title: "Dairy (U-Mix)",
    artist: "Dr Zeus & Amrinder Gill",
    albumId: "judaa2",
    albumTitle: "Judaa 2",
    artworkUrl: art(ART.judaa2),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/21/aa/e3/21aae3d4-fe48-0e12-1c46-7c1a409ceafd/mzaf_17303720839391832970.plus.aac.p.m4a",
    durationMs: 258137,
    trackNumber: 10,
  },

  // ── Amrinder Gill — Judaa 3 (Chapter 1) ──────────────────────────────────
  {
    id: "1773473870",
    title: "Band Darvaze",
    artist: "Amrinder Gill & Dr Zeus",
    albumId: "judaa3",
    albumTitle: "Judaa 3",
    artworkUrl: art(ART.judaa3ch1),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/c9/aa/d0/c9aad097-f209-88fc-3a8d-04b6668e51c3/mzaf_17039818774591109191.plus.aac.p.m4a",
    durationMs: 308232,
    trackNumber: 1,
  },
  {
    id: "1773473871",
    title: "Chal Jindiye",
    artist: "Amrinder Gill & Dr Zeus",
    albumId: "judaa3",
    albumTitle: "Judaa 3",
    artworkUrl: art(ART.judaa3ch1),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/ef/95/e8/ef95e851-a08a-45c2-aa1c-cbc559bd00bd/mzaf_10534646609133786458.plus.aac.p.m4a",
    durationMs: 204340,
    trackNumber: 2,
  },
  {
    id: "1773473872",
    title: "Pagg (feat. NseeB)",
    artist: "Amrinder Gill & Dr Zeus",
    albumId: "judaa3",
    albumTitle: "Judaa 3",
    artworkUrl: art(ART.judaa3ch1),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/21/83/ae/2183ae0e-ca8b-60d0-3a49-08c17bbfc3c2/mzaf_16949083379919448551.plus.aac.p.m4a",
    durationMs: 178573,
    trackNumber: 3,
  },
  {
    id: "1773473874",
    title: "Zid Kaisi",
    artist: "Amrinder Gill & Dr Zeus",
    albumId: "judaa3",
    albumTitle: "Judaa 3",
    artworkUrl: art(ART.judaa3ch1),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/0d/1d/9e/0d1d9e9f-c656-03a6-9020-0e3a860a0dd0/mzaf_14411380401565616692.plus.aac.p.m4a",
    durationMs: 244860,
    trackNumber: 4,
  },
  {
    id: "1773473875",
    title: "Necklace",
    artist: "Amrinder Gill & Dr Zeus",
    albumId: "judaa3",
    albumTitle: "Judaa 3",
    artworkUrl: art(ART.judaa3ch1),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/a7/43/a7/a743a7b7-66da-d8e5-cf55-5fd7832eb986/mzaf_1055253207505176441.plus.aac.p.m4a",
    durationMs: 215820,
    trackNumber: 5,
  },
  {
    id: "1773473876",
    title: "Gussa",
    artist: "Amrinder Gill & Dr Zeus",
    albumId: "judaa3",
    albumTitle: "Judaa 3",
    artworkUrl: art(ART.judaa3ch1),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/ac/5f/ff/ac5fff07-9927-c78a-5a86-ae4a080a9dcc/mzaf_16765550920598104117.plus.aac.p.m4a",
    durationMs: 208655,
    trackNumber: 6,
  },
  {
    id: "1773473881",
    title: "Muqabla",
    artist: "Amrinder Gill & Dr Zeus",
    albumId: "judaa3",
    albumTitle: "Judaa 3",
    artworkUrl: art(ART.judaa3ch1),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/9c/df/b6/9cdfb681-ca97-09b4-0976-037aca7e0df2/mzaf_13830845525539529420.plus.aac.p.m4a",
    durationMs: 176482,
    trackNumber: 7,
  },
  {
    id: "1773473888",
    title: "Band Darvaze (Ballad Mix)",
    artist: "Amrinder Gill & Dr Zeus",
    albumId: "judaa3",
    albumTitle: "Judaa 3",
    artworkUrl: art(ART.judaa3ch1),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/88/f4/34/88f434b9-e43e-c60b-a311-7748d3d2afcc/mzaf_9030402998413513243.plus.aac.p.m4a",
    durationMs: 327052,
    trackNumber: 8,
  },
  {
    id: "1844959852",
    title: "That Girl",
    artist: "Amrinder Gill, Raj Ranjodh & Dr Zeus",
    albumId: "judaa3",
    albumTitle: "Judaa 3",
    artworkUrl: art(ART.judaa3ch2),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/50/a0/94/50a094e0-46fa-352e-0a97-72c9c767fad6/mzaf_9650906495741341906.plus.aac.p.m4a",
    durationMs: 157370,
    trackNumber: 9,
  },
  {
    id: "1844959853",
    title: "Judaa 3 Title Track",
    artist: "Amrinder Gill, Dr Zeus & Raj Ranjodh",
    albumId: "judaa3",
    albumTitle: "Judaa 3",
    artworkUrl: art(ART.judaa3ch2),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/4c/a9/6a/4ca96a1b-9e33-c219-085a-e21178fbd64c/mzaf_16686709314990444874.plus.aac.p.m4a",
    durationMs: 227267,
    trackNumber: 10,
  },
  {
    id: "1844959854",
    title: "Kafka (feat. Gurlej Akhtar)",
    artist: "Amrinder Gill & Dr Zeus",
    albumId: "judaa3",
    albumTitle: "Judaa 3",
    artworkUrl: art(ART.judaa3ch2),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/e7/26/9d/e7269de4-cb9a-e67c-88da-358ee9449f69/mzaf_18222697644622547066.plus.aac.p.m4a",
    durationMs: 192194,
    trackNumber: 11,
  },
  {
    id: "1844959855",
    title: "Havaa",
    artist: "Amrinder Gill & Dr Zeus",
    albumId: "judaa3",
    albumTitle: "Judaa 3",
    artworkUrl: art(ART.judaa3ch2),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/3a/05/16/3a051636-68ae-aac5-03fb-fd0cdda4151c/mzaf_15099980795072894018.plus.aac.p.m4a",
    durationMs: 206779,
    trackNumber: 12,
  },
  {
    id: "1844959856",
    title: "Reflection",
    artist: "Amrinder Gill & Dr Zeus",
    albumId: "judaa3",
    albumTitle: "Judaa 3",
    artworkUrl: art(ART.judaa3ch2),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/a1/dd/6f/a1dd6f0d-a248-47da-31e9-cc501d6030f9/mzaf_982800097968960454.plus.aac.p.m4a",
    durationMs: 161156,
    trackNumber: 13,
  },
  {
    id: "1844959859",
    title: "Sunkissed",
    artist: "Amrinder Gill & Dr Zeus",
    albumId: "judaa3",
    albumTitle: "Judaa 3",
    artworkUrl: art(ART.judaa3ch2),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/9e/b5/85/9eb585eb-1ce2-d3e7-e8c6-24659052e5c4/mzaf_8419830042957115173.plus.aac.p.m4a",
    durationMs: 179206,
    trackNumber: 14,
  },
  {
    id: "1844959861",
    title: "Kamli Jehi",
    artist: "Amrinder Gill & Dr Zeus",
    albumId: "judaa3",
    albumTitle: "Judaa 3",
    artworkUrl: art(ART.judaa3ch2),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/20/87/e6/2087e615-1130-b7c4-63e0-1c961f4e23f8/mzaf_8532910890812462090.plus.aac.p.m4a",
    durationMs: 203768,
    trackNumber: 15,
  },
  {
    id: "1844959862",
    title: "Goriye",
    artist: "Amrinder Gill & Dr Zeus",
    albumId: "judaa3",
    albumTitle: "Judaa 3",
    artworkUrl: art(ART.judaa3ch2),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/97/33/86/973386f5-9d0f-b0ae-f66c-044096918991/mzaf_11260858105590665839.plus.aac.p.m4a",
    durationMs: 181322,
    trackNumber: 16,
  },

  // ── Arjan Dhillon — A for Arjan 2 ────────────────────────────────────────
  {
    id: "1835109922",
    title: "Ki Kariye",
    artist: "Arjan Dhillon",
    albumId: "aforarjan2",
    albumTitle: "A for Arjan 2",
    artworkUrl: art(ART.aforarjan2),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/6c/eb/ad/6cebad81-cf75-d6a3-11c7-4a9116ef0dea/mzaf_13721687557145357760.plus.aac.p.m4a",
    durationMs: 272243,
    trackNumber: 1,
  },
  {
    id: "1835109923",
    title: "Mulaqat",
    artist: "Arjan Dhillon",
    albumId: "aforarjan2",
    albumTitle: "A for Arjan 2",
    artworkUrl: art(ART.aforarjan2),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/c0/1c/44/c01c4423-6a69-ea12-958b-bdd3cfbb6f22/mzaf_16416744503509816761.plus.aac.p.m4a",
    durationMs: 166032,
    trackNumber: 2,
  },
  {
    id: "1835109924",
    title: "He Is Mine",
    artist: "Arjan Dhillon",
    albumId: "aforarjan2",
    albumTitle: "A for Arjan 2",
    artworkUrl: art(ART.aforarjan2),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/6a/f9/bc/6af9bc1b-0874-adfd-4702-261b16bf675b/mzaf_4791439911826613295.plus.aac.p.m4a",
    durationMs: 181000,
    trackNumber: 3,
  },
  {
    id: "1835109935",
    title: "Ik Tarfa",
    artist: "Arjan Dhillon",
    albumId: "aforarjan2",
    albumTitle: "A for Arjan 2",
    artworkUrl: art(ART.aforarjan2),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/69/41/25/694125cb-8b31-ac53-07d2-d898e2e330f8/mzaf_9460578716263311785.plus.aac.p.m4a",
    durationMs: 263647,
    trackNumber: 5,
  },
  {
    id: "1835109925",
    title: "Changa Ae",
    artist: "Arjan Dhillon",
    albumId: "aforarjan2",
    albumTitle: "A for Arjan 2",
    artworkUrl: art(ART.aforarjan2),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/78/c4/8a/78c48a4b-4f1e-f391-e866-676e3eb8e919/mzaf_11887019046832277517.plus.aac.p.m4a",
    durationMs: 235982,
    trackNumber: 6,
  },
  {
    id: "1835109926",
    title: "Aphrodite",
    artist: "Arjan Dhillon",
    albumId: "aforarjan2",
    albumTitle: "A for Arjan 2",
    artworkUrl: art(ART.aforarjan2),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/18/26/6b/18266b56-0c36-2fd0-d9f4-40addef94a29/mzaf_1875084913798539741.plus.aac.p.m4a",
    durationMs: 148410,
    trackNumber: 7,
  },
  {
    id: "1835109927",
    title: "Portrait Of You",
    artist: "Arjan Dhillon",
    albumId: "aforarjan2",
    albumTitle: "A for Arjan 2",
    artworkUrl: art(ART.aforarjan2),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/06/8e/ff/068eff11-2631-458b-66aa-33fa4e45958b/mzaf_2195652872845234333.plus.aac.p.m4a",
    durationMs: 212313,
    trackNumber: 8,
  },
  {
    id: "1835109928",
    title: "Haseen",
    artist: "Arjan Dhillon",
    albumId: "aforarjan2",
    albumTitle: "A for Arjan 2",
    artworkUrl: art(ART.aforarjan2),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/bf/de/5c/bfde5c50-3be9-1d78-8957-68f6d65a6b95/mzaf_18366174349455013368.plus.aac.p.m4a",
    durationMs: 214743,
    trackNumber: 9,
  },
  {
    id: "1835109929",
    title: "Love Gone",
    artist: "Arjan Dhillon",
    albumId: "aforarjan2",
    albumTitle: "A for Arjan 2",
    artworkUrl: art(ART.aforarjan2),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/dc/d1/46/dcd146be-49fa-f935-3785-a47c499ca1b9/mzaf_6379500718552487813.plus.aac.p.m4a",
    durationMs: 214718,
    trackNumber: 10,
  },
  {
    id: "1835109930",
    title: "Marjana",
    artist: "Arjan Dhillon",
    albumId: "aforarjan2",
    albumTitle: "A for Arjan 2",
    artworkUrl: art(ART.aforarjan2),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/fe/f4/b4/fef4b426-068e-7aac-1bc7-1526f1192881/mzaf_14449645025701304346.plus.aac.p.m4a",
    durationMs: 206250,
    trackNumber: 11,
  },
  {
    id: "1835109931",
    title: "Taj Mahal",
    artist: "Arjan Dhillon",
    albumId: "aforarjan2",
    albumTitle: "A for Arjan 2",
    artworkUrl: art(ART.aforarjan2),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/00/1d/89/001d899d-b356-c7bf-37fd-7e11e4ce5398/mzaf_6564267405086406272.plus.aac.p.m4a",
    durationMs: 140500,
    trackNumber: 12,
  },
  {
    id: "1835109932",
    title: "My Heart Go",
    artist: "Arjan Dhillon",
    albumId: "aforarjan2",
    albumTitle: "A for Arjan 2",
    artworkUrl: art(ART.aforarjan2),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/7a/63/d1/7a63d135-aa07-c810-6ebe-f7ca38acd1a1/mzaf_10090653627849888203.plus.aac.p.m4a",
    durationMs: 161951,
    trackNumber: 13,
  },
  {
    id: "1835109933",
    title: "Meharma",
    artist: "Arjan Dhillon",
    albumId: "aforarjan2",
    albumTitle: "A for Arjan 2",
    artworkUrl: art(ART.aforarjan2),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/3d/51/04/3d5104eb-419d-b42a-9846-e03c85295fb3/mzaf_16786889370714370749.plus.aac.p.m4a",
    durationMs: 226909,
    trackNumber: 14,
  },
  {
    id: "1835109934",
    title: "Love Garrage",
    artist: "Arjan Dhillon",
    albumId: "aforarjan2",
    albumTitle: "A for Arjan 2",
    artworkUrl: art(ART.aforarjan2),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/73/2b/1d/732b1deb-d099-d01d-a820-54e4b5de3ade/mzaf_9349204035013841974.plus.aac.p.m4a",
    durationMs: 217896,
    trackNumber: 15,
  },
  {
    id: "1835109936",
    title: "Mohabbat",
    artist: "Arjan Dhillon",
    albumId: "aforarjan2",
    albumTitle: "A for Arjan 2",
    artworkUrl: art(ART.aforarjan2),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/9b/51/2d/9b512d95-db3e-e506-ddd8-4303136ee939/mzaf_2961108440242936939.plus.aac.p.m4a",
    durationMs: 224606,
    trackNumber: 16,
  },
  {
    id: "1835109937",
    title: "Bewafa",
    artist: "Arjan Dhillon",
    albumId: "aforarjan2",
    albumTitle: "A for Arjan 2",
    artworkUrl: art(ART.aforarjan2),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/41/22/ee/4122ee8e-23fd-162b-3908-5cdc5c2195fd/mzaf_8135600086665320215.plus.aac.p.m4a",
    durationMs: 148935,
    trackNumber: 17,
  },
  {
    id: "1835109938",
    title: "Tatoo",
    artist: "Arjan Dhillon",
    albumId: "aforarjan2",
    albumTitle: "A for Arjan 2",
    artworkUrl: art(ART.aforarjan2),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/63/6c/6a/636c6ad4-2205-48dd-c24a-1bd1c26c4fdf/mzaf_7398094959164619896.plus.aac.p.m4a",
    durationMs: 205220,
    trackNumber: 18,
  },
  {
    id: "1835109939",
    title: "Ranjha",
    artist: "Arjan Dhillon",
    albumId: "aforarjan2",
    albumTitle: "A for Arjan 2",
    artworkUrl: art(ART.aforarjan2),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/ef/cb/7e/efcb7e3f-e18c-bdd3-fee2-15dec1153ec9/mzaf_8805751981699903701.plus.aac.p.m4a",
    durationMs: 262290,
    trackNumber: 19,
  },

  // ── Favourite singles — no dedicated album ────────────────────────────────
  {
     id: "1664679160",
    title: "Dark Love",
    artist: "Sidhu Moose Wala",
    albumId: "singles",
    albumTitle: "Dark Love - Single",
    artworkUrl: art(ART.darklove),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview113/v4/71/1a/7a/711a7ad5-7dd7-4762-5202-ade1c88da0e8/mzaf_11609992245797372853.plus.aac.p.m4a",
    durationMs: 305168,
    trackNumber: 1,
  },
  {
    id: "1421702013",
    title: "Badnam",
    artist: "Mankirt Aulakh & DJ Flow",
    albumId: "singles",
    albumTitle: "Badnam - Single",
    artworkUrl:
      "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/c2/64/84/c264845e-5988-df3a-3af8-d58b8c140ecb/8902633278462.jpg/400x400bb.jpg",
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview112/v4/1a/23/1f/1a231f17-edee-c7bd-20ed-63e39fa38bf1/mzaf_13896968473090479719.plus.aac.p.m4a",
    durationMs: 203651,
    trackNumber: 2,
  },
  {
    id: "581775219",
    title: "Criminal",
    artist: "Britney Spears",
    albumId: "singles",
    albumTitle: "Femme Fatale",
    artworkUrl:
      "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/f6/b5/e1/f6b5e110-5ae3-1db4-ae81-e8d59d0e1c92/884977898842.jpg/400x400bb.jpg",
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/bb/e9/ad/bbe9ad70-3141-951d-49f3-d7d2045f855c/mzaf_2723233998202938723.plus.aac.p.m4a",
    durationMs: 225080,
    trackNumber: 3,
  },
  {
    id: "1690028363",
    title: "Tu Hi Haqeeqat",
    artist: "Pritam & Javed Ali",
    albumId: "singles",
    albumTitle: "Pritam (All Time Hits)",
    artworkUrl:
      "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/b7/21/bf/b721bf9a-7b6a-d918-18a2-fcfa4b15fdc6/196871180054.jpg/400x400bb.jpg",
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/b7/08/63/b7086399-1e85-4525-4831-eeb3bc0c724e/mzaf_13469149421196877389.plus.aac.p.m4a",
    durationMs: 302027,
    trackNumber: 4,
  },
  {
    id: "1188705396",
    title: "Backbone",
    artist: "Harrdy Sandhu",
    albumId: "singles",
    albumTitle: "Backbone - Single",
    artworkUrl: art(ART.backbone),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/0c/f5/f4/0cf5f4fd-df54-d64c-da79-d39d3f4bf0c7/mzaf_6489555441274595329.plus.aac.p.m4a",
    durationMs: 175059,
    trackNumber: 5,
  },
  {
    id: "1767583509",
    title: "Guilty (feat. Karan Aujla)",
    artist: "Inder Chahal",
    albumId: "singles",
    albumTitle: "Guilty (feat. Karan Aujla) - Single",
    artworkUrl:
      "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/06/7d/06/067d0673-d9ca-fbe4-e09d-e136fc02cdda/8905285020236.png/400x400bb.jpg",
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/f4/e7/bd/f4e7bda7-be88-e52d-bfe1-f4b3ce31cca0/mzaf_13598574423896631893.plus.aac.p.m4a",
    durationMs: 178392,
    trackNumber: 6,
  },
  {
    id: "1599706618",
    title: "Chandigarh Walian",
    artist: "Sharan Deol",
    albumId: "singles",
    albumTitle: "Chandigarh Walian - Single",
    artworkUrl:
      "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/5c/dc/ba/5cdcba79-e458-aed9-fcff-876953ef0af0/8902356508556.png/400x400bb.jpg",
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/d3/54/9c/d3549c15-7bcb-d24d-58d1-e308ad0ccb91/mzaf_9401566896102863271.plus.aac.p.m4a",
    durationMs: 249936,
    trackNumber: 7,
  },
  {
    id: "1455648996",
    title: "On My Way",
    artist: "Alan Walker, Sabrina Carpenter & Farruko",
    albumId: "singles",
    albumTitle: "On My Way - Single",
    artworkUrl: art(ART.onmyway),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/21/63/f4/2163f4b2-8e9c-6f1b-e6da-1dd838f0941f/mzaf_952717904460349711.plus.aac.p.m4a",
    durationMs: 193798,
    trackNumber: 8,
  },
  {
    id: "1421701622",
    title: "Main Tan Vi Pyar Kardan (feat. Millind Gaba)",
    artist: "Happy Raikoti",
    albumId: "singles",
    albumTitle: "Main Tan Vi Pyar Kardan - Single",
    artworkUrl:
      "https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/17/f8/fd/17f8fd45-a429-8680-e002-5573f85386d0/8902633271012.jpg/400x400bb.jpg",
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/3f/8f/58/3f8f58eb-077b-c3ec-23eb-4ffe6e6fe637/mzaf_14584244114287754242.plus.aac.p.m4a",
    durationMs: 264046,
    trackNumber: 9,
  },
  {
    id: "1826785702",
    title: "The Last Ride",
    artist: "Sidhu Moose Wala",
    albumId: "singles",
    albumTitle: "The Last Ride - Single",
    artworkUrl:
      "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/db/2c/84/db2c84f2-f42f-af93-2709-6158995f9f72/810105712582_cover.jpg/400x400bb.jpg",
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/31/fb/bf/31fbbf4b-e524-7ff2-5471-73eb7b2f6637/mzaf_9842736588858391397.plus.aac.p.m4a",
    durationMs: 262247,
    trackNumber: 10,
  },
  {
    id: "1677114965",
    title: "Golgappe Vs Daru",
    artist: "Karan Aujla",
    albumId: "singles",
    albumTitle: "Golgappe Vs Daru - Single",
    artworkUrl:
      "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/37/8a/b4/378ab417-a473-683f-871a-69c73b79d197/859731514030.png/400x400bb.jpg",
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/d6/34/1e/d6341e53-de89-d6ad-a87c-244e5267f5d1/mzaf_15487511418644668895.plus.aac.p.m4a",
    durationMs: 189100,
    trackNumber: 11,
  },
  {
    id: "1116333464",
    title: "Hale Dil",
    artist: "Harshit Saxena",
    albumId: "singles",
    albumTitle: "Murder 2 (Original Motion Picture Soundtrack)",
    artworkUrl:
      "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/bb/cc/4b/bbcc4bd9-b705-8cff-d637-6379ac87b9a6/8902894695916_cover.jpg/400x400bb.jpg",
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/90/eb/0a/90eb0a80-5df7-3620-423c-519da5b2ade6/mzaf_3165716824914562573.plus.aac.p.m4a",
    durationMs: 346627,
    trackNumber: 12,
  },
  {
    id: "1859131618",
    title: "Na Na Na",
    artist: "Karan Aujla",
    albumId: "singles",
    albumTitle: "Na Na Na - Single",
    artworkUrl:
      "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/6a/d7/9e/6ad79e66-9401-5f95-9891-1dce8cef44f9/859731511640_cover.jpg/400x400bb.jpg",
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/70/5d/dc/705ddcea-aea9-8cf3-2528-2454860ca4d5/mzaf_1262199982154045993.plus.aac.p.m4a",
    durationMs: 207151,
    trackNumber: 13,
  },
  {
    id: "1434569457",
    title: "Carol of the Bells",
    artist: "Lindsey Stirling",
    albumId: "singles",
    albumTitle: "Warmer In The Winter (Deluxe Edition)",
    artworkUrl: art(ART.carolbells),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/68/59/36/6859369a-6477-4414-0489-4e4f4032ed1a/mzaf_15724659125621539109.plus.aac.p.m4a",
    durationMs: 168335,
    trackNumber: 14,
  },
  {
    id: "1158554778",
    title: "Soch",
    artist: "Harrdy Sandhu & B. Praak",
    albumId: "singles",
    albumTitle: "Soch - Single",
    artworkUrl: art(ART.soch),
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/0e/a8/b1/0ea8b1f0-1108-8e22-2800-2b624661915b/mzaf_2081569724044338527.plus.aac.p.m4a",
    durationMs: 346905,
    trackNumber: 15,
  },
  {
    id: "1601446692",
    title: "Smile for You",
    artist: "Vicki Vox",
    albumId: "singles",
    albumTitle: "Smile for You - Single",
    artworkUrl:
      "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/95/f0/72/95f07247-1c1d-f2a2-65b7-1ca5e7528008/7330178076105.png/400x400bb.jpg",
    previewUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/ac/14/ca/ac14cabf-806a-53a5-c164-d7fbb5df8855/mzaf_4088450038442985208.plus.aac.p.m4a",
    durationMs: 171084,
    trackNumber: 16,
  },
];

// ---------------------------------------------------------------------------
// Albums
// ---------------------------------------------------------------------------
export const albums: Album[] = [
  {
    id: "judaa1",
    title: "Judaa 1",
    artist: "Amrinder Gill",
    artistId: "amrinder-gill",
    year: 2011,
    artworkUrl: art(ART.judaa1),
    genre: "Punjabi Pop",
    songIds: ["1426290360", "1426290362", "1426290363", "1426290364", "1426290797", "1426290816", "1426290819", "1426290820", "1426290973"],
  },
  {
    id: "judaa2",
    title: "Judaa 2",
    artist: "Amrinder Gill",
    artistId: "amrinder-gill",
    year: 2014,
    artworkUrl: art(ART.judaa2),
    genre: "Punjabi Pop",
    songIds: ["806210364", "806210365", "806210369", "806210371", "806210373", "806210374", "806210377", "806210384", "806210385", "806210542"],
  },
  {
    id: "judaa3",
    title: "Judaa 3",
    artist: "Amrinder Gill & Dr Zeus",
    artistId: "amrinder-gill",
    year: 2024,
    artworkUrl: art(ART.judaa3ch2),
    genre: "Worldwide",
    songIds: ["1773473870", "1773473871", "1773473872", "1773473874", "1773473875", "1773473876", "1773473881", "1773473888", "1844959852", "1844959853", "1844959854", "1844959855", "1844959856", "1844959859", "1844959861", "1844959862"],
  },
  {
    id: "pbx1",
    title: "PBX 1",
    artist: "Sidhu Moose Wala",
    artistId: "sidhu-moosewala",
    year: 2018,
    artworkUrl: art(ART.pbx1),
    genre: "Punjabi Pop",
    songIds: ["1439435009", "1439435011", "1439435012", "1439435013", "1439435016", "1439435017", "1439435018", "1439435019", "1439435020", "1439435142", "1439435143", "1439435144", "1439435145"],
  },
  {
    id: "fourme",
    title: "Four Me",
    artist: "Karan Aujla",
    artistId: "karan-aujla",
    year: 2024,
    artworkUrl: art(ART.fourme),
    genre: "New Age",
    songIds: ["1753101068", "1753101069", "1753101077", "1753101463"],
  },
  {
    id: "age19",
    title: "Age 19",
    artist: "Jass Manak",
    artistId: "jass-manak",
    year: 2019,
    artworkUrl: art(ART.age19),
    genre: "Punjabi Pop",
    songIds: [
      "1760569286",
      "1760569287",
      "1760569294",
      "1760569298",
      "1760569299",
      "1760569302",
      "1760569304",
      "1760569308",
      "1760569729",
    ],
  },
  {
    id: "shatterme",
    title: "Shatter Me",
    artist: "Lindsey Stirling",
    artistId: "lindsey-stirling",
    year: 2014,
    artworkUrl: art(ART.shatterme),
    genre: "Electronic",
    songIds: ["844250541", "844250559", "844250572", "844250590", "844250599", "844250689", "844250747", "844250817", "844251976", "844250616", "844252047", "844252055"],
  },
  {
    id: "moosetape",
    title: "Moosetape",
    artist: "Sidhu Moose Wala",
    artistId: "sidhu-moosewala",
    year: 2021,
    artworkUrl: art(ART.moosetape),
    genre: "New Age",
    songIds: ["1826848586", "1826848589", "1826848594", "1826848600", "1826848602", "1826848605", "1826848609", "1826848610", "1826848675", "1826848679", "1826848681", "1826848682", "1826848683", "1826848685", "1826848687", "1826848689", "1826848690", "1826848698", "1826848691", "1826848692", "1826848694", "1826848696", "1826848697", "1826848912", "1826848914", "1826848919", "1826848921", "1826848924", "1826848925", "1826848930", "1826849048", "1826849050"],
  },
  {
    id: "aforarjan2",
    title: "A for Arjan 2",
    artist: "Arjan Dhillon",
    artistId: "arjan-dhillon",
    year: 2025,
    artworkUrl: art(ART.aforarjan2),
    genre: "Punjabi",
    songIds: ["1835109922", "1835109923", "1835109924", "1835109935", "1835109925", "1835109926", "1835109927", "1835109928", "1835109929", "1835109930", "1835109931", "1835109932", "1835109933", "1835109934", "1835109936", "1835109937", "1835109938", "1835109939"],
  },
  {
    id: "singles",
    title: "Singles",
    artist: "Various Artists",
    artistId: "various",
    year: 2024,
    artworkUrl: art(ART.darklove),
    genre: "Various",
    songIds: [
      "1664679160",
      "1421702013",
      "581775219",
      "1690028363",
      "1188705396",
      "1767583509",
      "1599706618",
      "1455648996",
      "1421701622",
      "1826785702",
      "1677114965",
      "1116333464",
      "1859131618",
      "1434569457",
      "1158554778",
      "1601446692",
    ],
  },
  {
    id: "fouryou",
    title: "Four You",
    artist: "Karan Aujla",
    artistId: "karan-aujla",
    year: 2023,
    artworkUrl: art(ART.fouryou),
    genre: "New Age",
    songIds: ["1859550758", "1859550748", "1859550751", "1859550762"],
  },
];

// ---------------------------------------------------------------------------
// Artists
// ---------------------------------------------------------------------------
export const artists: Artist[] = [
  {
    id: "sidhu-moosewala",
    name: "Sidhu Moosewala",
    artworkUrl: art(ART.moosetape),
    albumIds: ["pbx1", "moosetape"],
  },
  {
    id: "amrinder-gill",
    name: "Amrinder Gill",
    artworkUrl: art(ART.judaa2),
    albumIds: ["judaa1", "judaa2", "judaa3"],
  },
  {
    id: "mankirt-aulakh",
    name: "Mankirt Aulakh",
    artworkUrl:
      "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/c2/64/84/c264845e-5988-df3a-3af8-d58b8c140ecb/8902633278462.jpg/400x400bb.jpg",
    albumIds: [],
  },
  {
    id: "karan-aujla",
    name: "Karan Aujla",
    artworkUrl: art(ART.fourme),
    albumIds: ["fourme", "fouryou"],
  },
  {
    id: "lindsey-stirling",
    name: "Lindsey Stirling",
    artworkUrl: art(ART.shatterme),
    albumIds: ["shatterme"],
  },
  {
    id: "jass-manak",
    name: "Jass Manak",
    artworkUrl: art(ART.age19),
    albumIds: ["age19"],
  },
  {
    id: "cheema-y",
    name: "Cheema Y",
    artworkUrl: art(ART.cheemay),
    albumIds: [],
  },
  {
    id: "arjan-dhillon",
    name: "Arjan Dhillon",
    artworkUrl: art(ART.aforarjan2),
    albumIds: ["aforarjan2"],
  },
  {
    id: "harrdy-sandhu",
    name: "Harrdy Sandhu",
    artworkUrl: art(ART.backbone),
    albumIds: [],
  },
  {
    id: "britney-spears",
    name: "Britney Spears",
    artworkUrl:
      "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/f6/b5/e1/f6b5e110-5ae3-1db4-ae81-e8d59d0e1c92/884977898842.jpg/400x400bb.jpg",
    albumIds: [],
  },
  {
    id: "alan-walker",
    name: "Alan Walker",
    artworkUrl: art(ART.onmyway),
    albumIds: [],
  },
  {
    id: "harshit-saxena",
    name: "Harshit Saxena",
    artworkUrl:
      "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/bb/cc/4b/bbcc4bd9-b705-8cff-d637-6379ac87b9a6/8902894695916_cover.jpg/400x400bb.jpg",
    albumIds: [],
  },
  {
    id: "sharan-deol",
    name: "Sharan Deol",
    artworkUrl:
      "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/5c/dc/ba/5cdcba79-e458-aed9-fcff-876953ef0af0/8902356508556.png/400x400bb.jpg",
    albumIds: [],
  },
  {
    id: "happy-raikoti",
    name: "Happy Raikoti",
    artworkUrl:
      "https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/17/f8/fd/17f8fd45-a429-8680-e002-5573f85386d0/8902633271012.jpg/400x400bb.jpg",
    albumIds: [],
  },
  {
    id: "inder-chahal",
    name: "Inder Chahal",
    artworkUrl:
      "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/06/7d/06/067d0673-d9ca-fbe4-e09d-e136fc02cdda/8905285020236.png/400x400bb.jpg",
    albumIds: [],
  },
  {
    id: "vicki-vox",
    name: "Vicki Vox",
    artworkUrl:
      "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/95/f0/72/95f07247-1c1d-f2a2-65b7-1ca5e7528008/7330178076105.png/400x400bb.jpg",
    albumIds: [],
  },
  {
    id: "pritam",
    name: "Pritam",
    artworkUrl:
      "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/b7/21/bf/b721bf9a-7b6a-d918-18a2-fcfa4b15fdc6/196871180054.jpg/400x400bb.jpg",
    albumIds: [],
  },
];

// ---------------------------------------------------------------------------
// Lookup maps
// ---------------------------------------------------------------------------
export const songById = Object.fromEntries(songs.map((s) => [s.id, s]));
export const albumById = Object.fromEntries(albums.map((a) => [a.id, a]));
export const artistById = Object.fromEntries(artists.map((a) => [a.id, a]));

// ---------------------------------------------------------------------------
// Curated collections
// ---------------------------------------------------------------------------

/** Songs shown in "Frequently Played" — in the exact order specified */
export const frequentlyPlayedIds: string[] = [
  "1664679160", // Dark Love — Sidhu Moosewala
  "1421702013", // Badnam — Mankirt Aulakh
  "1753101463", // Y.D.G — Karan Aujla
  "1835109935", // Ik Tarfa — Arjan Dhillon
  "581775219",  // Criminal — Britney Spears
  "1690028363", // Tu Hi Haqeeqat — Pritam & Javed Ali
  "1188705396", // Backbone — Harrdy Sandhu
  "1767583509", // Guilty — Inder Chahal feat. Karan Aujla
  "1599706618", // Chandigarh Walian — Sharan Deol
  "1753101077", // Antidote — Karan Aujla
  "1859550758", // Fallin Apart — Karan Aujla & Ikky
  "1455648996", // On My Way — Alan Walker
  "1421701622", // Main Tan Vi Pyar Kardan — Happy Raikoti
  "1826785702", // The Last Ride — Sidhu Moosewala
  "1677114965", // Golgappe Vs Daru — Karan Aujla
  "1116333464", // Hale Dil — Harshit Saxena
  "1826848698", // Invincible — Sidhu Moosewala ft. Stefflon Don
  "1859131618", // Na Na Na — Karan Aujla
  "1434569457", // Carol of the Bells — Lindsey Stirling
  "1158554778", // Soch — Harrdy Sandhu
  "844250616",  // Roundtable Rival — Lindsey Stirling
  "1601446692", // Smile for You — Vicki Vox
];

/** Home page featured picks */
export const homeFeatured: Array<{
  label: string;
  title: string;
  accent: string;
  albumId: string;
}> = [
  { label: "Classic", title: "Judaa 1", accent: "dark", albumId: "judaa1" },
  { label: "Fan Favourite", title: "Judaa 2", accent: "blue", albumId: "judaa2" },
  { label: "New Release", title: "Judaa 3", accent: "pink", albumId: "judaa3" },
  { label: "Essential", title: "Moosetape", accent: "green", albumId: "moosetape" },
];
