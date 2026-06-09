import { Circle, DoneAll, Notifications } from "@mui/icons-material";
import {
  Badge,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../hooks/use-i18n";
import { useDropdown } from "../hooks/use-dropdown";
import {
  formatNotificationDate,
  localizeNotification,
  notificationTypeLabel,
} from "../modules/notifications/notification-utils";
import { useNotifications } from "../modules/notifications/use-notifications";
import type { NotificationRecord } from "../services/notifications-api";

type Props = {
  onOpen?: () => void;
  dropdown?: ReturnType<typeof useDropdown>;
};

export function NotificationMenu({ onOpen, dropdown: externalDropdown }: Props) {
  const theme = useTheme();
  const navigate = useNavigate();
  const internalDropdown = useDropdown();
  const { open, close, toggle, containerRef } = externalDropdown ?? internalDropdown;
  const { t, language } = useI18n();
  const { items, unreadCount, isLoading, markAsRead, markAllAsRead, isMarkingRead } = useNotifications(8);

  const menuAnchorHorizontal = theme.direction === "rtl" ? "left" : "right";

  const handleToggle = () => {
    onOpen?.();
    toggle();
  };

  const handleOpenNotification = (notification: NotificationRecord) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    close();
    navigate("/notifications");
  };

  return (
    <Box ref={containerRef}>
      <IconButton onClick={handleToggle} aria-label={t("common.notifications")}>
        <Badge
          color="error"
          badgeContent={unreadCount > 0 ? unreadCount : undefined}
          max={99}
          overlap="circular"
        >
          <Notifications />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={containerRef.current}
        open={open}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: menuAnchorHorizontal }}
        transformOrigin={{ vertical: "top", horizontal: menuAnchorHorizontal }}
        slotProps={{
          paper: {
            sx: { width: 360, maxWidth: "92vw", mt: 0.5 },
          },
        }}
      >
        <Stack
          direction="row"
          sx={{ px: 2, py: 1.25, alignItems: "center", justifyContent: "space-between" }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {t("common.notifications")}
          </Typography>
          {unreadCount > 0 ? (
            <Button
              size="small"
              startIcon={<DoneAll fontSize="small" />}
              onClick={() => markAllAsRead()}
              disabled={isMarkingRead}
            >
              {t("notifications.markAllRead")}
            </Button>
          ) : null}
        </Stack>

        <Divider />

        {isLoading ? (
          <Stack sx={{ py: 4, alignItems: "center" }}>
            <CircularProgress size={24} />
          </Stack>
        ) : items.length === 0 ? (
          <Box sx={{ px: 2, py: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
              {t("notifications.empty")}
            </Typography>
          </Box>
        ) : (
          items.map((notification) => {
            const localized = localizeNotification(notification, language, t);
            return (
              <MenuItem
                key={notification.id}
                onClick={() => handleOpenNotification(notification)}
                sx={{
                  alignItems: "flex-start",
                  gap: 1,
                  py: 1.25,
                  bgcolor: notification.isRead ? "transparent" : "action.hover",
                  whiteSpace: "normal",
                }}
              >
                <ListItemIcon sx={{ minWidth: 28, mt: 0.5 }}>
                  {!notification.isRead ? (
                    <Circle sx={{ fontSize: 10, color: "primary.main" }} />
                  ) : (
                    <Box sx={{ width: 10 }} />
                  )}
                </ListItemIcon>
                <Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between" }}>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: notification.isRead ? 500 : 700, lineHeight: 1.35 }}
                    >
                      {localized.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                      {formatNotificationDate(notification.createdAt, language)}
                    </Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                    {notificationTypeLabel(notification.type, t)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                    {localized.body}
                  </Typography>
                </Stack>
              </MenuItem>
            );
          })
        )}

        <Divider />
        <MenuItem
          onClick={() => {
            close();
            navigate("/notifications");
          }}
          sx={{ justifyContent: "center", fontWeight: 600 }}
        >
          {t("notifications.viewAll")}
        </MenuItem>
      </Menu>
    </Box>
  );
}
