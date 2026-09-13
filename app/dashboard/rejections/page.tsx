"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Plus,
  RefreshCw,
  Flame,
  Factory,
  Trash2,
  CheckCircle2,
  XCircle,
  TrendingDown,
  Layers,
  Recycle,
  Eye,
  Pencil
} from "lucide-react";
import Topbar from "../../../components/Topbar";
import StatCard from "../../../components/StatCard";
import DataTable from "../../../components/DataTable";
import Modal from "../../../components/Modal";
import { ColumnDef } from "@tanstack/react-table";
import { api } from "../../../lib/api";
import { rejectionSchema } from "../../../lib/schemas";
import { formatPlantName } from "../../../lib/plants";

export default function RejectionsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit State
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [editStage, setEditStage] = useState("ROLLING_MILL");
  const [editRejectionType, setEditRejectionType] = useState("END_CROP_SCRAP");
  const [editRejectedPieces, setEditRejectedPieces] = useState<string>("");
  const [editRejectedWeightMt, setEditRejectedWeightMt] = useState<string>("");
  const [editReason, setEditReason] = useState("");
  const [editActionTaken, setEditActionTaken] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  // Form State
  const [heatNumber, setHeatNumber] = useState("");
  const [dispatchId, setDispatchId] = useState("");
  const [productionId, setProductionId] = useState("");
  const [stage, setStage] = useState("ROLLING_MILL");
  const [rejectionType, setRejectionType] = useState("END_CROP_SCRAP");
  const [rejectedPieces, setRejectedPieces] = useState<string>("");
  const [rejectedWeightMt, setRejectedWeightMt] = useState<string>("");
  const [disposition, setDisposition] = useState("SCRAP_REMELT");
  const [rejectionReason, setRejectionReason] = useState("");
  const [remarks, setRemarks] = useState("");

  // Pagination & Search state for backend pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");

  // Fetch Rejections with backend pagination & search
  const {
    data: rejectionsData,
    isLoading,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ["rejections", page, pageSize, search],
    queryFn: () =>
      api.get(
        `/rejections?page=${page}&limit=${pageSize}&search=${encodeURIComponent(search)}`
      )
  });

  // Fetch Heats to pick from
  const { data: heatsData } = useQuery({
    queryKey: ["billet-heats"],
    queryFn: () => api.get("/billets/heats")
  });

  // Fetch Dispatches for selected heat
  const { data: heatDispatchesData } = useQuery({
    queryKey: ["heat-dispatches-rej", heatNumber],
    queryFn: () => api.get(`/dispatches?heat_number=${heatNumber}`),
    enabled: !!heatNumber
  });

  // Fetch Production Batches for selected heat
  const { data: heatProductsData } = useQuery({
    queryKey: ["heat-products-rej", heatNumber],
    queryFn: () => api.get(`/finished-products?heat_number=${heatNumber}`),
    enabled: !!heatNumber
  });

  // Fetch Plant Returns for selected heat
  const { data: heatReturnsData } = useQuery({
    queryKey: ["heat-returns-rej", heatNumber],
    queryFn: () => api.get(`/returns?heat_number=${heatNumber}`),
    enabled: !!heatNumber
  });

  const rejections = rejectionsData?.data || [];
  const pagination = rejectionsData?.pagination;
  const heats = heatsData?.data || [];
  const heatDispatches = heatDispatchesData?.data || [];
  const heatProducts = heatProductsData?.data || [];
  const heatReturns = heatReturnsData?.data || [];

  // Create Rejection Mutation
  const createMutation = useMutation({
    mutationFn: (newRej: any) => api.post("/rejections", newRej),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rejections"] });
      queryClient.invalidateQueries({ queryKey: ["billet-heats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["traceability-summary"] });
      queryClient.invalidateQueries({ queryKey: ["heat-traceability"] });
      setIsModalOpen(false);
      setFormError(null);
      setHeatNumber("");
    },
    onError: (err: any) => {
      setFormError(err.message || "Failed to log rejection.");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/rejections/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rejections"] });
      queryClient.invalidateQueries({ queryKey: ["billet-heats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["traceability-summary"] });
      queryClient.invalidateQueries({ queryKey: ["heat-traceability"] });
      setSelectedRecord(null);
    }
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/rejections/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rejections"] });
      queryClient.invalidateQueries({ queryKey: ["billet-heats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["traceability-summary"] });
      queryClient.invalidateQueries({ queryKey: ["heat-traceability"] });
      setEditingRecord(null);
      setEditError(null);
    },
    onError: (err: any) => {
      setEditError(err.message || "Failed to update rejection record.");
    }
  });

  const handleOpenEdit = (rec: any) => {
    setEditingRecord(rec);
    setEditStage(rec.stage || "ROLLING_MILL");
    setEditRejectionType(rec.rejection_type || "END_CROP_SCRAP");
    setEditRejectedPieces(rec.rejected_pieces !== undefined ? String(rec.rejected_pieces) : "");
    setEditRejectedWeightMt(rec.rejected_weight_mt !== undefined ? String(rec.rejected_weight_mt) : "");
    setEditReason(rec.rejection_reason || "");
    setEditActionTaken(rec.remarks || "");
    setEditError(null);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    const rw = parseFloat(editRejectedWeightMt);
    if (isNaN(rw) || rw <= 0) {
      setEditError("Rejected scrap weight must be strictly positive (greater than 0 MT).");
      return;
    }
    editMutation.mutate({
      id: editingRecord.id || editingRecord._id,
      data: {
        stage: editStage,
        rejection_type: editRejectionType,
        rejected_pieces: parseInt(editRejectedPieces, 10) || 0,
        rejected_weight_mt: rw,
        rejection_reason: editReason,
        remarks: editActionTaken
      }
    });
  };

  // KPI calculations
  const totalRejectionsCount = pagination?.total ?? rejections.length;
  const totalScrapWeight = rejections
    .reduce((acc: number, r: any) => acc + (Number(r.rejected_weight_mt) || 0), 0)
    .toFixed(3);
  const totalRejectedPieces = rejections.reduce(
    (acc: number, r: any) => acc + (Number(r.rejected_pieces) || 0),
    0
  );
  const remeltCount = rejections.filter((r: any) => r.disposition === "SCRAP_REMELT").length;
  const remeltPct = totalRejectionsCount > 0 ? Math.round((remeltCount / totalRejectionsCount) * 100) : 100;

  // Dispatch Material Reconciliation calculation
  const selectedDispatch = heatDispatches.find((d: any) => (d.id || d._id) === dispatchId);
  const productsForDispatch = heatProducts.filter(
    (p: any) => (p.dispatch_id || p.dispatch?._id) === dispatchId
  );
  const finishedWeightMade = productsForDispatch.reduce(
    (sum: number, p: any) => sum + (Number(p.input_billet_weight_mt) || 0),
    0
  );
  const rejectionsForDispatch = rejections.filter(
    (r: any) => (r.dispatch_id || r.dispatch?._id) === dispatchId
  );
  const priorRejectionsWeight = rejectionsForDispatch.reduce(
    (sum: number, r: any) => sum + (Number(r.rejected_weight_mt) || 0),
    0
  );
  const returnsForDispatch = heatReturns.filter(
    (ret: any) => (ret.dispatch_id || ret.dispatch?._id) === dispatchId
  );
  const priorReturnsWeight = returnsForDispatch.reduce(
    (sum: number, ret: any) => sum + (Number(ret.returned_weight_mt) || 0),
    0
  );
  const dispatchedWeight = Number(selectedDispatch?.dispatched_weight_mt) || 0;
  const isFullyConsumed = selectedDispatch
    ? finishedWeightMade + priorReturnsWeight >= dispatchedWeight - 0.001
    : false;
  const remainingDispatchBalance = selectedDispatch
    ? Math.max(0, dispatchedWeight - finishedWeightMade - priorRejectionsWeight - priorReturnsWeight)
    : 0;
  const isZeroBalance = selectedDispatch ? remainingDispatchBalance <= 0.0001 : false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!heatNumber) {
      setFormError("Please select or enter a heat number.");
      return;
    }

    const numRejWeight = parseFloat(rejectedWeightMt);
    if (isNaN(numRejWeight) || numRejWeight <= 0) {
      setFormError("Rejected scrap weight must be greater than zero.");
      return;
    }

    // Material Balance Rule: Rejection impossible if finished products + returns consumed all dispatch material
    if (selectedDispatch) {
      if (isFullyConsumed) {
        setFormError(
          `Impossible to add rejection: All ${dispatchedWeight.toFixed(3)} MT dispatched material has already been consumed by finished products (${finishedWeightMade.toFixed(3)} MT) or returned to yard stock (${priorReturnsWeight.toFixed(3)} MT). Rejection is only possible if unconsumed material remains at the plant.`
        );
        return;
      }

      if (isZeroBalance) {
        setFormError(
          `Impossible to add rejection: Remaining unconsumed dispatch balance is 0 MT (Dispatched: ${dispatchedWeight.toFixed(3)} MT, Finished products: ${finishedWeightMade.toFixed(3)} MT, Prior rejections: ${priorRejectionsWeight.toFixed(3)} MT, Prior returns: ${priorReturnsWeight.toFixed(3)} MT).`
        );
        return;
      }

      if (numRejWeight > remainingDispatchBalance + 0.005) {
        setFormError(
          `Rejection weight (${numRejWeight} MT) exceeds remaining unconsumed dispatch balance (${remainingDispatchBalance.toFixed(3)} MT). Finished product made: ${finishedWeightMade.toFixed(3)} MT of ${dispatchedWeight.toFixed(3)} MT dispatched (Prior returns: ${priorReturnsWeight.toFixed(3)} MT, Prior scrap: ${priorRejectionsWeight.toFixed(3)} MT).`
        );
        return;
      }
    }

    const payload = {
      heat_number: heatNumber.trim().toUpperCase(),
      dispatch_id: dispatchId || undefined,
      production_id: productionId || undefined,
      stage,
      rejection_type: rejectionType,
      rejected_pieces: parseInt(rejectedPieces, 10) || 0,
      rejected_weight_mt: numRejWeight,
      disposition,
      rejection_reason: rejectionReason,
      remarks: remarks || undefined
    };

    createMutation.mutate(payload);
  };

  // Table Columns
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "rejection_number",
      header: "Rejection #",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold text-red-700 bg-red-50 px-2.5 py-1 rounded-md border border-red-200">
          {row.getValue("rejection_number")}
        </span>
      )
    },
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
      accessorKey: "stage",
      header: "Stage",
      cell: ({ row }) => {
        const s = (row.getValue("stage") as string) || "ROLLING_MILL";
        return (
          <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {s.replace(/_/g, " ")}
          </span>
        );
      }
    },
    {
      accessorKey: "rejection_type",
      header: "Rejection Defect",
      cell: ({ row }) => {
        const t = (row.getValue("rejection_type") as string) || "DEFECT";
        return (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>{t.replace(/_/g, " ")}</span>
          </div>
        );
      }
    },
    {
      accessorKey: "rejected_pieces",
      header: "Pieces",
      cell: ({ row }) => (
        <span className="font-bold text-slate-900">
          {row.getValue("rejected_pieces")} <span className="text-xs font-normal text-slate-500">pcs</span>
        </span>
      )
    },
    {
      accessorKey: "rejected_weight_mt",
      header: "Weight (MT)",
      cell: ({ row }) => (
        <span className="font-bold text-rose-600">
          {Number(row.getValue("rejected_weight_mt")).toFixed(3)}{" "}
          <span className="text-xs font-normal text-slate-500">MT</span>
        </span>
      )
    },
    {
      accessorKey: "disposition",
      header: "Disposition",
      cell: ({ row }) => {
        const d = (row.getValue("disposition") as string) || "SCRAP_REMELT";
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Recycle className="w-3 h-3" />
            {d.replace(/_/g, " ")}
          </span>
        );
      }
    },
    {
      accessorKey: "rejection_reason",
      header: "Reason / Diagnosis",
      cell: ({ row }) => (
        <span className="text-xs text-slate-600 max-w-[200px] truncate block" title={row.getValue("rejection_reason")}>
          {row.getValue("rejection_reason")}
        </span>
      )
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedRecord(row.original)}
            className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenEdit(row.original)}
            className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
            title="Edit Rejection Record"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (confirm(`Are you sure you want to delete this rejection voucher for Heat ${row.original.heat_number}?`)) {
                deleteMutation.mutate(row.original.id || row.original._id);
              }
            }}
            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Delete Rejection"
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
        pageTitle="Scrap & Defect Rejection Ledger"
        mobileTitle="Rejections & Scrap"
        pageSubtitle="Log continuous casting cut-offs, mill crop cuts, cobbles, and defective billets with closed-loop furnace remelt tracking."
      />

      <main className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 flex-1 font-sans">
        {/* Action Header with unified brand matching */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-sans">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-orange-50 text-orange-600 border border-orange-200/60 shadow-xs shrink-0">
              <AlertTriangle className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-sans">
                  Scrap & Defect Rejection Ledger
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-orange-100 text-orange-700 border border-orange-200">
                  Step 5: Rejections & Scrap
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-sans">
                Continuous casting cut-offs, mill crop cuts, cobbles & closed-loop furnace remelt disposition
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
                setIsModalOpen(true);
                setFormError(null);
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-md shadow-orange-500/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Log Rejection</span>
            </button>
          </div>
        </div>

        {/* KPI Cards - 2x2 on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <StatCard
            label="Total Rejection Vouchers"
            value={totalRejectionsCount}
            subtext="Logged defect events"
            icon={AlertTriangle}
            variant="orange"
          />
          <StatCard
            label="Total Scrap Weight"
            value={`${totalScrapWeight} MT`}
            subtext="Crop & defect tonnage"
            icon={TrendingDown}
            variant="rose"
          />
          <StatCard
            label="Total Rejected Pieces"
            value={`${totalRejectedPieces} pcs`}
            subtext="Individual cuts rejected"
            icon={Layers}
            variant="amber"
          />
          <StatCard
            label="Recycled for Remelt"
            value={`${remeltPct}%`}
            subtext="Sent back to SMS furnace"
            icon={Recycle}
            variant="slate"
          />
        </div>

        {/* DataTable */}
        <DataTable
          columns={columns}
          data={rejections}
          searchPlaceholder="Search by rejection #, heat #, defect stage, reason..."
          isLoading={isLoading}
          serverPagination={{
            page,
            pageSize,
            total: pagination?.total ?? rejections.length,
            totalPages:
              pagination?.totalPages ??
              Math.max(1, Math.ceil((pagination?.total ?? rejections.length) / pageSize)),
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

        {/* CREATE REJECTION MODAL */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Record Rejection / Scrap Cut"
          subtitle="Document defective cuts or crop losses and assign disposition for SMS remelt."
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Heat Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                Heat Number *
              </label>
              <select
                value={heatNumber}
                onChange={(e) => {
                  setHeatNumber(e.target.value);
                  setDispatchId("");
                  setProductionId("");
                }}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800 font-sans"
              >
                <option value="">-- Select Heat --</option>
                {heats.map((h: any) => (
                  <option key={h.id || h._id} value={h.heat_number}>
                    {h.heat_number} | {h.grade} | {h.section}
                  </option>
                ))}
              </select>
            </div>

            {/* Optional Link to Dispatch / Production */}
            {heatDispatches.length > 0 && (
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                    Link to Plant Transfer Manifest
                  </label>
                  <select
                    value={dispatchId}
                    onChange={(e) => setDispatchId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800 font-sans"
                  >
                    <option value="">-- Optional: Link to Specific Dispatch --</option>
                    {heatDispatches.map((d: any) => (
                      <option key={d.id || d._id} value={d.id || d._id}>
                        {d.dispatch_number} → {formatPlantName(d.target_plant)} ({d.dispatched_pieces} pcs / {d.dispatched_weight_mt} MT)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dispatch Material Reconciliation Card */}
                {selectedDispatch && (
                  <div
                    className={`p-3 rounded-xl border text-xs transition-all ${
                      isFullyConsumed || isZeroBalance
                        ? "bg-rose-50/90 border-rose-200/80 text-rose-950"
                        : "bg-emerald-50/80 border-emerald-200/80 text-emerald-950"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold mb-1.5">
                      <span className="flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                        {isFullyConsumed || isZeroBalance ? (
                          <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        )}
                        Material Reconciliation ({selectedDispatch.dispatch_number})
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-mono text-[9px] font-black uppercase ${
                          isFullyConsumed || isZeroBalance
                            ? "bg-rose-100 text-rose-700 border border-rose-200"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        }`}
                      >
                        {isFullyConsumed || isZeroBalance ? "Rejection Impossible" : "Rejection Allowed"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-1.5 border-y border-slate-200/60 font-mono text-[11px]">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Dispatched:</span>
                        <span className="font-bold text-slate-900">{dispatchedWeight.toFixed(3)} MT</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Finished Built:</span>
                        <span className="font-bold text-slate-900">{finishedWeightMade.toFixed(3)} MT</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Plant Returns:</span>
                        <span className="font-bold text-slate-700">{priorReturnsWeight.toFixed(3)} MT</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Available Balance:</span>
                        <span
                          className={`font-black ${
                            remainingDispatchBalance <= 0 ? "text-rose-600" : "text-emerald-700"
                          }`}
                        >
                          {remainingDispatchBalance.toFixed(3)} MT
                        </span>
                      </div>
                    </div>

                    <p className="mt-1.5 text-[11px] leading-relaxed">
                      {isFullyConsumed ? (
                        <span className="font-semibold text-rose-700 block">
                          ⚠️ All {dispatchedWeight.toFixed(3)} MT dispatched material has already been converted into finished products. Rejection is impossible.
                        </span>
                      ) : isZeroBalance ? (
                        <span className="font-semibold text-rose-700 block">
                          ⚠️ Zero balance remaining on this dispatch (consumed by finished products & prior rejections).
                        </span>
                      ) : (
                        <span className="font-medium text-emerald-800 block">
                          ✓ Finished product ({finishedWeightMade.toFixed(3)} MT) is less than dispatch ({dispatchedWeight.toFixed(3)} MT). Rejection is possible up to <strong>{remainingDispatchBalance.toFixed(3)} MT</strong>.
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}

            {heatProducts.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                  Link to Finished Product Batch
                </label>
                <select
                  value={productionId}
                  onChange={(e) => {
                    const prodId = e.target.value;
                    setProductionId(prodId);
                    if (prodId) {
                      const matched = heatProducts.find((p: any) => (p.id || p._id) === prodId);
                      const dId = matched?.dispatch_id || matched?.dispatch?._id;
                      if (dId && !dispatchId) {
                        setDispatchId(dId);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800 font-sans"
                >
                  <option value="">-- Optional: Link to Specific Production Batch --</option>
                  {heatProducts.map((p: any) => (
                    <option key={p.id || p._id} value={p.id || p._id}>
                      {p.production_batch_number} ({p.finished_product_name} - {p.finished_size})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Stage & Defect Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                  Stage Occurred *
                </label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800 font-sans"
                >
                  <option value="ROLLING_MILL">Rolling Mill</option>
                  <option value="BILLET_YARD">Billet Yard</option>
                  <option value="REHEAT_FURNACE">Reheat Furnace</option>
                  <option value="FINISHING">Finishing & Straightening</option>
                  <option value="LAB_TEST">Lab Chemical / Physical Test</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                  Rejection Type *
                </label>
                <select
                  value={rejectionType}
                  onChange={(e) => setRejectionType(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800 font-sans"
                >
                  <option value="END_CROP_SCRAP">End Crop Scrap (Head / Tail)</option>
                  <option value="SURFACE_CRACKS">Surface Cracks / Seams</option>
                  <option value="SECTION_DEFECT">Section Size Distortion</option>
                  <option value="COBBLE_SCRAP">Mill Cobble Scrap</option>
                  <option value="INTERNAL_POROSITY">Internal Porosity / Pipe</option>
                  <option value="CHEMISTRY_NONCONFORMANCE">Chemical Non-Conformance</option>
                </select>
              </div>
            </div>

            {/* Pieces & Weight */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                  Rejected Pieces
                </label>
                <input
                  type="number"
                  min="0"
                  value={rejectedPieces}
                  onChange={(e) => setRejectedPieces(e.target.value)}
                  placeholder="0 pcs"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold text-slate-800 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                  Rejected Weight (MT) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={rejectedWeightMt}
                  onChange={(e) => setRejectedWeightMt(e.target.value)}
                  required
                  placeholder="e.g. 0.001"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold text-slate-900"
                />
              </div>
            </div>

            {/* Disposition */}
            {/* <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Material Disposition *
            </label>
            <select
              value={disposition}
              onChange={(e) => setDisposition(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 font-medium font-sans"
            >
              <option value="SCRAP_REMELT">Scrap Remelt (Return to SMS Induction Furnace)</option>
              <option value="DOWNGRADE">Downgrade to Commercial Grade</option>
              <option value="INVESTIGATION">Under Quality Committee Review</option>
              <option value="DISCARD">Scrap Discard / Landfill</option>
            </select>
          </div> */}

            {/* Reason */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Rejection Reason / Technical Description *
              </label>
              <textarea
                rows={2}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 font-sans"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || !!(selectedDispatch && (isFullyConsumed || isZeroBalance))}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl shadow-md shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {createMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving Rejection...
                  </>
                ) : selectedDispatch && (isFullyConsumed || isZeroBalance) ? (
                  <>
                    <XCircle className="w-4 h-4" />
                    Rejection Not Allowed (Material Consumed)
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    Submit Rejection Record
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>

        {/* VIEW DETAILS MODAL */}
        {selectedRecord && (
          <Modal
            isOpen={!!selectedRecord}
            onClose={() => setSelectedRecord(null)}
            title={`Rejection Record #${selectedRecord.rejection_number}`}
            subtitle="Audit log of defect and scrap material disposition."
            size="md"
          >
            <div className="space-y-4 font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Heat Number:</span>
                  <span className="font-bold text-slate-900 font-mono text-sm">
                    {selectedRecord.heat_number}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Stage Occurred:</span>
                  <span className="font-bold text-slate-900">{selectedRecord.stage}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Rejection Defect:</span>
                  <span className="font-bold text-rose-700">{selectedRecord.rejection_type}</span>
                </div>
                {/* <div>
                  <span className="text-slate-500 block text-[11px]">Disposition:</span>
                  <span className="font-bold text-amber-700">{selectedRecord.disposition}</span>
                </div> */}
                <div>
                  <span className="text-slate-500 block text-[11px]">Pieces:</span>
                  <span className="font-bold text-slate-900">{selectedRecord.rejected_pieces} pcs</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Scrap Weight:</span>
                  <span className="font-bold text-rose-700">
                    {Number(selectedRecord.rejected_weight_mt).toFixed(3)} MT
                  </span>
                </div>
              </div>

              <div className="text-xs bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
                <span className="font-bold text-slate-700 block mb-1">Reason:</span>
                <p className="text-slate-800">{selectedRecord.rejection_reason}</p>
              </div>

              {selectedRecord.remarks && (
                <div className="text-xs bg-orange-50/40 border border-orange-200/60 p-3 rounded-xl text-slate-800">
                  <span className="font-bold block mb-1 text-orange-700">Remarks:</span>
                  <p>{selectedRecord.remarks}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this rejection record?")) {
                      deleteMutation.mutate(selectedRecord.id || selectedRecord._id);
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
                    href={`/dashboard/traceability?heat=${selectedRecord.heat_number}`}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl transition-all shadow-xs flex items-center gap-1"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    View Heat Traceability
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSelectedRecord(null)}
                    className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {/* EDIT REJECTION MODAL */}
        {editingRecord && (
          <Modal
            isOpen={!!editingRecord}
            onClose={() => setEditingRecord(null)}
            title={`Edit Rejection: Heat ${editingRecord.heat_number}`}
            subtitle="Modify scrap stage, defect type, piece counts, or tonnage."
            size="md"
          >
            <form onSubmit={handleEditSubmit} className="space-y-4 font-sans">
              {editError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                    Stage Occurred *
                  </label>
                  <select
                    value={editStage}
                    onChange={(e) => setEditStage(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800 font-sans"
                  >
                    <option value="ROLLING_MILL">Rolling Mill</option>
                    <option value="BILLET_YARD">Billet Yard</option>
                    <option value="REHEAT_FURNACE">Reheat Furnace</option>
                    <option value="FINISHING">Finishing & Straightening</option>
                    <option value="LAB_TEST">Lab Chemical / Physical Test</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                    Rejection Type *
                  </label>
                  <select
                    value={editRejectionType}
                    onChange={(e) => setEditRejectionType(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800 font-sans"
                  >
                    <option value="END_CROP_SCRAP">End Crop Scrap (Head / Tail)</option>
                    <option value="SURFACE_CRACKS">Surface Cracks / Seams</option>
                    <option value="SECTION_DEFECT">Section Size Distortion</option>
                    <option value="COBBLE_SCRAP">Mill Cobble Scrap</option>
                    <option value="INTERNAL_POROSITY">Internal Porosity / Pipe</option>
                    <option value="CHEMISTRY_NONCONFORMANCE">Chemical Non-Conformance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                    Rejected Pieces
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editRejectedPieces}
                    onChange={(e) => setEditRejectedPieces(e.target.value)}
                    placeholder="0 pcs"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold text-slate-800 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                    Rejected Weight (MT) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={editRejectedWeightMt}
                    onChange={(e) => setEditRejectedWeightMt(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold text-slate-900 font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                  Defect Diagnosis / Reason *
                </label>
                <input
                  type="text"
                  required
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                  Disposition / Action Notes
                </label>
                <input
                  type="text"
                  value={editActionTaken}
                  onChange={(e) => setEditActionTaken(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
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
