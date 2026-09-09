import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import {
  MapPin,
  ExternalLink,
  Layers,
  Search,
  Globe,
  Compass,
  FileText,
  ShieldCheck,
  Building2,
  Navigation,
  Database,
  Info,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Plane,
  Droplets,
  Landmark,
  Sparkles,
  Maximize2,
  ChevronRight,
  Eye,
  Crosshair,
  RefreshCw,
  Plus,
  Ruler,
  Scale,
  FileCheck2,
  BookOpen,
  SlidersHorizontal,
  Trash2,
  HelpCircle,
  Check
} from 'lucide-react';
import {
  UP_DEVELOPMENT_AUTHORITIES,
  STATUTORY_GIS_ZONING_FEATURES,
  STATUTORY_BUFFER_ENVELOPES,
  BASEMAP_PROVIDERS,
  GISAuthority,
  GISZoningFeature,
  GISBufferEnvelope,
  BasemapProvider,
  auditCoordinatesSpatialCompliance,
  SpatialAuditResult,
  calculateDistanceKm
} from '../data/upGisMasterPlanData';
import { useToast } from '../context/ToastContext';
import { BhuvanGeocodingSearch, GeocodedLocation } from './BhuvanGeocodingSearch';
import { CustomGisConnectorModal } from './CustomGisConnectorModal';
import { SpatialDossierModal } from './gis/SpatialDossierModal';
import { GisValueGuideModal } from './gis/GisValueGuideModal';

// Geodesic Spherical Polygon Area in Square Meters (WGS84)
export function calculatePolygonAreaSqMeters(coords: [number, number][]): number {
  if (coords.length < 3) return 0;
  const R = 6378137; // Earth's radius in meters
  let area = 0;
  for (let i = 0; i < coords.length; i++) {
    const p1 = coords[i];
    const p2 = coords[(i + 1) % coords.length];
    const p1LatRad = (p1[0] * Math.PI) / 180;
    const p2LatRad = (p2[0] * Math.PI) / 180;
    const p1LngRad = (p1[1] * Math.PI) / 180;
    const p2LngRad = (p2[1] * Math.PI) / 180;
    area += (p2LngRad - p1LngRad) * (2 + Math.sin(p1LatRad) + Math.sin(p2LatRad));
  }
  return Math.abs((area * R * R) / 2);
}

