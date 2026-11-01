import { useEffect, useRef } from "react";
import { AddPhotoAlternate, Close, Star } from "@mui/icons-material";
import { Box, Chip, IconButton, Stack, Typography } from "@mui/material";
import { resolveAssetUrl } from "../../utils/asset-url";
import type { AdminProduct } from "../../services/admin-api";

export type ProductImageItem =
  | { kind: "existing"; path: string; id?: string }
  | { kind: "new"; file: File; preview: string };

type Props = {
  items: ProductImageItem[];
  onChange: (items: ProductImageItem[]) => void;
  label?: string;
  hint?: string;
  addLabel?: string;
  disabled?: boolean;
};

function itemKey(item: ProductImageItem, index: number) {
  if (item.kind === "existing") return `existing-${item.id || item.path}-${index}`;
  return `new-${item.file.name}-${item.file.size}-${index}`;
}

export function ProductImagePicker({ items, onChange, label, hint, addLabel = "إضافة صور", disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef(items);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    return () => {
      itemsRef.current.forEach((item) => {
        if (item.kind === "new") URL.revokeObjectURL(item.preview);
      });
    };
  }, []);

  function addFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const next = [...items];
    for (const file of Array.from(fileList)) {
      if (!file.type.startsWith("image/")) continue;
      next.push({ kind: "new", file, preview: URL.createObjectURL(file) });
    }
    onChange(next);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeAt(index: number) {
    const item = items[index];
    if (item?.kind === "new") URL.revokeObjectURL(item.preview);
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <Box>
      {label ? (
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
          {label}
        </Typography>
      ) : null}
      {hint ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
          {hint}
        </Typography>
      ) : null}

      <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
        {items.map((item, index) => (
          <Box
            key={itemKey(item, index)}
            sx={{
              position: "relative",
              width: 88,
              height: 88,
              borderRadius: 1.5,
              overflow: "hidden",
              border: 1.5,
              borderColor: index === 0 ? "primary.main" : "divider",
              bgcolor: "action.hover",
              boxShadow: index === 0 ? "0 0 0 1px inset" : "none",
            }}
          >
            <Box
              component="img"
              src={item.kind === "existing" ? resolveAssetUrl(item.path) : item.preview}
              alt=""
              sx={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            {index === 0 ? (
              <Chip
                label="الرئيسية"
                size="small"
                icon={<Star sx={{ fontSize: "12px !important", color: "inherit" }} />}
                sx={{
                  position: "absolute",
                  bottom: 2,
                  left: "50%",
                  transform: "translateX(-50%)",
                  height: 18,
                  fontSize: "10px",
                  fontWeight: 700,
                  bgcolor: "rgba(0,0,0,0.75)",
                  color: "#fff",
                  px: 0.5,
                  "& .MuiChip-icon": { ml: 0.5, mr: -0.25 },
                }}
              />
            ) : null}
            <IconButton
              size="small"
              disabled={disabled}
              onClick={() => removeAt(index)}
              sx={{
                position: "absolute",
                top: 3,
                insetInlineEnd: 3,
                bgcolor: "rgba(0,0,0,0.65)",
                color: "#fff",
                width: 22,
                height: 22,
                "&:hover": { bgcolor: "rgba(0,0,0,0.85)" },
              }}
            >
              <Close sx={{ fontSize: 13 }} />
            </IconButton>
          </Box>
        ))}

        <Box
          component="label"
          sx={{
            display: "inline-flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: items.length > 0 ? 88 : "100%",
            height: items.length > 0 ? 88 : 110,
            borderRadius: 1.5,
            border: "2px dashed",
            borderColor: "divider",
            bgcolor: "action.hover",
            cursor: disabled ? "default" : "pointer",
            transition: "all 0.2s",
            opacity: disabled ? 0.6 : 1,
            "&:hover": disabled
              ? {}
              : {
                  borderColor: "primary.main",
                  bgcolor: "action.selected",
                },
          }}
        >
          <AddPhotoAlternate
            sx={{
              fontSize: items.length > 0 ? 26 : 32,
              color: "primary.main",
              mb: items.length > 0 ? 0.25 : 0.75,
            }}
          />
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              color: "text.primary",
              fontSize: items.length > 0 ? "11px" : "13px",
              textAlign: "center",
              px: 1,
            }}
          >
            {items.length > 0 ? "إضافة" : addLabel}
          </Typography>
          <input
            ref={inputRef}
            hidden
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            disabled={disabled}
            onChange={(e) => addFiles(e.target.files)}
          />
        </Box>
      </Stack>
    </Box>
  );
}

export async function resolveProductImagePaths(
  items: ProductImageItem[],
  upload: (files: File[]) => Promise<string[]>
): Promise<string[]> {
  const existing = items.filter((item) => item.kind === "existing").map((item) => item.path);
  const newFiles = items.filter((item) => item.kind === "new").map((item) => item.file);
  if (!newFiles.length) return existing;
  const uploaded = await upload(newFiles);
  return [...existing, ...uploaded];
}

export function productImagesToItems(product?: AdminProduct | null): ProductImageItem[] {
  if (!product?.images?.length) return [];
  return product.images.map((img) => ({ kind: "existing" as const, path: img.path, id: img.id }));
}
