import React from "react";
import { createRoot } from "react-dom/client";
import { ContentOverlayApp } from "@/content/ContentOverlayApp";

export default defineContentScript({
  matches: ["https://www.coupangplay.com/*", "https://www.spotvnow.co.kr/*"],
  main(ctx) {
    const rootElement = document.createElement("div");
    rootElement.id = "footballay-overlay-root";
    document.documentElement.append(rootElement);

    const root = createRoot(rootElement);
    root.render(<ContentOverlayApp />);

    ctx.onInvalidated(() => {
      root.unmount();
      rootElement.remove();
    });
  }
});
