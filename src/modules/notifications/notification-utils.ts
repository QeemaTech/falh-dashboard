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
  const typeKey = `notifications.types.${notification.type}`;
  const fromI18nTitle = interpolate(t(`${typeKey}.title`, ""), data);
  const fromI18nBody = interpolate(t(`${typeKey}.body`, ""), data);

  if (language === "ar") {
    return {
      title: data.titleAr || fromI18nTitle || notification.title,
      body: data.bodyAr || fromI18nBody || data.bodyEn || notification.body,
    };
  }

  return {
    title: data.titleEn || fromI18nTitle || notification.title,
    body: data.bodyEn || fromI18nBody || data.bodyAr || notification.body,
  };
}

export function formatNotificationDate(value: string, language: TranslationLanguage) {
  return new Date(value).toLocaleString(language === "ar" ? "ar-EG" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function notificationTypeLabel(
  type: string,
  t: (key: string, fallback?: string) => string,
  rawNotification?: NotificationRecord
) {
  const subType = (rawNotification?.data as Record<string, unknown> | undefined)?.subType;
  if (subType && typeof subType === "string") {
    return t(`notifications.types.${subType}.label`, subType.replaceAll("_", " "));
  }
  return t(`notifications.types.${type}.label`, type.replaceAll("_", " "));
}
