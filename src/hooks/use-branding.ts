import { useQuery } from "@tanstack/react-query";
import { fetchPublicBranding } from "../services/settings-api";
import { useI18n } from "./use-i18n";
import { resolveAssetUrl } from "../utils/asset-url";

export const BRANDING_QUERY_KEY = ["branding"] as const;

const FALLBACK_LOGO = "/logo.png";

export function useBranding() {
  const { t } = useI18n();

  const query = useQuery({
    queryKey: BRANDING_QUERY_KEY,
    queryFn: fetchPublicBranding,
    staleTime: 60_000,
  });

  const branding = query.data;
  const logoPath = branding?.logo || branding?.loginLogo || "";
  const logoUrl = logoPath ? resolveAssetUrl(logoPath) : FALLBACK_LOGO;

  return {
    ...query,
    projectName: branding?.projectName?.trim() || t("brand.name"),
    footerText: branding?.footerText?.trim() || t("brand.tagline"),
    logoUrl,
    faviconUrl: branding?.favicon ? resolveAssetUrl(branding.favicon) : "",
    loginBackgroundUrl: branding?.loginBackground ? resolveAssetUrl(branding.loginBackground) : "",
  };
}
