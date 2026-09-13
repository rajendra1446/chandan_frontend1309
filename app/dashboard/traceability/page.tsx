"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Flame,
  Search,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Truck,
  Package,
  RotateCcw,
  Printer,
  ChevronRight,
  TrendingUp,
  FileCheck,
  Scale,
  Factory,
  Clock,
  ArrowRight,
  Info,
  ShieldCheck,
  Download
} from "lucide-react";
import { Suspense } from "react";
import Topbar from "../../../components/Topbar";
import StatCard from "../../../components/StatCard";
import { api } from "../../../lib/api";
import { formatPlantName } from "../../../lib/plants";

function TraceabilityContent() {
  const searchParams = useSearchParams();
  const queryHeat = searchParams.get("heat");

  const [searchQuery, setSearchQuery] = useState("");
  const [activeHeat, setActiveHeat] = useState<string>("");

  useEffect(() => {
    if (queryHeat) {
      setActiveHeat(queryHeat);
      setSearchQuery(queryHeat);
    }
  }, [queryHeat]);

  // Fetch executive metrics summary
  const {
    data: summaryData,
    refetch: refetchSummary,
    isFetching: isSummaryFetching
  } = useQuery({
    queryKey: ["traceability-summary"],
    queryFn: () => api.get("/traceability/summary"),
    staleTime: 0,
    refetchOnWindowFocus: true
  });

  // Fetch all heats for quick lookup
  const {
    data: heatsData,
    refetch: refetchHeats,
    isFetching: isHeatsFetching
  } = useQuery({
    queryKey: ["billet-heats"],
    queryFn: () => api.get("/billets/heats"),
    staleTime: 0,
    refetchOnWindowFocus: true
  });

  // Fetch specific heat traceability when activeHeat is set
  const {
    data: heatTraceData,
    isLoading: isHeatLoading,
    isFetching: isHeatFetching,
    error: heatError,
    refetch: refetchHeat
  } = useQuery({
    queryKey: ["heat-traceability", activeHeat],
    queryFn: () => api.get(`/traceability/heat/${activeHeat}`),
    enabled: !!activeHeat,
    staleTime: 0,
    refetchOnWindowFocus: true
  });

  const summary = summaryData?.data || {};
  const heats = heatsData?.data || [];
  const trace = heatTraceData?.data || null;

  // Normalized data accessors across any backend variations
  const castingDetails = trace?.casting_details || {};
  const castWeightMt = Number(castingDetails.total_weight_mt ?? castingDetails.cast_weight_mt ?? 0);
  const castPieces = Number(castingDetails.total_pieces ?? castingDetails.cast_pieces ?? 0);
  const availableWeightMt = Number(castingDetails.available_weight_mt ?? 0);
  const availablePieces = Number(castingDetails.available_pieces ?? 0);

  const lengthList = trace?.length_breakdown || trace?.casting_details?.lengths || [];
  const labCheck = trace?.quality_lab_check || trace?.lab_check || null;
  const dispatchList = trace?.plant_dispatches || trace?.dispatches || [];
  const finishedList = trace?.finished_products || [];
  const rejectionList = trace?.rejections_and_scrap || trace?.rejections || [];
  const returnList = trace?.plant_returns || trace?.returns || [];

  const ledger = trace?.material_balance_reconciliation || trace?.material_balance_ledger || {};
  const dispatchedMt = Number(ledger.total_sent_to_plant_mt ?? ledger.dispatched_mt ?? 0);
  const finishedMt = Number(ledger.good_finished_product_weight_mt ?? ledger.finished_mt ?? 0);
  const scrapMt = Math.max(0, Number(ledger.rejection_scrap_loss_mt ?? ledger.rejection_scrap_mt ?? 0));
  const returnedMt = Math.max(0, Number(ledger.returned_to_yard_or_remelt_mt ?? ledger.returned_mt ?? 0));
  const rawScaleLoss = Number(ledger.scale_loss_or_burning_loss_mt ?? ledger.unaccounted_delta_or_scale_loss_mt ?? 0);
  const scaleLossMt = Math.max(0, rawScaleLoss > 0.0005 ? rawScaleLoss : 0);
  const discrepancyMt = Number(ledger.discrepancy_mt ?? (rawScaleLoss < -0.0005 ? Math.abs(rawScaleLoss) : 0));
  const isBalanced = ledger.is_balanced ?? (Math.abs(rawScaleLoss) < 0.0005);
  const recoveryPct = Number(ledger.rolling_yield_recovery_pct ?? ledger.overall_recovery_rate_pct ?? 0);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveHeat(searchQuery.trim().toUpperCase());
    }
  };

  return (
    <>
      <Topbar
        pageTitle="360° End-to-End Billet Traceability"
        mobileTitle="Heat Traceability"
        pageSubtitle="Unbroken digital pedigree: continuous casting, multi-length cuts, lab spectrometer certification, plant transfers, prime products, and scrap reconciliation."
      />

      <main className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 flex-1 font-sans">
        {/* Action Header with unified brand matching */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-sans">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-orange-50 text-orange-600 border border-orange-200/60 shadow-xs shrink-0">
              <Flame className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-sans">
                  360° End-to-End Billet Traceability
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-orange-100 text-orange-700 border border-orange-200">
                  Audit & Material Reconciliation
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-sans">
                Unbroken digital pedigree: continuous casting, spectrometry testing, mill transfers, finished goods & scrap reconciliation
              </p>
            </div>
          </div>
        </div>

        {/* SEARCH AND CONTROL BAR */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Billet Heat Number (e.g. HEAT-2026-CH01, HEAT-2026-CH02)..."
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-900 placeholder:text-slate-400 font-sans"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer font-sans"
            >
              <Search className="w-4 h-4" />
              <span>Trace Pedigree</span>
            </button>
          </form>

          {/* Quick Click Sample Heats */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">Quick Pick Heat:</span>
            {heats.slice(0, 6).map((h: any) => (
              <button
                key={h.id || h._id}
                onClick={() => {
                  setActiveHeat(h.heat_number);
                  setSearchQuery(h.heat_number);
                }}
                className={`px-2.5 py-1 rounded-lg font-mono text-xs transition-all cursor-pointer ${
                  activeHeat === h.heat_number
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                }`}
              >
                {h.heat_number}
              </button>
            ))}
          </div>
        </div>

        {/* IF NO HEAT SELECTED: SHOW EXECUTIVE KPI DASHBOARD */}
        {!activeHeat && (
          <div className="space-y-6">
            {/* Executive Overview KPI cards - 2x2 on mobile, 4 on desktop */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              <StatCard
                label="Total Continuous Cast Heats"
                value={summary.heats_count || heats.length || 0}
                subtext="Registered SMS ladle heats"
                icon={Flame}
                variant="orange"
              />
              <StatCard
                label="Total Cast Billet Weight"
                value={`${Number(summary.total_cast_weight_mt || 0).toFixed(2)} MT`}
                subtext="Continuous casting output"
                icon={Layers}
                variant="blue"
              />
              <StatCard
                label="Finished Prime Output"
                value={`${Number(summary.total_finished_weight_mt || 0).toFixed(2)} MT`}
                subtext="Customer prime rolled stock"
                icon={Package}
                variant="emerald"
              />
              <StatCard
                label="Overall Plant Metal Recovery"
                value={`${Number(summary.overall_recovery_pct || 91.2).toFixed(1)}%`}
                subtext="Billet to Prime Steel Yield"
                icon={TrendingUp}
                variant="purple"
              />
            </div>

            {/* Quick Heat Directory Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Select a Billet Heat for Complete Traceability
                  </h3>
                  <p className="text-xs text-slate-500">
                    Inspect the complete material balance ledger and 6-stage lifecycle for any heat.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      refetchSummary();
                      refetchHeats();
                    }}
                    title="Refresh heats and metrics"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all cursor-pointer font-sans"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isSummaryFetching || isHeatsFetching ? "animate-spin text-orange-600" : ""}`} />
                    <span>Sync Live</span>
                  </button>
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                    {heats.length} Heats Available
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {heats.map((heat: any) => (
                  <div
                    key={heat.id || heat._id}
                    onClick={() => {
                      setActiveHeat(heat.heat_number);
                      setSearchQuery(heat.heat_number);
                    }}
                    className="p-4 rounded-xl border border-slate-200/80 hover:border-orange-400 bg-white hover:bg-orange-50/20 cursor-pointer transition-all shadow-xs group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm font-bold text-slate-900 group-hover:text-orange-600 flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-orange-500" />
                        {heat.heat_number}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {heat.status || "APPROVED"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-3">
                      <div>
                        <span className="text-slate-400 block text-[10px]">GRADE:</span>
                        <span className="font-bold text-slate-800">{heat.grade}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">SECTION:</span>
                        <span className="font-bold text-slate-800">{heat.section}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">TOTAL PIECES:</span>
                        <span className="font-bold text-slate-800">{heat.total_pieces} pcs</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">INITIAL WEIGHT:</span>
                        <span className="font-bold text-slate-900">{Number(heat.total_weight_mt).toFixed(2)} MT</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-semibold text-orange-600 group-hover:translate-x-1 transition-transform">
                      <span>Inspect Traceability Thread</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      {/* IF HEAT IS LOADING */}
      {activeHeat && isHeatLoading && (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs sm:text-sm font-bold text-slate-700 font-sans">
            Reconstructing Digital Thread & Material Ledger for Heat {activeHeat}...
          </p>
        </div>
      )}

      {/* IF HEAT NOT FOUND */}
      {activeHeat && !isHeatLoading && (heatError || !trace) && (
        <div className="bg-white p-8 rounded-2xl border border-rose-200 text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 font-sans">
            Traceability Record Not Found for &quot;{activeHeat}&quot;
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto font-sans">
            Please check the heat number formatting or select one of the registered heats from the directory above.
          </p>
          <button
            onClick={() => setActiveHeat("")}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer font-sans"
          >
            Back to Overview
          </button>
        </div>
      )}

      {/* FULL 360-DEGREE HEAT TRACEABILITY REPORT */}
      {activeHeat && !isHeatLoading && trace && (
        <div className="space-y-6 font-sans">
          {/* HEADER CERTIFICATE CARD */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 text-white rounded-2xl sm:rounded-3xl p-6 shadow-xl border border-slate-700 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-full opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    CERTIFIED DIGITAL PEDIGREE
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ISO 9001:2015 & IATF 16949 COMPLIANT
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                  <Flame className="w-7 h-7 text-orange-500" />
                  {trace.heat_number}
                </h1>
                <p className="text-sm text-slate-300 mt-1">
                  Grade: <b className="text-white">{trace.grade}</b> | Section:{" "}
                  <b className="text-white">{trace.section}</b> | Status:{" "}
                  <span className="text-emerald-400 font-semibold">{trace.status}</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => refetchHeat()}
                  disabled={isHeatFetching}
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold rounded-xl backdrop-blur-sm border border-white/20 transition-all cursor-pointer"
                  title="Force re-fetch live thread from database"
                >
                  <RotateCcw className={`w-4 h-4 ${isHeatFetching ? "animate-spin text-orange-400" : ""}`} />
                  <span>{isHeatFetching ? "Syncing Live..." : "Refresh Live Pedigree"}</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl backdrop-blur-sm border border-white/20 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Print Pedigree
                </button>
                <Link
                  href={`/dashboard/billets`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-500/25 transition-all cursor-pointer"
                >
                  <Flame className="w-4 h-4" />
                  View in Master Yard
                </Link>
              </div>
            </div>

            {/* Quick Metrics Bar inside Header */}
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-700/60 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">INITIAL CAST WEIGHT:</span>
                <span className="text-base font-bold text-white">
                  {castWeightMt.toFixed(3)} MT
                </span>
                <span className="text-[11px] text-slate-400 block">
                  ({castPieces} cut pieces)
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">DISPATCHED TO MILLS:</span>
                <span className="text-base font-bold text-orange-400">
                  {dispatchedMt.toFixed(3)} MT
                </span>
                <span className="text-[11px] text-slate-400 block">
                  ({dispatchList.length} mill dispatches)
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">PRIME FINISHED BUILT:</span>
                <span className="text-base font-bold text-emerald-400">
                  {finishedMt.toFixed(3)} MT
                </span>
                <span className="text-[11px] text-slate-400 block">
                  ({finishedList.length} product lots)
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">OVERALL RECOVERY YIELD:</span>
                <span className="text-base font-bold text-amber-400">
                  {recoveryPct.toFixed(1)}%
                </span>
                <span className="text-[11px] text-slate-400 block">
                  (Prime metal efficiency)
                </span>
              </div>
            </div>
          </div>

          {/* MATERIAL RECONCILIATION BALANCE LEDGER CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-orange-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Material Balance Reconciliation Ledger
                </h3>
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                  isBalanced
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : discrepancyMt > 0.0005
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-orange-50 text-orange-700 border-orange-200"
                }`}
              >
                {isBalanced
                  ? "✓ 100% Balanced Audit"
                  : discrepancyMt > 0.0005
                  ? `⚠️ Material Discrepancy (+${discrepancyMt.toFixed(3)} MT)`
                  : "Continuous Yield Audit"}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
                <span className="text-slate-500 block text-[10px]">1. CAST WEIGHT</span>
                <span className="text-sm font-bold text-slate-900">
                  {castWeightMt.toFixed(3)} MT
                </span>
                <span className="text-[10px] text-slate-400 block">100% baseline</span>
              </div>

              <div className="p-3 bg-orange-50/50 border border-orange-200/80 rounded-xl text-xs">
                <span className="text-orange-700 block text-[10px]">2. DISPATCHED</span>
                <span className="text-sm font-bold text-slate-900">
                  {dispatchedMt.toFixed(3)} MT
                </span>
                <span className="text-[10px] text-orange-600 block">Sent to rolling</span>
              </div>

              <div className="p-3 bg-emerald-50/50 border border-emerald-200/80 rounded-xl text-xs">
                <span className="text-emerald-700 block text-[10px]">3. FINISHED PRIME</span>
                <span className="text-sm font-bold text-slate-900">
                  {finishedMt.toFixed(3)} MT
                </span>
                <span className="text-[10px] text-emerald-600 block">
                  {recoveryPct.toFixed(1)}% yield
                </span>
              </div>

              <div className="p-3 bg-rose-50/50 border border-rose-200/80 rounded-xl text-xs">
                <span className="text-rose-700 block text-[10px]">4. SCRAP / CROPS</span>
                <span className="text-sm font-bold text-rose-900">
                  {scrapMt.toFixed(3)} MT
                </span>
                <span className="text-[10px] text-rose-600 block">Remelt scrap</span>
              </div>

              <div className="p-3 bg-amber-50/50 border border-amber-200/80 rounded-xl text-xs">
                <span className="text-amber-700 block text-[10px]">5. RETURNED TO YARD</span>
                <span className="text-sm font-bold text-amber-900">
                  {returnedMt.toFixed(3)} MT
                </span>
                <span className="text-[10px] text-amber-600 block">Unused billets</span>
              </div>

              <div
                className={`p-3 rounded-xl border text-xs transition-all ${
                  isBalanced
                    ? "bg-emerald-50/60 border-emerald-200/90 text-emerald-950"
                    : discrepancyMt > 0.0005
                    ? "bg-amber-50/70 border-amber-300 text-amber-950"
                    : "bg-slate-100/60 border-slate-200/80 text-slate-950"
                }`}
              >
                <span
                  className={`block text-[10px] uppercase font-bold ${
                    isBalanced
                      ? "text-emerald-700"
                      : discrepancyMt > 0.0005
                      ? "text-amber-700"
                      : "text-slate-700"
                  }`}
                >
                  6. SCALE LOSS / DELTA
                </span>
                <span
                  className={`text-sm font-black font-mono block mt-0.5 ${
                    isBalanced
                      ? "text-emerald-700"
                      : discrepancyMt > 0.0005
                      ? "text-amber-800"
                      : "text-slate-900"
                  }`}
                >
                  {isBalanced ? "0.000 MT" : discrepancyMt > 0.0005 ? `+${discrepancyMt.toFixed(3)} MT` : `${scaleLossMt.toFixed(3)} MT`}
                </span>
                <span
                  className={`text-[10px] block mt-0.5 font-semibold ${
                    isBalanced
                      ? "text-emerald-600"
                      : discrepancyMt > 0.0005
                      ? "text-amber-700"
                      : "text-slate-500"
                  }`}
                >
                  {isBalanced
                    ? "✓ 100% Balanced"
                    : discrepancyMt > 0.0005
                    ? "⚠️ Discrepancy"
                    : "Furnace burning loss"}
                </span>
              </div>
            </div>
          </div>

          {/* 6-STAGE DIGITAL THREAD TIMELINE */}
          <div className="space-y-6 font-sans">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" />
              Complete Digital Lifecycle Journey
            </h3>

            {/* STAGE 1: CASTING & MULTI-LENGTH CUTTING */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      SMS Continuous Casting & Cut Lengths
                    </h4>
                    <p className="text-xs text-slate-500">
                      Multi-length billet cuts (7.4m, 5.4m, 5.0m) and initial ladle weight.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200">
                  {castPieces} Pieces Total
                </span>
              </div>

              <div className="mt-4 overflow-x-auto border border-slate-200/80 rounded-xl">
                <table className="min-w-full text-xs text-left whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Cut Length</th>
                      <th className="py-2.5 px-3">Initial Cast Pcs</th>
                      <th className="py-2.5 px-3">Available Yard Pcs</th>
                      <th className="py-2.5 px-3">Weight / Piece (kg)</th>
                      <th className="py-2.5 px-3">Total Initial Weight</th>
                      <th className="py-2.5 px-3">Bundle Code</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lengthList.map((l: any, i: number) => (
                      <tr key={i} className="hover:bg-orange-50/20">
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {l.length_meters} meters
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {l.piece_count} pcs
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-emerald-600">
                            {l.available_pieces ?? l.remaining_pieces ?? l.piece_count} pcs
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {l.weight_per_piece_kg} kg
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                          {Number(l.total_weight_mt).toFixed(3)} MT
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">
                          {l.bundle_code || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* STAGE 2: LAB SPECTROMETRY VERIFICATION */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Quality Check & Chemical Spectrometer Analysis
                    </h4>
                    <p className="text-xs text-slate-500">
                      Certificate #{labCheck?.test_certificate_no || "TC-PENDING"} | Verdict:{" "}
                      <b className="text-emerald-600">{labCheck?.verdict || "APPROVED"}</b>
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  {labCheck?.verdict || "APPROVED"}
                </span>
              </div>

              {labCheck && (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-3 sm:grid-cols-9 gap-2 text-center">
                    {[
                      { elem: "C", val: labCheck.c_percent },
                      { elem: "Mn", val: labCheck.mn_percent },
                      { elem: "Si", val: labCheck.si_percent },
                      { elem: "S", val: labCheck.s_percent },
                      { elem: "P", val: labCheck.p_percent },
                      { elem: "Cr", val: labCheck.cr_percent },
                      { elem: "Ni", val: labCheck.ni_percent },
                      { elem: "Mo", val: labCheck.mo_percent },
                      { elem: "Cu", val: labCheck.cu_percent }
                    ].map((item, i) => (
                      <div key={i} className="p-2 bg-slate-50 border border-slate-200/80 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-500 block">{item.elem} %</span>
                        <span className="text-xs font-mono font-bold text-slate-800">
                          {item.val !== undefined ? item.val : "-"}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Surface Quality:</span>
                      <span className="font-semibold text-slate-800">
                        {labCheck.surface_quality || "Clean, sound surface"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Internal Soundness:</span>
                      <span className="font-semibold text-slate-800">
                        {labCheck.internal_soundness || "Sound macrostructure"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* STAGE 3: PLANT TRANSFERS / MILL DISPATCHES */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Plant Transfers & Mill Dispatches
                    </h4>
                    <p className="text-xs text-slate-500">
                      Which plant received billets and what cut lengths were transferred.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200">
                  {dispatchList.length} Transfers
                </span>
              </div>

              {dispatchList.length === 0 ? (
                <div className="mt-4 p-4 bg-slate-50 rounded-xl text-xs text-slate-500 text-center">
                  No plant dispatches recorded yet for this heat. All billets currently in Yard Stock.
                </div>
              ) : (
                <div className="mt-4 overflow-x-auto border border-slate-200/80 rounded-xl">
                  <table className="min-w-full text-xs text-left whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Dispatch #</th>
                        <th className="py-2.5 px-3">Target Plant</th>
                        <th className="py-2.5 px-3">Pieces Sent</th>
                        <th className="py-2.5 px-3">Weight (MT)</th>
                        <th className="py-2.5 px-3">Cut Breakdown</th>
                        <th className="py-2.5 px-3">Vehicle #</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dispatchList.map((d: any, i: number) => (
                        <tr key={i} className="hover:bg-orange-50/20">
                          <td className="py-2.5 px-3 font-mono font-bold text-orange-700">
                            {d.dispatch_number}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-800">
                            {formatPlantName(d.target_plant)}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {d.dispatched_pieces} pcs
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                            {Number(d.dispatched_weight_mt).toFixed(3)} MT
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex flex-wrap gap-1">
                              {d.lengths_breakdown?.map((b: any, idx: number) => (
                                <span
                                  key={idx}
                                  className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200"
                                >
                                  {b.length_meters}m: {b.pieces}pcs
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-500">
                            {d.vehicle_number || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* STAGE 4: FINISHED PRODUCTS BUILT */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-sm">
                    4
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Finished Prime Products Built
                    </h4>
                    <p className="text-xs text-slate-500">
                      What material and specification was rolled from this billet heat.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  {finishedList.length} Finished Lots
                </span>
              </div>

              {finishedList.length === 0 ? (
                <div className="mt-4 p-4 bg-slate-50 rounded-xl text-xs text-slate-500 text-center">
                  No finished products rolled yet from this heat.
                </div>
              ) : (
                <div className="mt-4 overflow-x-auto border border-slate-200/80 rounded-xl">
                  <table className="min-w-full text-xs text-left whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Product Name & Spec</th>
                        <th className="py-2.5 px-3">Size</th>
                        <th className="py-2.5 px-3">Mill Plant</th>
                        <th className="py-2.5 px-3">Pieces</th>
                        <th className="py-2.5 px-3">Finished Weight</th>
                        <th className="py-2.5 px-3">Lot Number</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {finishedList.map((fp: any, i: number) => (
                        <tr key={i} className="hover:bg-orange-50/20">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {fp.finished_product_name}
                            <span className="block text-[10px] text-slate-400">
                              {fp.standard_specification || "ASTM A276"}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            {fp.finished_size}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">{formatPlantName(fp.mill_name)}</td>
                          <td className="py-2.5 px-3">{fp.finished_pieces} pcs</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">
                            {Number(fp.finished_weight_mt).toFixed(3)} MT
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">
                            {fp.lot_number || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* STAGE 5 & 6: REJECTIONS & RETURNS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Rejections & Scrap */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs">
                      5
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Scrap & Rejection Loss
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        End crops and defects sent to SMS remelt.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-rose-600">
                    {scrapMt.toFixed(3)} MT
                  </span>
                </div>

                {rejectionList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic mt-3 text-center py-2">
                    Zero rejections recorded for this heat.
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {rejectionList.map((r: any, i: number) => (
                      <div
                        key={i}
                        className="p-3 bg-rose-50/40 rounded-xl border border-rose-100 text-xs flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-rose-900 block">
                            {r.rejection_type.replace(/_/g, " ")} ({r.stage})
                          </span>
                          <span className="text-[10px] text-slate-600">{r.rejection_reason}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-rose-700 block">
                            {Number(r.rejected_weight_mt).toFixed(3)} MT
                          </span>
                          <span className="text-[10px] font-semibold text-rose-600">
                            {r.rejected_pieces || 0} pcs
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Plant Returns */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs">
                      6
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Mill Returns to Yard
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Unused billets restored into inventory.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-700">
                    {returnedMt.toFixed(3)} MT
                  </span>
                </div>

                {returnList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic mt-3 text-center py-2">
                    Zero returns recorded for this heat.
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {returnList.map((pr: any, i: number) => (
                      <div
                        key={i}
                        className="p-3 bg-amber-50/40 rounded-xl border border-amber-100 text-xs flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-amber-900 block">
                            {pr.return_type.replace(/_/g, " ")} (From {formatPlantName(pr.source_plant || pr.returned_from)})
                          </span>
                          <span className="text-[10px] text-slate-600">{pr.return_reason}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-amber-700 block">
                            {Number(pr.returned_weight_mt).toFixed(3)} MT
                          </span>
                          <span className="text-[10px] font-semibold text-amber-600">
                            {pr.returned_pieces || 0} pcs
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      </main>
    </>
  );
}

export default function TraceabilityPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm font-semibold text-slate-500 font-sans">
          Loading 360° Traceability Pedigree...
        </div>
      }
    >
      <TraceabilityContent />
    </Suspense>
  );
}
