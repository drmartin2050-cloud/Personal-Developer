/**
 * Safe and highly compatible clipboard helper functions.
 * Designed to bypass browser iframe sandbox constraints and missing permissions.
 */

/**
 * Copies a given string to the user's clipboard.
 * Uses navigator.clipboard if available, otherwise falls back to document.execCommand('copy').
 */
export function safeCopyToClipboard(text: string): boolean {
  // Try modern navigator api
  try {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    console.warn("navigator.clipboard.writeText failed, attempting fallback", e);
  }

  // Fallback method using a temporary textarea
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Position to avoid scrolling
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.width = "2em";
    textArea.style.height = "2em";
    textArea.style.padding = "0";
    textArea.style.border = "none";
    textArea.style.outline = "none";
    textArea.style.boxShadow = "none";
    textArea.style.background = "transparent";
    textArea.style.opacity = "0";
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return !!successful;
  } catch (err) {
    console.error("ExecCommand copy fallback failed:", err);
    return false;
  }
}

/**
 * Requests reading text from the clipboard.
 * Due to iframe constraints, this may easily throw security errors.
 * Returns null if blocked by security.
 */
export async function safeReadFromClipboard(): Promise<string | null> {
  try {
    if (navigator.clipboard?.readText) {
      const text = await navigator.clipboard.readText();
      return text;
    }
  } catch (e) {
    console.warn("navigator.clipboard.readText failed or was blocked by sandbox permissions.", e);
  }
  return null;
}
