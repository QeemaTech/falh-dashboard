export const EGYPT_GOVERNORATES = [
  { value: "cairo", label: "القاهرة", labelEn: "Cairo" },
  { value: "giza", label: "الجيزة", labelEn: "Giza" },
  { value: "alexandria", label: "الإسكندرية", labelEn: "Alexandria" },
  { value: "qalyubia", label: "القليوبية", labelEn: "Qalyubia" },
  { value: "port_said", label: "بورسعيد", labelEn: "Port Said" },
  { value: "suez", label: "السويس", labelEn: "Suez" },
  { value: "dakahlia", label: "الدقهلية", labelEn: "Dakahlia" },
  { value: "sharqia", label: "الشرقية", labelEn: "Sharqia" },
  { value: "gharbia", label: "الغربية", labelEn: "Gharbia" },
  { value: "monufia", label: "المنوفية", labelEn: "Monufia" },
  { value: "beheira", label: "البحيرة", labelEn: "Beheira" },
  { value: "kafr_el_sheikh", label: "كفر الشيخ", labelEn: "Kafr El Sheikh" },
  { value: "damietta", label: "دمياط", labelEn: "Damietta" },
  { value: "ismailia", label: "الإسماعيلية", labelEn: "Ismailia" },
  { value: "fayoum", label: "الفيوم", labelEn: "Fayoum" },
  { value: "beni_suef", label: "بني سويف", labelEn: "Beni Suef" },
  { value: "minya", label: "المنيا", labelEn: "Minya" },
  { value: "asyut", label: "أسيوط", labelEn: "Asyut" },
  { value: "sohag", label: "سوهاج", labelEn: "Sohag" },
  { value: "qena", label: "قنا", labelEn: "Qena" },
  { value: "luxor", label: "الأقصر", labelEn: "Luxor" },
  { value: "aswan", label: "أسوان", labelEn: "Aswan" },
  { value: "red_sea", label: "البحر الأحمر", labelEn: "Red Sea" },
  { value: "new_valley", label: "الوادي الجديد", labelEn: "New Valley" },
  { value: "matrouh", label: "مطروح", labelEn: "Matrouh" },
  { value: "north_sinai", label: "شمال سيناء", labelEn: "North Sinai" },
  { value: "south_sinai", label: "جنوب سيناء", labelEn: "South Sinai" },
] as const;

export function governorateOptions(language: "ar" | "en") {
  return EGYPT_GOVERNORATES.map((item) => ({
    value: item.value,
    label: language === "en" ? item.labelEn : item.label,
  }));
}

export const EGYPT_GOVERNORATES_LIST = EGYPT_GOVERNORATES;
export const getGovernorateOptions = governorateOptions;
