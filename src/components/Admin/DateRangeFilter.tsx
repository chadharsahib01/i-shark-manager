import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  ChevronDown,
  Clock,
  Sparkles,
  RotateCcw,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check
} from 'lucide-react';
import {
  DateRangePresetId,
  DATE_RANGE_PRESETS,
  getPresetDateRange,
  formatRangeDisplay,
  countDaysInclusive
} from '../../utils/datePresets';
import { addDaysLocal, getLocalDateString } from '../../utils/dateUtils';

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  presetId: DateRangePresetId;
  onChangeRange: (startDate: string, endDate: string, presetId: DateRangePresetId) => void;
  className?: string;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  startDate,
  endDate,
  presetId,
  onChangeRange,
  className = '',
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Handle choosing a preset template
  const handleSelectPreset = (id: DateRangePresetId) => {
    const range = getPresetDateRange(id, startDate, endDate);
    onChangeRange(range.startDate, range.endDate, id);
    setDropdownOpen(false);
  };

  // Handle custom date input changes
  const handleStartDateChange = (newStart: string) => {
    let newEnd = endDate;
    if (newStart > endDate) {
      newEnd = newStart;
    }
    onChangeRange(newStart, newEnd, 'custom');
  };

  const handleEndDateChange = (newEnd: string) => {
    let newStart = startDate;
    if (newEnd < startDate) {
      newStart = newEnd;
    }
    onChangeRange(newStart, newEnd, 'custom');
  };

  // Navigate step back or forward (e.g. shift window by same span)
  const daysSpan = countDaysInclusive(startDate, endDate);

  const handleShiftPeriod = (direction: 'prev' | 'next') => {
    if (presetId === 'thisMonth' || presetId === 'lastMonth') {
      // Month-based shift
      const [yStr, mStr] = startDate.split('-');
      const y = parseInt(yStr, 10);
      const m = parseInt(mStr, 10) - 1;
      const targetMonthDate = new Date(y, direction === 'next' ? m + 1 : m - 1, 1);
      const tY = targetMonthDate.getFullYear();
      const tM = String(targetMonthDate.getMonth() + 1).padStart(2, '0');
      const lastDay = String(new Date(tY, targetMonthDate.getMonth() + 1, 0).getDate()).padStart(2, '0');
      onChangeRange(`${tY}-${tM}-01`, `${tY}-${tM}-${lastDay}`, 'custom');
      return;
    }

    const shiftDays = direction === 'next' ? daysSpan : -daysSpan;
    const newStart = addDaysLocal(startDate, shiftDays);
    const newEnd = addDaysLocal(endDate, shiftDays);
    onChangeRange(newStart, newEnd, 'custom');
  };

  const currentPresetDef = DATE_RANGE_PRESETS.find((p) => p.id === presetId);
  const activeLabel = formatRangeDisplay(startDate, endDate, presetId);
  const daysCount = countDaysInclusive(startDate, endDate);

  // Top quick-access buttons for immediate 1-click filtering
  const quickPresets: DateRangePresetId[] = [
    'thisMonth',
    'lastMonth',
    'last7days',
    'last15days',
    'last30days',
    'today'
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Top row: Preset chips and Templates menu */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="tag-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center space-x-1 mr-1">
            <Filter className="w-3 h-3 text-violet-400" />
            <span>Templates:</span>
          </span>

          {quickPresets.map((pid) => {
            const p = DATE_RANGE_PRESETS.find((item) => item.id === pid)!;
            const isActive = presetId === pid;
            return (
              <button
                key={pid}
                type="button"
                id={`btn-preset-${pid}`}
                onClick={() => handleSelectPreset(pid)}
                className={`px-2.5 py-1 rounded-lg tag-mono text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-950/60 border border-violet-400/40'
                    : 'bg-slate-950/70 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                <span>{p.shortLabel}</span>
              </button>
            );
          })}

          {/* More Templates Dropdown */}
          <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
              type="button"
              id="btn-more-presets-dropdown"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`px-2.5 py-1 rounded-lg tag-mono text-xs font-bold border transition flex items-center space-x-1 cursor-pointer ${
                dropdownOpen || !quickPresets.includes(presetId)
                  ? 'bg-violet-950/90 text-violet-300 border-violet-500/50'
                  : 'bg-slate-950/70 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
            >
              <Sparkles className="w-3 h-3 text-violet-400" />
              <span>More Templates</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-64 rounded-xl bg-slate-950/95 border border-violet-500/30 shadow-2xl p-2 z-50 backdrop-blur-md">
                <div className="px-2 py-1.5 text-[10px] font-mono font-bold text-violet-400 uppercase tracking-wider border-b border-slate-800/80 mb-1 flex items-center justify-between">
                  <span>PREMADE TEMPLATES</span>
                  <span className="text-[9px] text-slate-500">{DATE_RANGE_PRESETS.length} presets</span>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-0.5 custom-scrollbar">
                  {DATE_RANGE_PRESETS.map((p) => {
                    const isSelected = presetId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPreset(p.id)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-violet-600/30 text-white border border-violet-500/40 font-bold'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                        }`}
                      >
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span>{p.label}</span>
                            {p.id === 'thisMonth' && (
                              <span className="text-[8px] px-1 py-0.2 rounded bg-violet-500/20 text-violet-300 font-bold">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-normal">
                            {p.description}
                          </div>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-violet-400 shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Shift previous / next period */}
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => handleShiftPeriod('prev')}
            className="p-1.5 rounded-lg bg-slate-950/70 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer"
            title="Shift to previous period"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleShiftPeriod('next')}
            className="p-1.5 rounded-lg bg-slate-950/70 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer"
            title="Shift to next period"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset('thisMonth')}
            className="p-1.5 rounded-lg bg-slate-950/70 hover:bg-slate-800 text-slate-400 hover:text-violet-300 border border-slate-800 transition cursor-pointer"
            title="Reset to Current Month"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom row: Exact Date Pickers & Active Range Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
        <div className="flex flex-wrap items-center gap-3">
          {/* Start Date */}
          <div className="flex items-center space-x-1.5">
            <span className="tag-mono text-[11px] text-slate-400 font-bold uppercase">FROM:</span>
            <input
              type="date"
              id="filter-start-date"
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg border border-slate-700 bg-slate-900 text-white outline-hidden focus:border-violet-500 cursor-pointer"
            />
          </div>

          {/* End Date */}
          <div className="flex items-center space-x-1.5">
            <span className="tag-mono text-[11px] text-slate-400 font-bold uppercase">TO:</span>
            <input
              type="date"
              id="filter-end-date"
              value={endDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
              className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg border border-slate-700 bg-slate-900 text-white outline-hidden focus:border-violet-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Selected Period Badge */}
        <div className="flex items-center space-x-2">
          <div className="px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-300 font-mono text-xs flex items-center space-x-1.5">
            <CalendarRange className="w-3.5 h-3.5 text-violet-400" />
            <span className="font-bold">{activeLabel}</span>
            {daysCount < 9999 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-violet-600/40 text-violet-200 font-bold">
                {daysCount} {daysCount === 1 ? 'day' : 'days'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
