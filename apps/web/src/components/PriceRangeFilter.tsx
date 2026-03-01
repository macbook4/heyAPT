"use client";

import * as Slider from "@radix-ui/react-slider";
import type { ReactElement } from "react";

export type PriceRangeValue = {
  min: number;
  max: number;
};

type PricePreset = {
  label: string;
  min: number;
  max: number;
};

const PRICE_MIN = 0;
const PRICE_MAX = 40;
const SNAP_THRESHOLD_POSITION = 3;
const TICK_VALUES = [0, 5, 10, 20, 30, 40];
const TICK_COUNT = TICK_VALUES.length;
const SEGMENT_SIZE = 100 / (TICK_COUNT - 1);

const PRESETS: PricePreset[] = [
  { label: "전체", min: 0, max: 40 },
  { label: "~2억", min: 0, max: 2 },
  { label: "~3억", min: 0, max: 3 },
  { label: "~4억", min: 0, max: 4 },
  { label: "~5억", min: 0, max: 5 },
  { label: "~6억", min: 0, max: 6 },
  { label: "~10억", min: 0, max: 10 },
  { label: "~12억", min: 0, max: 12 },
  { label: "15억~", min: 15, max: 40 },
  { label: "20억~", min: 20, max: 40 },
  { label: "30억~", min: 30, max: 40 },
  { label: "40억~", min: 40, max: 40 },
];

type PriceRangeFilterProps = {
  value: PriceRangeValue;
  onChange: (value: PriceRangeValue) => void;
};

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Converts real price value to equal-spaced slider position (0~100).
 */
function valueToPosition(value: number): number {
  const clamped = clampNumber(value, PRICE_MIN, PRICE_MAX);
  for (let i = 0; i < TICK_VALUES.length - 1; i += 1) {
    const start = TICK_VALUES[i];
    const end = TICK_VALUES[i + 1];
    if (clamped <= end) {
      const localRatio = end === start ? 0 : (clamped - start) / (end - start);
      return (i + localRatio) * SEGMENT_SIZE;
    }
  }
  return 100;
}

/**
 * Converts slider position (0~100) back to real price value.
 */
function positionToValue(position: number): number {
  const clampedPosition = clampNumber(position, 0, 100);
  const segmentIndex = Math.min(TICK_VALUES.length - 2, Math.floor(clampedPosition / SEGMENT_SIZE));
  const start = TICK_VALUES[segmentIndex];
  const end = TICK_VALUES[segmentIndex + 1];
  const segmentStartPosition = segmentIndex * SEGMENT_SIZE;
  const localRatio = (clampedPosition - segmentStartPosition) / SEGMENT_SIZE;
  return Math.round(start + (end - start) * localRatio);
}

/**
 * Snaps position to nearest visual tick when close enough.
 */
function snapToNearestTickPosition(position: number): number {
  const tickPositions = TICK_VALUES.map((_, idx) => idx * SEGMENT_SIZE);
  const nearestTickPosition = tickPositions.reduce((closest, tickPos) =>
    Math.abs(tickPos - position) < Math.abs(closest - position) ? tickPos : closest,
  );
  if (Math.abs(nearestTickPosition - position) <= SNAP_THRESHOLD_POSITION) {
    return nearestTickPosition;
  }
  return position;
}

/**
 * Renders range slider + presets for price filtering.
 */
export function PriceRangeFilter({ value, onChange }: PriceRangeFilterProps): ReactElement {
  const sliderValue = [valueToPosition(value.min), valueToPosition(value.max)];

  /**
   * Updates range while dragging thumbs.
   */
  function onSliderValueChange(nextValues: number[]): void {
    const [minPosition, maxPosition] = nextValues;
    const min = positionToValue(minPosition);
    const max = positionToValue(maxPosition);
    onChange({
      min: Math.min(min, max),
      max: Math.max(max, min),
    });
  }

  /**
   * Applies weak snapping on commit.
   */
  function onSliderValueCommit(nextValues: number[]): void {
    const [rawMinPosition, rawMaxPosition] = nextValues;
    const snappedMinPosition = snapToNearestTickPosition(rawMinPosition);
    const snappedMaxPosition = snapToNearestTickPosition(rawMaxPosition);
    const snappedMin = positionToValue(snappedMinPosition);
    const snappedMax = positionToValue(snappedMaxPosition);
    onChange({
      min: Math.min(snappedMin, snappedMax),
      max: Math.max(snappedMax, snappedMin),
    });
  }

  /**
   * Applies preset range.
   */
  function onPresetClick(preset: PricePreset): void {
    onChange({ min: preset.min, max: preset.max });
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
        <span>선택 범위</span>
        <span>
          {value.min}억 ~ {value.max}억
        </span>
      </div>
      <div className="relative px-1 pt-1">
        <Slider.Root
          className="relative flex h-8 select-none items-center"
          min={0}
          max={100}
          step={1}
          minStepsBetweenThumbs={0}
          value={sliderValue}
          onValueChange={onSliderValueChange}
          onValueCommit={onSliderValueCommit}
          aria-label="가격 범위"
        >
          <Slider.Track className="relative h-2 w-full rounded-full bg-slate-300">
            <Slider.Range className="absolute h-full rounded-full bg-emerald-600" />
          </Slider.Track>
          <Slider.Thumb
            className="block size-5 rounded-full border-2 border-white bg-emerald-600 shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-300"
            aria-label="최소 가격"
          />
          <Slider.Thumb
            className="block size-5 rounded-full border-2 border-white bg-emerald-700 shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-300"
            aria-label="최대 가격"
          />
        </Slider.Root>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            className={`rounded-full border px-2.5 py-1 text-xs ${
              value.min === preset.min && value.max === preset.max
                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : "border-slate-300 bg-white text-slate-700"
            }`}
            onClick={() => onPresetClick(preset)}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
