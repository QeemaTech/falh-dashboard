import type { ReactNode } from "react";
import { Link } from "@mui/material";
import { isPrivateFilePath } from "../utils/private-file";
import { openStoredFile } from "../utils/open-stored-file";
import { resolveAssetUrl } from "../utils/asset-url";

export function PrivateFileLink({ path, label }: { path?: string | null; label: ReactNode }) {
  if (!path) return <span>-</span>;
  if (!isPrivateFilePath(path)) {
    return (
      <Link href={resolveAssetUrl(path)} target="_blank" rel="noreferrer">
        {label}
      </Link>
    );
  }
  return (
    <Link component="button" type="button" underline="always" onClick={() => void openStoredFile(path)} sx={{ verticalAlign: "baseline" }}>
      {label}
    </Link>
  );
}
