import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Refresh } from "@mui/icons-material";
import { Box, Button, Chip, CircularProgress, Stack, Tab, Tabs } from "@mui/material";
import { EmptyState } from "../../components/layout";
import { toast } from "../../components/ui/sonner";
import {
  fetchAdminMarketPrices,
  fetchLatestMarketDataApi,
  fetchMarketPriceCategoriesApi,
  refreshMarketPricesApi,
} from "../../services/admin-api";
import { getApiErrorMessage } from "../../utils/api-error";
import { useI18n } from "../../hooks/use-i18n";
import type { MarketTrend } from "../../types/market";
import { MarketListPanel } from "./market-list-panel";

type MarketTab = "crops" | "livestock" | "poultry";

const TAB_CONFIG: Record<
  MarketTab,
  {
    labelKey: string;
    nameColumnKey: string;
    searchPlaceholderKey: string;
    listTitleKey: string;
    statTotalKey: string;
  }
> = {
  crops: {
    labelKey: "market.tab.crops",
    nameColumnKey: "market.colCrop",
    searchPlaceholderKey: "market.search.crops",
    listTitleKey: "market.list.crops",
    statTotalKey: "market.stat.crops",
  },
  livestock: {
    labelKey: "market.tab.livestock",
    nameColumnKey: "market.colType",
    searchPlaceholderKey: "market.search.livestock",
    listTitleKey: "market.list.livestock",
    statTotalKey: "market.stat.livestock",
  },
  poultry: {
    labelKey: "market.tab.poultry",
    nameColumnKey: "market.colType",
    searchPlaceholderKey: "market.search.poultry",
    listTitleKey: "market.list.poultry",
    statTotalKey: "market.stat.poultry",
  },
};

export function MarketPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<MarketTab>("crops");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [trend, setTrend] = useState<"" | MarketTrend>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, trend, pageSize, activeTab]);

  const categoriesQuery = useQuery({
    queryKey: ["market-price-categories"],
    queryFn: fetchMarketPriceCategoriesApi,
    staleTime: 60_000,
  });

  const cropsQuery = useQuery({
    queryKey: ["admin-market-prices", page, pageSize, debouncedSearch, category, trend],
    queryFn: () =>
      fetchAdminMarketPrices({
        page,
        limit: pageSize,
        search: debouncedSearch || undefined,
        category: category || undefined,
        trend: trend || undefined,
        sortBy: "recordedAt",
        sortOrder: "desc",
      }),
    enabled: activeTab === "crops",
  });

  const legacyQuery = useQuery({
    queryKey: ["market-latest"],
    queryFn: fetchLatestMarketDataApi,
    enabled: activeTab !== "crops",
  });

  const refreshMutation = useMutation({
    mutationFn: refreshMarketPricesApi,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin-market-prices"] });
      queryClient.invalidateQueries({ queryKey: ["market-latest"] });
      queryClient.invalidateQueries({ queryKey: ["market-price-categories"] });
      if (result.fallback) {
        toast.warning(t("market.refreshFallback"));
        return;
      }
      toast.success(t("market.refreshSuccess"));
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, t("market.refreshFailed"))),
  });

  const config = TAB_CONFIG[activeTab];
  const isCropsTab = activeTab === "crops";

  const cropsItems = cropsQuery.data?.items || [];
  const cropsPagination = cropsQuery.data?.pagination;

  const legacyItems =
    activeTab === "livestock" ? legacyQuery.data?.livestock || [] : legacyQuery.data?.poultry || [];

  const isLoading = isCropsTab ? cropsQuery.isLoading : legacyQuery.isLoading;
  const isError = isCropsTab ? cropsQuery.isError : legacyQuery.isError;
  const error = isCropsTab ? cropsQuery.error : legacyQuery.error;
  const isFetching = isCropsTab ? cropsQuery.isFetching : legacyQuery.isFetching;

  const tabCounts = {
    crops: cropsPagination?.totalItems ?? cropsItems.length,
    livestock: legacyQuery.data?.livestock?.length || 0,
    poultry: legacyQuery.data?.poultry?.length || 0,
  };

  if (isLoading) {
    return (
      <Stack sx={{ py: 6, alignItems: "center" }}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  if (isError) {
    return (
      <EmptyState
        title={t("market.loadFailed")}
        description={getApiErrorMessage(error)}
        action={
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => (isCropsTab ? cropsQuery.refetch() : legacyQuery.refetch())}
          >
            {t("market.tryAgain")}
          </Button>
        }
      />
    );
  }

  return (
    <Stack spacing={3}>
      <Tabs
        value={activeTab}
        onChange={(_, value: MarketTab) => {
          setActiveTab(value);
          setSearch("");
          setCategory("");
          setTrend("");
        }}
        variant="scrollable"
        allowScrollButtonsMobile
      >
        {(Object.keys(TAB_CONFIG) as MarketTab[]).map((tab) => (
          <Tab
            key={tab}
            value={tab}
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {t(TAB_CONFIG[tab].labelKey)}
                <Chip label={tabCounts[tab]} size="small" />
              </Box>
            }
          />
        ))}
      </Tabs>

      {isCropsTab ? (
        <MarketListPanel
          items={cropsItems}
          pagination={cropsPagination}
          search={search}
          category={category}
          trend={trend}
          pageSize={pageSize}
          categories={categoriesQuery.data || []}
          onSearchChange={setSearch}
          onCategoryChange={setCategory}
          onTrendChange={setTrend}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onRefresh={() => refreshMutation.mutate()}
          isFetching={isFetching}
          isRefreshing={refreshMutation.isPending}
          nameColumnKey={config.nameColumnKey}
          searchPlaceholderKey={config.searchPlaceholderKey}
          listTitleKey={config.listTitleKey}
          statTotalKey={config.statTotalKey}
        />
      ) : (
        <MarketListPanel
          items={legacyItems}
          search=""
          category=""
          trend=""
          pageSize={legacyItems.length || 10}
          categories={[]}
          onSearchChange={() => {}}
          onCategoryChange={() => {}}
          onTrendChange={() => {}}
          onPageChange={() => {}}
          onPageSizeChange={() => {}}
          onRefresh={() => legacyQuery.refetch()}
          isFetching={isFetching}
          isRefreshing={false}
          nameColumnKey={config.nameColumnKey}
          searchPlaceholderKey={config.searchPlaceholderKey}
          listTitleKey={config.listTitleKey}
          statTotalKey={config.statTotalKey}
        />
      )}
    </Stack>
  );
}
