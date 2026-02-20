import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faApple } from "@fortawesome/free-brands-svg-icons";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ToggleOnIcon,
  ToggleOffIcon,
  BatteryCharging01Icon,
  Wifi01Icon,
} from "@hugeicons/core-free-icons";

export default function Home() {
  return (
    <div className="fixed inset-0">
      <Image
        src="/wallpapers/Sonoma.jpeg"
        alt="Background"
        fill
        className="object-cover -z-10 inset-0"
      />
      <div
        id="menu-bar"
        className="fixed backdrop-blur-sm w-full h-8 bg-black bg-opacity-[0.18] flex items-center p-4 gap-6 text-white drop-shadow-[0_0_4px_rgba(0,0,0,0.5)]"
      >
        <FontAwesomeIcon icon={faApple} width={16} height={16} />
        <div className="flex items-center gap-4">
          <div className="font-semibold text-sm cursor-default">
            System Settings
          </div>
          <div className="text-sm cursor-default">Menu</div>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-4 cursor-default">
          <Image
            src="/icons/battery.svg"
            alt="Battery"
            width={24}
            height={24}
          />
          <Image src="/icons/wifi.svg" alt="Wifi" width={17} height={17} />
          <Image
            src="/icons/control-center.svg"
            alt="Control Center"
            width={14}
            height={14}
          />
          <div className="text-sm">Sat Sep 18 11:02:45 AM</div>
        </div>
      </div>

      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[60] bg-[#F6F6F6]/40 backdrop-blur-sm flex items-center gap-1 w-fit rounded-xl p-1 drop-shadow-[0_0_16px_rgba(0,0,0,0.5)]">
        <Image src="/icons/finder.png" alt="Finder" width={50} height={50} />
        <Image src="/icons/notes.png" alt="Notes" width={50} height={50} />
        <Image
          src="/icons/messages.png"
          alt="Messages"
          width={50}
          height={50}
        />
        <Image src="/icons/music.png" alt="Music" width={50} height={50} />
        <Image src="/icons/tv.png" alt="TV" width={50} height={50} />
      </div>
    </div>
  );
}
