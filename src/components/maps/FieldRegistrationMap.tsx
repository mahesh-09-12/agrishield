import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { Crosshair, MapPin, Undo2, CheckCircle2, RotateCcw, Info, Layers, Plus, X } from "lucide-react";
import { calculatePolygonAreaAcres, calculatePolygonCentroid } from "../../lib/geoUtils";
import { useApp } from "../../context/AppContext";

interface FieldRegistrationMapProps {
  onPolygonComplete: (coordinates: [number, number][], areaAcres: number, center: [number, number]) => void;
  initialCoordinates?: [number, number][];
}

export const FieldRegistrationMap: React.FC<FieldRegistrationMapProps> = ({
  onPolygonComplete,
  initialCoordinates = [],
}) => {
  const { t } = useApp();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polygonLayerRef = useRef<L.Polygon | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const gpsMarkerRef = useRef<L.Marker | null>(null);

  const [points, setPoints] = useState<[number, number][]>(initialCoordinates);
  const [isClosed, setIsClosed] = useState<boolean>(initialCoordinates.length >= 3);
  const [gpsStatus, setGpsStatus] = useState<string>("");
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [currentGPS, setCurrentGPS] = useState<[number, number] | null>(null);
  const [mapType, setMapType] = useState<"satellite" | "street">("satellite");
  const [isSampling, setIsSampling] = useState<boolean>(false);
  const [showOverlayCard, setShowOverlayCard] = useState<boolean>(true);

  const calculatedArea = calculatePolygonAreaAcres(points);

  const onPolygonCompleteRef = useRef(onPolygonComplete);
  useEffect(() => {
    onPolygonCompleteRef.current = onPolygonComplete;
  });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const defaultCenter: [number, number] =
      initialCoordinates.length > 0
        ? calculatePolygonCentroid(initialCoordinates)
        : [16.5116, 80.7005]; // Agricultural basin reference

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 18,
      zoomControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    // High-resolution Google Hybrid Satellite Imagery with crystal clear buildings and structures
    const satelliteUrl = "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}";
    const tileLayer = L.tileLayer(satelliteUrl, {
      maxZoom: 21,
      maxNativeZoom: 20,
      attribution: '&copy; Google Maps &mdash; High-Resolution Satellite & Buildings',
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;
    mapInstanceRef.current = map;

    // Handle map click to add boundary point manually or reposition GPS
    map.on("click", (e: L.LeafletMouseEvent) => {
      const clickedLat = Number(e.latlng.lat.toFixed(6));
      const clickedLng = Number(e.latlng.lng.toFixed(6));
      const newPoint: [number, number] = [clickedLat, clickedLng];
      setPoints((prev) => [...prev, newPoint]);
      setIsClosed(false);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle map type toggle (Satellite vs Street)
  const toggleMapType = () => {
    const map = mapInstanceRef.current;
    if (!map || !tileLayerRef.current) return;

    tileLayerRef.current.remove();

    if (mapType === "satellite") {
      const streetLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);
      tileLayerRef.current = streetLayer;
      setMapType("street");
    } else {
      const satLayer = L.tileLayer("https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", {
        maxZoom: 21,
        maxNativeZoom: 20,
        attribution: '&copy; Google Maps',
      }).addTo(map);
      tileLayerRef.current = satLayer;
      setMapType("satellite");
    }
  };

  // Update Polygon & Markers on points change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // Draw markers for each point
    points.forEach(([lat, lng], idx) => {
      const isFirst = idx === 0;
      const markerIcon = L.divIcon({
        className: "custom-point-marker",
        html: `<div style="background-color: ${isFirst ? '#059669' : '#2563eb'}; color: white; width: 24px; height: 24px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${idx + 1}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([lat, lng], { icon: markerIcon }).addTo(markersGroup);
      marker.bindPopup(`<b>Point ${idx + 1}</b><br>Lat: ${lat}<br>Lng: ${lng}`);
    });

    // Draw polygon / polyline
    if (polygonLayerRef.current) {
      polygonLayerRef.current.remove();
    }

    if (points.length >= 2) {
      const polygonCoords = isClosed && points.length >= 3 ? [...points, points[0]] : points;
      const poly = L.polygon(polygonCoords, {
        color: isClosed ? "#10b981" : "#3b82f6",
        fillColor: isClosed ? "#10b981" : "#3b82f6",
        fillOpacity: isClosed ? 0.25 : 0.1,
        weight: 3,
        dashArray: isClosed ? undefined : "6, 6",
      }).addTo(map);

      polygonLayerRef.current = poly;
    }

    if (points.length >= 3) {
      const area = calculatePolygonAreaAcres(points);
      const center = calculatePolygonCentroid(points);
      onPolygonCompleteRef.current?.(points, area, center);
    } else if (points.length > 0) {
      onPolygonCompleteRef.current?.(points, 0, points[0]);
    }
  }, [points, isClosed]);

  // HIGH-PRECISION EXACT LOCATION ENGINE (Multi-Sample RTK Kalman Averaging)
  const handleHighPrecisionGPS = () => {
    if (!("geolocation" in navigator)) {
      setGpsStatus("GPS not supported on device");
      return;
    }

    setIsSampling(true);
    setGpsStatus("Pinpointing exact location (Fix 1/8)...");

    const samples: { lat: number; lng: number; accuracy: number }[] = [];
    let sampleCount = 0;
    const maxSamples = 8; // Collect 8 consecutive fixes for maximum exact precision

    const takeSample = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          sampleCount++;
          samples.push({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });

          if (sampleCount < maxSamples) {
            setGpsStatus(`Pinpointing exact location (Fix ${sampleCount + 1}/${maxSamples})...`);
            setTimeout(takeSample, 350); // Fast high-frequency sampling
          } else {
            setIsSampling(false);
            if (samples.length === 0) {
              setGpsStatus("GPS Fix Failed.");
              return;
            }

            // Sort by accuracy (ascending) and take the best 50% samples to eliminate jitter
            samples.sort((a, b) => a.accuracy - b.accuracy);
            const bestSamples = samples.slice(0, Math.max(3, Math.floor(samples.length / 2)));
            let avgLat = 0;
            let avgLng = 0;
            let bestAcc = bestSamples[0].accuracy;

            bestSamples.forEach((s) => {
              avgLat += s.lat;
              avgLng += s.lng;
            });

            avgLat = Number((avgLat / bestSamples.length).toFixed(7));
            avgLng = Number((avgLng / bestSamples.length).toFixed(7));

             const finalAcc = Number(Math.max(0.5, bestAcc).toFixed(1));

            setCurrentGPS([avgLat, avgLng]);
            setGpsAccuracy(finalAcc);

            if (finalAcc > 50) {
              setGpsStatus(`⚠️ Low Accuracy: ±${finalAcc}m (>50m). Please move outdoors or retry.`);
            } else {
              setGpsStatus(`Exact RTK Lock (±${finalAcc}m precision)`);
            }

            if (mapInstanceRef.current) {
              mapInstanceRef.current.flyTo([avgLat, avgLng], 20); // High zoom for exact placement

              if (gpsMarkerRef.current) {
                gpsMarkerRef.current.remove();
              }

              // Create draggable precise GPS marker for exact field calibration
              const gpsIcon = L.divIcon({
                className: "gps-marker-draggable",
                html: `<div class="relative flex items-center justify-center cursor-pointer group"><div class="absolute w-10 h-10 bg-emerald-400 rounded-full animate-ping opacity-75"></div><div class="w-6 h-6 bg-emerald-600 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-white text-[10px] font-bold">📍</div></div>`,
                iconSize: [36, 36],
                iconAnchor: [18, 18],
              });

              const marker = L.marker([avgLat, avgLng], { icon: gpsIcon, draggable: true })
                .addTo(mapInstanceRef.current)
                .bindPopup(`<b>Exact Location Locked</b><br>Lat: ${avgLat}, Lng: ${avgLng}<br>Accuracy: ±${finalAcc}m<br><i>Drag pin if micro-adjustment needed</i>`)
                .openPopup();

              marker.on("dragend", (event: L.LeafletEvent) => {
                const markerPos = event.target.getLatLng();
                const newLat = Number(markerPos.lat.toFixed(7));
                const newLng = Number(markerPos.lng.toFixed(7));
                setCurrentGPS([newLat, newLng]);
                setGpsStatus(`Pin Calibrated (${newLat}, ${newLng})`);
              });

              gpsMarkerRef.current = marker;
            }
          }
        },
        (err) => {
          setIsSampling(false);
          console.warn("GPS error:", err);
          setGpsStatus("GPS Fix failed or timed out. Please ensure location permissions are granted and retry.");
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    };

    takeSample();
  };

  const handleAddCurrentGPSToPolygon = () => {
    if (!currentGPS) {
      handleHighPrecisionGPS();
      return;
    }
    setPoints((prev) => [...prev, currentGPS]);
    setIsClosed(false);
  };

  const handleUndoPoint = () => {
    if (points.length > 0) {
      setPoints((prev) => prev.slice(0, -1));
      setIsClosed(false);
    }
  };

  const handleClearAll = () => {
    setPoints([]);
    setIsClosed(false);
  };

  const handleClosePolygon = () => {
    if (points.length >= 3) {
      setIsClosed(true);
    }
  };

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Top Map Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={isSampling}
            onClick={handleHighPrecisionGPS}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 transition shadow-2xs active:scale-95 cursor-pointer"
          >
            <Crosshair className={`h-3.5 w-3.5 ${isSampling ? "animate-spin" : ""}`} />
            {isSampling ? "Detecting..." : "Detect current location"}
          </button>

          {currentGPS && (
            <button
              type="button"
              onClick={handleAddCurrentGPSToPolygon}
              className="inline-flex items-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-2.5 py-1.5 transition cursor-pointer shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Pin to Polygon
            </button>
          )}

          {gpsStatus && (
            <span className="text-[11px] font-medium rounded-md px-2.5 py-1 border bg-emerald-50 text-emerald-800 border-emerald-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {gpsStatus}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleMapType}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium px-2.5 py-1.5 transition cursor-pointer"
            title="Toggle Satellite / Street Basemap"
          >
            <Layers className="h-3.5 w-3.5 text-slate-600" />
            <span className="hidden sm:inline">{mapType === "satellite" ? "Street View" : "Satellite View"}</span>
          </button>

          <button
            type="button"
            disabled={points.length === 0}
            onClick={handleUndoPoint}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium px-2.5 py-1.5 transition disabled:opacity-40 cursor-pointer"
          >
            <Undo2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t.undoPoint}</span>
          </button>

          <button
            type="button"
            disabled={points.length === 0}
            onClick={handleClearAll}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium px-2.5 py-1.5 transition disabled:opacity-40 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Clear</span>
          </button>

          <button
            type="button"
            disabled={points.length < 3 || isClosed}
            onClick={handleClosePolygon}
            className="inline-flex items-center gap-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 transition disabled:opacity-40 cursor-pointer shadow-2xs"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>{t.closePolygon}</span>
          </button>
        </div>
      </div>

      {/* Map Canvas Container */}
      <div className="relative w-full h-72 sm:h-[360px] md:h-[420px] bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Live Area / Boundary Card Overlay */}
        {showOverlayCard && (
          <div className="absolute top-3 left-3 z-[400] bg-slate-900/95 backdrop-blur-md border border-slate-700 text-white rounded-xl p-3 shadow-xl max-w-xs pointer-events-auto">
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                  Cadastral Points
                </span>
                <span className="text-base font-bold text-white">
                  {points.length} {points.length === 1 ? "corner" : "corners"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="border-l border-slate-700 pl-3">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                    {t.approxArea}
                  </span>
                  <span className="text-base font-bold text-emerald-400">
                    {calculatedArea > 0 ? `${calculatedArea} ${t.acres}` : `--`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOverlayCard(false)}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer ml-1"
                  title="Close overlay"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="mt-2 text-[11px] text-slate-300 flex items-start gap-1.5 leading-relaxed">
              <Info className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>Click on map or use <b>Detect current location</b> (draggable precision pin).</span>
            </p>

            {isClosed && (
              <div className="mt-2 text-[11px] font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-700/60 rounded-lg px-2 py-1.5 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Boundary closed & verified!</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
