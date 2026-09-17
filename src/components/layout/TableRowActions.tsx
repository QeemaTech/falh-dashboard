import type { ReactNode } from "react";
import { Delete, Edit, Visibility } from "@mui/icons-material";
import { IconButton, Stack, Tooltip } from "@mui/material";
import { useI18n } from "../../hooks/use-i18n";

const iconBtnSx = {
  borderRadius: "8px",
  border: "1px solid",
  borderColor: "divider",
  bgcolor: "background.paper",
  width: 34,
  height: 34,
  "&:hover": {
    borderColor: "primary.main",
    bgcolor: (theme: { palette: { mode: string } }) =>
      theme.palette.mode === "dark" ? "rgba(77, 154, 91, 0.12)" : "rgba(35, 103, 58, 0.06)",
  },
} as const;

type TableRowActionsProps = {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  viewLabel?: string;
  editLabel?: string;
  deleteLabel?: string;
  disableDelete?: boolean;
  extra?: ReactNode;
};

export function TableRowActions({
  onView,
  onEdit,
  onDelete,
  viewLabel,
  editLabel,
  deleteLabel,
  disableDelete,
  extra,
}: TableRowActionsProps) {
  const { t } = useI18n();

  return (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", flexWrap: "nowrap" }}>
      {onView ? (
        <Tooltip title={viewLabel || t("common.view", "View")}>
          <IconButton size="small" onClick={onView} aria-label={viewLabel || t("common.view", "View")} sx={iconBtnSx}>
            <Visibility sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      ) : null}
      {onEdit ? (
        <Tooltip title={editLabel || t("common.edit", "Edit")}>
          <IconButton
            size="small"
            color="primary"
            onClick={onEdit}
            aria-label={editLabel || t("common.edit", "Edit")}
            sx={{
              ...iconBtnSx,
              borderColor: "primary.light",
              color: "primary.main",
            }}
          >
            <Edit sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      ) : null}
      {extra}
      {onDelete ? (
        <Tooltip title={deleteLabel || t("common.delete", "Delete")}>
          <span>
            <IconButton
              size="small"
              color="error"
              disabled={disableDelete}
              onClick={onDelete}
              aria-label={deleteLabel || t("common.delete", "Delete")}
              sx={{
                ...iconBtnSx,
                borderColor: "error.light",
                color: "error.main",
                "&:hover": {
                  borderColor: "error.main",
                  bgcolor: "rgba(220, 38, 38, 0.06)",
                },
              }}
            >
              <Delete sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>
      ) : null}
    </Stack>
  );
}
