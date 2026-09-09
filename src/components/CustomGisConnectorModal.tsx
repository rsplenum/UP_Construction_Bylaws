import React, { useState } from 'react';
import {
  Globe,
  Database,
  Layers,
  X,
  Plus,
  CheckCircle2,
  Server,
  Sparkles,
  HelpCircle,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { BasemapProvider } from '../data/upGisMasterPlanData';
import { useToast } from '../context/ToastContext';

interface CustomGisConnectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProvider: (provider: BasemapProvider) => void;
}

interface GisPreset {
  id: string;
  name: string;
  agency: string;
  description: string;
  url: string;
  attribution: string;
  maxZoom: number;
  isDark?: boolean;
}

const VERIFIED_GIS_PRESETS: GisPreset[] = [
  {
    id: 'esri_topo',
    name: 'Esri World Topographic',
    agency: 'Esri GIS & USGS',
    description: 'High-detail contours, elevation models, administrative boundaries and forest buffers.',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Sources: GEBCO, NOAA, CHS, OSU, UNH, CSUMB, National Geographic, DeLorme, NAVTEQ',
    maxZoom: 19,
    isDark: false,
  },
  {
    id: 'esri_street',
    name: 'Esri World Street Infrastructure',
    agency: 'Esri & HERE Tech',
    description: 'Detailed highway corridors, parcel frontages, road hierarchies and rail corridors.',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong)',
    maxZoom: 19,
    isDark: false,
  },
  {
    id: 'nasa_night_lights',
    name: 'NASA VIIRS Urban Density & Night Lights',
    agency: 'NASA GIBS Earthdata',
    description: 'Statutory urbanization footprint, nocturnal radiance and economic density corridors across UP.',
    url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_CityLights_2012/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg',
    attribution: 'Imagery &copy; NASA Earth Science Data and Information System (ESDIS) Project / GIBS',
    maxZoom: 8,
    isDark: true,
  },
  {
    id: 'stadia_smooth',
    name: 'Stadia Alidade Ultra-Clean Vector',
    agency: 'Stadia Maps & OpenMapTiles',
    description: 'Apple-style minimalist monochromatic vector style designed for statutory zoning tint visibility.',
    url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
    maxZoom: 20,
    isDark: false,
  },
];

export const CustomGisConnectorModal: React.FC<CustomGisConnectorModalProps> = ({
  isOpen,
  onClose,
  onAddProvider,
}) => {
  const toast = useToast();

  const [providerName, setProviderName] = useState('');
  const [endpointUrl, setEndpointUrl] = useState('');
  const [attribution, setAttribution] = useState('');
  const [maxZoom, setMaxZoom] = useState(19);
  const [isDark, setIsDark] = useState(false);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: GisPreset) => {
    setProviderName(preset.name);
    setEndpointUrl(preset.url);
    setAttribution(preset.attribution);
    setMaxZoom(preset.maxZoom);
    setIsDark(preset.isDark ?? false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!providerName.trim() || !endpointUrl.trim()) {
      toast.error('Validation Error', 'Please provide both a provider name and a tile/WMS endpoint URL.');
      return;
    }

    // Basic URL check
    if (!endpointUrl.startsWith('http://') && !endpointUrl.startsWith('https://')) {
      toast.error('Invalid URL', 'Endpoint must start with http:// or https://');
      return;
    }

    const newProvider: BasemapProvider = {
      id: 'custom-' + Date.now(),
      name: providerName.trim(),
      provider: 'Custom GIS Server',
      type: 'tile',
      url: endpointUrl.trim(),
      attribution: attribution.trim() || `Custom GIS Endpoint: ${providerName.trim()}`,
      maxZoom,
      isDark,
    };

    onAddProvider(newProvider);
    toast.success('GIS Source Connected', `Mounted "${newProvider.name}" as active map layer.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-[#161617] rounded-3xl shadow-2xl border border-black/[0.08] dark:border-white/[0.12] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center font-bold dark:text-emerald-300">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Connect External GIS API / Spatial Endpoint</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Universal
                </span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Overlay government GeoServer, ISRO Bhuvan, Survey of India, or custom TileXYZ services.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-600 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors dark:text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Quick Select Presets */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Verified Public & Government GIS Presets</span>
              <span className="text-[11px] font-normal text-slate-600 dark:text-slate-400">Click to autofill</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {VERIFIED_GIS_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="text-left p-3 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] hover:border-emerald-500/50 bg-slate-50/50 dark:bg-white/[0.02] hover:bg-emerald-50/40 dark:hover:bg-white/[0.05] transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                      {preset.name}
                    </span>
                    <span className="text-[9px] font-semibold text-slate-600 font-mono dark:text-slate-400">
                      {preset.agency}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {preset.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Form */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
            <div>
              <label htmlFor="custom-gis-connector-modal-gis-provider-layer-name" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                GIS Provider / Layer Name *
              </label>
              <input id="custom-gis-connector-modal-gis-provider-layer-name"
                type="text"
                required
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                placeholder="e.g. Lucknow Development Authority GeoServer / Bhuvan LULC"
                className="w-full bg-slate-100/90 dark:bg-white/[0.06] text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 px-3.5 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.1] focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label htmlFor="custom-gis-connector-modal-tile-endpoint-url-xyz-tms" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Tile Endpoint URL (XYZ / TMS format) *
              </label>
              <input id="custom-gis-connector-modal-tile-endpoint-url-xyz-tms"
                type="text"
                required
                value={endpointUrl}
                onChange={(e) => setEndpointUrl(e.target.value)}
                placeholder="https://server.domain.gov.in/tiles/{z}/{x}/{y}.png"
                className="w-full font-mono text-xs text-slate-900 dark:text-white placeholder-slate-400 px-3.5 py-2.5 rounded-xl bg-slate-100/90 dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.1] focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-600 mt-1 dark:text-slate-400">
                Supports Standard Web Mercator (EPSG:3857) Tile XYZ URLs, GeoServer cached layers, and ArcGIS MapServer tile endpoints.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="custom-gis-connector-modal-attribution-license-credit" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Attribution & License Credit
                </label>
                <input id="custom-gis-connector-modal-attribution-license-credit"
                  type="text"
                  value={attribution}
                  onChange={(e) => setAttribution(e.target.value)}
                  placeholder="&copy; RSAC-UP / State Portal"
                  className="w-full text-xs text-slate-900 dark:text-white placeholder-slate-400 px-3.5 py-2.5 rounded-xl bg-slate-100/90 dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.1] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label htmlFor="custom-gis-connector-modal-max-zoom-level" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Max Zoom Level
                </label>
                <input id="custom-gis-connector-modal-max-zoom-level"
                  type="number"
                  min={5}
                  max={24}
                  value={maxZoom}
                  onChange={(e) => setMaxZoom(Number(e.target.value))}
                  className="w-full text-xs text-slate-900 dark:text-white px-3.5 py-2.5 rounded-xl bg-slate-100/90 dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.1] focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Footer Action Buttons */}
            <div className="pt-4 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Mount GIS API Layer</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
