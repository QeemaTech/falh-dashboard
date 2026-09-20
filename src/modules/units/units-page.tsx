import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Add } from "@mui/icons-material";
import {
  Button,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
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
  createAdminUnitApi,
  deleteAdminUnitApi,
  fetchAdminUnits,
  updateAdminUnitApi,
  type AdminUnit,
} from "../../services/admin-api";

const emptyForm = {
  nameAr: "",
  nameEn: "",
  symbol: "",
  sortOrder: "0",
  isActive: true,
};

const fieldSx = { "& .MuiOutlinedInput-root": { borderRadius: "8px" } };

export function UnitsPage() {
  const { t, language } = useI18n();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["admin-units", page, pageSize],
    queryFn: () => fetchAdminUnits({ page, limit: pageSize, sortBy: "sortOrder", sortOrder: "asc" }),
    placeholderData: (previousData) => previousData,
  });

  const units = data?.items || [];
  const totalPages = resolveTotalPages(data?.meta);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.nameAr.trim()) throw new Error(t("units.nameArRequired"));
      if (!form.symbol.trim()) throw new Error(t("units.symbolRequired"));
      const payload = {
        nameAr: form.nameAr.trim(),
        nameEn: form.nameEn.trim() || undefined,
        symbol: form.symbol.trim(),
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      };
      if (editingId) return updateAdminUnitApi(editingId, payload);
      return createAdminUnitApi(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-units"] });
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin-categories-list"] });
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
      const wasEdit = Boolean(editingId);
      closeModal();
      toast.success(wasEdit ? t("units.updated") : t("units.created"));
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : t("units.saveFailed")),
  });

  const deleteMutation = useMutation({
    mutationFn: (unitId: string) => deleteAdminUnitApi(unitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-units"] });
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin-categories-list"] });
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
      toast.success(t("units.deleted"));
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : t("units.deleteFailed")),
  });

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(unit: AdminUnit) {
    setEditingId(unit.id);
    setForm({
      nameAr: unit.nameAr || "",
      nameEn: unit.nameEn || "",
      symbol: unit.symbol || "",
      sortOrder: String(unit.sortOrder ?? 0),
      isActive: unit.isActive !== false,
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  return (
    <Stack spacing={2.5} sx={{ width: "100%", pb: 2 }}>
      <PageHeader
        title={t("units.title")}
        subtitle={t("units.subtitle")}
        action={
          <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ borderRadius: "8px" }}>
            {t("units.add")}
          </Button>
        }
      />

      {isLoading ? (
        <Stack sx={{ py: 8, alignItems: "center" }}>
          <CircularProgress size={28} />
        </Stack>
      ) : null}

      {isError ? <EmptyState title={t("units.loadFailed")} description={(error as Error).message} /> : null}

      {!isLoading && !isError ? (
        <AppTable minWidth={720}>
          <AppTableHead>
            <AppTableRow hover={false}>
              <AppTableHeaderCell>{t("units.col.name")}</AppTableHeaderCell>
              <AppTableHeaderCell width={120}>{t("units.col.symbol")}</AppTableHeaderCell>
              <AppTableHeaderCell width={80}>{t("units.col.sort")}</AppTableHeaderCell>
              <AppTableHeaderCell width={120}>{t("units.col.status")}</AppTableHeaderCell>
              <AppTableHeaderCell align="right" width={140}>
                {t("units.col.actions")}
              </AppTableHeaderCell>
            </AppTableRow>
          </AppTableHead>
          <TableBody>
            {units.length ? (
              units.map((unit) => (
                <AppTableRow key={unit.id}>
                  <AppTableCell>
                    {language === "ar" ? unit.nameAr || unit.nameEn : unit.nameEn || unit.nameAr}
                  </AppTableCell>
                  <AppTableCell>{unit.symbol}</AppTableCell>
                  <AppTableCell>{unit.sortOrder ?? 0}</AppTableCell>
                  <AppTableCell>
                    <AppBadge variant={unit.isActive === false ? "neutral" : "success"}>
                      {unit.isActive === false ? t("units.inactive") : t("units.active")}
                    </AppBadge>
                  </AppTableCell>
                  <AppTableCell align="right">
                    <TableRowActions
                      onEdit={() => openEdit(unit)}
                      onDelete={() => {
                        if (window.confirm(t("units.deleteConfirm").replace("{{name}}", unit.nameAr))) {
                          deleteMutation.mutate(unit.id);
                        }
                      }}
                    />
                  </AppTableCell>
                </AppTableRow>
              ))
            ) : (
              <AppTableRow>
                <AppTableCell colSpan={5}>
                  <EmptyState title={t("units.empty")} />
                </AppTableCell>
              </AppTableRow>
            )}
          </TableBody>
        </AppTable>
      ) : null}

      {!isLoading && !isError && (units.length > 0 || totalPages > 1) ? (
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
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? t("units.update") : t("units.add")}
        footer={
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              sx={{ borderRadius: "8px" }}
            >
              {saveMutation.isPending ? t("products.form.saving") : editingId ? t("units.update") : t("units.add")}
            </Button>
            <Button onClick={closeModal} sx={{ borderRadius: "8px" }}>
              {t("products.cancel")}
            </Button>
          </Stack>
        }
      >
        <Stack spacing={2}>
          <TextField
            label={`${t("units.nameAr")} *`}
            size="small"
            fullWidth
            value={form.nameAr}
            onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))}
            sx={fieldSx}
          />
          <TextField
            label={t("units.nameEn")}
            size="small"
            fullWidth
            value={form.nameEn}
            onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
            sx={fieldSx}
          />
          <TextField
            label={`${t("units.symbol")} *`}
            size="small"
            fullWidth
            value={form.symbol}
            onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value }))}
            helperText={t("units.symbolHint")}
            sx={fieldSx}
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label={t("units.sortOrder")}
              type="number"
              size="small"
              fullWidth
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
              sx={fieldSx}
            />
            <TextField
              select
              label={t("units.status")}
              size="small"
              fullWidth
              value={form.isActive ? "true" : "false"}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value === "true" }))}
              sx={fieldSx}
            >
              <MenuItem value="true">{t("units.active")}</MenuItem>
              <MenuItem value="false">{t("units.inactive")}</MenuItem>
            </TextField>
          </Stack>
        </Stack>
      </AppModal>
    </Stack>
  );
}
