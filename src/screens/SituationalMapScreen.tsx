import React, { useState, useRef, useEffect } from 'react';
import { useCrisis } from '../context/CrisisContext';
import { Incident } from '../types';
import { Anchor, Navigation, AlertTriangle, Droplets, Users } from 'lucide-react';

export const SituationalMapScreen: React.FC = () => {
  const { incidents, resources, selectedIncident, selectIncident, setScreen } = useCrisis();
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'FLOOD' | 'BOATS'>('ALL');
  const [focusedIncident, setFocusedIncident] = useState<Incident | null>(
    selectedIncident || incidents[0] || null
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Filtered incidents
  const displayedIncidents = incidents.filter((inc) => {
    if (activeFilter === 'FLOOD') return inc.waterDepthMeters >= 1.0;
    if (activeFilter === 'BOATS') return inc.assignedResourceName?.includes('Boat');
    return true;
  });

  // Render tactical GIS canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let pulseAngle = 0;

    const render = () => {
      pulseAngle += 0.05;
      const width = canvas.width;
      const height = canvas.height;

      // Clear dark background
      ctx.fillStyle = '#070E18';
      ctx.fillRect(0, 0, width, height);

      // A. Tactical Coordinate Grid
      ctx.strokeStyle = '#132438';
      ctx.lineWidth = 1;
      const step = 45;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // B. Flood River Corridor (Yamuna)
      const riverGrad = ctx.createLinearGradient(0, 0, width, height);
      riverGrad.addColorStop(0, 'rgba(0, 48, 73, 0.45)');
      riverGrad.addColorStop(0.5, 'rgba(2, 62, 138, 0.6)');
      riverGrad.addColorStop(1, 'rgba(0, 119, 182, 0.75)');

      ctx.beginPath();
      ctx.moveTo(width * 0.15, 0);
      ctx.bezierCurveTo(
        width * 0.45,
        height * 0.25,
        width * 0.35,
        height * 0.55,
        width * 0.75,
        height * 0.85
      );
      ctx.lineTo(width * 0.95, height);
      ctx.lineTo(width * 0.7, height);
      ctx.bezierCurveTo(
        width * 0.25,
        height * 0.65,
        width * 0.28,
        height * 0.35,
        width * 0.05,
        0
      );
      ctx.closePath();
      ctx.fillStyle = riverGrad;
      ctx.fill();

      // C. Hazard Inundation Polygon (Mayur Vihar breached zone)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(width * 0.3, height * 0.32);
      ctx.lineTo(width * 0.72, height * 0.28);
      ctx.lineTo(width * 0.82, height * 0.55);
      ctx.lineTo(width * 0.5, height * 0.62);
      ctx.lineTo(width * 0.25, height * 0.48);
      ctx.closePath();
      ctx.fillStyle = 'rgba(217, 4, 41, 0.16)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(229, 57, 53, 0.7)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.stroke();
      ctx.restore();

      // D. Tactical Navigation Route (if focused incident is assigned or selected)
      if (focusedIncident) {
        const incIdx = incidents.findIndex((i) => i.incidentId === focusedIncident.incidentId);
        const effectiveIdx = incIdx >= 0 ? incIdx : 0;
        const incX = (0.2 + effectiveIdx * 0.15) * width;
        const incY = (0.25 + (effectiveIdx % 3) * 0.22) * height;

        const depotX = width * 0.18;
        const depotY = height * 0.75;

        // Route Glow
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(depotX, depotY);
        ctx.lineTo(width * 0.25, height * 0.58);
        ctx.lineTo(width * 0.42, height * 0.48);
        ctx.lineTo(incX, incY);
        ctx.strokeStyle = 'rgba(0, 194, 224, 0.25)';
        ctx.lineWidth = 8;
        ctx.stroke();

        // Dashed Core Route
        ctx.strokeStyle = '#00C2E0';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([12, 6]);
        ctx.stroke();
        ctx.restore();
      }

      // E. Draw Resource Depots
      resources.forEach((res, i) => {
        const rx = (0.15 + i * 0.14) * width;
        const ry = (0.7 + (i % 2) * 0.08) * height;

        // Outer field halo
        ctx.beginPath();
        ctx.arc(rx, ry, 14, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 200, 83, 0.2)';
        ctx.fill();

        // Inner solid circle
        ctx.beginPath();
        ctx.arc(rx, ry, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#00C853';
        ctx.fill();

        // Resource Label
        ctx.font = '10px ui-sans-serif, sans-serif';
        ctx.fillStyle = '#94A3B8';
        ctx.fillText(res.name.split(' ')[0], rx - 14, ry + 16);
      });

      // F. Draw Incidents
      displayedIncidents.forEach((inc) => {
        const idx = incidents.findIndex((i) => i.incidentId === inc.incidentId);
        const ix = (0.2 + idx * 0.15) * width;
        const iy = (0.25 + (idx % 3) * 0.22) * height;
        const isSelected = inc.incidentId === focusedIncident?.incidentId;

        const markerColor =
          inc.severity === 'CRITICAL'
            ? '#E53935'
            : inc.severity === 'HIGH'
            ? '#FF6B00'
            : inc.severity === 'MEDIUM'
            ? '#FFB300'
            : '#00C2E0';

        // Outer pulsing ring for critical / selected
        if (inc.severity === 'CRITICAL' || isSelected) {
          const pulseRadius = (isSelected ? 20 : 14) + Math.sin(pulseAngle) * 3;
          ctx.beginPath();
          ctx.arc(ix, iy, pulseRadius, 0, Math.PI * 2);
          ctx.fillStyle = isSelected
            ? 'rgba(0, 194, 224, 0.3)'
            : 'rgba(229, 57, 53, 0.35)';
          ctx.fill();
        }

        // Marker Body
        ctx.beginPath();
        ctx.arc(ix, iy, isSelected ? 10 : 7, 0, Math.PI * 2);
        ctx.fillStyle = markerColor;
        ctx.fill();

        // White Center Core
        ctx.beginPath();
        ctx.arc(ix, iy, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        // Incident Tag
        ctx.font = 'bold 9px ui-sans-serif, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(inc.incidentId, ix - 16, iy - 12);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [incidents, resources, focusedIncident, displayedIncidents]);

  // Click canvas to select nearest incident
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    let closest: Incident | null = null;
    let minDistance = Infinity;

    incidents.forEach((inc, idx) => {
      const ix = (0.2 + idx * 0.15) * canvas.width;
      const iy = (0.25 + (idx % 3) * 0.22) * canvas.height;
      const dist = Math.hypot(clickX - ix, clickY - iy);
      if (dist < minDistance && dist < 60) {
        minDistance = dist;
        closest = inc;
      }
    });

    if (closest) {
      setFocusedIncident(closest);
      selectIncident(closest);
    }
  };

  const handleResize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }
  };

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative w-full h-[calc(100vh-120px)] bg-[#070E18] overflow-hidden flex flex-col">
      {/* 1. Tactical Vector Canvas */}
      <div className="relative flex-1 w-full h-full">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          data-testid="tactical_gis_map_canvas"
          className="w-full h-full cursor-crosshair block"
        />

        {/* 2. Map HUD Overlay */}
        <div className="absolute top-3 left-3 right-3 flex flex-col gap-2 pointer-events-none">
          {/* Layer Filter Chips */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              onClick={() => setActiveFilter('ALL')}
              data-testid="filter_all"
              className={`px-3 py-1 rounded-full text-xs font-bold transition border ${
                activeFilter === 'ALL'
                  ? 'bg-[#FF6B00] text-white border-[#FF6B00]'
                  : 'bg-[#0E1A2B]/90 text-[#94A3B8] border-[#223854] hover:text-white'
              }`}
            >
              All Assets ({incidents.length})
            </button>
            <button
              onClick={() => setActiveFilter('FLOOD')}
              data-testid="filter_flood"
              className={`px-3 py-1 rounded-full text-xs font-bold transition border ${
                activeFilter === 'FLOOD'
                  ? 'bg-[#008BA3] text-white border-[#00C2E0]'
                  : 'bg-[#0E1A2B]/90 text-[#94A3B8] border-[#223854] hover:text-white'
              }`}
            >
              Water Level &gt; 1m
            </button>
            <button
              onClick={() => setActiveFilter('BOATS')}
              data-testid="filter_boats"
              className={`px-3 py-1 rounded-full text-xs font-bold transition border ${
                activeFilter === 'BOATS'
                  ? 'bg-[#009624] text-white border-[#00C853]'
                  : 'bg-[#0E1A2B]/90 text-[#94A3B8] border-[#223854] hover:text-white'
              }`}
            >
              Rescue Boats
            </button>
          </div>

          {/* Telemetry Indicator */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#070E18]/90 border border-[#223854] backdrop-blur-md self-start pointer-events-auto shadow-lg">
            <span className="w-2 h-2 rounded-full bg-[#E53935] animate-ping" />
            <span className="text-[10px] font-bold tracking-wide text-white">
              LIVE GIS: YAMUNA BASIN SECTOR 1-5 • HAZARD RED ZONE ACTIVE
            </span>
          </div>
        </div>
      </div>

      {/* 3. Bottom Tactical Drawer for Selected Incident */}
      {focusedIncident && (
        <div
          data-testid="map_marker_detail_card"
          className="bg-[#0E1A2B] border-t border-[#223854] p-4 shadow-2xl z-20 max-w-2xl mx-auto w-full"
        >
          <div className="flex items-center justify-between">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase ${
                focusedIncident.severity === 'CRITICAL'
                  ? 'bg-[#E53935]'
                  : focusedIncident.severity === 'HIGH'
                  ? 'bg-[#FF6B00]'
                  : 'bg-[#FFB300]'
              }`}
            >
              {focusedIncident.severity} • {focusedIncident.urgency}
            </span>

            <span className="text-xs font-bold text-[#00C2E0]">
              Priority Score: {focusedIncident.priorityScore}/100
            </span>
          </div>

          <h3 className="text-sm sm:text-base font-bold text-white mt-1.5">
            {focusedIncident.title}
          </h3>

          <div className="flex items-center gap-4 text-xs text-[#94A3B8] mt-1">
            <span className="flex items-center gap-1">
              📍 {focusedIncident.locationName}
            </span>
            <span className="flex items-center gap-1 text-[#00C2E0] font-semibold">
              <Droplets className="w-3 h-3" />
              {focusedIncident.waterDepthMeters}m depth
            </span>
            <span className="flex items-center gap-1 text-[#FF6B00] font-semibold">
              <Users className="w-3 h-3" />
              {focusedIncident.affectedPopulation} victims
            </span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-[#223854]/60">
            <button
              onClick={() => {
                selectIncident(focusedIncident);
                setScreen('RESOURCE_ALLOCATION');
              }}
              data-testid="map_dispatch_button"
              className="py-2 px-3 bg-[#FF6B00] hover:bg-[#FF8533] text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow"
            >
              <Anchor className="w-3.5 h-3.5" />
              <span>Allocate Resource</span>
            </button>

            <button
              onClick={() => {
                selectIncident(focusedIncident);
                setScreen('ROUTE_TRACKING');
              }}
              data-testid="map_navigate_button"
              className="py-2 px-3 bg-[#070E18] hover:bg-[#16253B] text-[#00C2E0] border border-[#00C2E0] font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Follow Route</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
