"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  RotateCcw,
  Plus,
  RefreshCw,
  Flame,
  Factory,
  Trash2,
  CheckCircle2,
  XCircle,
  Layers,
  Eye,
  AlertCircle,
  ArchiveRestore,
  Pencil
} from "lucide-react";
import Topbar from "../../../components/Topbar";
import StatCard from "../../../components/StatCard";
import DataTable from "../../../components/DataTable";
import Modal from "../../../components/Modal";
import { ColumnDef } from "@tanstack/react-table";
import { api } from "../../../lib/api";
import { plantReturnSchema } from "../../../lib/schemas";
import { PLANT_CATEGORIES, formatPlantName } from "../../../lib/plants";

export default function PlantReturnsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<any | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit State
  const [editingReturn, setEditingReturn] = useState<any | null>(null);
  const [editReturnedFrom, setEditReturnedFrom] = useState("");
  const [editReturnedTo, setEditReturnedTo] = useState("");
  const [editReturnType, setEditReturnType] = useState("UNUSED_BILLET_RETURN");
  const [editReturnedPieces, setEditReturnedPieces] = useState<string>("");
  const [editReturnedWeightMt, setEditReturnedWeightMt] = useState<string>("");
  const [editStockRestored, setEditStockRestored] = useState(true);
  const [editReturnReason, setEditReturnReason] = useState("");
  const [editRemarks, setEditRemarks] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  // Form State
  const [heatNumber, setHeatNumber] = useState("");
  const [dispatchId, setDispatchId] = useState("");
  const [returnedFrom, setReturnedFrom] = useState("");
  const [returnedTo, setReturnedTo] = useState("");
  const [returnType, setReturnType] = useState("UNUSED_BILLET_RETURN");
  const [returnedPieces, setReturnedPieces] = useState<string>("");
  const [returnedWeightMt, setReturnedWeightMt] = useState<string>("");
  const [returnReason, setReturnReason] = useState("");
  const [stockRestored, setStockRestored] = useState(true);
  const [remarks, setRemarks] = useState("");

  // Pagination & Search state for backend pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");

  // Fetch Returns with backend pagination & search
  const {
    data: returnsData,
    isLoading,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ["plant-returns", page, pageSize, search],
    queryFn: () =>
      api.get(
        `/returns?page=${page}&limit=${pageSize}&search=${encodeURIComponent(search)}`
      )
  });

  // Fetch Heats to pick from
  const { data: heatsData } = useQuery({
    queryKey: ["billet-heats"],
    queryFn: () => api.get("/billets/heats")
  });

  // Fetch Plants from DB
  const { data: plantsData } = useQuery({
    queryKey: ["plants"],
    queryFn: () => api.get("/plants")
  });

  // Fetch Dispatches for selected heat to validate return source plant
  const { data: heatDispatchesData } = useQuery({
    queryKey: ["heat-dispatches-return", heatNumber],
    queryFn: () => api.get(`/dispatches?heat_number=${heatNumber}`),
    enabled: !!heatNumber
  });

  // Fetch Finished Products for selected heat
  const { data: heatProductsData } = useQuery({
    queryKey: ["heat-products-return", heatNumber],
    queryFn: () => api.get(`/finished-products?heat_number=${heatNumber}`),
    enabled: !!heatNumber
  });

  // Fetch Rejections for selected heat
  const { data: heatRejectionsData } = useQuery({
    queryKey: ["heat-rejections-return", heatNumber],
    queryFn: () => api.get(`/rejections?heat_number=${heatNumber}`),
    enabled: !!heatNumber
  });

  const returns = returnsData?.data || [];
  const pagination = returnsData?.pagination;
  const heats = heatsData?.data || [];
  const plantsList = plantsData?.data || [];
  const heatDispatches = heatDispatchesData?.data || [];
  const heatProducts = heatProductsData?.data || [];
  const heatRejections = heatRejectionsData?.data || [];
  const dispatchedPlants: string[] = Array.from(
    new Set(heatDispatches.map((d: any) => String(d.target_plant || "")).filter(Boolean))
  );

  // Create Return Mutation
  const createMutation = useMutation({
    mutationFn: (newRet: any) => api.post("/returns", newRet),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plant-returns"] });
      queryClient.invalidateQueries({ queryKey: ["billet-heats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["traceability-summary"] });
      queryClient.invalidateQueries({ queryKey: ["heat-traceability"] });
      setIsModalOpen(false);
      setFormError(null);
      setHeatNumber("");
    },
    onError: (err: any) => {
      setFormError(err.message || "Failed to log plant return.");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/returns/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plant-returns"] });
      queryClient.invalidateQueries({ queryKey: ["billet-heats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["traceability-summary"] });
      queryClient.invalidateQueries({ queryKey: ["heat-traceability"] });
      setSelectedReturn(null);
    }
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/returns/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plant-returns"] });
      queryClient.invalidateQueries({ queryKey: ["billet-heats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["traceability-summary"] });
      queryClient.invalidateQueries({ queryKey: ["heat-traceability"] });
      setEditingReturn(null);
      setEditError(null);
    },
    onError: (err: any) => {
      setEditError(err.message || "Failed to update plant return.");
    }
  });

  const handleOpenEdit = (ret: any) => {
    setEditingReturn(ret);
    setEditReturnedFrom(ret.returned_from || ret.source_plant || "");
    setEditReturnedTo(ret.returned_to || "Billet Yard Stock");
    setEditReturnType(ret.return_type || "UNUSED_BILLET_RETURN");
    setEditReturnedPieces(ret.returned_pieces !== undefined ? String(ret.returned_pieces) : "");
    setEditReturnedWeightMt(ret.returned_weight_mt !== undefined ? String(ret.returned_weight_mt) : "");
    setEditStockRestored(ret.stock_restored !== false);
    setEditReturnReason(ret.return_reason || "");
    setEditRemarks(ret.remarks || "");
    setEditError(null);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReturn) return;
    const rw = parseFloat(editReturnedWeightMt);
    if (isNaN(rw) || rw <= 0) {
      setEditError("Returned weight must be a positive number greater than 0.");
      return;
    }
    editMutation.mutate({
      id: editingReturn.id || editingReturn._id,
      data: {
        returned_from: editReturnedFrom,
        source_plant: editReturnedFrom,
        returned_to: editReturnedTo,
        destination_plant: editReturnedTo,
        return_type: editReturnType,
        returned_pieces: parseInt(editReturnedPieces, 10) || 0,
        returned_weight_mt: rw,
        stock_restored: editStockRestored,
        return_reason: editReturnReason,
        remarks: editRemarks
      }
    });
  };

  // KPI calculations
  const totalReturnsCount = pagination?.total ?? returns.length;
  const totalWeightRestored = returns
    .reduce((acc: number, r: any) => acc + (Number(r.returned_weight_mt) || 0), 0)
    .toFixed(3);
  const totalPiecesRestored = returns.reduce(
    (acc: number, r: any) => acc + (Number(r.returned_pieces) || 0),
    0
  );
  const restoredStockCount = returns.filter((r: any) => r.stock_restored).length;

  // Dispatch Material Reconciliation calculation
  const selectedDispatch = heatDispatches.find((d: any) => (d.id || d._id) === dispatchId);
  const productsForDispatch = heatProducts.filter(
    (p: any) => (p.dispatch_id || p.dispatch?._id) === dispatchId
  );
  const finishedWeightMade = productsForDispatch.reduce(
    (sum: number, p: any) => sum + (Number(p.input_billet_weight_mt) || 0),
    0
  );
  const rejectionsForDispatch = heatRejections.filter(
    (r: any) => (r.dispatch_id || r.dispatch?._id) === dispatchId
  );
  const scrapWeightLogged = rejectionsForDispatch.reduce(
    (sum: number, r: any) => sum + (Number(r.rejected_weight_mt) || 0),
    0
  );
  const returnsForDispatch = returns.filter(
    (ret: any) => (ret.dispatch_id || ret.dispatch?._id) === dispatchId
  );
  const priorReturnsWeight = returnsForDispatch.reduce(
    (sum: number, ret: any) => sum + (Number(ret.returned_weight_mt) || 0),
    0
  );
  const priorReturnsPieces = returnsForDispatch.reduce(
    (sum: number, ret: any) => sum + (Number(ret.returned_pieces) || 0),
    0
  );
  const dispatchedWeight = Number(selectedDispatch?.dispatched_weight_mt) || 0;
  const dispatchedPieces = Number(selectedDispatch?.dispatched_pieces) || 0;
  const isFullyConsumed = selectedDispatch
    ? finishedWeightMade + scrapWeightLogged + priorReturnsWeight >= dispatchedWeight - 0.001
    : false;
  const remainingReturnableBalance = selectedDispatch
    ? Math.max(0, dispatchedWeight - finishedWeightMade - scrapWeightLogged - priorReturnsWeight)
    : 0;
  const remainingReturnablePieces = selectedDispatch
    ? Math.max(0, dispatchedPieces - priorReturnsPieces)
    : 0;
  const isZeroBalance = selectedDispatch ? remainingReturnableBalance <= 0.0001 : false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!heatNumber) {
      setFormError("Please select or enter a heat number.");
      return;
    }

    const numRetWeight = parseFloat(returnedWeightMt);
    if (isNaN(numRetWeight) || numRetWeight <= 0) {
      setFormError("Returned weight must be greater than zero.");
      return;
    }

    // Material Balance Rule: Rejection/Return impossible if finished products + scrap consumed all dispatch material
    if (selectedDispatch) {
      if (isFullyConsumed) {
        setFormError(
          `Impossible to return material: All ${dispatchedWeight.toFixed(3)} MT dispatched material has already been consumed by finished products (${finishedWeightMade.toFixed(3)} MT), scrap/cobbles (${scrapWeightLogged.toFixed(3)} MT), or prior returns (${priorReturnsWeight.toFixed(3)} MT).`
        );
        return;
      }

      if (numRetWeight > remainingReturnableBalance + 0.005) {
        setFormError(
          `Returned weight (${numRetWeight} MT) exceeds available unconsumed dispatch balance (${remainingReturnableBalance.toFixed(3)} MT). Dispatched: ${dispatchedWeight.toFixed(3)} MT, Finished: ${finishedWeightMade.toFixed(3)} MT, Scrap: ${scrapWeightLogged.toFixed(3)} MT, Prior returns: ${priorReturnsWeight.toFixed(3)} MT.`
        );
        return;
      }
    }

    const payload = {
      heat_number: heatNumber.trim().toUpperCase(),
      dispatch_id: dispatchId || undefined,
      returned_from: returnedFrom,
      returned_to: returnedTo,
      return_type: returnType,
      returned_pieces: parseInt(returnedPieces, 10) || 1,
      returned_weight_mt: numRetWeight,
      return_reason: returnReason,
      stock_restored: stockRestored,
      remarks: remarks || undefined
    };

    createMutation.mutate(payload);
  };

  // Table Columns
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "return_number",
      header: "Return #",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
          {row.getValue("return_number")}
        </span>
      )
    },
    {
      accessorKey: "return_type",
      header: "Category",
      cell: ({ row }) => {
        const t = (row.getValue("return_type") as string) || "UNUSED_BILLET_RETURN";
        const isScrap = t.includes("SCRAP");
        const isDefect = t.includes("DEFECT");
        return (
          <span
            className={`px-2 py-0.5 rounded text-xs font-bold uppercase border ${
              isScrap
                ? "bg-orange-50 text-orange-700 border-orange-200"
                : isDefect
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : "bg-blue-50 text-blue-700 border-blue-200"
            }`}
          >
            {isScrap ? "Mill Scrap (Remelt)" : isDefect ? "Defective Billet" : "Unused Billet"}
          </span>
        );
      }
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
      accessorKey: "returned_from",
      header: "Returned From",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-slate-800 text-xs font-medium">
          <Factory className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="font-semibold text-xs text-slate-900">{formatPlantName(row.original.returned_from || row.original.source_plant)}</span>
        </div>
      )
    },
    {
      accessorKey: "returned_to",
      header: "Returned To",
      cell: ({ row }) => (
        <span className="text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-medium">
          {row.getValue("returned_to")}
        </span>
      )
    },
    {
      accessorKey: "returned_pieces",
      header: "Pieces",
      cell: ({ row }) => (
        <span className="font-bold text-slate-900">
          {row.getValue("returned_pieces")} <span className="text-xs font-normal text-slate-500">pcs</span>
        </span>
      )
    },
    {
      accessorKey: "returned_weight_mt",
      header: "Restored (MT)",
      cell: ({ row }) => (
        <span className="font-bold text-emerald-700">
          {Number(row.getValue("returned_weight_mt")).toFixed(3)}{" "}
          <span className="text-xs font-normal text-slate-500">MT</span>
        </span>
      )
    },
    {
      accessorKey: "stock_restored",
      header: "Inventory Status",
      cell: ({ row }) => {
        const ok = row.getValue("stock_restored");
        return ok ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            Restored to Yard
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="w-3 h-3" />
            Pending Yard Inward
          </span>
        );
      }
    },
    {
      accessorKey: "return_reason",
      header: "Reason",
      cell: ({ row }) => (
        <span className="text-xs text-slate-600 max-w-[200px] truncate block" title={row.getValue("return_reason")}>
          {row.getValue("return_reason")}
        </span>
      )
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedReturn(row.original)}
            className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
            title="View Return Slip"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenEdit(row.original)}
            className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
            title="Edit Return Record"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (confirm(`Are you sure you want to delete this plant return for Heat ${row.original.heat_number}?`)) {
                deleteMutation.mutate(row.original.id || row.original._id);
              }
            }}
            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Delete Return"
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
        pageTitle="Plant Returns & Inventory Reversal"
        mobileTitle="Plant Returns"
        pageSubtitle="Process billets returned from rolling mills back into yard stock with automatic balance restoration."
      />

      <main className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 flex-1 font-sans">
        {/* Action Header with unified brand matching */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-sans">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-orange-50 text-orange-600 border border-orange-200/60 shadow-xs shrink-0">
              <RotateCcw className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-sans">
                  Plant Returns & Stock Restoration
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-orange-100 text-orange-700 border border-orange-200">
                  Step 6: Yard Inward
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-sans">
                Process unused, excess or redirected billets returned from rolling mills back into yard stock
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
              <span>Log Plant Return</span>
            </button>
          </div>
        </div>

        {/* KPI Cards - 2x2 on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <StatCard
            label="Total Return Slips"
            value={totalReturnsCount}
            subtext="Processed mill reversals"
            icon={RotateCcw}
            variant="orange"
          />
          <StatCard
            label="Tonnage Restored"
            value={`${totalWeightRestored} MT`}
            subtext="Returned to yard stock"
            icon={ArchiveRestore}
            variant="amber"
          />
          <StatCard
            label="Pieces Restored"
            value={`${totalPiecesRestored} pcs`}
            subtext="Physical billets added back"
            icon={Layers}
            variant="blue"
          />
          <StatCard
            label="Auto-Restored Vouchers"
            value={restoredStockCount}
            subtext="Active yard reconciliations"
            icon={CheckCircle2}
            variant="emerald"
          />
        </div>

        {/* DataTable */}
        <DataTable
          columns={columns}
          data={returns}
          searchPlaceholder="Search by return #, heat #, plant, return reason..."
          isLoading={isLoading}
          serverPagination={{
            page,
            pageSize,
            total: pagination?.total ?? returns.length,
            totalPages:
              pagination?.totalPages ??
              Math.max(1, Math.ceil((pagination?.total ?? returns.length) / pageSize)),
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

        {/* CREATE RETURN MODAL */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Issue Plant Return Voucher"
          subtitle="Log unused billets returning to the casting yard and automatically replenish available stock."
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
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
                  const val = e.target.value;
                  setHeatNumber(val);
                  setDispatchId("");
                  setReturnedFrom("");
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

            {/* If dispatches exist, show dispatch selector */}
            {heatDispatches.length > 0 ? (
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                    Select Dispatched Manifest to Return From
                  </label>
                  <select
                    value={dispatchId}
                    onChange={(e) => {
                      const dId = e.target.value;
                      setDispatchId(dId);
                      const d = heatDispatches.find((item: any) => (item.id || item._id) === dId);
                      if (d) {
                        setReturnedFrom(formatPlantName(d.target_plant));
                        const prods = heatProducts.filter((p: any) => (p.dispatch_id || p.dispatch?._id) === dId);
                        const finWt = prods.reduce((sum: number, p: any) => sum + (Number(p.input_billet_weight_mt) || 0), 0);
                        const rejs = heatRejections.filter((r: any) => (r.dispatch_id || r.dispatch?._id) === dId);
                        const scrWt = rejs.reduce((sum: number, r: any) => sum + (Number(r.rejected_weight_mt) || 0), 0);
                        const rets = returns.filter((r: any) => (r.dispatch_id || r.dispatch?._id) === dId);
                        const retWt = rets.reduce((sum: number, r: any) => sum + (Number(r.returned_weight_mt) || 0), 0);
                        const retPcs = rets.reduce((sum: number, r: any) => sum + (Number(r.returned_pieces) || 0), 0);

                        const remWt = Number(Math.max(0, d.dispatched_weight_mt - finWt - scrWt - retWt).toFixed(3));
                        const remPcs = Math.max(0, (Number(d.dispatched_pieces) || 0) - retPcs);
                        setReturnedPieces(String(remPcs > 0 ? remPcs : ""));
                        // Manual weight entry only: keep returnedWeightMt empty for user input
                      }
                    }}
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
                        {isFullyConsumed || isZeroBalance ? "Return Impossible" : "Return Allowed"}
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
                        <span className="text-[10px] text-slate-500 block">Scrap / Cobble:</span>
                        <span className="font-bold text-rose-600">{scrapWeightLogged.toFixed(3)} MT</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Returnable Balance:</span>
                        <span
                          className={`font-black ${
                            remainingReturnableBalance <= 0 ? "text-rose-600" : "text-emerald-700"
                          }`}
                        >
                          {remainingReturnableBalance.toFixed(3)} MT
                        </span>
                      </div>
                    </div>

                    <p className="mt-1.5 text-[11px] leading-relaxed">
                      {isFullyConsumed ? (
                        <span className="font-semibold text-rose-700 block">
                          ⚠️ All {dispatchedWeight.toFixed(3)} MT dispatched material has already been consumed by finished products ({finishedWeightMade.toFixed(3)} MT) and scrap ({scrapWeightLogged.toFixed(3)} MT). Return is impossible.
                        </span>
                      ) : isZeroBalance ? (
                        <span className="font-semibold text-rose-700 block">
                          ⚠️ Zero returnable balance remaining on this dispatch (consumed by finished products, scrap & prior returns).
                        </span>
                      ) : (
                        <span className="font-medium text-emerald-800 block">
                          ✓ Available unconsumed material at mill is <strong>{remainingReturnableBalance.toFixed(3)} MT</strong> (max {remainingReturnablePieces} pcs).
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            ) : heatNumber ? (
              <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-xl border border-amber-200 font-medium">
                Note: No dispatches found yet for heat {heatNumber}. Material must be dispatched to a plant before it can be returned.
              </p>
            ) : null}

            {/* Return Category / Material Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                Return Category / Material Type *
              </label>
              <select
                value={returnType}
                onChange={(e) => {
                  const val = e.target.value;
                  setReturnType(val);
                  if (val === "SCRAP_REMELT") {
                    setReturnedTo("SMS Induction / Arc Furnace (Remelt Bay)");
                    setStockRestored(false);
                  } else if (val === "DEFECTIVE_BILLET_RETURN") {
                    setReturnedTo("SMS Quality Hold Yard");
                    setStockRestored(false);
                  } else {
                    setReturnedTo("Billet Yard Stock");
                    setStockRestored(true);
                  }
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800 font-sans"
              >
                <option value="UNUSED_BILLET_RETURN">Unused Billets → Return to Billet Yard Stock</option>
                <option value="SCRAP_REMELT">Rolling Mill Scrap / Cobble Cuts → Return to SMS Furnace (Remelt)</option>
                <option value="DEFECTIVE_BILLET_RETURN">Defective / Non-Conforming Billets → Quality Hold</option>
              </select>
            </div>

            {/* Plants */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                  Returned From (Source Plant) *
                </label>
                <select
                  value={formatPlantName(returnedFrom)}
                  onChange={(e) => setReturnedFrom(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800 font-sans cursor-pointer"
                >
                  <option value="">-- Select Source Plant (7 Units Only) --</option>
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                  Returned To (Receiving Unit) *
                </label>
                <select
                  value={returnedTo}
                  onChange={(e) => setReturnedTo(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800 font-sans"
                >
                  <option value="Billet Yard Stock">Billet Yard Stock (SMS Central Yard)</option>
                  {plantsList.map((p: any) => (
                    <option key={p.id || p.code} value={p.name || p.code}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pieces & Weight */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Returned Pieces *
                </label>
                <input
                  type="number"
                  min="1"
                  value={returnedPieces}
                  onChange={(e) => setReturnedPieces(e.target.value)}
                  placeholder="1 pcs"
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold text-slate-800 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Returned Weight (MT) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={returnedWeightMt}
                  onChange={(e) => setReturnedWeightMt(e.target.value)}
                  required
                  placeholder="e.g. 0.001"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold text-emerald-600 font-sans"
                />
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Reason for Mill Return *
              </label>
              <input
                type="text"
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 font-sans"
              />
            </div>

            {/* Stock Restoration Checkbox */}
            <div className="p-3 bg-emerald-50/50 border border-emerald-200/80 rounded-xl">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-emerald-900 select-none">
                <input
                  type="checkbox"
                  checked={stockRestored}
                  onChange={(e) => setStockRestored(e.target.checked)}
                  className="rounded border-emerald-400 text-orange-600 focus:ring-orange-500 w-4 h-4"
                />
                <span>Automatically restore these pieces and weight back to Billet Yard Available Balance</span>
              </label>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Remarks / Stack Bay Location
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
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
                disabled={createMutation.isPending}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl shadow-md shadow-orange-500/25 disabled:opacity-50 transition-all cursor-pointer"
              >
                {createMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Logging Return...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    Authorize Return & Inward
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>

        {/* VIEW RETURN DETAILS MODAL */}
        {selectedReturn && (
          <Modal
            isOpen={!!selectedReturn}
            onClose={() => setSelectedReturn(null)}
            title={`Plant Return Slip #${selectedReturn.return_number}`}
            subtitle="Verification of billet return from rolling mill."
            size="md"
          >
            <div className="space-y-4 font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Heat Number:</span>
                  <span className="font-bold text-slate-900 font-mono text-sm">
                    {selectedReturn.heat_number}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Return Category:</span>
                  <span className="font-bold text-slate-800">
                    {selectedReturn.return_type === "SCRAP_REMELT"
                      ? "Mill Scrap (Furnace Remelt)"
                      : selectedReturn.return_type === "DEFECTIVE_BILLET_RETURN"
                      ? "Defective Billet"
                      : "Unused Billet Return"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Source Plant:</span>
                  <span className="font-bold text-slate-900">{formatPlantName(selectedReturn.source_plant || selectedReturn.returned_from)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Receiving Unit:</span>
                  <span className="font-bold text-slate-900">{selectedReturn.returned_to}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Returned Pieces:</span>
                  <span className="font-bold text-slate-900">{selectedReturn.returned_pieces} pcs</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Tonnage Restored:</span>
                  <span className="font-bold text-emerald-600">
                    {Number(selectedReturn.returned_weight_mt).toFixed(3)} MT
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Yard Stock Status:</span>
                  <span className={`font-bold ${selectedReturn.stock_restored ? "text-emerald-700" : "text-amber-700"}`}>
                    {selectedReturn.stock_restored ? "Restored to Yard Stock" : "Pending Inward / Remelt"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Return Date:</span>
                  <span className="text-slate-800">
                    {new Date(selectedReturn.created_at || selectedReturn.return_date).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="text-xs bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
                <span className="font-bold text-slate-700 block mb-1">Reason:</span>
                <p className="text-slate-800">{selectedReturn.return_reason}</p>
              </div>

              {selectedReturn.remarks && (
                <div className="text-xs bg-orange-50/40 border border-orange-200/60 p-3 rounded-xl text-slate-800">
                  <span className="font-bold block mb-1 text-orange-700">Remarks / Stack Bay:</span>
                  <p>{selectedReturn.remarks}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this return record?")) {
                      deleteMutation.mutate(selectedReturn.id || selectedReturn._id);
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
                    href={`/dashboard/traceability?heat=${selectedReturn.heat_number}`}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl transition-all shadow-xs flex items-center gap-1"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    View Heat Traceability
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSelectedReturn(null)}
                    className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {/* EDIT PLANT RETURN MODAL */}
        {editingReturn && (
          <Modal
            isOpen={!!editingReturn}
            onClose={() => setEditingReturn(null)}
            title={`Edit Return: Heat ${editingReturn.heat_number}`}
            subtitle="Modify returning mill, target yard bay, returned pieces, or weight."
            size="md"
          >
            <form onSubmit={handleEditSubmit} className="space-y-4 font-sans">
              {editError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Return Category / Material Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                  Return Category / Material Type *
                </label>
                <select
                  value={editReturnType}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditReturnType(val);
                    if (val === "SCRAP_REMELT") {
                      setEditReturnedTo("SMS Induction / Arc Furnace (Remelt Bay)");
                      setEditStockRestored(false);
                    } else if (val === "DEFECTIVE_BILLET_RETURN") {
                      setEditReturnedTo("SMS Quality Hold Yard");
                      setEditStockRestored(false);
                    } else {
                      setEditReturnedTo("Billet Yard Stock");
                      setEditStockRestored(true);
                    }
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800 font-sans"
                >
                  <option value="UNUSED_BILLET_RETURN">Unused Billets → Return to Billet Yard Stock</option>
                  <option value="SCRAP_REMELT">Rolling Mill Scrap / Cobble Cuts → Return to SMS Furnace (Remelt)</option>
                  <option value="DEFECTIVE_BILLET_RETURN">Defective / Non-Conforming Billets → Quality Hold</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                    Returned From (Source Plant) *
                  </label>
                  <select
                    value={formatPlantName(editReturnedFrom)}
                    onChange={(e) => setEditReturnedFrom(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800 font-sans cursor-pointer"
                  >
                    <option value="">-- Select Source Plant (7 Units Only) --</option>
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

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                    Returned To (Destination Unit) *
                  </label>
                  <select
                    value={editReturnedTo}
                    onChange={(e) => setEditReturnedTo(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800 font-sans"
                  >
                    {Array.from(
                      new Set([
                        "Billet Yard Stock",
                        "Billet Yard Stock (SMS Central Yard)",
                        "SMS Induction / Arc Furnace (Remelt Bay)",
                        "SMS Quality Hold Yard",
                        editReturnedTo,
                        ...(editingReturn?.returned_to ? [editingReturn.returned_to] : []),
                        ...plantsList.map((p: any) => p.name),
                        ...plantsList.map((p: any) => p.code)
                      ].filter(Boolean))
                    ).map((unitName: string) => (
                      <option key={unitName} value={unitName}>
                        {unitName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                    Returned Pieces *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editReturnedPieces}
                    onChange={(e) => setEditReturnedPieces(e.target.value)}
                    placeholder="1 pcs"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold text-slate-800 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                    Returned Weight (MT) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={editReturnedWeightMt}
                    onChange={(e) => setEditReturnedWeightMt(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold text-slate-900 font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                  Return Reason *
                </label>
                <input
                  type="text"
                  required
                  value={editReturnReason}
                  onChange={(e) => setEditReturnReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                  Remarks / Bay Location
                </label>
                <input
                  type="text"
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 font-sans"
                />
              </div>

              {/* Stock Restoration Checkbox */}
              <div className="p-3 bg-emerald-50/50 border border-emerald-200/80 rounded-xl">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-emerald-900 select-none">
                  <input
                    type="checkbox"
                    checked={editStockRestored}
                    onChange={(e) => setEditStockRestored(e.target.checked)}
                    className="rounded border-emerald-400 text-orange-600 focus:ring-orange-500 w-4 h-4"
                  />
                  <span>Automatically restore these pieces and weight back to Billet Yard Available Balance</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingReturn(null)}
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
