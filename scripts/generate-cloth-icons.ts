import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  PlayIcon,
  XLogoIcon,
  ArrowUpRightIcon,
} from "@phosphor-icons/react/ssr";
import { writeFileSync } from "node:fs";
for (const [name, Icon, weight] of [
  ["play", PlayIcon, "fill"],
  ["x", XLogoIcon, "regular"],
  ["external", ArrowUpRightIcon, "bold"],
] as const) {
  writeFileSync(
    `public/journey/action-${name}.svg`,
    renderToStaticMarkup(
      createElement(Icon, {
        size: 128,
        color: "white",
        weight,
        xmlns: "http://www.w3.org/2000/svg",
      }),
    ),
  );
}
