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
  ArrowLeftRight,
  Scissors
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

  // Further Cutting State
  const [cuttingDispatch, setCuttingDispatch] = useState<any | null>(null);
  const [cutOrigLength, setCutOrigLength] = useState<string>("");
  const [cutBilletsCount, setCutBilletsCount] = useState<string>("");
  const [cutNewLength, setCutNewLength] = useState<string>("");
  const [cutPiecesProduced, setCutPiecesProduced] = useState<string>("");
  const [cutWeightMt, setCutWeightMt] = useState<string>(""); // starts empty by default
  const [cutRemarks, setCutRemarks] = useState("");
  const [cutError, setCutError] = useState<string | null>(null);

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
      // populate default breakdown row from first length with EMPTY manual weight
      const firstL = found.lengths[0];
      const pcs = Math.min(firstL.available_pieces || firstL.piece_count || 4, 4);
      setBreakdown([{
        length_meters: firstL.length_meters,
        pieces: pcs,
        weight_mt: ""
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

  // Query cuttings for selected cuttingDispatch
  const {
    data: cuttingsData,
    refetch: refetchCuttings,
    isLoading: isCuttingsLoading
  } = useQuery({
    queryKey: ["further-cuttings", cuttingDispatch?.id || cuttingDispatch?._id],
    queryFn: () => api.get(`/billets/cuttings?dispatch_id=${cuttingDispatch?.id || cuttingDispatch?._id}`),
    enabled: !!cuttingDispatch
  });

  const dispatchCuttings = cuttingsData?.data || [];

  const createCuttingMutation = useMutation({
    mutationFn: (newCutting: any) => api.post("/billets/cuttings", newCutting),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["further-cuttings"] });
      queryClient.invalidateQueries({ queryKey: ["dispatches"] });
      queryClient.invalidateQueries({ queryKey: ["heat-traceability"] });
      queryClient.invalidateQueries({ queryKey: ["traceability-summary"] });
      setCutError(null);
      setCutOrigLength("");
      setCutBilletsCount("");
      setCutNewLength("");
      setCutPiecesProduced("");
      setCutWeightMt("");
      setCutRemarks("");
      refetchCuttings();
    },
    onError: (err: any) => {
      setCutError(err.message || "Failed to record plant further cutting.");
    }
  });

  const handleOpenFurtherCutting = (dispatch: any) => {
    setCuttingDispatch(dispatch);
    setCutError(null);
    const bd = dispatch.lengths_breakdown || [];
    setCutOrigLength(bd.length > 0 ? String(bd[0].length_meters) : "");
    setCutBilletsCount("1");
    setCutNewLength("");
    setCutPiecesProduced("");
    setCutWeightMt(""); // empty by default
    setCutRemarks("");
  };

  const handleFurtherCuttingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCutError(null);
    if (!cuttingDispatch) return;

    const origL = parseFloat(cutOrigLength);
    const cutCount = parseInt(cutBilletsCount, 10);
    const newL = parseFloat(cutNewLength);
    const pcsProd = parseInt(cutPiecesProduced, 10);
    const wtMt = parseFloat(cutWeightMt);

    if (isNaN(origL) || origL <= 0) {
      setCutError("Original billet cutting length must be greater than zero.");
      return;
    }
    if (isNaN(cutCount) || cutCount <= 0) {
      setCutError("Number of transferred billets to cut must be at least 1.");
      return;
    }
    if (isNaN(newL) || newL <= 0) {
      setCutError("New cutting length at receiving plant must be greater than zero.");
      return;
    }
    if (isNaN(pcsProd) || pcsProd <= 0) {
      setCutError("Number of pieces produced after further cutting must be at least 1.");
      return;
    }
    if (isNaN(wtMt) || wtMt <= 0) {
      setCutError("Actual weight of pieces produced must be entered manually and be greater than 0.");
      return;
    }

    createCuttingMutation.mutate({
      heat_number: cuttingDispatch.heat_number,
      dispatch_id: cuttingDispatch.id || cuttingDispatch._id,
      dispatch_number: cuttingDispatch.dispatch_number,
      plant_name: cuttingDispatch.target_plant,
      original_length_meters: origL,
      transferred_billets_cut: cutCount,
      new_length_meters: newL,
      pieces_produced: pcsProd,
      weight_produced_mt: wtMt,
      remarks: cutRemarks || undefined
    });
  };

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
      { length_meters: "", pieces: "", weight_mt: "" }
    ]);
  };

  const handleRemoveBreakdownRow = (index: number) => {
    if (breakdown.length <= 1) return;
    setBreakdown(breakdown.filter((_, i) => i !== index));
  };

  const handleBreakdownChange = (index: number, field: string, val: string | number) => {
    const updated = [...breakdown];
    (updated[index] as any)[field] = val;
    // Strictly manual weight entry: no automatic weight calculation
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
            onClick={() => handleOpenFurtherCutting(row.original)}
            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
            title="Record Receiving Plant Further Cutting & Piece Tracking"
          >
            <Scissors className="w-4 h-4 text-amber-600" />
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
                        placeholder="Manual MT"
                        className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg font-bold text-slate-900 bg-white focus:ring-1 focus:ring-orange-500"
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

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const d = selectedDispatch;
                      setSelectedDispatch(null);
                      handleOpenFurtherCutting(d);
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Scissors className="w-3.5 h-3.5 text-amber-600" />
                    Further Cut Billets at Plant
                  </button>
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

        {/* RECEIVING PLANT FURTHER CUTTING MODAL */}
        {cuttingDispatch && (
          <Modal
            isOpen={!!cuttingDispatch}
            onClose={() => setCuttingDispatch(null)}
            title={`Receiving Plant Further Cutting: Heat ${cuttingDispatch.heat_number}`}
            subtitle={`Plant: ${formatPlantName(cuttingDispatch.target_plant)} | Dispatch #${cuttingDispatch.dispatch_number}`}
            size="lg"
          >
            <div className="space-y-5 font-sans">
              {cutError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{cutError}</span>
                </div>
              )}

              {/* Transferred Billets Overview Banner */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-slate-500 block text-[11px]">Transferred to Plant:</span>
                  <span className="font-bold text-slate-900">{formatPlantName(cuttingDispatch.target_plant)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Total Transferred Billets:</span>
                  <span className="font-bold text-slate-900">{cuttingDispatch.dispatched_pieces} pcs ({Number(cuttingDispatch.dispatched_weight_mt).toFixed(3)} MT)</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Original Cutting Lengths:</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {(cuttingDispatch.lengths_breakdown || []).map((b: any, idx: number) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-bold text-[10px] text-slate-800">
                        {b.length_meters}m ({b.pieces} pcs)
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Further Cutting Record Form */}
              <form onSubmit={handleFurtherCuttingSubmit} className="p-4 bg-amber-50/40 border border-amber-200/80 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <Scissors className="w-4 h-4 text-amber-600" />
                  <span>Cut Transferred Billets into New Lengths</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Original Billet Cutting Length (M) *
                    </label>
                    <select
                      value={cutOrigLength}
                      onChange={(e) => setCutOrigLength(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-bold text-slate-900"
                    >
                      <option value="">-- Select Original Length --</option>
                      {(cuttingDispatch.lengths_breakdown || []).map((b: any, idx: number) => (
                        <option key={idx} value={b.length_meters}>
                          {b.length_meters} meters ({b.pieces} pcs transferred)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Transferred Billets to Cut *
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={cutBilletsCount}
                      onChange={(e) => setCutBilletsCount(e.target.value)}
                      placeholder="e.g. 2 billets"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      New Cutting Length at Receiving Plant (M) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      required
                      value={cutNewLength}
                      onChange={(e) => setCutNewLength(e.target.value)}
                      placeholder="e.g. 3.7"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Pieces Produced After Further Cutting *
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={cutPiecesProduced}
                      onChange={(e) => setCutPiecesProduced(e.target.value)}
                      placeholder="e.g. 4 pcs"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1" title="Actual weighbridge or scale weight. System does not auto-calculate.">
                      Actual Weight Produced (MT) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.0001"
                      required
                      value={cutWeightMt}
                      onChange={(e) => setCutWeightMt(e.target.value)}
                      placeholder="Enter actual weight (MT)"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Shift Remarks
                    </label>
                    <input
                      type="text"
                      value={cutRemarks}
                      onChange={(e) => setCutRemarks(e.target.value)}
                      placeholder="e.g. Cut for rolling mill #2"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={createCuttingMutation.isPending}
                    className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span>{createCuttingMutation.isPending ? "Recording Cutting..." : "Save Plant Further Cutting"}</span>
                  </button>
                </div>
              </form>

              {/* Existing Cuttings Table for this Dispatch */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Recorded Further Cuttings & Piece Tracking for Dispatch #{cuttingDispatch.dispatch_number}
                  </h4>
                  <span className="text-[11px] font-semibold text-slate-500 font-mono">
                    {dispatchCuttings.length} Cutting Batches
                  </span>
                </div>

                {isCuttingsLoading ? (
                  <div className="p-4 text-center text-xs text-slate-500">Loading cut pieces...</div>
                ) : dispatchCuttings.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-center text-xs text-slate-500">
                    No further cuttings recorded yet for this dispatch at {formatPlantName(cuttingDispatch.target_plant)}.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
                    <table className="min-w-full text-xs text-left whitespace-nowrap">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Cutting Batch #</th>
                          <th className="py-2.5 px-3">Orig Length</th>
                          <th className="py-2.5 px-3">Billets Cut</th>
                          <th className="py-2.5 px-3">New Length</th>
                          <th className="py-2.5 px-3">Pieces Produced</th>
                          <th className="py-2.5 px-3">Pieces Consumed</th>
                          <th className="py-2.5 px-3">Remaining Pieces</th>
                          <th className="py-2.5 px-3">Remaining Weight</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {dispatchCuttings.map((c: any) => (
                          <tr key={c.id || c._id} className="hover:bg-amber-50/20">
                            <td className="py-2.5 px-3 font-bold text-amber-700">{c.cutting_batch_no}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-800">{c.original_length_meters}m</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800">{c.transferred_billets_cut} pcs</td>
                            <td className="py-2.5 px-3 font-bold text-amber-800">{c.new_length_meters}m</td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">{c.pieces_produced} pcs</td>
                            <td className="py-2.5 px-3 text-orange-600 font-semibold">{c.pieces_consumed || 0} pcs</td>
                            <td className="py-2.5 px-3 font-bold text-emerald-600">{c.remaining_pieces} pcs</td>
                            <td className="py-2.5 px-3 font-bold text-emerald-700">{Number(c.remaining_weight_mt).toFixed(3)} MT</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCuttingDispatch(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </Modal>
        )}
      </main>
    </>
  );
}
