import React from "react";
import { useApp } from "../../context/AppContext";
import {
  CloudRain,
  Wind,
  Thermometer,
  CloudLightning,
  CheckCircle2,
  Radio,
  AlertTriangle,
} from "lucide-react";
import {
  ResponsiveContainer,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Line,
  ComposedChart,
} from "recharts";

export const WeatherCorrelationPanel: React.FC = () => {
  const { weatherData, isWeatherLoading, fields, activeFieldId, disasterReports, t } = useApp();

  const activeField = fields.find((f) => f.id === activeFieldId) || fields[0];
  const activeDisaster = disasterReports.find((d) => d.fieldId === activeFieldId);

  if (!activeField || activeField.centerLat == null || activeField.centerLng == null) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-xs text-amber-800 shadow-2xs space-y-2">
        <AlertTriangle className="h-6 w-6 text-amber-600 mx-auto" />
        <p className="font-bold text-sm">{t["noFieldCoordinates"] || "Weather data unavailable: field location not registered."}</p>
        <p className="text-[11px] text-amber-700">{t["invalidFieldCoordinates"] || "Please register or select a valid field with geographic coordinates to view weather telemetry."}</p>
      </div>
    );
  }

  if (isWeatherLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-500 shadow-2xs space-y-2">
        <Radio className="h-5 w-5 animate-pulse text-emerald-600 mx-auto" />
        <p>{t["loadingWeather"] || "Fetching live weather data for"} <span className="font-semibold">{activeField.name}</span>...</p>
      </div>
    );
  }

  if (!weatherData || !weatherData.daily || weatherData.daily.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-500 shadow-2xs space-y-2">
        <AlertTriangle className="h-5 w-5 text-rose-500 mx-auto" />
        <p className="font-bold text-slate-800">{t["noWeatherData"] || "Weather data unavailable"}</p>
        <p className="text-slate-500">{t["weatherDataUnavailable"] || "Could not connect to weather service."} ({activeField.centerLat.toFixed(4)}°N, {activeField.centerLng.toFixed(4)}°E)</p>
      </div>
    );
  }

  const chartData = weatherData.daily;
  const summary = weatherData.correlationSummary;

  // Read directly from summary object (typed correctly with peakWindSpeedKmh & avgMaxTempC)
  const peakWindSpeedKmh = summary.peakWindSpeedKmh ?? 0;
  const avgMaxTempC = summary.avgMaxTempC ?? 0;

  // Correlation status label
  let correlationStatus = t["noDisasterReportFiled"] || "No disaster report filed";
  let correlationBadgeBg = "bg-slate-50 text-slate-800 border-slate-200";

  if (activeDisaster) {
    if (summary.extremeEventConfirmed) {
      correlationStatus = `${t["weatherCorrelationConfirmed"] || "Weather correlation: Confirmed"} (${activeDisaster.disasterType})`;
      correlationBadgeBg = "bg-emerald-50 text-emerald-900 border-emerald-200";
    } else {
      correlationStatus = t["weatherCorrelationUnconfirmed"] || "Weather correlation: Unconfirmed / Normal";
      correlationBadgeBg = "bg-amber-50 text-amber-900 border-amber-200";
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded inline-block mb-1">
            {t["openMeteoTelemetry"] || "Live Weather Data"} ({activeField.name})
          </span>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <CloudRain className="h-4 w-4 text-emerald-700" />
            {t["weatherTelemetry"] || "Weather & Rainfall Timeline"}
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {t["coordinatesLabel"] || "Location:"} {activeField.centerLat.toFixed(4)}°N, {activeField.centerLng.toFixed(4)}°E &bull; {t["fieldLabel"] || "Field:"} {activeField.name}
          </p>
        </div>

        {summary.extremeEventConfirmed ? (
          <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-rose-900">
            <CloudLightning className="h-3.5 w-3.5 text-rose-600 shrink-0" />
            {summary.eventLabel} ({summary.peakRainfallMm} mm)
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-emerald-900">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            {summary.eventLabel}
          </div>
        )}
      </div>

      {/* Weather Metrics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
          <div className="flex items-center gap-1 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
            <CloudRain className="h-3.5 w-3.5 text-blue-600" />
            {t["peakRainfall"] || "Peak Rainfall"}
          </div>
          <div className="text-lg font-bold text-slate-900 mt-0.5">
            {summary.peakRainfallMm} <span className="text-xs font-normal text-slate-500">mm</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {t["dateLabel"] || "Date:"} {summary.peakRainfallDate}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
          <div className="flex items-center gap-1 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
            <Wind className="h-3.5 w-3.5 text-cyan-600" />
            {t["peakWindGusts"] || "Peak Wind Gusts"}
          </div>
          <div className="text-lg font-bold text-slate-900 mt-0.5">
            {peakWindSpeedKmh} <span className="text-xs font-normal text-slate-500">km/h</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {t["maxTelemetryRecorded"] || "Max recorded"}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
          <div className="flex items-center gap-1 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
            <Thermometer className="h-3.5 w-3.5 text-amber-600" />
            {t["avgMaxTemp"] || "Avg Max Temp"}
          </div>
          <div className="text-lg font-bold text-slate-900 mt-0.5">
            {avgMaxTempC} <span className="text-xs font-normal text-slate-500">°C</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {t["monitoredWindowAverage"] || "Period average"}
          </div>
        </div>

        <div className={`rounded-lg border p-2.5 ${correlationBadgeBg}`}>
          <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider opacity-80">
            <Radio className="h-3.5 w-3.5" />
            {t["correlationStatus"] || "Correlation Status"}
          </div>
          <div className="text-xs font-bold mt-1">
            {correlationStatus}
          </div>
          <div className="text-[10px] opacity-75 mt-0.5 truncate">
            {activeDisaster ? `${t["disasterLabel"] || "Disaster:"} ${activeDisaster.disasterType} (${activeDisaster.date})` : (t["noDisasterClaim"] || "No disaster claim logged")}
          </div>
        </div>
      </div>

      {/* Recharts Precipitation & Wind Timeline */}
      <div>
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
          <span>{t["rainfallWindTimeline"] || "Daily Rainfall & Wind Speed Timeline"}</span>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 bg-blue-500 rounded-xs inline-block"></span> {t["rainfallLabel"] || "Rainfall (mm)"}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 bg-cyan-600 rounded-full inline-block"></span> {t["windLabel"] || "Wind (km/h)"}
            </span>
          </div>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => (d ? d.split("-").slice(1).join("/") : "")}
                tick={{ fontSize: 10, fill: "#64748b" }}
              />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#64748b" }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#64748b" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "11px",
                }}
                formatter={(val: any, name: string) => [
                  `${val} ${name === "Rainfall" ? "mm" : name === "Wind Speed" ? "km/h" : "°C"}`,
                  name,
                ]}
              />
              <Bar
                yAxisId="left"
                dataKey="rainfallMm"
                name="Rainfall"
                fill="#3b82f6"
                radius={[3, 3, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="windSpeedKmh"
                name="Wind Speed"
                stroke="#0891b2"
                strokeWidth={1.5}
                dot={{ r: 2.5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Correlation Statement Callout */}
      <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-3">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-950 leading-relaxed">
            <span className="font-bold">{t["meteorologicalEvidence"] || "Weather Evidence:"} </span>
            {summary.correlationStatement || (t["telemetryRetrieved"] || "Live weather data retrieved successfully.")}
          </div>
        </div>
      </div>
    </div>
  );
};
