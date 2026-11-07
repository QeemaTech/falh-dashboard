import { toast } from "../components/ui/sonner";
import { isPrivateFilePath, openPrivateFile } from "./private-file";
import { resolveAssetUrl } from "./asset-url";

/** Opens a stored file: private Join Us documents with the session token, everything else as a plain link. */
export async function openStoredFile(path: string) {
  if (!isPrivateFilePath(path)) {
    window.open(resolveAssetUrl(path), "_blank", "noopener,noreferrer");
    return;
  }
  try {
    await openPrivateFile(path);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Could not open the document");
  }
}
