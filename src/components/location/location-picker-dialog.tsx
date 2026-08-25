import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Close, LocationOn, Search } from "@mui/icons-material";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useI18n } from "../../hooks/use-i18n";

// Fix Leaflet default marker icon URLs (bundler breaks relative paths)
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type LocationPickerProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (coords: { lat: number; lng: number } | null) => void;
  initialLat?: number;
  initialLng?: number;
};

function placeDraggableMarker(
  map: L.Map,
  lat: number,
  lng: number,
  onMove: (coords: { lat: number; lng: number }) => void,
  existing?: L.Marker | null
) {
  if (existing) {
    existing.setLatLng([lat, lng]);
    return existing;
  }
  const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
  marker.on("dragend", () => {
    const pos = marker.getLatLng();
    onMove({ lat: Number(pos.lat.toFixed(6)), lng: Number(pos.lng.toFixed(6)) });
  });
  return marker;
}

export function LocationPickerDialog({
  open,
  onClose,
  onSelect,
  initialLat,
  initialLng,
}: LocationPickerProps) {
  const { isArabic } = useI18n();
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [mapEl, setMapEl] = useState<HTMLDivElement | null>(null);
  const [dialogReady, setDialogReady] = useState(false);

  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const mapContainerRef = useCallback((node: HTMLDivElement | null) => {
    setMapEl(node);
  }, []);

  useEffect(() => {
    if (!document.getElementById("leaflet-css-dynamic")) {
      const link = document.createElement("link");
      link.id = "leaflet-css-dynamic";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setDialogReady(false);
      setSearchQuery("");
      return;
    }
    if (
      initialLat !== undefined &&
      initialLng !== undefined &&
      !Number.isNaN(initialLat) &&
      !Number.isNaN(initialLng)
    ) {
      setSelectedCoords({ lat: initialLat, lng: initialLng });
    } else {
      setSelectedCoords(null);
    }
  }, [open, initialLat, initialLng]);

  // Create map only after Dialog transition finishes AND the container is mounted
  useEffect(() => {
    if (!open || !dialogReady || !mapEl) return;
    if (mapInstanceRef.current) return;

    const defaultLat = initialLat ?? 30.0444;
    const defaultLng = initialLng ?? 31.2357;
    const defaultZoom = initialLat != null && initialLng != null ? 12 : 6;

    // Clear leftover Leaflet state from Strict Mode remounts
    delete (mapEl as HTMLDivElement & { _leaflet_id?: number })._leaflet_id;
    mapEl.innerHTML = "";

    const map = L.map(mapEl, {
      center: [defaultLat, defaultLng],
      zoom: defaultZoom,
      zoomControl: true,
    });
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const onMove = (coords: { lat: number; lng: number }) => setSelectedCoords(coords);

    if (initialLat != null && initialLng != null && !Number.isNaN(initialLat) && !Number.isNaN(initialLng)) {
      markerRef.current = placeDraggableMarker(map, initialLat, initialLng, onMove);
    }

    map.on("click", (e: L.LeafletMouseEvent) => {
      const roundedLat = Number(e.latlng.lat.toFixed(6));
      const roundedLng = Number(e.latlng.lng.toFixed(6));
      setSelectedCoords({ lat: roundedLat, lng: roundedLng });
      markerRef.current = placeDraggableMarker(map, roundedLat, roundedLng, onMove, markerRef.current);
    });

    const refresh = () => map.invalidateSize({ animate: false });
    refresh();
    requestAnimationFrame(refresh);
    const timers = [100, 250, 500].map((ms) => setTimeout(refresh, ms));

    return () => {
      timers.forEach(clearTimeout);
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, [open, dialogReady, mapEl, initialLat, initialLng]);

  async function handleSearch() {
    if (!searchQuery.trim() || !mapInstanceRef.current) return;
    try {
      setSearching(true);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          `${searchQuery.trim()}, Egypt`
        )}&limit=1`,
        { headers: { Accept: "application/json" } }
      );
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) return;

      const lat = Number(parseFloat(data[0].lat).toFixed(6));
      const lng = Number(parseFloat(data[0].lon).toFixed(6));
      setSelectedCoords({ lat, lng });
      mapInstanceRef.current.flyTo([lat, lng], 13);
      markerRef.current = placeDraggableMarker(
        mapInstanceRef.current,
        lat,
        lng,
        (coords) => setSelectedCoords(coords),
        markerRef.current
      );
    } catch {
      // Ignore search errors (network / rate limit)
    } finally {
      setSearching(false);
    }
  }

  function handleConfirm() {
    onSelect(selectedCoords);
    onClose();
  }

  function handleClear() {
    onSelect(null);
    onClose();
  }

  const markDialogReady = useCallback(() => {
    setDialogReady(true);
    requestAnimationFrame(() => {
      mapInstanceRef.current?.invalidateSize({ animate: false });
    });
  }, []);

  // Fallback if transition callbacks don't fire (MUI version differences)
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(markDialogReady, 350);
    return () => window.clearTimeout(timer);
  }, [open, markDialogReady]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      keepMounted={false}
      TransitionProps={{
        onEntered: markDialogReady,
        onExited: () => setDialogReady(false),
      }}
      slotProps={{
        transition: {
          onEntered: markDialogReady,
          onExited: () => setDialogReady(false),
        },
      }}
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <LocationOn color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {isArabic ? "تحديد موقع المنتج على الخريطة" : "Select Product Location on Map"}
          </Typography>
        </Stack>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            {isArabic
              ? "اضغط في أي مكان على الخريطة لتحديد موقع المنتج أو اسحب العلامة."
              : "Click anywhere on the map or drag the pin to select location."}
          </Typography>

          <TextField
            size="small"
            fullWidth
            placeholder={
              isArabic
                ? "ابحث عن مدينة أو منطقة في مصر (مثلاً: الجيزة، بني سويف)..."
                : "Search city or area..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    size="small"
                    variant="contained"
                    onClick={handleSearch}
                    disabled={searching || !searchQuery.trim()}
                    startIcon={searching ? <CircularProgress size={14} color="inherit" /> : <Search />}
                  >
                    {isArabic ? "بحث" : "Search"}
                  </Button>
                </InputAdornment>
              ),
            }}
          />

          <Box
            ref={mapContainerRef}
            sx={{
              height: 380,
              minHeight: 380,
              width: "100%",
              borderRadius: 2,
              overflow: "hidden",
              border: "1px solid",
              borderColor: "divider",
              position: "relative",
              zIndex: 0,
              bgcolor: "#e5e3df",
              "& .leaflet-container": {
                height: "100% !important",
                width: "100% !important",
                fontFamily: "inherit",
              },
              "& .leaflet-tile-pane": {
                opacity: 1,
              },
            }}
          />

          {selectedCoords ? (
            <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: "action.hover" }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "primary.main" }}>
                {isArabic ? "الموقع المحدد:" : "Selected Coordinates:"} {selectedCoords.lat},{" "}
                {selectedCoords.lng}
              </Typography>
            </Box>
          ) : null}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: "space-between" }}>
        <Button variant="outlined" color="error" onClick={handleClear}>
          {isArabic ? "إزالة الموقع" : "Clear Location"}
        </Button>
        <Stack direction="row" spacing={1}>
          <Button onClick={onClose}>{isArabic ? "إلغاء" : "Cancel"}</Button>
          <Button variant="contained" onClick={handleConfirm} disabled={!selectedCoords}>
            {isArabic ? "تأكيد الاختيار" : "Confirm Selection"}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
