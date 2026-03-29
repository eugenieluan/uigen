import { test, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { PreviewFrame } from "../PreviewFrame";
import { useFileSystem } from "@/lib/contexts/file-system-context";

vi.mock("@/lib/contexts/file-system-context", () => ({
  useFileSystem: vi.fn(),
}));

vi.mock("@/lib/transform/jsx-transformer", () => ({
  createImportMap: vi.fn(() => ({
    importMap: {},
    styles: "",
    errors: [],
  })),
  createPreviewHTML: vi.fn(() => "<html><body>Preview</body></html>"),
}));

const makeFileSystem = (files: Map<string, string> = new Map(), trigger = 0) => ({
  getAllFiles: vi.fn(() => files),
  refreshTrigger: trigger,
});

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

test("shows firstLoad placeholder when no files exist on mount", () => {
  (useFileSystem as any).mockReturnValue(makeFileSystem(new Map()));

  render(<PreviewFrame />);

  expect(screen.getByText("Welcome to UI Generator")).toBeDefined();
});

test("renders iframe when files are present", async () => {
  const files = new Map([["/App.jsx", "export default () => <div>Hello</div>"]]);
  (useFileSystem as any).mockReturnValue(makeFileSystem(files));

  const { container } = render(<PreviewFrame />);

  await act(async () => {});

  const iframe = container.querySelector("iframe");
  expect(iframe).toBeDefined();
});

test("shows error message when files are empty after first load", async () => {
  const files = new Map([["/App.jsx", "content"]]);
  (useFileSystem as any).mockReturnValue(makeFileSystem(files, 1));

  const { rerender } = render(<PreviewFrame />);

  await act(async () => {});

  // Now remove files and trigger refresh
  (useFileSystem as any).mockReturnValue(makeFileSystem(new Map(), 2));
  rerender(<PreviewFrame />);

  await act(async () => {});

  expect(screen.getByText("No files to preview")).toBeDefined();
});

test("effect does not re-run without dependency changes (no re-render loop)", async () => {
  const getAllFiles = vi.fn(() => new Map([["/App.jsx", "content"]]));
  (useFileSystem as any).mockReturnValue({
    getAllFiles,
    refreshTrigger: 0,
  });

  render(<PreviewFrame />);
  await act(async () => {});

  // getAllFiles should be called once per effect run — not in a loop
  const callCount = getAllFiles.mock.calls.length;
  expect(callCount).toBe(1);

  // Wait a tick and verify no additional calls happened
  await act(async () => {
    await new Promise((r) => setTimeout(r, 50));
  });

  expect(getAllFiles.mock.calls.length).toBe(callCount);
});

test("effect re-runs when refreshTrigger changes", async () => {
  const getAllFiles = vi.fn(() => new Map([["/App.jsx", "content"]]));

  (useFileSystem as any).mockReturnValue({ getAllFiles, refreshTrigger: 0 });

  const { rerender } = render(<PreviewFrame />);
  await act(async () => {});

  const countAfterFirst = getAllFiles.mock.calls.length;

  (useFileSystem as any).mockReturnValue({ getAllFiles, refreshTrigger: 1 });
  rerender(<PreviewFrame />);
  await act(async () => {});

  expect(getAllFiles.mock.calls.length).toBeGreaterThan(countAfterFirst);
});
