"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import {
  MAP_CENTER,
  MAP_DEFAULT_ZOOM,
  MAP_TILE_ATTRIBUTION,
  MAP_TILE_URL,
} from "@/lib/geo/constants";
import "leaflet/dist/leaflet.css";

const pin = L.divIcon({
  className: "da-admin-pin",
  html: `<span style="display:block;width:18px;height:18px;border-radius:50% 50% 50% 0;background:#9C1C1C;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></span>`,
  iconSize: [18, 18],
  iconAnchor: [9, 18],
});

function ClickCatch({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], Math.max(map.getZoom(), 12));
  }, [lat, lng, map]);
  return null;
}

export default function CoordPickerInner({
  lat,
  lng,
  onPick,
}: {
  lat: number | null;
  lng: number | null;
  onPick: (lat: number, lng: number) => void;
}) {
  const center: [number, number] =
    lat != null && lng != null ? [lat, lng] : MAP_CENTER;
  return (
    <MapContainer
      center={center}
      zoom={lat != null ? 12 : MAP_DEFAULT_ZOOM}
      className="h-full w-full rounded-sm"
      scrollWheelZoom
    >
      <TileLayer attribution={MAP_TILE_ATTRIBUTION} url={MAP_TILE_URL} />
      <ClickCatch onPick={onPick} />
      {lat != null && lng != null && (
        <>
          <Marker position={[lat, lng]} icon={pin} />
          <Recenter lat={lat} lng={lng} />
        </>
      )}
    </MapContainer>
  );
}
