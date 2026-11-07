import { API_ORIGIN } from "../config/api";
import { http } from "../services/http";

/**
 * Join Us documents (identity, licences, commercial registrations, dynamic file answers) are private:
 * the API only serves them to authenticated users with the right permission, so they cannot be opened with a
 * plain link. These helpers fetch them with the session token and show them from a temporary blob URL.
 */
export const PRIVATE_FILE_PREFIX = "/uploads/join-us/";

export function isPrivateFilePath(path?: string | null): boolean {
  return Boolean(path) && String(path).startsWith(PRIVATE_FILE_PREFIX);
}

export class PrivateFileError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

/** Opens a private document in a new tab. Throws PrivateFileError (401/403/404...) when it cannot be read. */
export async function openPrivateFile(path: string): Promise<void> {
  // Open the tab synchronously (inside the click) so the pop-up blocker allows it, then point it at the blob.
  const tab = window.open("about:blank", "_blank");
  try {
    const response = await http.get<Blob>(`${API_ORIGIN}${path}`, { responseType: "blob", baseURL: "" });
    const url = URL.createObjectURL(response.data);
    if (tab) tab.location.href = url;
    else window.open(url, "_blank");
    window.setTimeout(() => URL.revokeObjectURL(url), 5 * 60_000);
  } catch (error) {
    tab?.close();
    const status = (error as { response?: { status?: number } })?.response?.status;
    throw new PrivateFileError(
      status === 403
        ? "You do not have permission to open this document"
        : status === 404
          ? "The document was not found"
          : "Could not open the document",
      status
    );
  }
}
