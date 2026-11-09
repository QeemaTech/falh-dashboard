import { Fragment, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Add, ExpandLess, ExpandMore, Place } from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Collapse,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  AppBadge,
  AppModal,
  AppTable,
  AppTableCell,
  AppTableHead,
  AppTableHeaderCell,
  AppTableRow,
  TableBody,
} from "../../components/design-system";
import { EmptyState, PageHeader, TablePaginationBar, TableRowActions, resolveTotalPages } from "../../components/layout";
import { useI18n } from "../../hooks/use-i18n";
import { toast } from "../../components/ui/sonner";
import {
  createAdminCenterApi,
  createAdminCityApi,
  deleteAdminCenterApi,
  deleteAdminCityApi,
  fetchAdminCities,
  updateAdminCenterApi,
  updateAdminCityApi,
  type AdminCity,
  type AdminCityCenter,
} from "../../services/admin-api";

const emptyForm = { nameAr: "", nameEn: "", sortOrder: "0", isActive: true };
const fieldSx = { "& .MuiOutlinedInput-root": { borderRadius: "8px" } };

function displayName(item: { nameAr?: string | null; nameEn?: string | null; name?: string }, language: "ar" | "en") {
  if (language === "ar") return item.nameAr || item.nameEn || item.name || "-";
  return item.nameEn || item.nameAr || item.name || "-";
}

