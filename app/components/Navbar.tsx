"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const Navbar = () => {
  const tab = usePathname();
  return (
    <div className="w-fit h-fit flex justify-center items-center rounded-full px-3 text-sm font-medium text-secondary-foreground shadow-lg shadow-zinc-800/5 border backdrop-blur">
      <Link
        href={"/"}
        className={`relative block px-3 py-2 transition text-secondary-foreground ${
          tab == "/" && "!text-blue-500 dark:text-blue-400"
        }`}
      >
        About
        {tab=="/"&&<span className="absolute inset-x-1 -bottom-px h-px bg-gradient-to-r from-blue-500/0 via-blue-500/40 to-blue-500/0 dark:from-blue-400/0 dark:via-blue-400/40 dark:to-blue-400/0"></span>}
      </Link>
      <Link
        href={"/blog"}
        className={`relative block px-3 py-2 transition text-secondary-foreground ${
            tab == "/blog" && "!text-blue-500 dark:text-blue-400"
          }`}      >
        Blog
        {tab == "/blog" &&<span className="absolute inset-x-1 -bottom-px h-px bg-gradient-to-r from-blue-500/0 via-blue-500/40 to-blue-500/0 dark:from-blue-400/0 dark:via-blue-400/40 dark:to-blue-400/0"></span>}
      </Link>
      <Link
        href={"/projects"}
        className={`relative block px-3 py-2 transition text-secondary-foreground ${
            tab == "/projects" && "!text-blue-500 dark:text-blue-400"
          }`}
      >
        Projects
        {tab == "/projects" &&<span className="absolute inset-x-1 -bottom-px h-px bg-gradient-to-r from-blue-500/0 via-blue-500/40 to-blue-500/0 dark:from-blue-400/0 dark:via-blue-400/40 dark:to-blue-400/0"></span>}
      </Link>
    </div>
  );
};

export default Navbar;
