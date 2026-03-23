import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge } from "../ToolCallBadge";
import type { ToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

function makeInvocation(
  toolName: string,
  args: Record<string, any>,
  state: "call" | "result" = "result",
  result: any = "Success"
): ToolInvocation {
  if (state === "result") {
    return { toolCallId: "id", toolName, args, state, result } as ToolInvocation;
  }
  return { toolCallId: "id", toolName, args, state } as ToolInvocation;
}

test("shows 'Creating <filename>' for str_replace_editor create command", () => {
  render(<ToolCallBadge toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/components/Card.jsx" })} />);
  expect(screen.getByText("Creating Card.jsx")).toBeDefined();
});

test("shows green dot when state is result", () => {
  const { container } = render(<ToolCallBadge toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/components/Card.jsx" })} />);
  expect(container.querySelector(".bg-emerald-500")).not.toBeNull();
});

test("shows spinner when state is call (pending)", () => {
  render(<ToolCallBadge toolInvocation={makeInvocation("str_replace_editor", { command: "str_replace", path: "/App.jsx" }, "call")} />);
  expect(screen.getByText("Editing App.jsx")).toBeDefined();
  // spinner has animate-spin class
  const { container } = render(<ToolCallBadge toolInvocation={makeInvocation("str_replace_editor", { command: "str_replace", path: "/App.jsx" }, "call")} />);
  expect(container.querySelector(".animate-spin")).not.toBeNull();
});

test("shows 'Editing <filename>' for str_replace command", () => {
  render(<ToolCallBadge toolInvocation={makeInvocation("str_replace_editor", { command: "str_replace", path: "/src/App.jsx" })} />);
  expect(screen.getByText("Editing App.jsx")).toBeDefined();
});

test("shows 'Editing <filename>' for insert command", () => {
  render(<ToolCallBadge toolInvocation={makeInvocation("str_replace_editor", { command: "insert", path: "/src/utils.ts" })} />);
  expect(screen.getByText("Editing utils.ts")).toBeDefined();
});

test("shows 'Viewing <filename>' for view command", () => {
  render(<ToolCallBadge toolInvocation={makeInvocation("str_replace_editor", { command: "view", path: "/src/index.tsx" })} />);
  expect(screen.getByText("Viewing index.tsx")).toBeDefined();
});

test("shows 'Undoing edit in <filename>' for undo_edit command", () => {
  render(<ToolCallBadge toolInvocation={makeInvocation("str_replace_editor", { command: "undo_edit", path: "/src/utils.ts" })} />);
  expect(screen.getByText("Undoing edit in utils.ts")).toBeDefined();
});

test("shows 'Renaming <filename>' for file_manager rename", () => {
  render(<ToolCallBadge toolInvocation={makeInvocation("file_manager", { command: "rename", path: "/components/old.tsx", new_path: "/components/new.tsx" })} />);
  expect(screen.getByText("Renaming old.tsx")).toBeDefined();
});

test("shows 'Deleting <filename>' for file_manager delete", () => {
  render(<ToolCallBadge toolInvocation={makeInvocation("file_manager", { command: "delete", path: "/components/Button.tsx" })} />);
  expect(screen.getByText("Deleting Button.tsx")).toBeDefined();
});

test("falls back to raw tool name for unknown tools", () => {
  render(<ToolCallBadge toolInvocation={makeInvocation("unknown_tool", {})} />);
  expect(screen.getByText("unknown_tool")).toBeDefined();
});
