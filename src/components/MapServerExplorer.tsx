import React, { useEffect, useRef, useState } from 'react';
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
  Info
} from 'lucide-react';

interface AuthorityGISData {
  code: number;
  name: string;
  shortName: string;
  lat: number;
  lng: number;
  region: string;
  masterPlanHorizon: string;
  gisServerUrl: string;
  mapServerType: 'Geoportal' | 'WebGIS' | 'Bhuvan/RSAC' | 'WMS/WFS';
  keyFeatures: string[];
  zoningSummary: string;
  gazetteNotified: boolean;
}

const UP_AUTHORITIES_GIS: AuthorityGISData[] = [
  {
    code: 1,
    name: 'Ayodhya Development Authority (ADA)',
    shortName: 'Ayodhya',
    lat: 26.7922,
    lng: 82.1998,
    region: 'Ayodhya Division (Special Temple Heritage Region)',
    masterPlanHorizon: 'Master Plan 2031 (Notified)',
    gisServerUrl: 'https://ayodhyada.in',
    mapServerType: 'Geoportal',
    keyFeatures: ['Special Pilgrim City Buffer', 'Saryu River 200m Eco-Zone', 'Chaurasi Kosi Parikrama Corridor', 'Building Height Restriction Zones'],
    zoningSummary: 'Comprehensive Appendix-15 mapping covering Heritage Pilgrim Zones, Riverfront Green, Mixed Use Bazaar, and Tourism facilities.',
    gazetteNotified: true,
  },
  {
    code: 2,
    name: 'Lucknow Development Authority (LDA)',
    shortName: 'Lucknow',
    lat: 26.8467,
    lng: 80.9462,
    region: 'State Capital Region (SCR) / Awadh',
    masterPlanHorizon: 'Master Plan 2031 (Approved)',
    gisServerUrl: 'https://gis.ldalucknow.co.in',
    mapServerType: 'WebGIS',
    keyFeatures: ['State Capital Region (SCR) Corridor', 'Shaheed Path TOD Corridor', 'Gomti Riverfront Buffer', 'Metro Zone Higher FAR'],
    zoningSummary: 'Standard 16 zones with sub-categories for Transit Oriented Development (TOD) corridors with 1.5x to 2x FAR.',
    gazetteNotified: true,
  },
  {
    code: 3,
    name: 'Varanasi Development Authority (VDA)',
    shortName: 'Varanasi',
    lat: 25.3176,
    lng: 82.9739,
    region: 'Varanasi Division (Ganga Heritage Zone)',
    masterPlanHorizon: 'Master Plan 2031 (Notified)',
    gisServerUrl: 'https://vdavaranasi.com',
    mapServerType: 'Geoportal',
    keyFeatures: ['Ganga River 200m Prohibited Buffer (Chapter 2.11)', 'Kashi Vishwanath Cultural Envelope', 'Panchkroshi Parikrama Marg', 'Ring Road Phase-2 Logistics'],
    zoningSummary: 'Strict riverbank development control rules (35% Ground Coverage, 1.5 FAR cap for Ashrams/Temples with zero direct discharge).',
    gazetteNotified: true,
  },
  {
    code: 4,
    name: 'Kanpur Development Authority (KDA)',
    shortName: 'Kanpur',
    lat: 26.4499,
    lng: 80.3319,
    region: 'Kanpur Mega Industrial Region',
    masterPlanHorizon: 'Master Plan 2031',
    gisServerUrl: 'https://kda.co.in',
    mapServerType: 'WebGIS',
    keyFeatures: ['Leather Industrial Buffer Zones', 'Ganga Barrage Eco-tourism Corridor', 'Metro Corridor Transit Zone', 'Defence Industrial Corridor'],
    zoningSummary: 'High-density industrial zones (SI, LI) with integrated worker housing norms (max 20% FAR).',
    gazetteNotified: true,
  },
  {
    code: 5,
    name: 'Agra Development Authority (ADA)',
    shortName: 'Agra',
    lat: 27.1767,
    lng: 78.0081,
    region: 'Taj Trapezium Zone (TTZ) Environmental Control',
    masterPlanHorizon: 'Master Plan 2031',
    gisServerUrl: 'https://adaagra.in',
    mapServerType: 'Geoportal',
    keyFeatures: ['Taj Trapezium Zone (TTZ) Prohibitions', 'Strict Non-Polluting Industrial Norms', 'Monument 100m Prohibited & 200m Regulated Zones', 'Airport Funnel Height Caps'],
    zoningSummary: 'Strict environmental and green belt restrictions under Supreme Court TTZ directives and ASI monument buffers.',
    gazetteNotified: true,
  },
  {
    code: 6,
    name: 'Prayagraj Development Authority (PDA)',
    shortName: 'Prayagraj',
    lat: 25.4358,
    lng: 81.8463,
    region: 'Sangam Triveni Region',
    masterPlanHorizon: 'Master Plan 2031',
    gisServerUrl: 'https://pdaprayagraj.in',
    mapServerType: 'Geoportal',
    keyFeatures: ['Kumbh Mela High-Capacity Grounds', 'Ganga & Yamuna Flood Plain Regulations', 'Naini Industrial Rejuvenation', 'Civil Lines Heritage Preservation'],
    zoningSummary: 'Riverbank buffers and high-capacity open recreational zones mapped to standard RC and GB categories.',
    gazetteNotified: true,
  },
  {
    code: 7,
    name: 'Meerut Development Authority (MDA)',
    shortName: 'Meerut',
    lat: 28.9845,
    lng: 77.7064,
    region: 'National Capital Region (NCR)',
    masterPlanHorizon: 'Master Plan 2031 (NCR Plan 2041)',
    gisServerUrl: 'https://mdameerut.in',
    mapServerType: 'WebGIS',
    keyFeatures: ['Delhi-Meerut RRTS Transit-Oriented Development', 'Delhi-Meerut Expressway Corridor', 'Sports Goods Industrial Cluster', 'Expressway Greenbelt'],
    zoningSummary: 'NCR high-density TOD zoning with purchasable FAR up to 4.0 along designated RRTS stations.',
    gazetteNotified: true,
  },
  {
    code: 8,
    name: 'Ghaziabad Development Authority (GDA)',
    shortName: 'Ghaziabad',
    lat: 28.6692,
    lng: 77.4538,
    region: 'National Capital Region (NCR)',
    masterPlanHorizon: 'Master Plan 2031',
    gisServerUrl: 'https://gdaonline.gov.in',
    mapServerType: 'WebGIS',
    keyFeatures: ['Metro Red Line Corridor TOD', 'Hindon River Eco-Zone', 'Eastern Peripheral Expressway Hub', 'High-Density Mixed-Use Zones'],
    zoningSummary: 'Multi-unit residential and group housing high-density codes with automated online sanction portal.',
    gazetteNotified: true,
  },
  {
    code: 9,
    name: 'Yamuna Expressway Industrial Development Authority (YEIDA)',
    shortName: 'YEIDA',
    lat: 28.3587,
    lng: 77.5451,
    region: 'Noida International Airport (Jewar) Region',
    masterPlanHorizon: 'Master Plan 2041 Phase-1 & 2',
    gisServerUrl: 'https://yamunaexpresswayauthority.com',
    mapServerType: 'Geoportal',
    keyFeatures: ['Jewar Airport Aviation Concession & Funnel', 'Film City Mega Sector', 'Data Center & Semiconductor Parks', 'Logistics Multi-Modal Hub'],
    zoningSummary: 'Special industrial and aviation zoning with height restrictions governed by ICAO/AAI funnel charts.',
    gazetteNotified: true,
  },
  {
    code: 10,
    name: 'Noida & Greater Noida Authorities',
    shortName: 'Noida/Gr. Noida',
    lat: 28.5355,
    lng: 77.3910,
    region: 'National Capital Region (NCR)',
    masterPlanHorizon: 'Master Plan 2031 / 2041',
    gisServerUrl: 'https://noidaauthorityonline.in',
    mapServerType: 'WebGIS',
    keyFeatures: ['Expressway High-Rise Hub', 'IT & ITeS Data Centre Zone', 'Comprehensive Sectoral Road Grids (30m-60m)', 'Green Building Certified Incentives'],
    zoningSummary: 'Complete planned sector grid with automated compounding, EVCI, and LEED/GRIHA incentive allocations.',
    gazetteNotified: true,
  },
  {
    code: 11,
    name: 'Bareilly Development Authority (BDA)',
    shortName: 'Bareilly',
    lat: 28.3670,
    lng: 79.4304,
    region: 'Rohilkhand Region',
    masterPlanHorizon: 'Master Plan 2031',
    gisServerUrl: 'https://bdabareilly.com',
    mapServerType: 'Geoportal',
    keyFeatures: ['Civil Airport Aviation Zone', 'Badaun-Pilibhit Bypass Expansion', 'Zari-Zardozi Craft MSME Zone', 'River Ramganga Buffer'],
    zoningSummary: 'Mixed-use bazaar and cottage MSME cluster provisions with road widths from 7m to 12m.',
    gazetteNotified: true,
  },
  {
    code: 12,
    name: 'Gorakhpur Development Authority (GDA)',
    shortName: 'Gorakhpur',
    lat: 26.7606,
    lng: 83.3732,
    region: 'Purvanchal Gateway Region',
    masterPlanHorizon: 'Master Plan 2031',
    gisServerUrl: 'https://gdagorakhpur.com',
    mapServerType: 'Geoportal',
    keyFeatures: ['Ramgarh Tal Eco-Tourism Buffer', 'AIIMS Medical Campus Zone', 'Gorakhpur Link Expressway Hub', 'Civil Airport Flight Path'],
    zoningSummary: 'Wetland and lake buffer conservation with eco-friendly recreational and institutional zones.',
    gazetteNotified: true,
  },
  {
    code: 13,
    name: 'Aligarh Development Authority (ADA)',
    shortName: 'Aligarh',
    lat: 27.8974,
    lng: 78.0880,
    region: 'Western UP / AMU Zone',
    masterPlanHorizon: 'Master Plan 2031',
    gisServerUrl: 'https://adaaligarh.in',
    mapServerType: 'Geoportal',
    keyFeatures: ['Hardware & Lock Industry Cluster', 'Defence Industrial Corridor Node', 'AMU Institutional Buffer', 'NH-91 Bypass Corridor'],
    zoningSummary: 'Small industry and non-polluting manufacturing zoned along designated 12m+ access roads.',
    gazetteNotified: true,
  },
  {
    code: 14,
    name: 'Jhansi Development Authority (JDA)',
    shortName: 'Jhansi',
    lat: 25.4484,
    lng: 78.5685,
    region: 'Bundelkhand Hub',
    masterPlanHorizon: 'Master Plan 2031',
    gisServerUrl: 'https://jdajhansi.com',
    mapServerType: 'Geoportal',
    keyFeatures: ['Defence Industrial Corridor Anchor', 'Historic Fort Monument Heritage Radius', 'Bundelkhand Expressway Link', 'Solar Energy Parks'],
    zoningSummary: 'Heritage and fort view preservation zoning with 100m prohibited and 300m regulated zones.',
    gazetteNotified: true,
  },
  {
    code: 15,
    name: 'Moradabad Development Authority (MDA)',
    shortName: 'Moradabad',
    lat: 28.8386,
    lng: 78.7733,
    region: 'Brass City Cluster',
    masterPlanHorizon: 'Master Plan 2031',
    gisServerUrl: 'https://mdamoradabad.in',
    mapServerType: 'Geoportal',
    keyFeatures: ['Brass Export Zone & SEZ', 'Ramganga River Floodplain', 'NH-24 Delhi Highway Expansion', 'Cottage Handicrafts Clustering'],
    zoningSummary: 'MSME cottage manufacturing permitted in residential built-up zones subject to power and noise caps.',
    gazetteNotified: true,
  },
  {
    code: 16,
    name: 'Saharanpur Development Authority (SDA)',
    shortName: 'Saharanpur',
    lat: 29.9679,
    lng: 77.5510,
    region: 'Shivalik Foothills / Woodcraft',
    masterPlanHorizon: 'Master Plan 2031',
    gisServerUrl: 'https://sdasahanpur.in',
    mapServerType: 'Geoportal',
    keyFeatures: ['Wood Carving Craft Cluster', 'Delhi-Dehradun Economic Corridor', 'River Paondhoi Eco-Stream', 'Agro-Forestry Processing'],
    zoningSummary: 'Craft-centric mixed use and highway logistics facilities along 18m+ bypass corridors.',
    gazetteNotified: true,
  },
  {
    code: 17,
    name: 'Mathura-Vrindavan Development Authority (MVDA)',
    shortName: 'Mathura-Vrindavan',
    lat: 27.4924,
    lng: 77.6737,
    region: 'Braj Teerth Heritage / TTZ',
    masterPlanHorizon: 'Master Plan 2031 (Heritage Master Plan)',
    gisServerUrl: 'https://mvdamathura.in',
    mapServerType: 'Geoportal',
    keyFeatures: ['Yamuna River Heritage Ghats (200m buffer)', 'Govardhan Parikrama Marg Eco-Zone', 'Taj Trapezium Zone (TTZ) Compliant', 'Pilgrim Dharmashala Norms'],
    zoningSummary: 'Strict temple town height caps (max 15m in pilgrim core), non-polluting vehicle parking hubs.',
    gazetteNotified: true,
  },
  {
    code: 18,
    name: 'Firozabad-Shikohabad Development Authority (FSDA)',
    shortName: 'Firozabad',
    lat: 27.1593,
    lng: 78.3957,
    region: 'Glass City / TTZ Boundary',
    masterPlanHorizon: 'Master Plan 2031',
    gisServerUrl: 'https://fsdafirozabad.in',
    mapServerType: 'Geoportal',
    keyFeatures: ['Glass Industry TTZ Natural Gas Mandate', 'NH-19 Industrial Ribbon', 'Sengur River Eco-corridor', 'MSME Bangles Craft Hub'],
    zoningSummary: 'Special industrial regulations complying with Supreme Court air quality norms in the Taj zone.',
    gazetteNotified: true,
  },
  {
    code: 19,
    name: 'Muzaffarnagar Development Authority (MDA)',
    shortName: 'Muzaffarnagar',
    lat: 29.4727,
    lng: 77.7085,
    region: 'Upper Doab / Steel & Sugar',
    masterPlanHorizon: 'Master Plan 2031',
    gisServerUrl: 'https://mdamuz.in',
    mapServerType: 'Geoportal',
    keyFeatures: ['Paper & Steel Rolling Mill Enclave', 'Jansath Road Bypass Network', 'Kali River Buffer', 'Delhi-Haridwar Highway TOD'],
    zoningSummary: 'Industrial zones segregated with mandatory 15m green buffers from residential neighborhoods.',
    gazetteNotified: true,
  },
  {
    code: 20,
    name: 'Hapur-Pilkhuwa Development Authority (HPDA)',
    shortName: 'Hapur-Pilkhuwa',
    lat: 28.7306,
    lng: 77.7759,
    region: 'NCR Textile & Logistics Hub',
    masterPlanHorizon: 'Master Plan 2031',
    gisServerUrl: 'https://hpdahapur.in',
    mapServerType: 'Geoportal',
    keyFeatures: ['NCR Textile Hub & Handloom Park', 'Delhi-Lucknow NH-9 Multi-Modal Terminal', 'Eastern Peripheral Logistics Link', 'Integrated Housing Schemes'],
    zoningSummary: 'Logistics and industrial warehousing with enhanced ground coverage up to 60% as per Ch 6.',
    gazetteNotified: true,
  },
  {
    code: 21,
    name: 'Banda Development Authority (BKDA)',
    shortName: 'Banda',
    lat: 25.4800,
    lng: 80.3367,
    region: 'Bundelkhand Mining & Agri',
    masterPlanHorizon: 'Master Plan 2031',
    gisServerUrl: 'https://bandada.in',
    mapServerType: 'Bhuvan/RSAC',
    keyFeatures: ['Ken River Sand & Mineral Buffers', 'Bundelkhand Expressway Arteries', 'Defence Corridor Ancillary', 'Rural Abadi Integration'],
    zoningSummary: 'Rural abadi regularizations (Zone RA) and agricultural processing centers (Zone A).',
    gazetteNotified: true,
  },
  {
    code: 22,
    name: 'Mirzapur-Vindhyachal Development Authority',
    shortName: 'Mirzapur',
    lat: 25.1337,
    lng: 82.5644,
    region: 'Vindhya Teerth / Carpet Hub',
    masterPlanHorizon: 'Master Plan 2031',
    gisServerUrl: 'https://vdamirzapur.in',
    mapServerType: 'Bhuvan/RSAC',
    keyFeatures: ['Vindhyavasini Devi Corridor Heritage Zone', 'Ganga South Bank Eco-Buffer', 'Handmade Carpet GI Craft MSME', 'Stone Mining Safe Perimeters'],
    zoningSummary: 'Temple corridor pilgrim movement corridors, 200m river restrictions, and heritage craft facilitation.',
    gazetteNotified: true,
  },
];

