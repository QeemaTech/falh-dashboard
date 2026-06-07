export function prefillCompanyLoginEmail(...sources: Array<string | null | undefined>) {
  for (const source of sources) {
    const value = String(source || "").trim().toLowerCase();
    if (value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return value;
    }
  }
  return "";
}
