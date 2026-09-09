import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  MapPin,
  Building2,
  Navigation,
  Globe,
  Loader2,
  ExternalLink,
  Sparkles,
  Layers,
  Crosshair,
  Droplets,
  Plane,
  X,
  ChevronRight
} from 'lucide-react';
import {
  UP_DEVELOPMENT_AUTHORITIES,
  STATUTORY_GIS_ZONING_FEATURES,
  STATUTORY_BUFFER_ENVELOPES,
  GISAuthority,
  GISZoningFeature,
  GISBufferEnvelope
} from '../data/upGisMasterPlanData';

/** Nominatim asks for at most one request per second; a small cache keeps us well under. */
const geocodeCache = new Map<string, GeocodedLocation[]>();
const GEOCODE_CACHE_LIMIT = 50;

export interface GeocodedLocation {
  id: string;
  title: string;
  subtitle: string;
  source: 'Statutory buffer' | 'RSAC-UP' | 'Statutory Master Plan 2031' | 'OpenStreetMap';
  type: 'authority' | 'parcel' | 'buffer' | 'heritage' | 'tod';
  lat: number;
  lng: number;
  zoom: number;
  polygon?: [number, number][];
  farInfo?: string;
  authorityName?: string;
  bounds?: [[number, number], [number, number]];
}

interface BhuvanGeocodingSearchProps {
  onSelectLocation: (location: GeocodedLocation) => void;
  className?: string;
}

