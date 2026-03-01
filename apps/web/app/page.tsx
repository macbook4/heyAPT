"use client";

import type { ReactElement } from "react";
import { useState } from "react";
import { NaverMapView, type PoiSummary } from "@/components/NaverMapView";
import { PriceRangeFilter } from "@/components/PriceRangeFilter";

type FilterType = "tradeType" | "maxPrice";

type FilterOption = {
  label: string;
  value: string;
};

const TRADE_OPTIONS: FilterOption[] = [
  { label: "전체", value: "all" },
  { label: "매매", value: "sale" },
  { label: "전월세", value: "lease" },
];

/**
 * Formats price chip label with selected range.
 */
function getPriceRangeLabel(min: number, max: number): string {
  if (min === 0 && max === 40) {
    return "";
  }
  if (min === 0) {
    return `: ~${max}억`;
  }
  if (max === 40) {
    return `: ${min}억~`;
  }
  return `: ${min}~${max}억`;
}

/**
 * Renders map-first home page with Tailwind + Radix slider filters.
 */
export default function HomePage(): ReactElement {
  const [openFilter, setOpenFilter] = useState<FilterType | null>(null);
  const [tradeType, setTradeType] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 40 });
  const [selectedPoi, setSelectedPoi] = useState<PoiSummary | null>(null);

  /**
   * Toggles filter panel by filter key.
   */
  function onFilterChipClick(type: FilterType): void {
    setOpenFilter((prev) => (prev === type ? null : type));
  }

  return (
    <main className="relative h-screen w-full overflow-hidden md:grid md:grid-cols-[320px_1fr]">
      <section className="absolute left-3 right-3 top-3 z-20 md:static md:h-screen">
        <div className="relative h-full">
          <header className="rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur md:h-full md:overflow-y-auto md:rounded-none md:border-x-0 md:border-l-0 md:border-r md:border-r-slate-200 md:bg-white md:p-5 md:shadow-none">
            <div className="grid gap-3 md:gap-4">
              <section className="grid gap-2.5" aria-label="Search">
                <h1 className="m-0 text-lg font-semibold tracking-tight md:text-2xl">heyAPT</h1>
                <div className="flex items-center gap-2 md:grid md:gap-2.5">
                  <input
                    type="search"
                    placeholder="지역/아파트 검색"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-emerald-200 placeholder:text-slate-400 focus:ring-2"
                  />
                  <button
                    type="button"
                    className="whitespace-nowrap rounded-lg border border-emerald-600 bg-emerald-600 px-3 py-2 text-sm text-white md:w-full"
                  >
                    검색
                  </button>
                </div>
              </section>

              <section className="grid gap-2.5" aria-label="Filter">
                <h2 className="m-0 text-sm font-semibold text-slate-800">필터</h2>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={`rounded-full border px-3 py-1.5 text-xs ${
                      openFilter === "tradeType"
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : "border-slate-300 bg-white text-slate-700"
                    }`}
                    onClick={() => onFilterChipClick("tradeType")}
                  >
                    거래유형
                    {tradeType !== "all"
                      ? `: ${TRADE_OPTIONS.find((x) => x.value === tradeType)?.label ?? "전체"}`
                      : ""}
                  </button>

                  <button
                    type="button"
                    className={`rounded-full border px-3 py-1.5 text-xs ${
                      openFilter === "maxPrice"
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : "border-slate-300 bg-white text-slate-700"
                    }`}
                    onClick={() => onFilterChipClick("maxPrice")}
                  >
                    최대가격
                    {getPriceRangeLabel(priceRange.min, priceRange.max)}
                  </button>
                </div>

                {openFilter === "tradeType" ? (
                  <div className="grid gap-1.5 rounded-xl border border-slate-200 bg-white p-2" role="listbox">
                    {TRADE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                          tradeType === option.value
                            ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                            : "border-slate-200 bg-slate-50 text-slate-700"
                        }`}
                        onClick={() => {
                          setTradeType(option.value);
                          setOpenFilter(null);
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                ) : null}

                {openFilter === "maxPrice" ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-2.5">
                    <PriceRangeFilter value={priceRange} onChange={setPriceRange} />
                  </div>
                ) : null}
              </section>
            </div>
          </header>

          {selectedPoi ? (
            <aside className="absolute inset-0 z-30 rounded-xl border border-emerald-200 bg-white/95 p-4 shadow-xl backdrop-blur md:rounded-none md:border-x-0 md:border-l-0 md:border-r md:border-r-slate-200 md:bg-white md:p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="m-0 text-xs font-medium text-emerald-700">result-bar</p>
                  <h2 className="m-0 mt-1 text-base font-semibold text-slate-900">선택된 POI</h2>
                </div>
                <button
                  type="button"
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"
                  onClick={() => setSelectedPoi(null)}
                >
                  닫기
                </button>
              </div>

              <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="m-0 text-xs text-slate-500">ID</p>
                <p className="m-0 text-sm font-medium text-slate-900">{selectedPoi.id}</p>
                <p className="m-0 text-xs text-slate-500">이름</p>
                <p className="m-0 text-sm font-medium text-slate-900">{selectedPoi.title}</p>
                <p className="m-0 text-xs text-slate-500">좌표</p>
                <p className="m-0 text-sm font-medium text-slate-900">
                  {selectedPoi.lat}, {selectedPoi.lng}
                </p>
              </div>
            </aside>
          ) : null}
        </div>
      </section>

      <NaverMapView onPoiSelect={setSelectedPoi} />
    </main>
  );
}
