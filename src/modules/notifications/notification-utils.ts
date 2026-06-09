import type { TranslationLanguage } from "../../i18n/translations";
import type { NotificationRecord } from "../../services/notifications-api";

type LocalizedData = {
  titleEn?: string;
  titleAr?: string;
  bodyEn?: string;
  bodyAr?: string;
  [key: string]: unknown;
};

function interpolate(template: string, params: Record<string, unknown>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = params[key];
    return value === undefined || value === null ? "" : String(value);
  });
}

export function localizeNotification(
  notification: NotificationRecord,
  language: TranslationLanguage,
  t: (key: string, fallback?: string) => string
) {
  const data = (notification.data || {}) as LocalizedData;

  if (language === "ar" && (data.titleAr || data.bodyAr)) {
    return {
      title: data.titleAr || notification.title,
      body: data.bodyAr || data.bodyEn || notification.body,
    };
  }

  if (language === "en" && (data.titleEn || data.bodyEn)) {
    return {
      title: data.titleEn || notification.title,
      body: data.bodyEn || data.bodyAr || notification.body,
    };
  }

  const typeKey = `notifications.types.${notification.type}`;
  const title = interpolate(t(`${typeKey}.title`, notification.title), data);
  const body = interpolate(t(`${typeKey}.body`, notification.body), data);

  return { title, body };
}

export function formatNotificationDate(value: string, language: TranslationLanguage) {
  return new Date(value).toLocaleString(language === "ar" ? "ar-EG" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function notificationTypeLabel(
  type: string,
  t: (key: string, fallback?: string) => string
) {
  return t(`notifications.types.${type}.label`, type.replaceAll("_", " "));
}