export const BhuvanGeocodingSearch: React.FC<BhuvanGeocodingSearchProps> = ({
  onSelectLocation,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<GeocodedLocation[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Quick preset suggestions
  const popularQueries = [
    { label: 'Gomti Nagar Ext', city: 'LDA Lucknow', q: 'Gomti Nagar' },
    { label: 'Jewar Aerotropolis', city: 'YEIDA', q: 'Jewar' },
    { label: 'Ram Mandir Core', city: 'ADA Ayodhya', q: 'Ayodhya' },
    { label: 'Ganga 200m Buffer', city: 'VDA Varanasi', q: 'Ganga' },
    { label: 'TTZ Ring', city: 'ADA Agra', q: 'Taj' },
    { label: 'RRTS TOD Band', city: 'MDA Meerut', q: 'RRTS' },
  ];

  // Perform search with debounce
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      const q = query.toLowerCase().trim();
      const localMatches: GeocodedLocation[] = [];

      // 1. Search Development Authorities
      UP_DEVELOPMENT_AUTHORITIES.forEach((auth) => {
        const aLat = Number(auth.lat);
        const aLng = Number(auth.lng);
        if (isNaN(aLat) || isNaN(aLng) || !isFinite(aLat) || !isFinite(aLng)) return;

        if (
          auth.name.toLowerCase().includes(q) ||
          auth.shortName.toLowerCase().includes(q) ||
          auth.district.toLowerCase().includes(q) ||
          auth.region.toLowerCase().includes(q)
        ) {
          localMatches.push({
            id: `auth-${auth.code}`,
            title: auth.name,
            subtitle: `${auth.region} • Master Plan Horizon: ${auth.masterPlanHorizon}`,
            source: 'RSAC-UP',
            type: 'authority',
            lat: aLat,
            lng: aLng,
            zoom: 12,
            authorityName: auth.name,
            farInfo: 'Jurisdiction Area: ' + auth.planningAreaSqKm + ' sq. km',
          });
        }
      });

      // 2. Search Statutory Zoning Features (Sectors, Commercial Hubs, TOD)
      STATUTORY_GIS_ZONING_FEATURES.forEach((feat) => {
        const fLat = Number(feat.center?.[0]);
        const fLng = Number(feat.center?.[1]);
        if (isNaN(fLat) || isNaN(fLng) || !isFinite(fLat) || !isFinite(fLng)) return;

        if (
          feat.name.toLowerCase().includes(q) ||
          feat.description.toLowerCase().includes(q) ||
          feat.zoneCode.toLowerCase().includes(q) ||
          feat.standardizedChapter15Zone.toLowerCase().includes(q) ||
          feat.authorityShort.toLowerCase().includes(q)
        ) {
          localMatches.push({
            id: feat.id,
            title: feat.name,
            subtitle: `${feat.authorityShort} Zone ${feat.zoneCode} (${feat.standardizedChapter15Zone})`,
            source: 'Statutory Master Plan 2031',
            type: feat.category === 'tod' ? 'tod' : feat.category === 'heritage' ? 'heritage' : 'parcel',
            lat: fLat,
            lng: fLng,
            zoom: 14,
            polygon: feat.polygon,
            authorityName: feat.authorityShort,
            farInfo: `Permissible FAR: ${feat.permittedFAR} • Road: ${feat.minRoadWidth}`,
          });
        }
      });

      // 3. Search Statutory Buffer Envelopes
      STATUTORY_BUFFER_ENVELOPES.forEach((buf) => {
        const bLat = Number(buf.center?.[0]);
        const bLng = Number(buf.center?.[1]);
        if (isNaN(bLat) || isNaN(bLng) || !isFinite(bLat) || !isFinite(bLng)) return;

        if (
          buf.name.toLowerCase().includes(q) ||
          buf.ruleReference.toLowerCase().includes(q) ||
          buf.impactSummary.toLowerCase().includes(q)
        ) {
          localMatches.push({
            id: buf.id,
            title: buf.name,
            subtitle: `${buf.authority} • ${buf.ruleReference}`,
            source: 'Statutory buffer',
            type: 'buffer',
            lat: bLat,
            lng: bLng,
            zoom: 13,
            polygon: buf.polygon,
            authorityName: buf.authority,
            farInfo: buf.impactSummary,
          });
        }
      });

      // 4. Fall back to the OpenStreetMap Nominatim geocoder, bounded to the UP envelope.
      //
      // This is OSM data, not Bhuvan. It was previously labelled "Bhuvan Web API" and
      // "National Geocoder", which overstated its provenance in a tool people rely on for
      // statutory decisions. The request is now aborted on timeout rather than merely
      // raced (the old Promise.race left the connection open), and results are cached so
      // typing does not hammer a free service that asks for one request per second.
      const cacheKey = query.trim().toLowerCase();
      const cached = geocodeCache.get(cacheKey);

      if (cached) {
        localMatches.push(...cached);
      } else {
        const controller = new AbortController();
        abortRef.current?.abort();
        abortRef.current = controller;
        const timeout = window.setTimeout(() => controller.abort(), 3500);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
              query + ', Uttar Pradesh',
            )}&format=json&countrycodes=in&limit=4&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' }, signal: controller.signal },
          );

          if (res.ok) {
            const data = await res.json();
            const remote: GeocodedLocation[] = [];

            if (Array.isArray(data)) {
              data.forEach((item: any, idx: number) => {
                const lat = parseFloat(item.lat);
                const lon = parseFloat(item.lon);
                if (!isFinite(lat) || !isFinite(lon)) return;
                // Keep results inside the approximate Uttar Pradesh envelope.
                if (lat < 23.5 || lat > 30.5 || lon < 77.0 || lon > 84.8) return;

                const duplicate = localMatches.some(
                  (m) => Math.abs(m.lat - lat) < 0.01 && Math.abs(m.lng - lon) < 0.01,
                );
                if (duplicate) return;

                remote.push({
                  id: `osm-${idx}-${item.place_id || lat}`,
                  title: item.name || String(item.display_name).split(',')[0],
                  subtitle: item.display_name,
                  source: 'OpenStreetMap',
                  type: 'parcel',
                  lat,
                  lng: lon,
                  zoom: 13,
                  farInfo: 'Address match from OpenStreetMap — not a cadastral or Bhuvan parcel record.',
                });
              });
            }

            geocodeCache.set(cacheKey, remote);
            if (geocodeCache.size > GEOCODE_CACHE_LIMIT) {
              geocodeCache.delete(geocodeCache.keys().next().value as string);
            }
            localMatches.push(...remote);
          }
        } catch {
          // Offline, blocked or timed out: the local statutory geodatabase still answered.
        } finally {
          window.clearTimeout(timeout);
          if (abortRef.current === controller) abortRef.current = null;
        }
      }

      setResults(localMatches);
      setIsLoading(false);
      setIsOpen(true);
    }, 280);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, [query]);

  const handleSelect = (item: GeocodedLocation) => {
    onSelectLocation(item);
    setQuery(item.title);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Bar Input Pill */}
      <div className="relative group">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-600 transition-colors dark:text-slate-400">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-emerald-700 dark:text-emerald-300" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>

        <input
          type="text"
          aria-label="Search a place, landmark or coordinates in Uttar Pradesh"
              value={query}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Bhuvan Geocoder: Search authority boundary, sector, plot, or parcel..."
          className="w-full bg-slate-100/90 dark:bg-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.12] focus:bg-white dark:focus:bg-black text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 pl-10 pr-24 py-2.5 rounded-2xl border border-black/[0.08] dark:border-white/[0.12] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-xs transition-all"
        />

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center space-x-1.5">
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setResults([]);
                setIsOpen(false);
              }}
              className="text-slate-600 hover:text-slate-600 dark:hover:text-slate-200 p-1 dark:text-slate-400"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="hidden sm:flex items-center space-x-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
            <Globe className="w-3 h-3" />
            <span>BHUVAN API</span>
          </div>
        </div>
      </div>

      {/* Preset Quick-Query Pills under search bar */}
      <div className="mt-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
        <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider pl-1 dark:text-slate-400">
          Suggestions:
        </span>
        {popularQueries.map((pq, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setQuery(pq.q);
            }}
            className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-white/10 whitespace-nowrap transition-colors"
          >
            {pq.label} <span className="text-[9px] text-slate-600 dark:text-slate-400">({pq.city})</span>
          </button>
        ))}
      </div>

      {/* Dropdown Live Results Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white/95 dark:bg-[#161617]/95 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.12] rounded-2xl shadow-2xl z-[1000] overflow-hidden max-h-96 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-2.5 bg-slate-50 dark:bg-white/[0.03] border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300" />
              <span>Real-Time Bhuvan Spatial Geocoding Results</span>
            </span>
            <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400">
              {results.length} Locations Found
            </span>
          </div>

          {results.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-600 dark:text-slate-400">
              {isLoading ? (
                <div className="flex flex-col items-center space-y-2">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-700 dark:text-emerald-300" />
                  <span>Connecting to Bhuvan & RSAC-UP Spatial Servers...</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    No spatial boundary matched for "{query}"
                  </p>
                  <p className="text-[11px]">
                    Try searching by authority name (e.g. "Varanasi", "YEIDA"), sector ("Gomti Nagar"), or environmental buffer ("River Ganga").
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
              {results.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="w-full text-left p-3 hover:bg-emerald-500/5 dark:hover:bg-white/[0.05] transition-colors flex items-start justify-between gap-3 group"
                >
                  <div className="flex items-start space-x-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        item.type === 'authority'
                          ? 'bg-blue-500/10 text-blue-600'
                          : item.type === 'tod'
                          ? 'bg-rose-500/10 text-rose-600'
                          : item.type === 'buffer'
                          ? 'bg-sky-500/10 text-sky-600'
                          : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      {item.type === 'authority' ? (
                        <Building2 className="w-4 h-4" />
                      ) : item.type === 'tod' ? (
                        <Navigation className="w-4 h-4" />
                      ) : item.type === 'buffer' ? (
                        <Droplets className="w-4 h-4" />
                      ) : (
                        <MapPin className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {item.title}
                        </h5>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                            item.type === 'authority'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : item.type === 'tod'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : item.type === 'buffer'
                              ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {item.type}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate mt-0.5">
                        {item.subtitle}
                      </p>

                      {item.farInfo && (
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium mt-1">
                          {item.farInfo}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end flex-shrink-0 text-right">
                    <span className="text-[10px] text-slate-600 font-mono dark:text-slate-400">
                      {item.lat.toFixed(4)}°, {item.lng.toFixed(4)}°
                    </span>
                    <span className="text-[9px] font-semibold text-slate-600 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-md mt-1 dark:text-slate-400">
                      {item.source}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