export const MapServerExplorer: React.FC = () => {
  const toast = useToast();

  // State
  const [selectedAuthority, setSelectedAuthority] = useState<GISAuthority>(UP_DEVELOPMENT_AUTHORITIES[1]); // Default Lucknow
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBasemapId, setActiveBasemapId] = useState<string>('carto_positron');
  const [customProviders, setCustomProviders] = useState<BasemapProvider[]>([]);
  const [isConnectorModalOpen, setIsConnectorModalOpen] = useState<boolean>(false);
  const [isDossierOpen, setIsDossierOpen] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [selectedZoningFeature, setSelectedZoningFeature] = useState<GISZoningFeature | null>(
    STATUTORY_GIS_ZONING_FEATURES[0]
  );
  const [spatialAudit, setSpatialAudit] = useState<SpatialAuditResult | null>(null);
  const [isAuditingPoint, setIsAuditingPoint] = useState(false);
  const [searchLocationQuery, setSearchLocationQuery] = useState('');

  // GIS Engine Modes: 'inspect' | 'distance' | 'area'
  const [toolMode, setToolMode] = useState<'inspect' | 'distance' | 'area'>('inspect');
  const toolModeRef = useRef<'inspect' | 'distance' | 'area'>('inspect');
  const [layerOpacity, setLayerOpacity] = useState<number>(0.35);

  // Measurement State
  const [distancePoints, setDistancePoints] = useState<[number, number][]>([]);
  const [areaPoints, setAreaPoints] = useState<[number, number][]>([]);

  // Combined official + custom GIS providers
  const allBasemapProviders = useMemo(
    () => [...BASEMAP_PROVIDERS, ...customProviders],
    [customProviders]
  );

  // Layer Toggles
  const [layerVisibility, setLayerVisibility] = useState({
    authorities: true,
    residential: true,
    commercial: true,
    industrial: true,
    tod: true,
    green: true,
    heritage: true,
    riverBuffers: true,
    aviationFunnels: true,
  });

  // Leaflet References
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const authorityMarkersRef = useRef<{ [code: number]: L.Marker }>({});
  const zoningLayersRef = useRef<{ [id: string]: L.Polygon }>({});
  const bufferLayersRef = useRef<{ [id: string]: L.Polygon }>({});
  const auditMarkerRef = useRef<L.Marker | null>(null);
  const measurementPolylineRef = useRef<L.Polyline | null>(null);
  const measurementPolygonRef = useRef<L.Polygon | null>(null);
  const measurementMarkersRef = useRef<L.CircleMarker[]>([]);
  const prevAuthorityCodeRef = useRef<number | null>(null);

  // Filtered Authorities for left sidebar
  const filteredAuthorities = UP_DEVELOPMENT_AUTHORITIES.filter(
    (auth) =>
      auth.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      auth.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
      auth.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      auth.district.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sync toolMode ref
  useEffect(() => {
    toolModeRef.current = toolMode;
  }, [toolMode]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Custom Apple-style Marker Icon
    const customIcon = L.divIcon({
      className: 'custom-apple-marker',
      html: `
        <div style="
          width: 28px;
          height: 28px;
          background: #0f172a;
          border: 2px solid #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          color: #10b981;
          cursor: pointer;
          transition: transform 0.2s ease;
        ">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      popupAnchor: [0, -28],
    });

    const safeInitLat = (selectedAuthority && !isNaN(selectedAuthority.lat) && isFinite(selectedAuthority.lat)) ? selectedAuthority.lat : 26.8467;
    const safeInitLng = (selectedAuthority && !isNaN(selectedAuthority.lng) && isFinite(selectedAuthority.lng)) ? selectedAuthority.lng : 80.9462;

    const map = L.map(mapContainerRef.current, {
      center: [safeInitLat, safeInitLng],
      zoom: selectedAuthority?.zoom || 11,
      scrollWheelZoom: true,
      zoomControl: false,
    });

    // Sleek Zoom Controls top-left
    L.control.zoom({ position: 'topleft' }).addTo(map);

    // Initial Base Tile Layer
    const initialBasemap = BASEMAP_PROVIDERS.find((b) => b.id === activeBasemapId) || BASEMAP_PROVIDERS[0];
    const tileLayer = L.tileLayer(initialBasemap.url, {
      attribution: initialBasemap.attribution,
      maxZoom: initialBasemap.maxZoom || 19,
      subdomains: initialBasemap.subdomains || 'abc',
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    mapInstanceRef.current = map;

    // Populate Authority Markers
    UP_DEVELOPMENT_AUTHORITIES.forEach((auth) => {
      if (typeof auth.lat !== 'number' || typeof auth.lng !== 'number' || isNaN(auth.lat) || isNaN(auth.lng) || !isFinite(auth.lat) || !isFinite(auth.lng)) {
        return;
      }
      const marker = L.marker([auth.lat, auth.lng], { icon: customIcon }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: -apple-system, sans-serif; min-width: 220px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; background: #ecfdf5; color: #047857; padding: 2px 8px; border-radius: 9999px;">
              Notified Master Plan
            </span>
            <span style="font-size: 10px; color: #64748b; font-family: monospace;">#${auth.code}</span>
          </div>
          <h4 style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0;">${auth.name}</h4>
          <p style="font-size: 11px; color: #64748b; margin: 0 0 6px 0;">${auth.region}</p>
          <div style="font-size: 11px; background: #f8fafc; padding: 6px 8px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 8px;">
            <div><strong>Horizon:</strong> ${auth.masterPlanHorizon}</div>
            <div><strong>Area:</strong> ${auth.planningAreaSqKm} sq. km</div>
            <div><strong>Portal:</strong> ${auth.portalName}</div>
          </div>
          <a href="${auth.gisServerUrl}" target="_blank" rel="noreferrer" style="display: block; text-align: center; font-size: 11px; font-weight: 600; color: #ffffff; background: #10b981; padding: 6px 12px; border-radius: 8px; text-decoration: none;">
            Launch Authority Geoportal &rarr;
          </a>
        </div>
      `);

      marker.on('click', () => {
        setSelectedAuthority(auth);
      });

      authorityMarkersRef.current[auth.code] = marker;
    });

    // Map Click Listener for Click-to-Audit or Measurement with strict coordinate validation
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (!e || !e.latlng) return;
      const cLat = Number(e.latlng.lat);
      const cLng = Number(e.latlng.lng);
      if (isNaN(cLat) || isNaN(cLng) || !isFinite(cLat) || !isFinite(cLng)) return;

      const currentMode = toolModeRef.current;
      if (currentMode === 'inspect') {
        handleMapClickAudit(cLat, cLng);
      } else if (currentMode === 'distance') {
        setDistancePoints((prev) => [...prev, [cLat, cLng]]);
      } else if (currentMode === 'area') {
        setAreaPoints((prev) => [...prev, [cLat, cLng]]);
      }
    });

    // Ensure map tiles properly layout on resize/container layout shifts
    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      try {
        map.remove();
      } catch (err) {
        console.warn('Error removing map instance:', err);
      }
      mapInstanceRef.current = null;
      authorityMarkersRef.current = {};
      zoningLayersRef.current = {};
      bufferLayersRef.current = {};
      auditMarkerRef.current = null;
      measurementPolylineRef.current = null;
      measurementPolygonRef.current = null;
      measurementMarkersRef.current = [];
      prevAuthorityCodeRef.current = null;
    };
  }, []);

  // Update Basemap Tiles
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(tileLayerRef.current);

    const basemap = allBasemapProviders.find((b) => b.id === activeBasemapId) || allBasemapProviders[0];
    const newLayer = L.tileLayer(basemap.url, {
      attribution: basemap.attribution,
      maxZoom: basemap.maxZoom || 19,
      subdomains: basemap.subdomains || 'abc',
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newLayer;
  }, [activeBasemapId, allBasemapProviders]);

  // Render & Update Statutory Zoning Polygons with dynamic opacity
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old zoning layers
    Object.values(zoningLayersRef.current).forEach((p) => map.removeLayer(p));
    zoningLayersRef.current = {};

    STATUTORY_GIS_ZONING_FEATURES.forEach((feat) => {
      // Check visibility filter
      const isVisible =
        (feat.category === 'residential' && layerVisibility.residential) ||
        (feat.category === 'commercial' && layerVisibility.commercial) ||
        (feat.category === 'industrial' && layerVisibility.industrial) ||
        (feat.category === 'tod' && layerVisibility.tod) ||
        (feat.category === 'green' && layerVisibility.green) ||
        (feat.category === 'heritage' && layerVisibility.heritage);

      if (!isVisible) return;

      if (!Array.isArray(feat.polygon) || feat.polygon.length < 3) return;
      const validPoints = feat.polygon.filter(
        (p): p is [number, number] =>
          Array.isArray(p) &&
          p.length >= 2 &&
          typeof p[0] === 'number' &&
          typeof p[1] === 'number' &&
          !isNaN(p[0]) &&
          !isNaN(p[1]) &&
          isFinite(p[0]) &&
          isFinite(p[1])
      );
      if (validPoints.length < 3) return;

      const polygon = L.polygon(validPoints, {
        color: feat.color,
        fillColor: feat.fillColor,
        fillOpacity: layerOpacity,
        weight: 2,
        dashArray: feat.dashArray,
      }).addTo(map);

      polygon.bindPopup(`
        <div style="font-family: -apple-system, sans-serif; min-width: 220px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: ${feat.color};">
              ${feat.authorityShort} • ${feat.zoneCode}
            </span>
            <span style="font-size: 10px; color: #64748b; font-weight: 600;">${feat.standardizedChapter15Zone}</span>
          </div>
          <h4 style="font-size: 13px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0;">${feat.name}</h4>
          <div style="font-size: 11px; background: #f8fafc; padding: 6px 8px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 6px; line-height: 1.5;">
            <div><strong>Permissible FAR:</strong> ${feat.permittedFAR}</div>
            <div><strong>Purchasable FAR:</strong> ${feat.purchasableFARCap}</div>
            <div><strong>Max Ground Coverage:</strong> ${feat.maxGroundCoverage}</div>
            <div><strong>Min Access Road:</strong> ${feat.minRoadWidth}</div>
          </div>
          <p style="font-size: 11px; color: #475569; margin: 0 0 6px 0; line-height: 1.4;">${feat.description}</p>
          <div style="font-size: 10px; color: #0284c7; font-weight: 600;">Statutory Ref: ${feat.byelawReference}</div>
        </div>
      `);

      polygon.on('click', () => {
        setSelectedZoningFeature(feat);
      });

      zoningLayersRef.current[feat.id] = polygon;
    });
  }, [layerVisibility, layerOpacity]);

  // Render & Update Buffer Envelopes (River 200m Buffers, Airport Funnels, TTZ)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old buffer layers
    Object.values(bufferLayersRef.current).forEach((p) => map.removeLayer(p));
    bufferLayersRef.current = {};

    STATUTORY_BUFFER_ENVELOPES.forEach((buf) => {
      const isVisible =
        (buf.type === 'river_buffer' && layerVisibility.riverBuffers) ||
        (buf.type === 'aviation_funnel' && layerVisibility.aviationFunnels) ||
        (buf.type === 'ttz_ring' && layerVisibility.heritage) ||
        (buf.type === 'tod_corridor' && layerVisibility.tod);

      if (!isVisible) return;

      if (!Array.isArray(buf.polygon) || buf.polygon.length < 3) return;
      const validPoints = buf.polygon.filter(
        (p): p is [number, number] =>
          Array.isArray(p) &&
          p.length >= 2 &&
          typeof p[0] === 'number' &&
          typeof p[1] === 'number' &&
          !isNaN(p[0]) &&
          !isNaN(p[1]) &&
          isFinite(p[0]) &&
          isFinite(p[1])
      );
      if (validPoints.length < 3) return;

      const polygon = L.polygon(validPoints, {
        color: buf.color,
        fillColor: buf.fillColor,
        fillOpacity: buf.severity === 'strictly_prohibited' ? Math.min(layerOpacity * 1.3, 0.7) : layerOpacity * 0.8,
        weight: 2.5,
        dashArray: buf.severity === 'strictly_prohibited' ? '4, 4' : undefined,
      }).addTo(map);

      polygon.bindPopup(`
        <div style="font-family: -apple-system, sans-serif; min-width: 240px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; background: ${
              buf.severity === 'strictly_prohibited' ? '#fee2e2; color: #b91c1c;' : '#fef3c7; color: #b45309;'
            } padding: 2px 8px; border-radius: 9999px;">
              ${buf.severity === 'strictly_prohibited' ? 'PROHIBITED BUFFER' : 'REGULATED ENVELOPE'}
            </span>
            <span style="font-size: 10px; color: #64748b;">${buf.authority}</span>
          </div>
          <h4 style="font-size: 13px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0;">${buf.name}</h4>
          <p style="font-size: 11px; color: #334155; margin: 0 0 6px 0; line-height: 1.4;">${buf.impactSummary}</p>
          <div style="font-size: 10px; color: #64748b; font-weight: 600;">Mandate: ${buf.ruleReference}</div>
        </div>
      `);

      bufferLayersRef.current[buf.id] = polygon;
    });
  }, [layerVisibility, layerOpacity]);

  // Distance Measurement Polyline Rendering
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (measurementPolylineRef.current) {
      map.removeLayer(measurementPolylineRef.current);
      measurementPolylineRef.current = null;
    }
    if (toolMode !== 'area') {
      measurementMarkersRef.current.forEach((m) => map.removeLayer(m));
      measurementMarkersRef.current = [];
    }

    if (toolMode === 'distance' && distancePoints.length > 0) {
      const polyline = L.polyline(distancePoints, {
        color: '#0284c7',
        weight: 3.5,
        dashArray: '6, 6',
      }).addTo(map);
      measurementPolylineRef.current = polyline;

      distancePoints.forEach(([lat, lng], idx) => {
        const marker = L.circleMarker([lat, lng], {
          radius: 5,
          color: '#ffffff',
          fillColor: '#0284c7',
          fillOpacity: 1,
          weight: 2,
        }).addTo(map);
        marker.bindTooltip(`P${idx + 1}`, { permanent: false });
        measurementMarkersRef.current.push(marker);
      });
    }
  }, [distancePoints, toolMode]);

  // Area Measurement Polygon Rendering
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (measurementPolygonRef.current) {
      map.removeLayer(measurementPolygonRef.current);
      measurementPolygonRef.current = null;
    }
    if (toolMode !== 'distance') {
      measurementMarkersRef.current.forEach((m) => map.removeLayer(m));
      measurementMarkersRef.current = [];
    }

    if (toolMode === 'area' && areaPoints.length > 0) {
      if (areaPoints.length >= 3) {
        const polygon = L.polygon(areaPoints, {
          color: '#059669',
          fillColor: '#10b981',
          fillOpacity: 0.35,
          weight: 2.5,
          dashArray: '4, 4',
        }).addTo(map);
        measurementPolygonRef.current = polygon;
      }

      areaPoints.forEach(([lat, lng], idx) => {
        const marker = L.circleMarker([lat, lng], {
          radius: 5,
          color: '#ffffff',
          fillColor: '#059669',
          fillOpacity: 1,
          weight: 2,
        }).addTo(map);
        marker.bindTooltip(`V${idx + 1}`, { permanent: false });
        measurementMarkersRef.current.push(marker);
      });
    }
  }, [areaPoints, toolMode]);

  // Mode Switcher Helper
  const handleSetToolMode = (mode: 'inspect' | 'distance' | 'area') => {
    setToolMode(mode);
    toolModeRef.current = mode;
    const map = mapInstanceRef.current;
    if (map) {
      if (measurementPolylineRef.current) {
        map.removeLayer(measurementPolylineRef.current);
        measurementPolylineRef.current = null;
      }
      if (measurementPolygonRef.current) {
        map.removeLayer(measurementPolygonRef.current);
        measurementPolygonRef.current = null;
      }
      measurementMarkersRef.current.forEach((m) => map.removeLayer(m));
      measurementMarkersRef.current = [];
    }
    setDistancePoints([]);
    setAreaPoints([]);
  };

  // Safe map navigation avoiding Leaflet's flyTo NaN crash on 0-sized containers or identical coordinates
  const safeNavigateMap = (
    lat: number,
    lng: number,
    zoom?: number,
    options?: { animate?: boolean; duration?: number }
  ) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const validLat = Number(lat);
    const validLng = Number(lng);
    if (isNaN(validLat) || isNaN(validLng) || !isFinite(validLat) || !isFinite(validLng)) {
      return;
    }

    const targetZoom = typeof zoom === 'number' && !isNaN(zoom) && isFinite(zoom) ? zoom : (map.getZoom() || 12);

    // If map container is not yet measured or has 0 size, fall back safely to setView
    let size: L.Point | null = null;
    try {
      size = map.getSize();
    } catch {
      size = null;
    }

    if (!size || size.x <= 0 || size.y <= 0) {
      try {
        map.setView([validLat, validLng], targetZoom);
      } catch (err) {
        console.warn('safeNavigateMap setView fallback error:', err);
      }
      return;
    }

    // If already at or very close to target coordinates and zoom, no need to re-fly
    try {
      const center = map.getCenter();
      if (
        center &&
        Math.abs(center.lat - validLat) < 0.0001 &&
        Math.abs(center.lng - validLng) < 0.0001 &&
        map.getZoom() === targetZoom
      ) {
        return;
      }
    } catch {}

    try {
      map.flyTo([validLat, validLng], targetZoom, {
        duration: options?.duration ?? 1.2,
        easeLinearity: 0.25,
        animate: options?.animate !== false,
      });
    } catch (err) {
      console.warn('flyTo failed, using setView fallback:', err);
      try {
        map.setView([validLat, validLng], targetZoom);
      } catch {}
    }
  };

  // Pan / Navigate on Authority Change
  useEffect(() => {
    if (!selectedAuthority || !mapInstanceRef.current) return;
    const aLat = Number(selectedAuthority.lat);
    const aLng = Number(selectedAuthority.lng);
    if (isNaN(aLat) || isNaN(aLng) || !isFinite(aLat) || !isFinite(aLng)) return;

    // Skip on initial mount to avoid flyTo before container layout has computed
    if (prevAuthorityCodeRef.current === null) {
      prevAuthorityCodeRef.current = selectedAuthority.code;
      return;
    }

    if (prevAuthorityCodeRef.current === selectedAuthority.code) {
      return;
    }
    prevAuthorityCodeRef.current = selectedAuthority.code;

    safeNavigateMap(aLat, aLng, selectedAuthority.zoom || 11, { duration: 1.2 });

    const marker = authorityMarkersRef.current[selectedAuthority.code];
    if (marker) {
      try {
        marker.openPopup();
      } catch {}
    }
  }, [selectedAuthority]);

  // Click-to-Audit Logic
  const handleMapClickAudit = (lat: number, lng: number) => {
    const validLat = Number(lat);
    const validLng = Number(lng);
    if (isNaN(validLat) || isNaN(validLng) || !isFinite(validLat) || !isFinite(validLng)) {
      console.warn('Coordinates rejected by handleMapClickAudit:', lat, lng);
      return;
    }

    const audit = auditCoordinatesSpatialCompliance(validLat, validLng);
    setSpatialAudit(audit);

    const map = mapInstanceRef.current;
    if (!map) return;

    if (auditMarkerRef.current) {
      try {
        map.removeLayer(auditMarkerRef.current);
      } catch {}
    }

    // Pin marker for audited coordinate
    const auditIcon = L.divIcon({
      className: 'apple-audit-pin',
      html: `
        <div style="
          width: 32px;
          height: 32px;
          background: ${audit.isProhibitedZone ? '#ef4444' : '#0071e3'};
          border: 3px solid #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 18px rgba(0,0,0,0.3);
          color: #ffffff;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="4"/>
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
          </svg>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    try {
      const marker = L.marker([validLat, validLng], { icon: auditIcon }).addTo(map);
      auditMarkerRef.current = marker;
    } catch (err) {
      console.warn('Failed to place audit marker:', err);
    }

    toast.info(
      'Point Audited',
      `Audited ${validLat.toFixed(4)}° N, ${validLng.toFixed(4)}° E near ${audit.nearestAuthority.shortName}.`
    );
  };

  // Landmark Search / Fly-To
  const handleLandmarkSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchLocationQuery.trim()) return;

    const query = searchLocationQuery.trim().toLowerCase();

    // Check if user input direct coordinates: e.g. "26.8467, 80.9462" or "26.8467 80.9462"
    const coordMatch = query.match(/^([+-]?\d+(?:\.\d+)?)[,\s]+([+-]?\d+(?:\.\d+)?)$/);
    if (coordMatch) {
      const parsedLat = parseFloat(coordMatch[1]);
      const parsedLng = parseFloat(coordMatch[2]);
      if (!isNaN(parsedLat) && !isNaN(parsedLng) && isFinite(parsedLat) && isFinite(parsedLng)) {
        safeNavigateMap(parsedLat, parsedLng, 14, { duration: 1.4 });
        handleMapClickAudit(parsedLat, parsedLng);
        toast.success('Coordinates Audited', `Audited plot at ${parsedLat.toFixed(4)}° N, ${parsedLng.toFixed(4)}° E.`);
        return;
      }
    }

    // Check matching feature or authority
    const matchedAuth = UP_DEVELOPMENT_AUTHORITIES.find(
      (a) =>
        a.shortName.toLowerCase().includes(query) ||
        a.name.toLowerCase().includes(query) ||
        a.district.toLowerCase().includes(query)
    );

    const matchedZoning = STATUTORY_GIS_ZONING_FEATURES.find(
      (z) => z.name.toLowerCase().includes(query) || z.description.toLowerCase().includes(query)
    );

    if (
      matchedZoning &&
      Array.isArray(matchedZoning.center) &&
      !isNaN(matchedZoning.center[0]) &&
      !isNaN(matchedZoning.center[1]) &&
      isFinite(matchedZoning.center[0]) &&
      isFinite(matchedZoning.center[1])
    ) {
      setSelectedZoningFeature(matchedZoning);
      safeNavigateMap(matchedZoning.center[0], matchedZoning.center[1], 14, { duration: 1.4 });
      handleMapClickAudit(matchedZoning.center[0], matchedZoning.center[1]);
      toast.success('Landmark Located', `Centered on ${matchedZoning.name}.`);
    } else if (matchedAuth && !isNaN(matchedAuth.lat) && !isNaN(matchedAuth.lng) && isFinite(matchedAuth.lat) && isFinite(matchedAuth.lng)) {
      setSelectedAuthority(matchedAuth);
      handleMapClickAudit(matchedAuth.lat, matchedAuth.lng);
      toast.success('Authority Located', `Navigated to ${matchedAuth.name}.`);
    } else {
      toast.warning('Not Found in Cache', 'Searching near State Capital (Lucknow)...');
      safeNavigateMap(26.8467, 80.9462, 11, { duration: 1 });
    }
  };

  // Handle Real-Time Bhuvan Geocoding Location Selection
  const handleBhuvanLocationSelect = (loc: GeocodedLocation) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const lat = Number(loc.lat);
    const lng = Number(loc.lng);
    if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
      toast.error('Invalid Coordinates', 'Location coordinates could not be resolved.');
      return;
    }

    safeNavigateMap(lat, lng, loc.zoom || 13, { duration: 1.4 });

    if (loc.authorityName) {
      const auth = UP_DEVELOPMENT_AUTHORITIES.find(
        (a) => a.name === loc.authorityName || a.shortName === loc.authorityName
      );
      if (auth) setSelectedAuthority(auth);
    }

    if (loc.polygon) {
      const feat = STATUTORY_GIS_ZONING_FEATURES.find((f) => f.id === loc.id);
      if (feat) setSelectedZoningFeature(feat);
    }

    handleMapClickAudit(lat, lng);
    toast.success('Bhuvan Geocoder Match', `Zoomed to ${loc.title} (${loc.source}).`);
  };

  // Strategic Urban Corridors Quick Jump
  const STRATEGIC_CORRIDORS = [
    { name: 'Lucknow Gomti Extn', lat: 26.837, lng: 81.012, zoom: 14, tag: 'Residential' },
    { name: 'Shaheed Path TOD', lat: 26.825, lng: 80.985, zoom: 14, tag: '4.0 FAR' },
    { name: 'Noida Sec 62 IT Enclave', lat: 28.625, lng: 77.365, zoom: 14, tag: 'Tech Hub' },
    { name: 'Jewar Aerotropolis OLS', lat: 28.185, lng: 77.580, zoom: 13, tag: 'Airport CCZM' },
    { name: 'Varanasi Ganga Ghats', lat: 25.308, lng: 83.016, zoom: 15, tag: '200m River Buffer' },
    { name: 'Ayodhya Heritage Core', lat: 26.798, lng: 82.205, zoom: 15, tag: 'ASI & Saryu Ring' },
    { name: 'Delhi-Meerut Namo Bharat', lat: 28.850, lng: 77.600, zoom: 14, tag: 'RRTS TOD' },
    { name: 'Agra TTZ Monument Ring', lat: 27.175, lng: 78.042, zoom: 14, tag: 'Supreme Court TTZ' },
    { name: 'Prayagraj Triveni Sangam', lat: 25.428, lng: 81.885, zoom: 14, tag: 'Kumbh Eco-Belt' },
  ];

  const handleCorridorJump = (c: typeof STRATEGIC_CORRIDORS[0]) => {
    safeNavigateMap(c.lat, c.lng, c.zoom, { duration: 1.4 });
    handleMapClickAudit(c.lat, c.lng);
    toast.info('Corridor Located', `Navigated to ${c.name} (${c.tag}).`);
  };

  // Measurement Calculations
  const totalDistanceMeters = useMemo(() => {
    if (distancePoints.length < 2) return 0;
    let sum = 0;
    for (let i = 0; i < distancePoints.length - 1; i++) {
      sum +=
        calculateDistanceKm(
          distancePoints[i][0],
          distancePoints[i][1],
          distancePoints[i + 1][0],
          distancePoints[i + 1][1]
        ) * 1000;
    }
    return sum;
  }, [distancePoints]);

  const measuredAreaSqM = useMemo(() => {
    if (areaPoints.length < 3) return 0;
    return calculatePolygonAreaSqMeters(areaPoints);
  }, [areaPoints]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Hero Banner */}
      <div className="apple-card p-6 sm:p-8 bg-gradient-to-b from-white to-slate-50/50 dark:from-[#161617] dark:to-[#111112]">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-3xl space-y-2">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                <Globe className="w-3.5 h-3.5" />
                <span>Statutory Master Plan 2031 & Geoportals</span>
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                ISRO Bhuvan • RSAC-UP • AMRUT
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Uttar Pradesh Spatial GIS & Urban Planning Geoportal
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Real-time spatial intelligence spanning all 22 Development Authorities of Uttar Pradesh. Seamlessly integrates ISRO Bhuvan satellite imagery, Remote Sensing Applications Centre (RSAC-UP) shapefiles, statutory Master Plan 2031 zoning polygons, River 200m prohibited eco-buffers (Section 2.11), and Transit-Oriented Development corridors.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-sm active:scale-95"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Why GIS Matters (Utility Guide)</span>
            </button>
            <a
              href="https://bhuvan-app1.nrsc.gov.in"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 text-xs font-semibold transition-all shadow-sm active:scale-95"
            >
              <span>ISRO Bhuvan Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Strategic Corridors Quick Jump */}
        <div className="mt-6 pt-4 border-t border-black/[0.06] dark:border-white/[0.08] space-y-2.5">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex-shrink-0 flex items-center gap-1">
              <Compass className="w-3 h-3" />
              <span>Strategic Corridors:</span>
            </span>
            {STRATEGIC_CORRIDORS.map((c, idx) => (
              <button
                key={idx}
                onClick={() => handleCorridorJump(c)}
                className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all active:scale-95 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 border border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 flex items-center gap-1.5"
              >
                <span>{c.name}</span>
                <span className="text-[10px] opacity-75 font-normal px-1 rounded bg-black/5 dark:bg-white/10">
                  {c.tag}
                </span>
              </button>
            ))}
          </div>

          {/* Authority Quick-Jump Pills */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex-shrink-0">
              Authorities:
            </span>
            {UP_DEVELOPMENT_AUTHORITIES.slice(0, 10).map((auth) => (
              <button
                key={auth.code}
                onClick={() => setSelectedAuthority(auth)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all active:scale-95 ${
                  selectedAuthority?.code === auth.code
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs font-semibold'
                    : 'bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
              >
                {auth.shortName}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Main Geoportal Workstation (Map + Sidebars) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Authority Directory & Spatial Search (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="apple-card p-4 flex flex-col h-[680px]">
            {/* Header & Search */}
            <div className="space-y-3 pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    22 Development Authorities
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400 font-semibold">
                  Notified 2031
                </span>
              </div>

              {/* Filter Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by city, region, or district..."
                  className="w-full bg-slate-100/80 dark:bg-white/[0.06] text-xs text-slate-900 dark:text-white placeholder-slate-400 pl-8 pr-3 py-2 rounded-xl border border-black/[0.06] dark:border-white/[0.08] focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* List of Authorities */}
            <div className="flex-1 overflow-y-auto space-y-1.5 py-2 pr-1">
              {filteredAuthorities.map((auth) => {
                const isSelected = selectedAuthority?.code === auth.code;
                return (
                  <button
                    key={auth.code}
                    onClick={() => setSelectedAuthority(auth)}
                    className={`w-full text-left p-3 rounded-xl text-xs transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/40 text-emerald-950 dark:text-emerald-100 shadow-xs'
                        : 'hover:bg-slate-100/80 dark:hover:bg-white/[0.05] border border-transparent text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {auth.code}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-semibold flex items-center justify-between">
                        <span className="truncate">{auth.name}</span>
                        <ChevronRight
                          className={`w-3.5 h-3.5 transition-transform ${
                            isSelected ? 'rotate-90 text-emerald-600' : 'text-slate-400'
                          }`}
                        />
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {auth.region}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className="text-[10px] bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-full">
                          {auth.masterPlanHorizon}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {auth.planningAreaSqKm} km²
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom Status */}
            <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Section 15 Master Plan Gazettes</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">100% Enforced</span>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive GIS Map & Spatial Intelligence (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Real-Time Bhuvan API Search & Spatial Geocoder */}
          <div className="apple-card p-3.5">
            <BhuvanGeocodingSearch onSelectLocation={handleBhuvanLocationSelect} />
          </div>

          {/* Top Control Bar: Basemap Selector & Landmark Search */}
          <div className="apple-card p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Basemap Switcher Segmented Control */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider pl-1 mr-1">
                Basemap:
              </span>
              {allBasemapProviders.map((base) => (
                <button
                  key={base.id}
                  onClick={() => setActiveBasemapId(base.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    activeBasemapId === base.id
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-semibold shadow-xs'
                      : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                  }`}
                >
                  {base.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setIsConnectorModalOpen(true)}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors whitespace-nowrap"
                title="Connect custom WMS, ISRO Bhuvan, Survey of India, or TileXYZ service"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Custom GIS API</span>
              </button>
            </div>

            {/* Quick Landmark Jump / Geocoder Form */}
            <form onSubmit={handleLandmarkSearch} className="relative flex items-center">
              <input
                type="text"
                value={searchLocationQuery}
                onChange={(e) => setSearchLocationQuery(e.target.value)}
                placeholder="Search sector, ghat, or monument..."
                className="w-full sm:w-56 bg-slate-100/80 dark:bg-white/[0.06] text-xs text-slate-900 dark:text-white placeholder-slate-400 pl-8 pr-3 py-1.5 rounded-full border border-black/[0.06] dark:border-white/[0.08] focus:outline-none focus:border-emerald-500"
              />
              <Crosshair className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            </form>
          </div>

          {/* Statutory Layer Toggles & Engine Controls Bar */}
          <div className="apple-card p-3 space-y-3">
            {/* Top Toolbar: Mode Switcher & Opacity Slider */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-black/[0.06] dark:border-white/[0.08]">
              {/* GIS Tool Modes */}
              <div className="flex items-center space-x-1.5 overflow-x-auto">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider pl-1 mr-1">
                  Tool:
                </span>
                <button
                  type="button"
                  onClick={() => handleSetToolMode('inspect')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center space-x-1.5 transition-all ${
                    toolMode === 'inspect'
                      ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                      : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                  }`}
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>Inspect & Audit (Pin)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetToolMode('distance')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center space-x-1.5 transition-all ${
                    toolMode === 'distance'
                      ? 'bg-sky-600 text-white font-semibold shadow-xs'
                      : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                  }`}
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span>Road & Corridor Ruler</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetToolMode('area')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center space-x-1.5 transition-all ${
                    toolMode === 'area'
                      ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                      : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Plot & FAR Simulator</span>
                </button>
              </div>

              {/* Vector Layer Opacity Slider */}
              <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="text-[11px] whitespace-nowrap">Fill Opacity:</span>
                <input
                  type="range"
                  min="0.15"
                  max="0.85"
                  step="0.05"
                  value={layerOpacity}
                  onChange={(e) => setLayerOpacity(parseFloat(e.target.value))}
                  className="w-20 sm:w-24 accent-emerald-600 cursor-pointer"
                />
                <span className="font-mono text-[11px] w-8">{Math.round(layerOpacity * 100)}%</span>
              </div>
            </div>

            {/* Layer Toggles */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-0.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider pl-1 flex items-center gap-1 flex-shrink-0">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>Layers:</span>
              </span>

              <button
                onClick={() =>
                  setLayerVisibility((p) => ({ ...p, residential: !p.residential }))
                }
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  layerVisibility.residential
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300'
                    : 'opacity-50 bg-slate-100 dark:bg-white/5 text-slate-400'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Residential (R-1/2)</span>
              </button>

              <button
                onClick={() =>
                  setLayerVisibility((p) => ({ ...p, commercial: !p.commercial }))
                }
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  layerVisibility.commercial
                    ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 border border-blue-300'
                    : 'opacity-50 bg-slate-100 dark:bg-white/5 text-slate-400'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span>Commercial (C-1/2)</span>
              </button>

              <button
                onClick={() =>
                  setLayerVisibility((p) => ({ ...p, tod: !p.tod }))
                }
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  layerVisibility.tod
                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border border-rose-300'
                    : 'opacity-50 bg-slate-100 dark:bg-white/5 text-slate-400'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-600" />
                <span>TOD Corridors</span>
              </button>

              <button
                onClick={() =>
                  setLayerVisibility((p) => ({ ...p, industrial: !p.industrial }))
                }
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  layerVisibility.industrial
                    ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 border border-purple-300'
                    : 'opacity-50 bg-slate-100 dark:bg-white/5 text-slate-400'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-purple-600" />
                <span>Industrial (I-1/2)</span>
              </button>

              <button
                onClick={() =>
                  setLayerVisibility((p) => ({ ...p, riverBuffers: !p.riverBuffers }))
                }
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  layerVisibility.riverBuffers
                    ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-900 dark:text-sky-200 border border-sky-300'
                    : 'opacity-50 bg-slate-100 dark:bg-white/5 text-slate-400'
                }`}
              >
                <Droplets className="w-3 h-3 text-sky-600" />
                <span>River 200m Buffers (Sec 2.11)</span>
              </button>

              <button
                onClick={() =>
                  setLayerVisibility((p) => ({ ...p, aviationFunnels: !p.aviationFunnels }))
                }
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  layerVisibility.aviationFunnels
                    ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 border border-indigo-300'
                    : 'opacity-50 bg-slate-100 dark:bg-white/5 text-slate-400'
                }`}
              >
                <Plane className="w-3 h-3 text-indigo-600" />
                <span>Aviation OLS</span>
              </button>
            </div>
          </div>

          {/* Leaflet Map Stage Container */}
          <div className="apple-card overflow-hidden h-[490px] relative">
            {/* Mode Instructions Pill */}
            <div className="absolute top-3 left-14 z-[999] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-black/[0.08] dark:border-white/[0.12] shadow-md flex items-center space-x-2 text-[11px] font-medium text-slate-700 dark:text-slate-200">
              <span
                className={`w-2 h-2 rounded-full ${
                  toolMode === 'distance'
                    ? 'bg-sky-500 animate-ping'
                    : toolMode === 'area'
                    ? 'bg-emerald-500 animate-ping'
                    : 'bg-emerald-500 animate-pulse'
                }`}
              />
              <span>
                {toolMode === 'inspect' && 'Click anywhere on map to audit plot compliance'}
                {toolMode === 'distance' && 'Click 2 or more points to measure road width / corridor distance'}
                {toolMode === 'area' && 'Click 3 or more plot corners to calculate area & permissible FAR'}
              </span>
            </div>

            {/* Distance Measurement Floating HUD */}
            {toolMode === 'distance' && (
              <div className="absolute top-14 left-4 z-[999] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl border border-sky-500/30 shadow-xl max-w-xs space-y-2.5 text-xs text-slate-800 dark:text-slate-200 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-1.5">
                  <span className="font-bold text-sky-700 dark:text-sky-400 flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5" />
                    <span>Road / Corridor Ruler</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {distancePoints.length} points
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-500 text-[11px]">Measured Distance:</span>
                    <strong className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                      {totalDistanceMeters >= 1000
                        ? `${(totalDistanceMeters / 1000).toFixed(2)} km`
                        : `${totalDistanceMeters.toFixed(1)} m`}
                    </strong>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex justify-between">
                    <span>Byelaw Road Width Class:</span>
                    <strong className="text-sky-600 dark:text-sky-400">
                      {totalDistanceMeters < 9
                        ? '< 9.0m (Sub-Standard)'
                        : totalDistanceMeters < 12
                        ? '9.0m - 12.0m (Local Access)'
                        : totalDistanceMeters < 18
                        ? '12.0m - 18.0m (Secondary Sector)'
                        : totalDistanceMeters < 24
                        ? '18.0m - 24.0m (Major Sector)'
                        : '24.0m+ (Arterial / TOD eligible)'}
                    </strong>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setDistancePoints([])}
                    className="flex-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetToolMode('inspect')}
                    className="flex-1 px-2.5 py-1 rounded-lg bg-sky-600 text-white hover:bg-sky-700 text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    <span>Done</span>
                  </button>
                </div>
              </div>
            )}

            {/* Area Measurement Floating HUD */}
            {toolMode === 'area' && (
              <div className="absolute top-14 left-4 z-[999] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl border border-emerald-500/30 shadow-xl max-w-sm space-y-2.5 text-xs text-slate-800 dark:text-slate-200 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-1.5">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5" />
                    <span>Plot Footprint & FAR Simulator</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {areaPoints.length} vertices
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center p-2 bg-slate-50 dark:bg-white/[0.03] rounded-xl border border-black/[0.04] dark:border-white/[0.06]">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Square Meters</span>
                    <strong className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                      {Math.round(measuredAreaSqM).toLocaleString()} m²
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Gaj (Sq. Yds)</span>
                    <strong className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {Math.round(measuredAreaSqM * 1.19599).toLocaleString()}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Acres</span>
                    <strong className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                      {(measuredAreaSqM / 4046.86).toFixed(3)}
                    </strong>
                  </div>
                </div>

                {/* Building Envelope Simulation */}
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Permissible Ground Coverage (60%):</span>
                    <strong className="text-slate-900 dark:text-white font-mono">
                      {Math.round(measuredAreaSqM * 0.6).toLocaleString()} m²
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Base Built-Up Area (Base FAR 1.75):</span>
                    <strong className="text-slate-900 dark:text-white font-mono">
                      {Math.round(measuredAreaSqM * 1.75).toLocaleString()} m²
                    </strong>
                  </div>
                  <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                    <span>Max Potential Area (TOD FAR 3.50):</span>
                    <strong className="font-mono">
                      {Math.round(measuredAreaSqM * 3.5).toLocaleString()} m²
                    </strong>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setAreaPoints([])}
                    className="flex-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetToolMode('inspect')}
                    className="flex-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    <span>Done</span>
                  </button>
                </div>
              </div>
            )}

            {/* Native Map Element */}
            <div ref={mapContainerRef} className="w-full h-full" />
          </div>

          {/* 3. Real-Time Click-to-Audit Spatial Compliance Drawer */}
          {spatialAudit && (
            <div className="apple-card p-5 space-y-4 border-2 border-emerald-500/30 animate-in slide-in-from-bottom-2 duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08] gap-3">
                <div className="flex items-center space-x-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-xs ${
                      spatialAudit.isProhibitedZone
                        ? 'bg-rose-600'
                        : spatialAudit.isTODZone
                        ? 'bg-indigo-600'
                        : 'bg-emerald-600'
                    }`}
                  >
                    <Crosshair className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                      <span>Spatial Audit: Plot at {spatialAudit.lat.toFixed(4)}° N, {spatialAudit.lng.toFixed(4)}° E</span>
                      {spatialAudit.isProhibitedZone && (
                        <span className="text-[10px] bg-rose-500 text-white font-bold px-2 py-0.5 rounded-full">
                          NON-PERMISSIBLE BUFFER
                        </span>
                      )}
                      {spatialAudit.isTODZone && (
                        <span className="text-[10px] bg-indigo-500 text-white font-bold px-2 py-0.5 rounded-full">
                          TOD BONUS ZONE
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Nearest Authority: <strong>{spatialAudit.nearestAuthority.name}</strong> ({spatialAudit.distanceToAuthorityCenterKm} km from center) • Elevation: ~{spatialAudit.elevationAmslMeters ?? spatialAudit.estimatedElevationAmsl}m AMSL
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsDossierOpen(true)}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-sm active:scale-95 whitespace-nowrap"
                  >
                    <FileCheck2 className="w-4 h-4" />
                    <span>Statutory Dossier Certificate</span>
                  </button>
                </div>
              </div>

              {/* Audit Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-white/[0.04] rounded-xl border border-black/[0.04] dark:border-white/[0.06]">
                  <span className="text-slate-400 text-[11px] block">Permissible FAR</span>
                  <strong className="text-slate-900 dark:text-white font-bold text-sm block mt-0.5">
                    {spatialAudit.recommendedFAR}
                  </strong>
                  <span className="text-[10px] text-emerald-600 block mt-0.5">
                    {spatialAudit.isTODZone ? 'TOD Corridors: Up to 4.0 FAR' : 'Standard Cap'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-white/[0.04] rounded-xl border border-black/[0.04] dark:border-white/[0.06]">
                  <span className="text-slate-400 text-[11px] block">Ground Coverage</span>
                  <strong className="text-slate-900 dark:text-white font-bold text-sm block mt-0.5">
                    {spatialAudit.maxGroundCoverage}
                  </strong>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Elev: ~{spatialAudit.elevationAmslMeters ?? spatialAudit.estimatedElevationAmsl}m AMSL
                  </span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-white/[0.04] rounded-xl border border-black/[0.04] dark:border-white/[0.06]">
                  <span className="text-slate-400 text-[11px] block">River 200m HFL Buffer</span>
                  <span
                    className={`inline-flex items-center gap-1 font-bold text-xs mt-0.5 ${
                      spatialAudit.isRiverBufferConflict || spatialAudit.isProhibitedZone ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {spatialAudit.isRiverBufferConflict || spatialAudit.isProhibitedZone ? 'Conflict (Sec 2.11)' : 'Clear (Sec 2.11 Passed)'}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    ~{spatialAudit.riverDistanceKm ?? spatialAudit.distanceToNearestRiverKm}km to {spatialAudit.nearestRiverName || 'River Channel'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-white/[0.04] rounded-xl border border-black/[0.04] dark:border-white/[0.06]">
                  <span className="text-slate-400 text-[11px] block">Aviation CCZM & OLS</span>
                  <strong className="text-slate-900 dark:text-white font-bold text-xs block mt-0.5">
                    {spatialAudit.isAirportOLSConflict ? 'CCZM 45m Height Cap' : 'OLS Funnel Clear'}
                  </strong>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    ~{spatialAudit.airportDistanceKm ?? spatialAudit.distanceToNearestAirportKm}km to {spatialAudit.nearestAirportName || 'Airport Runway'}
                  </span>
                </div>
              </div>

              {/* Statutory Summary */}
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <strong>Statutory Spatial Finding: </strong> {spatialAudit.statutorySummary}
              </div>

              {/* Mandatory Statutory Clearances List */}
              {spatialAudit.requiredNOCs && spatialAudit.requiredNOCs.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Statutory Clearances Required for this Coordinate ({spatialAudit.requiredNOCs.length}):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {spatialAudit.requiredNOCs.map((noc: any, idx) => {
                      const isString = typeof noc === 'string';
                      const title = isString ? noc : noc.name;
                      const subtitle = isString
                        ? 'Mandatory statutory clearance prior to building plan sanction'
                        : `${noc.authority} • Ref: ${noc.statutoryByelawClause}`;

                      return (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl border text-xs flex items-start gap-2 bg-amber-500/5 border-amber-500/20 text-slate-800 dark:text-slate-200"
                        >
                          <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                          <div className="min-w-0">
                            <strong className="block truncate text-slate-900 dark:text-white font-semibold">
                              {title}
                            </strong>
                            <span className="text-[10px] text-slate-500 block">
                              {subtitle}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. Selected Zoning Feature Inspector */}
          {selectedZoningFeature && (
            <div className="apple-card p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/[0.08]">
                <div className="flex items-center space-x-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedZoningFeature.color }}
                  />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedZoningFeature.name}
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 uppercase font-bold">
                    Zone {selectedZoningFeature.zoneCode}
                  </span>
                </div>

                <span className="text-xs font-semibold text-slate-500">
                  {selectedZoningFeature.standardizedChapter15Zone}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-white/[0.04] rounded-xl border border-black/[0.04] dark:border-white/[0.06]">
                  <span className="text-slate-400 block text-[11px]">Permissible FAR</span>
                  <strong className="text-slate-900 dark:text-white font-bold block mt-0.5">
                    {selectedZoningFeature.permittedFAR}
                  </strong>
                  <span className="text-[10px] text-emerald-600 block mt-0.5 font-medium">
                    Purchasable: {selectedZoningFeature.purchasableFARCap}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-white/[0.04] rounded-xl border border-black/[0.04] dark:border-white/[0.06]">
                  <span className="text-slate-400 block text-[11px]">Max Ground Coverage</span>
                  <strong className="text-slate-900 dark:text-white font-bold block mt-0.5">
                    {selectedZoningFeature.maxGroundCoverage}
                  </strong>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-white/[0.04] rounded-xl border border-black/[0.04] dark:border-white/[0.06]">
                  <span className="text-slate-400 block text-[11px]">Min Access Road</span>
                  <strong className="text-slate-900 dark:text-white font-bold block mt-0.5">
                    {selectedZoningFeature.minRoadWidth}
                  </strong>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50/50 dark:bg-white/[0.02] p-3 rounded-xl border border-black/[0.04] dark:border-white/[0.04]">
                {selectedZoningFeature.description}
              </p>
            </div>
          )}

          {/* 5. Selected Authority Master Plan Dossier */}
          {selectedAuthority && (
            <div className="apple-card p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08] gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-950 px-2 py-0.5 rounded-full">
                      Code #{selectedAuthority.code}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {selectedAuthority.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {selectedAuthority.region} • Jurisdiction Area: {selectedAuthority.planningAreaSqKm} sq. km
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <a
                    href={selectedAuthority.gisServerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-semibold shadow-sm transition-all active:scale-95"
                  >
                    <span>Launch Live {selectedAuthority.portalName}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Authority Features Grid */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Key Spatial Envelopes & Planning Directives:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedAuthority.keyFeatures.map((feat, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Zoning Summary Note */}
              <div className="p-3.5 bg-slate-50 dark:bg-white/[0.04] rounded-xl border border-black/[0.04] dark:border-white/[0.06] text-xs text-slate-600 dark:text-slate-400">
                <span className="font-bold text-slate-800 dark:text-slate-200">Appendix-15 Concordance: </span>
                {selectedAuthority.zoningSummary}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 6. Official State-Level Spatial Map Servers & Govt Portals Repository */}
      <div className="apple-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Official Government Geoportals & Spatial Repositories
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Direct WMS / WebGIS Endpoints
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="https://bhuvan-app1.nrsc.gov.in"
            target="_blank"
            rel="noreferrer"
            className="apple-card apple-card-hover p-4 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider">
                ISRO National Portal
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
            </div>
            <div className="font-bold text-slate-900 dark:text-white text-sm mt-1">
              ISRO Bhuvan Urban GIS
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              High-resolution Indian satellite imagery layers (Cartosat/Resourcesat) and AMRUT Master Plan geospatial sub-schemes across 22 UP cities.
            </p>
          </a>

          <a
            href="https://rsacup.org.in"
            target="_blank"
            rel="noreferrer"
            className="apple-card apple-card-hover p-4 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider">
                State Spatial Geodatabase
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
            </div>
            <div className="font-bold text-slate-900 dark:text-white text-sm mt-1">
              RSAC-UP Spatial Data
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Remote Sensing Applications Centre, UP: Official state spatial infrastructure for drainage catchments, green belts, and master plan boundaries.
            </p>
          </a>

          <a
            href="http://awasbandhu.in"
            target="_blank"
            rel="noreferrer"
            className="apple-card apple-card-hover p-4 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider">
                Statutory Authority
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
            </div>
            <div className="font-bold text-slate-900 dark:text-white text-sm mt-1">
              Awas Bandhu UP
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Housing & Urban Planning Department repository of Government Orders, Byelaws 2025 gazette notifications, and state urban development policies.
            </p>
          </a>

          <a
            href="https://niveshmitra.up.nic.in"
            target="_blank"
            rel="noreferrer"
            className="apple-card apple-card-hover p-4 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider">
                Single Window Clearance
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
            </div>
            <div className="font-bold text-slate-900 dark:text-white text-sm mt-1">
              Nivesh Mitra OBPAS
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Automated Online Building Plan Approval System (OBPAS) with unified 15-department time-bound deemed NOC engine across Uttar Pradesh.
            </p>
          </a>
        </div>
      </div>

      {/* Custom GIS API & WMS Connector Modal */}
      <CustomGisConnectorModal
        isOpen={isConnectorModalOpen}
        onClose={() => setIsConnectorModalOpen(false)}
        onAddProvider={(newProvider) => {
          setCustomProviders((prev) => [...prev, newProvider]);
          setActiveBasemapId(newProvider.id);
        }}
      />

      {/* Spatial Clearance Dossier Modal */}
      <SpatialDossierModal
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
        spatialAudit={spatialAudit}
      />

      {/* Strategic GIS Value & Utility Guide Modal */}
      <GisValueGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
};
