"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Truck,
  Plus,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Factory,
  ArrowRight,
  Layers,
  Trash2,
  Pencil,
  FileSpreadsheet,
  ArrowLeftRight
} from "lucide-react";
import Topbar from "../../../components/Topbar";
import StatCard from "../../../components/StatCard";
import DataTable from "../../../components/DataTable";
import Modal from "../../../components/Modal";
import { ColumnDef } from "@tanstack/react-table";
import { api } from "../../../lib/api";
import { dispatchSchema } from "../../../lib/schemas";
import { PLANT_CATEGORIES, formatPlantName } from "../../../lib/plants";

export default function DispatchesPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDispatch, setSelectedDispatch] = useState<any | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [heatNumber, setHeatNumber] = useState("");
  const [targetPlant, setTargetPlant] = useState("");
  const [remarks, setRemarks] = useState("");
  const [overrideLabCheck, setOverrideLabCheck] = useState(false);

  // Edit State
  const [editingDispatch, setEditingDispatch] = useState<any | null>(null);
  const [editTargetPlant, setEditTargetPlant] = useState("");
  const [editDispatchedPieces, setEditDispatchedPieces] = useState<string>("0");
  const [editDispatchedWeightMt, setEditDispatchedWeightMt] = useState<string>("0");
  const [editStatus, setEditStatus] = useState("DISPATCHED");
  const [editRemarks, setEditRemarks] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  // Length breakdown lines for dispatch
  const [breakdown, setBreakdown] = useState<Array<{
    length_meters: number | string;
    pieces: number | string;
    weight_mt: number | string;
  }>>([]);

  // Pagination & Search state for backend pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");

  // Fetch Dispatches with backend pagination & search
  const {
    data: dispatchesData,
    isLoading,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ["dispatches", page, pageSize, search],
    queryFn: () =>
      api.get(
        `/dispatches?page=${page}&limit=${pageSize}&search=${encodeURIComponent(search)}`
      )
  });

  // Fetch Heats to pick from available yard inventory
  const { data: heatsData } = useQuery({
    queryKey: ["billet-heats"],
    queryFn: () => api.get("/billets/heats")
  });

  // Fetch Plants / Mills dynamically from database
  const { data: plantsData } = useQuery({
    queryKey: ["plants"],
    queryFn: () => api.get("/plants")
  });

  const dispatches = dispatchesData?.data || [];
  const pagination = dispatchesData?.pagination;
  const heats = heatsData?.data || [];
  const plantsList = plantsData?.data || [];

  // When heat changes, auto-populate available lengths or update breakdown
  const selectedHeatData = heats.find((h: any) => h.heat_number === heatNumber);

  const handleHeatSelect = (hNo: string) => {
    setHeatNumber(hNo);
    const found = heats.find((h: any) => h.heat_number === hNo);
    if (found && found.lengths && found.lengths.length > 0) {
      // populate default breakdown row from first length
      const firstL = found.lengths[0];
      const pcs = Math.min(firstL.available_pieces || firstL.piece_count || 4, 4);
      const wtPerPc = firstL.weight_per_piece_kg || 836.5;
      const wtMt = Number(((pcs * wtPerPc) / 1000).toFixed(3));
      setBreakdown([{
        length_meters: firstL.length_meters,
        pieces: pcs,
        weight_mt: wtMt
      }]);
    }
  };

  // Calculations for breakdown
  const totalDispatchedPieces = breakdown.reduce((acc, row) => acc + (Number(row.pieces) || 0), 0);
  const totalDispatchedWeightMt = Number(
    breakdown.reduce((acc, row) => acc + (Number(row.weight_mt) || 0), 0).toFixed(3)
  );

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newDispatch: any) => api.post("/dispatches", newDispatch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispatches"] });
      queryClient.invalidateQueries({ queryKey: ["billet-heats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["traceability-summary"] });
      queryClient.invalidateQueries({ queryKey: ["heat-traceability"] });
      setIsCreateOpen(false);
      setFormError(null);
      setHeatNumber("");
      setTargetPlant("");
      setRemarks("");
      setBreakdown([]);
    },
    onError: (err: any) => {
      setFormError(err.message || "Failed to create plant dispatch.");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/dispatches/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispatches"] });
      queryClient.invalidateQueries({ queryKey: ["billet-heats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["traceability-summary"] });
      queryClient.invalidateQueries({ queryKey: ["heat-traceability"] });
      setSelectedDispatch(null);
    }
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/dispatches/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispatches"] });
      queryClient.invalidateQueries({ queryKey: ["billet-heats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["traceability-summary"] });
      queryClient.invalidateQueries({ queryKey: ["heat-traceability"] });
      setEditingDispatch(null);
      setEditError(null);
    },
    onError: (err: any) => {
      setEditError(err.message || "Failed to update dispatch record.");
    }
  });

  const handleOpenEdit = (dispatch: any) => {
    setEditingDispatch(dispatch);
    setEditTargetPlant(formatPlantName(dispatch.target_plant) || "RM10 - New Plant Rolling Mill 10");
    setEditDispatchedPieces(String(dispatch.dispatched_pieces ?? 0));
    setEditDispatchedWeightMt(String(dispatch.dispatched_weight_mt ?? 0));
    setEditStatus(dispatch.status || "DISPATCHED");
    setEditRemarks(dispatch.remarks || "");
    setEditError(null);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDispatch) return;
    editMutation.mutate({
      id: editingDispatch.id || editingDispatch._id,
      data: {
        target_plant: editTargetPlant,
        dispatched_pieces: Number(editDispatchedPieces) || 0,
        dispatched_weight_mt: Number(editDispatchedWeightMt) || 0,
        status: editStatus,
        remarks: editRemarks
      }
    });
  };

  // KPI calculations
  const totalDispatchesCount = pagination?.total ?? dispatches.length;
  const totalWeightDispatched = dispatches
    .reduce((acc: number, d: any) => acc + (Number(d.dispatched_weight_mt) || 0), 0)
    .toFixed(3);
  const totalPiecesDispatched = dispatches.reduce(
    (acc: number, d: any) => acc + (Number(d.dispatched_pieces) || 0),
    0
  );
  const uniquePlants = Array.from(new Set(dispatches.map((d: any) => formatPlantName(d.target_plant)))).length;

  // Handle Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!heatNumber) {
      setFormError("Please select a billet heat number.");
      return;
    }

    if (totalDispatchedPieces <= 0 || totalDispatchedWeightMt <= 0) {
      setFormError("Total pieces and dispatched weight must be greater than zero.");
      return;
    }

    const payload = {
      heat_number: heatNumber.trim().toUpperCase(),
      target_plant: targetPlant,
      dispatched_pieces: totalDispatchedPieces,
      dispatched_weight_mt: totalDispatchedWeightMt,
      lengths_breakdown: breakdown.map((b) => ({
        length_meters: Number(b.length_meters) || 0,
        pieces: Number(b.pieces) || 0,
        weight_mt: Number(b.weight_mt) || 0
      })),
      override_lab_check: overrideLabCheck,
      remarks: remarks || undefined
    };

    createMutation.mutate(payload);
  };

  // Add/Remove breakdown row
  const handleAddBreakdownRow = () => {
    setBreakdown([
      ...breakdown,
      { length_meters: 0, pieces: 0, weight_mt: 0 }
    ]);
  };

  const handleRemoveBreakdownRow = (index: number) => {
    if (breakdown.length <= 1) return;
    setBreakdown(breakdown.filter((_, i) => i !== index));
  };

  const handleBreakdownChange = (index: number, field: string, val: string | number) => {
    const updated = [...breakdown];
    (updated[index] as any)[field] = val;

    // Auto-recalculate MT if length or pieces change (default cross-section ~113.04 kg/m)
    if (field === "length_meters" || field === "pieces") {
      const len = Number(field === "length_meters" ? val : updated[index].length_meters) || 0;
      const pcs = Number(field === "pieces" ? val : updated[index].pieces) || 0;
      if (len > 0 && pcs > 0) {
        const autoMt = Number(((len * 113.04 * pcs) / 1000).toFixed(4));
        updated[index].weight_mt = autoMt;
      }
    }

    setBreakdown(updated);
  };

  // Columns definition for DataTable
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "heat_number",
      header: "Heat Number",
      cell: ({ row }) => {
        const val = row.getValue("heat_number") as string;
        return (
          <div className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <Link
              href={`/dashboard/traceability?heat=${val}`}
              className="font-semibold text-slate-900 hover:text-orange-600 hover:underline transition-colors"
            >
              {val}
            </Link>
          </div>
        );
      }
    },
    {
      accessorKey: "target_plant",
      header: "Target Plant",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 font-medium text-slate-800">
          <Factory className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="font-semibold text-xs text-slate-900">{formatPlantName(row.getValue("target_plant"))}</span>
        </div>
      )
    },
    {
      accessorKey: "dispatched_pieces",
      header: "Pieces",
      cell: ({ row }) => (
        <span className="font-bold text-slate-900">
          {row.getValue("dispatched_pieces")} <span className="text-xs font-normal text-slate-500">pcs</span>
        </span>
      )
    },
    {
      accessorKey: "dispatched_weight_mt",
      header: "Dispatched (MT)",
      cell: ({ row }) => (
        <span className="font-bold text-slate-900">
          {Number(row.getValue("dispatched_weight_mt")).toFixed(3)}{" "}
          <span className="text-xs font-normal text-slate-500">MT</span>
        </span>
      )
    },
    {
      id: "lengths_breakdown",
      header: "Length Breakdown",
      cell: ({ row }) => {
        const bd = row.original.lengths_breakdown || [];
        if (!bd.length) {
          return <span className="text-xs text-slate-400 italic">Uniform</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {bd.map((b: any, idx: number) => (
              <span
                key={idx}
                className="text-[11px] font-medium bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200"
              >
                {b.length_meters}m: <b>{b.pieces} pcs</b>
              </span>
            ))}
          </div>
        );
      }
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.getValue("status") as string;
        const isReceived = s === "RECEIVED";
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${isReceived
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-orange-50 text-orange-700 border border-orange-200"
              }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            {s || "DISPATCHED"}
          </span>
        );
      }
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedDispatch(row.original)}
            className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenEdit(row.original)}
            className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
            title="Edit Dispatch"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (confirm(`Are you sure you want to delete this dispatch of Heat ${row.original.heat_number}? Pieces will be restored to inventory.`)) {
                deleteMutation.mutate(row.original.id || row.original._id);
              }
            }}
            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Delete Dispatch"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <Link
            href={`/dashboard/traceability?heat=${row.original.heat_number}`}
            className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
            title="Inspect Heat Traceability"
          >
            <Flame className="w-4 h-4" />
          </Link>
        </div>
      )
    }
  ];

  return (
    <>
      <Topbar
        pageTitle="Plant Transfers & Mill Dispatches"
        mobileTitle="Unit Transfers"
        pageSubtitle="Manage billet shipments from casting yard to rolling mills and processing units with cut-length deductions."
      />

      <main className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 flex-1 font-sans">
        {/* Action Header with unified brand matching */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-sans">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-orange-50 text-orange-600 border border-orange-200/60 shadow-xs shrink-0">
              <ArrowLeftRight className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-sans">
                  Plant Transfers & Mill Dispatches
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-orange-100 text-orange-700 border border-orange-200">
                  Step 3: Unit Transfers
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-sans">
                Real-time yard inventory deduction, length breakdown manifests & mill logistics
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin text-orange-500" : ""}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => {
                setIsCreateOpen(true);
                setFormError(null);
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-md shadow-orange-500/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Plant Dispatch</span>
            </button>
          </div>
        </div>

        {/* KPI Cards - 2x2 on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <StatCard
            label="Total Mill Shipments"
            value={totalDispatchesCount}
            subtext="Active manifest transfers"
            icon={Truck}
            variant="orange"
          />
          <StatCard
            label="Total Dispatched Weight"
            value={`${totalWeightDispatched} MT`}
            subtext="Transfer tonnage sent"
            icon={Layers}
            variant="blue"
          />
          <StatCard
            label="Total Billet Pieces"
            value={`${totalPiecesDispatched} pcs`}
            subtext="Multi-length cuts sent"
            icon={Factory}
            variant="purple"
          />
          <StatCard
            label="Active Plant Units"
            value={uniquePlants}
            subtext="Rolling & wire rod mills"
            icon={Factory}
            variant="emerald"
          />
        </div>

        {/* DataTable */}
        <DataTable
          columns={columns}
          data={dispatches}
          searchPlaceholder="Search by dispatch #, heat #, target plant, vehicle..."
          isLoading={isLoading}
          serverPagination={{
            page,
            pageSize,
            total: pagination?.total ?? dispatches.length,
            totalPages:
              pagination?.totalPages ??
              Math.max(1, Math.ceil((pagination?.total ?? dispatches.length) / pageSize)),
            onPageChange: (newPage) => setPage(newPage),
            onPageSizeChange: (newSize) => {
              setPageSize(newSize);
              setPage(1);
            }
          }}
          searchValue={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
        />

        {/* CREATE DISPATCH MODAL */}
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="Issue New Plant Billet Dispatch"
          subtitle="Transfer verified cut billets from the continuous casting yard to a target processing plant."
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Heat Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                  Select Billet Heat *
                </label>
                <select
                  value={heatNumber}
                  onChange={(e) => handleHeatSelect(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800 font-sans"
                >
                  <option value="">-- Select Heat from Yard Stock --</option>
                  {heats.map((h: any) => (
                    <option key={h.id || h._id} value={h.heat_number}>
                      {h.heat_number} | {h.grade} | {h.section} (Avail: {h.available_pieces} pcs / {Number(h.available_weight_mt).toFixed(2)} MT)
                    </option>
                  ))}
                </select>
                {selectedHeatData && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Grade: <b>{selectedHeatData.grade}</b> | Yard Stock: <b>{selectedHeatData.available_pieces} pcs</b> ({Number(selectedHeatData.available_weight_mt).toFixed(2)} MT)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                  Target Plant / Mill *
                </label>
                <select
                  value={targetPlant}
                  onChange={(e) => setTargetPlant(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800 font-sans cursor-pointer"
                >
                  <option value="">-- Select Target Plant / Mill (7 Units Only) --</option>
                  {PLANT_CATEGORIES.map((cat) => (
                    <optgroup key={cat.category} label={`── ${cat.categoryLabel} ──`}>
                      {cat.plants.map((p) => (
                        <option key={p.code} value={p.label}>
                          {p.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>

            {/* Override Lab Check option */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={overrideLabCheck}
                  onChange={(e) => setOverrideLabCheck(e.target.checked)}
                  className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 w-4 h-4"
                />
                <span>Override mandatory lab approval (Special Emergency Dispatch)</span>
              </label>
            </div>

            {/* Lengths Breakdown Selector */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Cut Lengths Breakdown to Dispatch
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Select which meter cuts (e.g. 7.4m, 5.4m, 5.0m) and how many pieces are loaded.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddBreakdownRow}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-white border border-slate-200 text-orange-600 rounded-xl hover:bg-orange-50/50 transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Cut
                </button>
              </div>

              <div className="space-y-2">
                {breakdown.map((row, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-2 sm:grid-cols-12 gap-2.5 items-end sm:items-center bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs"
                  >
                    <div className="col-span-1 sm:col-span-4">
                      <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                        Cut Length (M)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={row.length_meters}
                        onChange={(e) =>
                          handleBreakdownChange(idx, "length_meters", e.target.value)
                        }
                        className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg font-semibold text-slate-800 focus:ring-1 focus:ring-orange-500"
                      />
                    </div>

                    <div className="col-span-1 sm:col-span-3">
                      <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                        Pieces
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={row.pieces}
                        onChange={(e) =>
                          handleBreakdownChange(idx, "pieces", e.target.value)
                        }
                        className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg font-semibold text-slate-800 focus:ring-1 focus:ring-orange-500"
                      />
                    </div>

                    <div className="col-span-1 sm:col-span-4">
                      <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                        Weight (MT)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={row.weight_mt}
                        onChange={(e) =>
                          handleBreakdownChange(idx, "weight_mt", e.target.value)
                        }
                        className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg font-bold text-slate-900 bg-slate-50 focus:ring-1 focus:ring-orange-500"
                      />
                    </div>

                    <div className="col-span-1 sm:col-span-1 flex justify-end sm:justify-center pt-1 sm:pt-3">
                      <button
                        type="button"
                        onClick={() => handleRemoveBreakdownRow(idx)}
                        disabled={breakdown.length <= 1}
                        className="text-slate-400 hover:text-rose-600 disabled:opacity-30 transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Aggregated Totals Card */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs font-semibold text-slate-700">
                <span>Total Dispatched Aggregates:</span>
                <div className="flex items-center gap-3">
                  <span className="bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-200">
                    {totalDispatchedPieces} Pieces
                  </span>
                  <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-2.5 py-0.5 rounded-lg font-bold shadow-xs">
                    {totalDispatchedWeightMt} MT
                  </span>
                </div>
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Remarks / Manifest Instructions
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Special order for wire drawing line"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 font-sans"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl shadow-md shadow-orange-500/25 disabled:opacity-50 transition-all cursor-pointer"
              >
                {createMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating Manifest...
                  </>
                ) : (
                  <>
                    <Truck className="w-4 h-4" />
                    Confirm & Dispatch Billets
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>

        {/* VIEW DISPATCH DETAILS MODAL */}
        {selectedDispatch && (
          <Modal
            isOpen={!!selectedDispatch}
            onClose={() => setSelectedDispatch(null)}
            title={`Plant Transfer: Heat ${selectedDispatch.heat_number}`}
            subtitle="Complete record of plant billet transfer and piece breakdown."
            size="md"
          >
            <div className="space-y-4 font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Heat Number:</span>
                  <span className="font-bold text-slate-900 font-mono text-sm">
                    {selectedDispatch.heat_number}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Destination Plant:</span>
                  <span className="font-bold text-slate-900">{formatPlantName(selectedDispatch.target_plant)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Pieces Sent:</span>
                  <span className="font-bold text-slate-900">
                    {selectedDispatch.dispatched_pieces} pcs
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Weight Sent:</span>
                  <span className="font-bold text-slate-900">
                    {Number(selectedDispatch.dispatched_weight_mt).toFixed(3)} MT
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Transfer Status:</span>
                  <span className="font-bold text-slate-800">
                    {selectedDispatch.status || "DISPATCHED"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Dispatch Date:</span>
                  <span className="text-slate-800">
                    {new Date(selectedDispatch.created_at || selectedDispatch.dispatch_date).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Breakdown List */}
              {selectedDispatch.lengths_breakdown && selectedDispatch.lengths_breakdown.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Loaded Length Cuts
                  </h4>
                  <div className="border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
                    <table className="min-w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Cut Length</th>
                          <th className="py-2.5 px-3">Pieces</th>
                          <th className="py-2.5 px-3">Weight (MT)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedDispatch.lengths_breakdown.map((item: any, i: number) => (
                          <tr key={i} className="hover:bg-orange-50/20">
                            <td className="py-2 px-3 font-semibold text-slate-800">
                              {item.length_meters} meters
                            </td>
                            <td className="py-2 px-3">{item.pieces} pcs</td>
                            <td className="py-2 px-3 font-mono font-bold text-slate-900">
                              {Number(item.weight_mt).toFixed(3)} MT
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedDispatch.remarks && (
                <div className="text-xs bg-orange-50/40 border border-orange-200/60 p-3 rounded-xl text-slate-800">
                  <span className="font-bold block mb-0.5 text-orange-700">Remarks:</span>
                  {selectedDispatch.remarks}
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this dispatch record?")) {
                      deleteMutation.mutate(selectedDispatch.id || selectedDispatch._id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Record
                </button>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/traceability?heat=${selectedDispatch.heat_number}`}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl shadow-xs transition-all flex items-center gap-1"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    View Heat Traceability
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSelectedDispatch(null)}
                    className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {/* EDIT DISPATCH MODAL */}
        {editingDispatch && (
          <Modal
            isOpen={!!editingDispatch}
            onClose={() => setEditingDispatch(null)}
            title={`Edit Transfer: Heat ${editingDispatch.heat_number}`}
            subtitle="Modify destination plant, piece count, tonnage, status, or shift notes."
            size="md"
          >
            <form onSubmit={handleEditSubmit} className="space-y-4 font-sans">
              {editError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                  Target Plant / Mill *
                </label>
                <select
                  value={formatPlantName(editTargetPlant)}
                  onChange={(e) => setEditTargetPlant(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800 font-sans cursor-pointer"
                >
                  <option value="">-- Select Target Plant / Mill (7 Units Only) --</option>
                  {PLANT_CATEGORIES.map((cat) => (
                    <optgroup key={cat.category} label={`── ${cat.categoryLabel} ──`}>
                      {cat.plants.map((p) => (
                        <option key={p.code} value={p.label}>
                          {p.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                    Dispatched Pieces *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={editDispatchedPieces}
                    onChange={(e) => setEditDispatchedPieces(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold text-slate-900 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                    Dispatched Weight (MT) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={editDispatchedWeightMt}
                    onChange={(e) => setEditDispatchedWeightMt(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold text-slate-900 font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                  Transfer Status *
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800 font-sans"
                >
                  <option value="DISPATCHED">DISPATCHED (In Transit)</option>
                  <option value="RECEIVED">RECEIVED (Mill Floor Yard)</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                  Remarks / Shift Notes
                </label>
                <input
                  type="text"
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  placeholder="Shift supervisor handover note"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingDispatch(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editMutation.isPending}
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl shadow-md shadow-orange-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {editMutation.isPending ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </main>
    </>
  );
}
