import React, { useState } from 'react';
import { Heartbeat } from '../../types/index.js';

interface SegmentedHeartbeatBarProps {
  heartbeats?: Heartbeat[];
  barsCount?: number;
}

export const SegmentedHeartbeatBar: React.FC<SegmentedHeartbeatBarProps> = ({
  heartbeats = [],
  barsCount = 30,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<Heartbeat | null>(null);

  // Fill up to barsCount
  const paddedBars = [...heartbeats].slice(-barsCount);
  const emptySlotsCount = Math.max(0, barsCount - paddedBars.length);
  const emptySlots = Array.from({ length: emptySlotsCount });

  return (
    <div className="relative group">
      {/* Tooltip */}
      {hoveredPoint && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-[11px] text-slate-200 shadow-xl pointer-events-none z-30 whitespace-nowrap flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              hoveredPoint.status === 'UP' ? 'bg-emerald-400' : 'bg-rose-500'
            }`}
          />
          <span className="font-semibold">{hoveredPoint.status}</span>
          <span className="text-slate-400">|</span>
          <span>{hoveredPoint.statusCode}</span>
          <span className="text-slate-400">|</span>
          <span className="text-sky-400">{hoveredPoint.responseTimeMs}ms</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-400">
            {new Date(hoveredPoint.checkedAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </span>
        </div>
      )}

      {/* Bars container */}
      <div className="flex items-center gap-[3px] h-6 py-1">
        {emptySlots.map((_, idx) => (
          <div
            key={`empty-${idx}`}
            className="flex-1 h-full rounded-sm bg-slate-800/40"
            title="No check record"
          />
        ))}

        {paddedBars.map((hb) => {
          const isUp = hb.status === 'UP';
          return (
            <div
              key={hb._id}
              onMouseEnter={() => setHoveredPoint(hb)}
              onMouseLeave={() => setHoveredPoint(null)}
              className={`flex-1 h-full rounded-sm transition-all cursor-pointer hover:scale-y-125 ${
                isUp
                  ? 'bg-emerald-500/80 hover:bg-emerald-400'
                  : 'bg-rose-500 hover:bg-rose-400'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};
