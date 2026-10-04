"use client";

import { useEffect } from "react";

/**
 * Where Google sign-in lands when it ran in a pop-up (the guestbook inside the
 * 3D Mac cannot show Google's page in its frame). Tells the site it is done,
 * then closes itself. A channel is used rather than window.opener, which
 * Google's own pages cut off on the way through.
 */
export default function SignInDone() {
  useEffect(() => {
    const channel = new BroadcastChannel("auth");
    channel.postMessage("signed-in");
    channel.close();
    window.close();
    // A window the script did not open cannot close itself: go home instead.
    const home = window.setTimeout(() => window.location.replace("/"), 1500);
    return () => window.clearTimeout(home);
  }, []);

  return (
    <main
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: "100dvh",
        font: "16px system-ui, sans-serif",
      }}
    >
      <p>You’re signed in. This window will close.</p>
    </main>
  );
}