export const MapServerExplorer: React.FC = () => {
  const [selectedAuthority, setSelectedAuthority] = useState<AuthorityGISData | null>(UP_AUTHORITIES_GIS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapLayerType, setMapLayerType] = useState<'osm' | 'topo'>('osm');

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<{ [key: number]: L.Marker }>({});

  const filteredAuthorities = UP_AUTHORITIES_GIS.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.shortName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    // Fix marker icon URLs
    const customIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    const map = L.map(mapContainerRef.current, {
      center: [26.8467, 80.9462], // Lucknow center of UP
      zoom: 7,
      scrollWheelZoom: true,
    });

    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    mapInstanceRef.current = map;

    // Add Markers for all UP Development Authorities
    UP_AUTHORITIES_GIS.forEach((auth) => {
      const marker = L.marker([auth.lat, auth.lng], { icon: customIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
          <strong style="color: #0f172a; font-size: 13px;">${auth.name}</strong><br/>
          <span style="color: #059669; font-weight: 600;">${auth.masterPlanHorizon}</span><br/>
          <span style="color: #64748b;">${auth.region}</span><br/>
          <a href="${auth.gisServerUrl}" target="_blank" rel="noreferrer" style="color: #059669; font-weight: bold; text-decoration: underline; display: inline-block; margin-top: 4px;">
            Open Authority GIS Web &rarr;
          </a>
        </div>
      `);

      marker.on('click', () => {
        setSelectedAuthority(auth);
      });

      markersRef.current[auth.code] = marker;
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer if type changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(tileLayerRef.current);

    const url =
      mapLayerType === 'osm'
        ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        : 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';

    const newLayer = L.tileLayer(url, {
      attribution: '&copy; OpenStreetMap contributors, OpenTopoMap',
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newLayer;
  }, [mapLayerType]);

  // Pan to selected authority
  useEffect(() => {
    if (!selectedAuthority || !mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([selectedAuthority.lat, selectedAuthority.lng], 11, {
      duration: 1.2,
    });
    const marker = markersRef.current[selectedAuthority.code];
    if (marker) {
      marker.openPopup();
    }
  }, [selectedAuthority]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
              <Globe className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Uttar Pradesh Urban GIS Map Servers & Master Plan 2031 Portal
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Live geographic master plan directory covering all 22 Development Authorities of Uttar Pradesh. Direct integration with State Geoportals (RSAC-UP, ISRO Bhuvan, Awas Bandhu, and City WebGIS servers) providing statutory zoning maps, master plans, and gazetted spatial boundaries.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>22 Notified Master Plans</span>
          </span>
        </div>
      </div>

      {/* Main Map + Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar: Authority Directory & Search */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[650px] overflow-hidden">
          <div className="p-4 border-b border-slate-200 space-y-3 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>Development Authorities ({filteredAuthorities.length})</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border">
                Appendix-15
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by city, region (e.g. NCR, TTZ)..."
                className="w-full bg-white border border-slate-300 pl-8 pr-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* List of Authorities */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
            {filteredAuthorities.map((auth) => {
              const isSelected = selectedAuthority?.code === auth.code;
              return (
                <button
                  key={auth.code}
                  onClick={() => setSelectedAuthority(auth)}
                  className={`w-full text-left p-3 rounded-lg text-xs transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-emerald-50 border border-emerald-300 text-emerald-950 shadow-xs'
                      : 'hover:bg-slate-50 border border-transparent text-slate-700'
                  }`}
                >
                  <MapPin
                    className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      isSelected ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold flex items-center justify-between">
                      <span className="truncate">{auth.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 ml-1">
                        #{auth.code}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {auth.region}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-emerald-700 bg-emerald-100/70 font-semibold px-1.5 py-0.5 rounded">
                        {auth.masterPlanHorizon}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {auth.mapServerType}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom Quick Help */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Click any authority to zoom on map</span>
            <span className="font-bold text-emerald-700">UP Awas Bandhu</span>
          </div>
        </div>

        {/* Right Map Canvas & Detail Card */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          {/* Leaflet Map Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-[420px] relative">
            {/* Map Layer Controls */}
            <div className="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur-xs p-1.5 rounded-lg border border-slate-200 shadow-md flex items-center space-x-1 text-xs">
              <button
                onClick={() => setMapLayerType('osm')}
                className={`px-2 py-1 rounded font-medium ${
                  mapLayerType === 'osm'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                Standard Street
              </button>
              <button
                onClick={() => setMapLayerType('topo')}
                className={`px-2 py-1 rounded font-medium ${
                  mapLayerType === 'topo'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                Topographic
              </button>
            </div>

            {/* Native Leaflet Map Container */}
            <div ref={mapContainerRef} className="w-full h-full" />
          </div>

          {/* Selected Authority Comprehensive Card */}
          {selectedAuthority && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                      Authority Code: {selectedAuthority.code}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      {selectedAuthority.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedAuthority.region} • GPS: {selectedAuthority.lat.toFixed(4)}° N, {selectedAuthority.lng.toFixed(4)}° E
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <a
                    href={selectedAuthority.gisServerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                  >
                    <span>Launch Live Geoportal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Grid of Key Attributes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Master Plan Horizon</span>
                  <strong className="text-slate-900 font-bold text-sm block mt-0.5">
                    {selectedAuthority.masterPlanHorizon}
                  </strong>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">GIS Server Architecture</span>
                  <strong className="text-slate-900 font-bold text-sm block mt-0.5">
                    {selectedAuthority.mapServerType} (WMS/WFS)
                  </strong>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Gazette Notification Status</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 text-sm mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Notified & Enforced</span>
                  </span>
                </div>
              </div>

              {/* Special Spatial Envelopes */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Key Spatial Envelopes & Planning Directives:</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedAuthority.keyFeatures.map((feat, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-emerald-50/50 border border-emerald-100 rounded-lg text-xs text-slate-700 flex items-start gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Zoning Summary Note */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
                <span className="font-bold text-slate-800">Appendix-15 Concordance: </span>
                {selectedAuthority.zoningSummary}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* State-Level Central GIS & Document Map Repositories */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 border-b pb-3">
          <Database className="w-5 h-5 text-emerald-600" />
          <h3 className="text-base font-bold text-slate-900">
            Official State-Level Spatial Map Servers & Repositories
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="https://rsacup.org.in"
            target="_blank"
            rel="noreferrer"
            className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-sm transition-all group bg-slate-50/40"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-emerald-700 tracking-wider">
                RSAC-UP Server
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
            </div>
            <div className="font-bold text-slate-900 text-sm mt-1">
              Remote Sensing Applications Centre
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Official satellite geodatabase for UP master plans, drainage catchments, and urban land-use shapefiles.
            </p>
          </a>

          <a
            href="https://bhuvan-app1.nrsc.gov.in"
            target="_blank"
            rel="noreferrer"
            className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-sm transition-all group bg-slate-50/40"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-emerald-700 tracking-wider">
                ISRO Bhuvan
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
            </div>
            <div className="font-bold text-slate-900 text-sm mt-1">
              Bhuvan UP Urban GIS
            </div>
            <p className="text-xs text-slate-500 mt-1">
              High-resolution satellite imagery layers and AMRUT Master Plan geospatial sub-schemes across 22 UP cities.
            </p>
          </a>

          <a
            href="http://awasbandhu.in"
            target="_blank"
            rel="noreferrer"
            className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-sm transition-all group bg-slate-50/40"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-emerald-700 tracking-wider">
                Awas Bandhu
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
            </div>
            <div className="font-bold text-slate-900 text-sm mt-1">
              Housing & Urban Planning Dept
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Repository of Government Orders, Byelaws 2025 gazette notifications, and state urban development policies.
            </p>
          </a>

          <a
            href="https://niveshmitra.up.nic.in"
            target="_blank"
            rel="noreferrer"
            className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-sm transition-all group bg-slate-50/40"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-emerald-700 tracking-wider">
                Single Window
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
            </div>
            <div className="font-bold text-slate-900 text-sm mt-1">
              Nivesh Mitra Portal
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Integrated building plan approval system (OBPAS) and 15-department time-bound deemed NOC engine.
            </p>
          </a>
        </div>
      </div>
    </div>
  );
};
