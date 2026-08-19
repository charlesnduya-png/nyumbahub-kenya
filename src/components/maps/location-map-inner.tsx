"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import {
  centerForCounty,
  hasValidCoordinates,
} from "@/lib/map-locations";

export interface MapCoordinates {
  latitude: number | null;
  longitude: number | null;
}

interface LocationMapInnerProps {
  mode: "pick" | "view";
  latitude?: number | null;
  longitude?: number | null;
  county?: string | null;
  town?: string | null;
  onChange?: (coords: MapCoordinates) => void;
  className?: string;
  heightClassName?: string;
}

function MapResizeFix() {
  const map = useMap();
  useEffect(() => {
    const t = window.setTimeout(() => map.invalidateSize(), 200);
    return () => window.clearTimeout(t);
  }, [map]);
  return null;
}

function FlyToCounty({
  county,
  enabled,
}: {
  county?: string | null;
  enabled: boolean;
}) {
  const map = useMap();
  useEffect(() => {
    if (!enabled) return;
    const { lat, lng, zoom } = centerForCounty(county);
    map.flyTo([lat, lng], zoom, { duration: 0.8 });
  }, [county, map, enabled]);
  return null;
}

function FlyToPin({
  latitude,
  longitude,
  enabled,
}: {
  latitude?: number | null;
  longitude?: number | null;
  enabled: boolean;
}) {
  const map = useMap();
  useEffect(() => {
    if (!enabled || !hasValidCoordinates(latitude, longitude)) return;
    map.flyTo([latitude!, longitude!], 16, { duration: 0.7 });
  }, [latitude, longitude, map, enabled]);
  return null;
}

function MapClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const pinIcon = L.divIcon({
  className: "",
  html: `<div style="width:28px;height:28px;background:#0b6e4f;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 12px rgba(0,0,0,0.35);"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

export function LocationMapInner({
  mode,
  latitude,
  longitude,
  county,
  town: _town,
  onChange,
  className,
  heightClassName = "h-[280px] sm:h-[320px]",
}: LocationMapInnerProps) {
  const markerRef = useRef<L.Marker>(null);
  const pinned = hasValidCoordinates(latitude, longitude);

  const initialCenter = useMemo(() => {
    if (pinned) {
      return { lat: latitude!, lng: longitude!, zoom: 15 };
    }
    return centerForCounty(county);
  }, [pinned, latitude, longitude, county]);

  function handlePick(lat: number, lng: number) {
    onChange?.({
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lng.toFixed(6)),
    });
  }

  return (
    <div
      className={`relative overflow-hidden rounded-xl border bg-muted ${heightClassName} ${className ?? ""}`}
    >
      <MapContainer
        center={[initialCenter.lat, initialCenter.lng]}
        zoom={initialCenter.zoom}
        scrollWheelZoom={mode === "pick"}
        className="h-full w-full z-0"
        attributionControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapResizeFix />
        {mode === "pick" ? (
          <>
            <FlyToCounty county={county} enabled={!pinned} />
            <FlyToPin
              latitude={latitude}
              longitude={longitude}
              enabled={pinned}
            />
            <MapClickHandler onPick={handlePick} />
          </>
        ) : null}
        {pinned ? (
          <Marker
            ref={markerRef}
            position={[latitude!, longitude!]}
            icon={pinIcon}
            draggable={mode === "pick"}
            eventHandlers={
              mode === "pick"
                ? {
                    dragend: () => {
                      const marker = markerRef.current;
                      if (!marker) return;
                      const pos = marker.getLatLng();
                      handlePick(pos.lat, pos.lng);
                    },
                  }
                : undefined
            }
          />
        ) : null}
      </MapContainer>
    </div>
  );
}
