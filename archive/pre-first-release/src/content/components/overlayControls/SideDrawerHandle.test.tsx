// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SideDrawerHandle } from "./SideDrawerHandle";

afterEach(() => {
  cleanup();
});

describe("SideDrawerHandle", () => {
  it("renders a left drawer handle", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<SideDrawerHandle side="left" onClick={onClick} />);

    await user.click(screen.getByRole("button", { name: "Open match events and team stats" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("marks the active drawer handle", () => {
    render(<SideDrawerHandle active side="right" onClick={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Open lineup and player stats" }).className).toContain(
      "footballay-edge-handle--active"
    );
  });
});
