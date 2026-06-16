export type JoinApplicationTypeSeed = {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  category: "COMPANY" | "PROVIDER";
  serviceProviderType?: string | null;
  isSystem: boolean;
  isActive: boolean;
  sortOrder: number;
};

/** Built-in types used when the types API is unavailable (e.g. backend not migrated yet). */
export const FALLBACK_JOIN_APPLICATION_TYPES: JoinApplicationTypeSeed[] = [
  {
    id: "fallback-company",
    code: "COMPANY",
    nameAr: "شركة",
    nameEn: "Company",
    category: "COMPANY",
    serviceProviderType: null,
    isSystem: true,
    isActive: true,
    sortOrder: 0,
  },
  {
    id: "fallback-doctor",
    code: "DOCTOR",
    nameAr: "طبيب بيطري",
    nameEn: "Veterinary doctor",
    category: "PROVIDER",
    serviceProviderType: "DOCTOR",
    isSystem: true,
    isActive: true,
    sortOrder: 10,
  },
  {
    id: "fallback-engineer",
    code: "AGRICULTURAL_ENGINEER",
    nameAr: "مهندس زراعي",
    nameEn: "Agricultural engineer",
    category: "PROVIDER",
    serviceProviderType: "ENGINEER",
    isSystem: true,
    isActive: true,
    sortOrder: 20,
  },
  {
    id: "fallback-consultant",
    code: "CONSULTANT",
    nameAr: "استشاري",
    nameEn: "Consultant",
    category: "PROVIDER",
    serviceProviderType: "CONSULTANT",
    isSystem: true,
    isActive: true,
    sortOrder: 30,
  },
  {
    id: "fallback-broker",
    code: "LAND_BROKER",
    nameAr: "وسيط أراضي",
    nameEn: "Land broker",
    category: "PROVIDER",
    serviceProviderType: "LAND_BROKER",
    isSystem: true,
    isActive: true,
    sortOrder: 40,
  },
  {
    id: "fallback-transport",
    code: "TRANSPORT",
    nameAr: "مزود نقل",
    nameEn: "Transport provider",
    category: "PROVIDER",
    serviceProviderType: "TRANSPORT",
    isSystem: true,
    isActive: true,
    sortOrder: 50,
  },
  {
    id: "fallback-other",
    code: "OTHER",
    nameAr: "أخرى",
    nameEn: "Other",
    category: "PROVIDER",
    serviceProviderType: "OTHER",
    isSystem: true,
    isActive: true,
    sortOrder: 60,
  },
];