export function CitiesPage() {
  const { t, language } = useI18n();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "true" | "false">("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [cityModal, setCityModal] = useState(false);
  const [centerModal, setCenterModal] = useState(false);
  const [editingCityId, setEditingCityId] = useState<string | null>(null);
  const [editingCenterId, setEditingCenterId] = useState<string | null>(null);
  const [parentCityId, setParentCityId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const queryParams = useMemo(
    () => ({
      page,
      limit: pageSize,
      search: search.trim() || undefined,
      isActive: statusFilter === "all" ? undefined : statusFilter === "true",
      sortBy: "sortOrder" as const,
      sortOrder: "asc" as const,
    }),
    [page, pageSize, search, statusFilter]
  );

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["admin-cities", queryParams],
    queryFn: () => fetchAdminCities(queryParams),
    placeholderData: (previousData) => previousData,
  });

  const cities = data?.items || [];
  const totalPages = resolveTotalPages(data?.meta);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-cities"] });
    queryClient.invalidateQueries({ queryKey: ["active-cities"] });
  };

  const saveCity = useMutation({
    mutationFn: async () => {
      if (!form.nameAr.trim()) throw new Error(t("cities.nameArRequired"));
      const payload = {
        nameAr: form.nameAr.trim(),
        nameEn: form.nameEn.trim() || undefined,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      };
      if (editingCityId) return updateAdminCityApi(editingCityId, payload);
      return createAdminCityApi(payload);
    },
    onSuccess: () => {
      invalidate();
      const wasEdit = Boolean(editingCityId);
      closeCityModal();
      toast.success(wasEdit ? t("cities.updated") : t("cities.created"));
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : t("cities.saveFailed")),
  });

  const saveCenter = useMutation({
    mutationFn: async () => {
      if (!form.nameAr.trim()) throw new Error(t("cities.nameArRequired"));
      if (!parentCityId && !editingCenterId) throw new Error(t("cities.cityRequired"));
      const payload = {
        nameAr: form.nameAr.trim(),
        nameEn: form.nameEn.trim() || undefined,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      };
      if (editingCenterId) return updateAdminCenterApi(editingCenterId, payload);
      return createAdminCenterApi(parentCityId!, payload);
    },
    onSuccess: () => {
      invalidate();
      const wasEdit = Boolean(editingCenterId);
      closeCenterModal();
      toast.success(wasEdit ? t("cities.centerUpdated") : t("cities.centerCreated"));
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : t("cities.saveFailed")),
  });

  const deleteCity = useMutation({
    mutationFn: deleteAdminCityApi,
    onSuccess: () => {
      invalidate();
      toast.success(t("cities.deleted"));
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : t("cities.deleteFailed")),
  });

  const deleteCenter = useMutation({
    mutationFn: deleteAdminCenterApi,
    onSuccess: () => {
      invalidate();
      toast.success(t("cities.centerDeleted"));
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : t("cities.deleteFailed")),
  });

  const toggleActiveCity = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => updateAdminCityApi(id, { isActive }),
    onSuccess: () => invalidate(),
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : t("cities.saveFailed")),
  });

  const toggleActiveCenter = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => updateAdminCenterApi(id, { isActive }),
    onSuccess: () => invalidate(),
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : t("cities.saveFailed")),
  });

  function openCreateCity() {
    setEditingCityId(null);
    setForm(emptyForm);
    setCityModal(true);
  }

  function openEditCity(city: AdminCity) {
    setEditingCityId(city.id);
    setForm({
      nameAr: city.nameAr || "",
      nameEn: city.nameEn || "",
      sortOrder: String(city.sortOrder ?? 0),
      isActive: city.isActive !== false,
    });
    setCityModal(true);
  }

  function openCreateCenter(cityId: string) {
    setParentCityId(cityId);
    setEditingCenterId(null);
    setForm(emptyForm);
    setExpanded((prev) => ({ ...prev, [cityId]: true }));
    setCenterModal(true);
  }

  function openEditCenter(center: AdminCityCenter) {
    setParentCityId(center.cityId);
    setEditingCenterId(center.id);
    setForm({
      nameAr: center.nameAr || "",
      nameEn: center.nameEn || "",
      sortOrder: String(center.sortOrder ?? 0),
      isActive: center.isActive !== false,
    });
    setCenterModal(true);
  }

  function closeCityModal() {
    setCityModal(false);
    setEditingCityId(null);
    setForm(emptyForm);
  }

  function closeCenterModal() {
    setCenterModal(false);
    setEditingCenterId(null);
    setParentCityId(null);
    setForm(emptyForm);
  }

  const nameForm = (
    <Stack spacing={2}>
      <TextField
        label={`${t("cities.nameAr")} *`}
        size="small"
        fullWidth
        value={form.nameAr}
        onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))}
        sx={fieldSx}
      />
      <TextField
        label={t("cities.nameEn")}
        size="small"
        fullWidth
        value={form.nameEn}
        onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
        sx={fieldSx}
      />
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          label={t("cities.sortOrder")}
          type="number"
          size="small"
          fullWidth
          value={form.sortOrder}
          onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
          sx={fieldSx}
        />
        <TextField
          select
          label={t("cities.status")}
          size="small"
          fullWidth
          value={form.isActive ? "true" : "false"}
          onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value === "true" }))}
          sx={fieldSx}
        >
          <MenuItem value="true">{t("cities.active")}</MenuItem>
          <MenuItem value="false">{t("cities.inactive")}</MenuItem>
        </TextField>
      </Stack>
    </Stack>
  );

  return (
    <Stack spacing={2.5} sx={{ width: "100%", pb: 2 }}>
      <PageHeader
        title={t("cities.title")}
        subtitle={t("cities.subtitle")}
        action={
          <Button variant="contained" startIcon={<Add />} onClick={openCreateCity} sx={{ borderRadius: "8px" }}>
            {t("cities.add")}
          </Button>
        }
      />

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <TextField
          size="small"
          fullWidth
          label={t("cities.search")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          sx={fieldSx}
        />
        <TextField
          select
          size="small"
          label={t("cities.status")}
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as "all" | "true" | "false");
            setPage(1);
          }}
          sx={{ ...fieldSx, minWidth: 160 }}
        >
          <MenuItem value="all">{t("cities.filterAll")}</MenuItem>
          <MenuItem value="true">{t("cities.active")}</MenuItem>
          <MenuItem value="false">{t("cities.inactive")}</MenuItem>
        </TextField>
      </Stack>

      {isLoading ? (
        <Stack sx={{ py: 8, alignItems: "center" }}>
          <CircularProgress size={28} />
        </Stack>
      ) : null}

      {isError ? <EmptyState title={t("cities.loadFailed")} description={(error as Error).message} /> : null}

      {!isLoading && !isError ? (
        <AppTable minWidth={820}>
          <AppTableHead>
            <AppTableRow hover={false}>
              <AppTableHeaderCell width={56} />
              <AppTableHeaderCell>{t("cities.col.name")}</AppTableHeaderCell>
              <AppTableHeaderCell width={120}>{t("cities.col.centers")}</AppTableHeaderCell>
              <AppTableHeaderCell width={80}>{t("cities.col.sort")}</AppTableHeaderCell>
              <AppTableHeaderCell width={120}>{t("cities.col.status")}</AppTableHeaderCell>
              <AppTableHeaderCell align="right" width={220}>
                {t("cities.col.actions")}
              </AppTableHeaderCell>
            </AppTableRow>
          </AppTableHead>
          <TableBody>
            {cities.length ? (
              cities.map((city) => {
                const open = Boolean(expanded[city.id]);
                const centers = city.centers || [];
                return (
                  <Fragment key={city.id}>
                    <AppTableRow>
                      <AppTableCell>
                        <IconButton
                          size="small"
                          onClick={() => setExpanded((prev) => ({ ...prev, [city.id]: !open }))}
                          aria-label={open ? t("cities.collapse") : t("cities.expand")}
                        >
                          {open ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                        </IconButton>
                      </AppTableCell>
                      <AppTableCell>
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                          <Place fontSize="small" color="primary" />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {displayName(city, language)}
                            </Typography>
                            {language === "ar" && city.nameEn ? (
                              <Typography variant="caption" color="text.secondary">
                                {city.nameEn}
                              </Typography>
                            ) : null}
                          </Box>
                        </Stack>
                      </AppTableCell>
                      <AppTableCell>{centers.length}</AppTableCell>
                      <AppTableCell>{city.sortOrder ?? 0}</AppTableCell>
                      <AppTableCell>
                        <AppBadge variant={city.isActive === false ? "neutral" : "success"}>
                          {city.isActive === false ? t("cities.inactive") : t("cities.active")}
                        </AppBadge>
                      </AppTableCell>
                      <AppTableCell align="right">
                        <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end", flexWrap: "wrap" }}>
                          <Button size="small" onClick={() => openCreateCenter(city.id)} sx={{ borderRadius: "8px" }}>
                            {t("cities.addCenter")}
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => toggleActiveCity.mutate({ id: city.id, isActive: city.isActive === false })}
                            sx={{ borderRadius: "8px" }}
                          >
                            {city.isActive === false ? t("cities.activate") : t("cities.deactivate")}
                          </Button>
                          <TableRowActions
                            onEdit={() => openEditCity(city)}
                            onDelete={() => {
                              if (window.confirm(t("cities.deleteConfirm").replace("{{name}}", displayName(city, language)))) {
                                deleteCity.mutate(city.id);
                              }
                            }}
                          />
                        </Stack>
                      </AppTableCell>
                    </AppTableRow>
                    <AppTableRow hover={false}>
                      <AppTableCell colSpan={6} sx={{ p: 0, borderBottom: open ? undefined : 0 }}>
                        <Collapse in={open} timeout="auto" unmountOnExit>
                          <Box sx={{ px: 3, py: 1.5, bgcolor: "action.hover" }}>
                            {centers.length ? (
                              centers.map((center) => (
                                <Stack
                                  key={center.id}
                                  direction={{ xs: "column", sm: "row" }}
                                  spacing={1}
                                  sx={{
                                    py: 1,
                                    alignItems: { sm: "center" },
                                    justifyContent: "space-between",
                                    borderBottom: "1px solid",
                                    borderColor: "divider",
                                  }}
                                >
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                      {displayName(center, language)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {t("cities.sortOrder")}: {center.sortOrder ?? 0}
                                    </Typography>
                                  </Box>
                                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                                    <AppBadge variant={center.isActive === false ? "neutral" : "success"}>
                                      {center.isActive === false ? t("cities.inactive") : t("cities.active")}
                                    </AppBadge>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      onClick={() =>
                                        toggleActiveCenter.mutate({
                                          id: center.id,
                                          isActive: center.isActive === false,
                                        })
                                      }
                                      sx={{ borderRadius: "8px" }}
                                    >
                                      {center.isActive === false ? t("cities.activate") : t("cities.deactivate")}
                                    </Button>
                                    <TableRowActions
                                      onEdit={() => openEditCenter(center)}
                                      onDelete={() => {
                                        if (
                                          window.confirm(
                                            t("cities.deleteCenterConfirm").replace("{{name}}", displayName(center, language))
                                          )
                                        ) {
                                          deleteCenter.mutate(center.id);
                                        }
                                      }}
                                    />
                                  </Stack>
                                </Stack>
                              ))
                            ) : (
                              <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                                {t("cities.noCenters")}
                              </Typography>
                            )}
                          </Box>
                        </Collapse>
                      </AppTableCell>
                    </AppTableRow>
                  </Fragment>
                );
              })
            ) : (
              <AppTableRow>
                <AppTableCell colSpan={6}>
                  <EmptyState title={t("cities.empty")} />
                </AppTableCell>
              </AppTableRow>
            )}
          </TableBody>
        </AppTable>
      ) : null}

      {!isLoading && !isError && (cities.length > 0 || totalPages > 1) ? (
        <TablePaginationBar
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          isFetching={isFetching}
          totalItems={data?.meta?.total}
        />
      ) : null}

      <AppModal
        open={cityModal}
        onClose={closeCityModal}
        title={editingCityId ? t("cities.update") : t("cities.add")}
        footer={
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              onClick={() => saveCity.mutate()}
              disabled={saveCity.isPending}
              sx={{ borderRadius: "8px" }}
            >
              {saveCity.isPending ? t("products.form.saving") : editingCityId ? t("cities.update") : t("cities.add")}
            </Button>
            <Button onClick={closeCityModal} sx={{ borderRadius: "8px" }}>
              {t("products.cancel")}
            </Button>
          </Stack>
        }
      >
        {nameForm}
      </AppModal>

      <AppModal
        open={centerModal}
        onClose={closeCenterModal}
        title={editingCenterId ? t("cities.updateCenter") : t("cities.addCenter")}
        footer={
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              onClick={() => saveCenter.mutate()}
              disabled={saveCenter.isPending}
              sx={{ borderRadius: "8px" }}
            >
              {saveCenter.isPending
                ? t("products.form.saving")
                : editingCenterId
                  ? t("cities.updateCenter")
                  : t("cities.addCenter")}
            </Button>
            <Button onClick={closeCenterModal} sx={{ borderRadius: "8px" }}>
              {t("products.cancel")}
            </Button>
          </Stack>
        }
      >
        {nameForm}
      </AppModal>
    </Stack>
  );
}
