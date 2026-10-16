import { downloadBlob } from "./files.ts";

export type ShareOutcome = "shared" | "saved" | "cancelled";

/** Whether this browser can hand the file to the phone's share sheet (WhatsApp, Messages, and the rest). */
export function canShareFile(file: File): boolean {
  return typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });
}

/** Opens the share sheet with the file when it can; otherwise saves the file to the device. */
export async function shareOrSave(file: File, title: string): Promise<ShareOutcome> {
  if (canShareFile(file)) {
    try {
      await navigator.share({ files: [file], title });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
    }
  }
  downloadBlob(file, file.name);
  return "saved";
}

/** Copies text to the clipboard, with the old textarea way as the fallback. Resolves false when neither worked. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.cssText = "position:fixed;opacity:0;pointer-events:none";
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand("copy");
    area.remove();
    return copied;
  }
}
