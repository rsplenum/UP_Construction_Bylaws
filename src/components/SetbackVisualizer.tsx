import React, { useState, useMemo } from 'react';
import { Compass, Info, CheckCircle2, Sliders, Shield } from 'lucide-react';
import { PLOTTED_RESIDENTIAL_SETBACKS, HIGH_RISE_SETBACKS } from '../data/byelawsData';

export const SetbackVisualizer: React.FC = () => {
  const [plotWidth, setPlotWidth] = useState<number>(12); // meters
  const [plotDepth, setPlotDepth] = useState<number>(20); // meters
  const [buildingHeight, setBuildingHeight] = useState<number>(12); // meters
  const [isCornerPlot, setIsCornerPlot] = useState<boolean>(false);
  const [hasStilt, setHasStilt] = useState<boolean>(true);
  const [occupancy, setOccupancy] = useState<'single_unit' | 'multi_unit' | 'commercial' | 'group_housing'>('single_unit');

  const plotArea = plotWidth * plotDepth;

  // Derive setbacks from the ingested Byelaws Chapter 3.2.4
  const setbackInfo = useMemo(() => {
    let front = 3.0;
    let rear = 1.5;
    let side1 = 0.0;
    let side2 = 0.0;
    let maxHeight = 15.0;
    let maxFloors = "3 floors + stilt";
    let ruleRef = "Chapter 3.2.4.1";

    if (occupancy === 'single_unit' || occupancy === 'multi_unit') {
      if (plotArea <= 150) {
        front = 1.0;
        rear = 0.0;
        side1 = 0.0;
        side2 = 0.0;
      } else if (plotArea <= 300) {
        front = 3.0;
        rear = 1.5;
        side1 = 0.0;
        side2 = 0.0;
      } else if (plotArea <= 500) {
        front = 3.0;
        rear = 3.0;
        side1 = 0.0;
        side2 = 0.0;
      } else if (plotArea <= 1200) {
        front = 4.5;
        rear = 4.5;
        side1 = 1.5;
        side2 = 0.0;
      } else {
        front = 6.0;
        rear = 6.0;
        side1 = 1.5;
        side2 = 1.5;
      }

      if (occupancy === 'multi_unit') {
        maxHeight = 17.5;
        maxFloors = "4 storeys + mandatory stilt";
      } else {
        maxHeight = 15.0;
        maxFloors = "3 storeys + optional stilt";
      }
    } else if (occupancy === 'group_housing') {
      ruleRef = "Chapter 3.2.4.2 & 3.2.4.9";
      if (buildingHeight <= 15) {
        front = 5.0;
        rear = 5.0;
        side1 = 5.0;
        side2 = 5.0;
      } else {
        const hr = HIGH_RISE_SETBACKS.find(
          (h) => buildingHeight >= h.minHeight && buildingHeight <= h.maxHeight
        ) || HIGH_RISE_SETBACKS[HIGH_RISE_SETBACKS.length - 1];
        front = hr.front;
        rear = hr.rear;
        side1 = hr.side1;
        side2 = hr.side2;
      }
      maxHeight = 999;
      maxFloors = "No restriction (Subject to airport funnel & monument NOC)";
    } else if (occupancy === 'commercial') {
      ruleRef = "Chapter 3.2.4.3";
      if (plotArea <= 100) {
        front = 1.5;
        rear = 0;
        side1 = 0;
        side2 = 0;
      } else if (plotArea <= 300) {
        front = 3.0;
        rear = 0;
        side1 = 0;
        side2 = 0;
      } else if (plotArea <= 1000) {
        front = 4.5;
        rear = 3.0;
        side1 = 1.5;
        side2 = 1.5;
      } else if (plotArea <= 3000) {
        front = 6.0;
        rear = 3.0;
        side1 = 3.0;
        side2 = 3.0;
      } else {
        front = 12.0;
        rear = 6.0;
        side1 = 6.0;
        side2 = 6.0;
      }
      maxHeight = 999;
      maxFloors = "No restriction (Commercial)";
    }

    // Corner plot modification (Chapter 3.2.4.1 Note-2)
    let effectiveSide2 = side2;
    if (isCornerPlot) {
      effectiveSide2 = Math.max(side2, front);
    }

    // Envelope calculations
    const envelopeWidth = Math.max(0, plotWidth - side1 - effectiveSide2);
    const envelopeDepth = Math.max(0, plotDepth - front - rear);
    const envelopeArea = envelopeWidth * envelopeDepth;
    const groundCoveragePercent = plotArea > 0 ? (envelopeArea / plotArea) * 100 : 0;

    return {
      front,
      rear,
      side1,
      side2: effectiveSide2,
      maxHeight,
      maxFloors,
      ruleRef,
      envelopeWidth,
      envelopeDepth,
      envelopeArea,
      groundCoveragePercent,
    };
  }, [plotArea, plotWidth, plotDepth, buildingHeight, isCornerPlot, occupancy]);

  // Scaled SVG dimensions
  const svgWidth = 360;
  const svgHeight = 420;
  const margin = 40;
  const scale = Math.min((svgWidth - 2 * margin) / plotWidth, (svgHeight - 2 * margin - 50) / plotDepth);

  const plotSvgW = plotWidth * scale;
  const plotSvgH = plotDepth * scale;
  const plotX = (svgWidth - plotSvgW) / 2;
  const plotY = margin + 30;

  const envX = plotX + setbackInfo.side1 * scale;
  const envY = plotY + setbackInfo.rear * scale; // In drawing: top is rear, bottom is front towards road
  const envW = Math.max(0, setbackInfo.envelopeWidth * scale);
  const envH = Math.max(0, setbackInfo.envelopeDepth * scale);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Parameters Panel */}
      <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 border-b pb-3">
          <Compass className="w-5 h-5 text-emerald-600" />
          <h3 className="text-base font-bold text-slate-900">
            Plot & Building Geometry
          </h3>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Occupancy Type
          </label>
          <select
            value={occupancy}
            onChange={(e) => setOccupancy(e.target.value as any)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
          >
            <option value="single_unit">Residential Plotted: Single Unit (max 15m ht)</option>
            <option value="multi_unit">Residential Plotted: Multi Unit (max 17.5m ht)</option>
            <option value="group_housing">Residential Group Housing</option>
            <option value="commercial">Commercial / Retail Shopping</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Plot Width (Frontage)
            </label>
            <div className="flex items-center space-x-1">
              <input
                type="number"
                min="3"
                max="100"
                value={plotWidth}
                onChange={(e) => setPlotWidth(Math.max(3, Number(e.target.value)))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800"
              />
              <span className="text-xs text-slate-500">m</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Plot Depth
            </label>
            <div className="flex items-center space-x-1">
              <input
                type="number"
                min="5"
                max="150"
                value={plotDepth}
                onChange={(e) => setPlotDepth(Math.max(5, Number(e.target.value)))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800"
              />
              <span className="text-xs text-slate-500">m</span>
            </div>
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border flex justify-between items-center text-xs">
          <span className="text-slate-600 font-medium">Computed Plot Area:</span>
          <span className="font-mono font-bold text-slate-900 text-sm">{plotArea.toFixed(1)} sqm</span>
        </div>

        {occupancy === 'group_housing' && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Proposed Building Height (meters)
            </label>
            <input
              type="number"
              min="5"
              max="150"
              value={buildingHeight}
              onChange={(e) => setBuildingHeight(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800"
            />
            <span className="text-[11px] text-slate-500">
              Setbacks scale progressively above 15m as per Chapter 3.2.4.9
            </span>
          </div>
        )}

        <div className="space-y-2 pt-2 border-t text-xs">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isCornerPlot}
              onChange={(e) => setIsCornerPlot(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-slate-800 font-medium">
              Corner Plot (Side-2 setback equals front setback as per Note-2)
            </span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hasStilt}
              onChange={(e) => setHasStilt(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-slate-800 font-medium">
              Stilt Floor Proposed (Mandatory for multi-unit; exempt from FAR)
            </span>
          </label>
        </div>

        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-1 text-emerald-900">
          <span className="font-bold flex items-center gap-1">
            <Info className="w-3.5 h-3.5" />
            <span>Authority Norms Applied:</span>
          </span>
          <p>Governing Section: <strong>{setbackInfo.ruleRef}</strong></p>
          <p>Max Height: <strong>{setbackInfo.maxHeight === 999 ? 'No Height Restriction' : `${setbackInfo.maxHeight} meters`}</strong></p>
          <p>Permissible Storeys: <strong>{setbackInfo.maxFloors}</strong></p>
        </div>
      </div>

      {/* 2D Architectural Diagram & Metrics */}
      <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-base font-bold text-slate-900">
            2D Site Layout & Building Envelope Diagram
          </h3>
          <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded font-bold">
            Ground Coverage: {setbackInfo.groundCoveragePercent.toFixed(1)}%
          </span>
        </div>

        {/* Setback Numeric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
            <span className="text-slate-500 block">Front Setback</span>
            <span className="font-bold text-emerald-800 text-sm">{setbackInfo.front} m</span>
          </div>
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
            <span className="text-slate-500 block">Rear Setback</span>
            <span className="font-bold text-emerald-800 text-sm">{setbackInfo.rear} m</span>
          </div>
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-slate-500 block">Side-1 (Left)</span>
            <span className="font-bold text-slate-800 text-sm">{setbackInfo.side1} m</span>
          </div>
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-slate-500 block">Side-2 (Right)</span>
            <span className="font-bold text-slate-800 text-sm">{setbackInfo.side2} m</span>
          </div>
        </div>

        {/* Scaled SVG Architectural Representation */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50/70 rounded-xl border border-slate-200">
          <svg
            width={svgWidth}
            height={svgHeight}
            className="overflow-visible select-none drop-shadow-sm"
          >
            {/* Background Grid */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width={svgWidth} height={svgHeight} fill="url(#grid)" rx="8" />

            {/* Rear Neighbor indicator (top) */}
            <text x={svgWidth / 2} y={plotY - 12} textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="600">
              REAR BOUNDARY ({setbackInfo.rear}m Setback)
            </text>

            {/* Plot Boundary */}
            <rect
              x={plotX}
              y={plotY}
              width={plotSvgW}
              height={plotSvgH}
              fill="#f8fafc"
              stroke="#0f172a"
              strokeWidth="2.5"
            />

            {/* Building Envelope (Buildable Area) */}
            {envW > 0 && envH > 0 ? (
              <g>
                <rect
                  x={envX}
                  y={envY}
                  width={envW}
                  height={envH}
                  fill="#10b981"
                  fillOpacity="0.22"
                  stroke="#059669"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                />
                <text
                  x={envX + envW / 2}
                  y={envY + envH / 2}
                  textAnchor="middle"
                  fill="#065f46"
                  fontSize="11"
                  fontWeight="bold"
                >
                  PERMISSIBLE ENVELOPE
                </text>
                <text
                  x={envX + envW / 2}
                  y={envY + envH / 2 + 14}
                  textAnchor="middle"
                  fill="#065f46"
                  fontSize="9"
                >
                  {setbackInfo.envelopeArea.toFixed(1)} sqm ({setbackInfo.envelopeWidth.toFixed(1)}m × {setbackInfo.envelopeDepth.toFixed(1)}m)
                </text>
              </g>
            ) : (
              <text
                x={plotX + plotSvgW / 2}
                y={plotY + plotSvgH / 2}
                textAnchor="middle"
                fill="#e11d48"
                fontSize="11"
                fontWeight="bold"
              >
                Setbacks exceed plot dimensions!
              </text>
            )}

            {/* Dimension Labels */}
            {/* Plot width top */}
            <text x={plotX + plotSvgW / 2} y={plotY + 12} textAnchor="middle" fill="#334155" fontSize="9" fontWeight="600">
              Width: {plotWidth}m
            </text>

            {/* Plot depth left */}
            <text
              x={plotX - 10}
              y={plotY + plotSvgH / 2}
              textAnchor="middle"
              fill="#334155"
              fontSize="9"
              fontWeight="600"
              transform={`rotate(-90 ${plotX - 10} ${plotY + plotSvgH / 2})`}
            >
              Depth: {plotDepth}m
            </text>

            {/* Abutting Road (Bottom) */}
            <rect
              x={plotX - 25}
              y={plotY + plotSvgH + 4}
              width={plotSvgW + 50}
              height="34"
              fill="#334155"
              rx="4"
            />
            <line
              x1={plotX - 20}
              y1={plotY + plotSvgH + 21}
              x2={plotX + plotSvgW + 20}
              y2={plotY + plotSvgH + 21}
              stroke="#fbbf24"
              strokeWidth="1.5"
              strokeDasharray="6 4"
            />
            <text
              x={plotX + plotSvgW / 2}
              y={plotY + plotSvgH + 24}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="9"
              fontWeight="bold"
            >
              FRONT ACCESS ROAD (MIN {occupancy === 'group_housing' ? '12m' : '9m'} ROW)
            </text>

            {/* Corner road if toggled */}
            {isCornerPlot && (
              <g>
                <rect
                  x={plotX + plotSvgW + 4}
                  y={plotY - 20}
                  width="30"
                  height={plotSvgH + 58}
                  fill="#475569"
                  rx="3"
                />
                <text
                  x={plotX + plotSvgW + 19}
                  y={plotY + plotSvgH / 2}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="8"
                  fontWeight="bold"
                  transform={`rotate(90 ${plotX + plotSvgW + 19} ${plotY + plotSvgH / 2})`}
                >
                  SIDE ROAD ({setbackInfo.side2}m Setback)
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Envelope Metrics footer */}
        <div className="p-3 bg-slate-50 rounded-lg border text-xs text-slate-700 flex flex-wrap justify-between gap-2">
          <div>
            <span className="text-slate-500">Max Ground Floor Footprint:</span>
            <span className="font-mono font-bold text-slate-900 ml-1.5">
              {setbackInfo.envelopeArea.toFixed(1)} sqm
            </span>
          </div>
          <div>
            <span className="text-slate-500">Permissible Ground Coverage:</span>
            <span className="font-mono font-bold text-emerald-800 ml-1.5">
              {setbackInfo.groundCoveragePercent.toFixed(1)}% of plot
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
