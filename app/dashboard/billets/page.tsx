"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Layers,
  Flame,
  Plus,
  Trash2,
  Boxes,
  ArrowRight,
  Eye,
  CheckCircle2,
  RefreshCw,
  Pencil
} from "lucide-react";
import Topbar from "../../../components/Topbar";
import StatCard from "../../../components/StatCard";
import DataTable from "../../../components/DataTable";
import Modal from "../../../components/Modal";
import { ColumnDef } from "@tanstack/react-table";
import { api } from "../../../lib/api";
import { castHeatSchema } from "../../../lib/schemas";

export default function BilletsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHeat, setSelectedHeat] = useState<any | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Heat State
  const [editingHeat, setEditingHeat] = useState<any | null>(null);
  const [editGrade, setEditGrade] = useState("");
  const [editSection, setEditSection] = useState("");
  const [editStatus, setEditStatus] = useState("CAST");
  const [editError, setEditError] = useState<string | null>(null);

  // New Length State in Lengths modal
  const [isAddingLength, setIsAddingLength] = useState(false);
  const [newLengthMeters, setNewLengthMeters] = useState<string>("");
  const [newPieceCount, setNewPieceCount] = useState<string>("");
  const [newWeightPerPieceKg, setNewWeightPerPieceKg] = useState<string>("");

  // Cast Heat Form State (clean dynamic inputs)
  const [heatNumber, setHeatNumber] = useState("");
  const [grade, setGrade] = useState("");
  const [section, setSection] = useState("");
  const [remarks, setRemarks] = useState("");

  const [lengths, setLengths] = useState<Array<{
    length_meters: string | number;
    piece_count: string | number;
    weight_per_piece_kg: string | number;
    total_weight_mt: string | number;
  }>>([
    { length_meters: "", piece_count: "", weight_per_piece_kg: "", total_weight_mt: "" }
  ]);

  // Compute live aggregates taking manual weights into account (no auto-calculation)
  const totalPiecesSum = lengths.reduce((acc, l) => acc + (Number(l.piece_count) || 0), 0);
  const totalWeightSumMt = Number(
    lengths
      .reduce((acc, l) => {
        if (l.total_weight_mt !== "" && l.total_weight_mt !== undefined && Number(l.total_weight_mt) > 0) {
          return acc + Number(l.total_weight_mt);
        } else if (l.weight_per_piece_kg !== "" && l.weight_per_piece_kg !== undefined && Number(l.weight_per_piece_kg) > 0 && l.piece_count) {
          return acc + (Number(l.weight_per_piece_kg) * Number(l.piece_count)) / 1000;
        }
        return acc;
      }, 0)
      .toFixed(3)
  );

  // Fetch grades from DB
  const { data: gradesData } = useQuery({
    queryKey: ["grades"],
    queryFn: () => api.get("/grades")
  });
  const gradesList = gradesData?.data || [];

  // Pagination & Search state for backend pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");

  // 1. Fetch Billet Heats
  const {
    data: heatsData,
    isLoading,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ["billet-heats", page, pageSize, search],
    queryFn: () =>
      api.get(
        `/billets/heats?page=${page}&limit=${pageSize}&search=${encodeURIComponent(search)}`
      )
  });

  const heats = heatsData?.data || [];
  const pagination = heatsData?.pagination;

  // Create Heat Mutation
  const createMutation = useMutation({
    mutationFn: (newHeat: any) => api.post("/billets/heats", newHeat),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billet-heats"] });
      queryClient.invalidateQueries({ queryKey: ["recent-heats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["traceability-summary"] });
      queryClient.invalidateQueries({ queryKey: ["heat-traceability"] });
      setIsModalOpen(false);
      setFormError(null);
      setHeatNumber("");
      setGrade("");
      setSection("");
      setRemarks("");
      setLengths([{ length_meters: "", piece_count: "", weight_per_piece_kg: "", total_weight_mt: "" }]);
    },
    onError: (err: any) => {
      setFormError(err.message || "Failed to cast heat.");
    }
  });

  const editHeatMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/billets/heats/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billet-heats"] });
      queryClient.invalidateQueries({ queryKey: ["recent-heats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["traceability-summary"] });
      queryClient.invalidateQueries({ queryKey: ["heat-traceability"] });
      setEditingHeat(null);
      setEditError(null);
    },
    onError: (err: any) => {
      setEditError(err.message || "Failed to update heat.");
    }
  });

  const deleteHeatMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/billets/heats/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billet-heats"] });
      queryClient.invalidateQueries({ queryKey: ["recent-heats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["traceability-summary"] });
      queryClient.invalidateQueries({ queryKey: ["heat-traceability"] });
      if (selectedHeat) setSelectedHeat(null);
    },
    onError: (err: any) => {
      alert(err.message || "Failed to delete heat.");
    }
  });

  const addLengthMutation = useMutation({
    mutationFn: (data: any) => api.post("/billets/lengths", data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["billet-heats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["traceability-summary"] });
      queryClient.invalidateQueries({ queryKey: ["heat-traceability"] });
      setIsAddingLength(false);
      // update selectedHeat local length state if open
      if (selectedHeat && res?.data) {
        setSelectedHeat({
          ...selectedHeat,
          lengths: [...(selectedHeat.lengths || []), res.data]
        });
      }
    },
    onError: (err: any) => {
      alert(err.message || "Failed to add length cut.");
    }
  });

  const deleteLengthMutation = useMutation({
    mutationFn: (lengthId: string) => api.delete(`/billets/lengths/${lengthId}`),
    onSuccess: (_, lengthId) => {
      queryClient.invalidateQueries({ queryKey: ["billet-heats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["traceability-summary"] });
      queryClient.invalidateQueries({ queryKey: ["heat-traceability"] });
      if (selectedHeat) {
        setSelectedHeat({
          ...selectedHeat,
          lengths: (selectedHeat.lengths || []).filter((l: any) => (l.id || l._id) !== lengthId)
        });
      }
    },
    onError: (err: any) => {
      alert(err.message || "Failed to delete length cut.");
    }
  });

  const handleEditHeatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHeat) return;
    editHeatMutation.mutate({
      id: editingHeat.id || editingHeat._id,
      data: {
        grade: editGrade,
        section: editSection
      }
    });
  };

  const handleAddLengthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHeat) return;
    addLengthMutation.mutate({
      heat_number: selectedHeat.heat_number,
      length_meters: Number(newLengthMeters),
      piece_count: Number(newPieceCount),
      weight_per_piece_kg: Number(newWeightPerPieceKg)
    });
  };

  const handleAddLengthRow = () => {
    setLengths([...lengths, { length_meters: "", piece_count: "", weight_per_piece_kg: "", total_weight_mt: "" }]);
  };

  const handleRemoveLengthRow = (index: number) => {
    if (lengths.length <= 1) return;
    setLengths(lengths.filter((_, idx) => idx !== index));
  };

  const handleLengthChange = (index: number, field: string, value: string) => {
    const updated = [...lengths];
    updated[index] = { ...updated[index], [field]: value };
    setLengths(updated);
  };

  const handleCastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      const validated = castHeatSchema.parse({
        heat_number: heatNumber,
        grade,
        section,
        remarks,
        lengths: lengths.map((l) => ({
          length_meters: Number(l.length_meters),
          piece_count: Number(l.piece_count),
          weight_per_piece_kg: l.weight_per_piece_kg !== "" && l.weight_per_piece_kg !== undefined && Number(l.weight_per_piece_kg) > 0 ? Number(l.weight_per_piece_kg) : undefined,
          total_weight_mt: l.total_weight_mt !== "" && l.total_weight_mt !== undefined && Number(l.total_weight_mt) > 0 ? Number(l.total_weight_mt) : undefined
        }))
      });
      createMutation.mutate(validated);
    } catch (err: any) {
      if (err.errors && Array.isArray(err.errors)) {
        setFormError(err.errors[0]?.message || "Validation error in lengths.");
      } else {
        setFormError(err.message);
      }
    }
  };

  // Table Columns
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "heat_number",
      header: "HEAT NUMBER",
      cell: ({ row }) => (
        <div className="font-bold text-slate-900 font-mono flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
          <span>{row.original.heat_number}</span>
        </div>
      )
    },
    {
      accessorKey: "grade",
      header: "GRADE",
      cell: ({ row }) => (
        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
          {row.original.grade}
        </span>
      )
    },
    {
      accessorKey: "section",
      header: "SECTION",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-medium text-slate-600">
          {row.original.section}
        </span>
      )
    },
    {
      accessorKey: "total_pieces",
      header: "TOTAL PIECES",
      cell: ({ row }) => (
        <span className="font-bold text-slate-900">
          {row.original.total_pieces} pcs
        </span>
      )
    },
    {
      accessorKey: "total_weight_mt",
      header: "INITIAL CAST MT",
      cell: ({ row }) => (
        <span className="font-bold text-slate-900">
          {row.original.total_weight_mt} MT
        </span>
      )
    },
    {
      accessorKey: "available_pieces",
      header: "YARD AVAILABLE",
      cell: ({ row }) => (
        <div>
          <span className="font-bold text-emerald-700">
            {row.original.available_pieces} pcs
          </span>
          <span className="text-xs text-slate-500 ml-1.5 font-medium">
            ({row.original.available_weight_mt} MT)
          </span>
        </div>
      )
    },
    {
      accessorKey: "status",
      header: "STATUS",
      cell: ({ row }) => {
        const s = row.original.status || "CAST";
        const isApproved = s.includes("APPROVED");
        const isDispatch = s.includes("DISPATCH");
        return (
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${isApproved
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : isDispatch
                ? "bg-orange-50 text-orange-700 border-orange-200"
                : "bg-blue-50 text-blue-700 border-blue-200"
              }`}
          >
            {s}
          </span>
        );
      }
    },
    {
      id: "actions",
      header: "ACTION",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedHeat(row.original)}
            className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
            title="View / Add Cut Lengths"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setEditingHeat(row.original);
              setEditGrade(row.original.grade || "AISI 304");
              setEditSection(row.original.section || "120x120 mm");
              setEditStatus(row.original.status || "CAST");
              setEditError(null);
            }}
            className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
            title="Edit Heat"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (confirm(`Are you sure you want to delete Heat ${row.original.heat_number}? All associated cut lengths and records will be deleted.`)) {
                deleteHeatMutation.mutate(row.original.id || row.original._id);
              }
            }}
            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Delete Heat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <Link
            href={`/dashboard/traceability?heat=${row.original.heat_number}`}
            className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
            title="Trace 360°"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )
    }
  ];

  return (
    <>
      <Topbar
        pageTitle="Cast Billets & Heat Master"
        mobileTitle="Billet Casting"
        pageSubtitle="SMS casting, multi-length cut management (7.4m, 5.0m, 5.4m) & yard inventory"
      />

      <main className="p-3.5 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8 flex-1 font-sans">
        {/* Hero Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-sans">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-orange-50 text-orange-600 border border-orange-200/60 shadow-xs shrink-0">
              <Layers className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-sans">
                  Primary Steel Casting (SMS / CCM)
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-orange-100 text-orange-700 border border-orange-200">
                  Step 1: SMS Master
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-sans">
                Record heats, cast multi-length pieces (7.4m, 5.0m, 5.4m), and calculate total initial weights
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => refetch()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-md shadow-orange-500/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Cast New Heat</span>
            </button>
          </div>
        </div>

        {/* StatCards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-5">
          <StatCard
            title="TOTAL HEATS"
            value={isLoading ? "..." : (pagination?.total ?? heats.length)}
            subtitle="Registered SMS cast heats"
            icon={Flame}
            variant="orange"
          />
          <StatCard
            title="TOTAL CAST PIECES"
            value={heats.reduce((acc: number, h: any) => acc + (h.total_pieces || 0), 0)}
            subtitle="Combined pieces across all cuts"
            icon={Boxes}
            variant="blue"
          />
          <StatCard
            title="TOTAL CAST WEIGHT"
            value={`${Number(
              heats.reduce((acc: number, h: any) => acc + (Number(h.total_weight_mt) || 0), 0).toFixed(3)
            )} MT`}
            subtitle="Initial total casting tonnage"
            icon={Layers}
            variant="purple"
          />
          <StatCard
            title="CURRENT YARD BALANCE"
            value={`${Number(
              heats.reduce((acc: number, h: any) => acc + (Number(h.available_weight_mt) || 0), 0).toFixed(3)
            )} MT`}
            subtitle="Available for mill transfers"
            icon={CheckCircle2}
            variant="emerald"
          />
        </div>

        {/* Data Table */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Cast Billets Master Inventory
              </h2>
              <p className="text-xs text-slate-500">
                Live inventory of cast heats, dimensions, and remaining yard balances
              </p>
            </div>
            {pagination?.total !== undefined && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono">
                Total Heats: {pagination.total}
              </span>
            )}
          </div>

          <DataTable
            columns={columns}
            data={heats}
            searchPlaceholder="Search by heat number, grade, section..."
            isLoading={isLoading}
            serverPagination={{
              page,
              pageSize,
              total: pagination?.total ?? heats.length,
              totalPages:
                pagination?.totalPages ??
                Math.max(1, Math.ceil((pagination?.total ?? heats.length) / pageSize)),
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
        </div>
      </main>

      {/* Cast Heat Modal with Dynamic Multi-Length Cut Rows */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Cast New Heat with Multi-Length Billet Cuts"
        subtitle="Add different lengths (e.g. 7.4m, 5.0m, 5.4m) with pieces & automated weight calculation"
        maxWidth="2xl"
      >
        <form onSubmit={handleCastSubmit} className="space-y-5">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
              {formError}
            </div>
          )}

          {/* Core Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Heat Number *
              </label>
              <input
                type="text"
                required
                value={heatNumber}
                onChange={(e) => setHeatNumber(e.target.value.toUpperCase())}
                placeholder="e.g. CH-XX01"
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Grade *
              </label>
              <input
                type="text"
                required
                list="grades-options"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="e.g.  304,316L"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
              <datalist id="grades-options">
                {gradesList.map((g: any) => (
                  <option key={g.id || g.code} value={g.code}>
                    {g.code} - {g.name}
                  </option>
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Section Dimension *
              </label>
              <input
                type="text"
                required
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="e.g. 120x120 mm"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Multi-Length Cut Section */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800">
                  Cut Length Variants (Multiple Lengths & Piece Counts)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Enter length, piece quantity, and manual weights or use automated cross-section calculations.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddLengthRow}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-orange-300 hover:text-orange-600 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Length Cut</span>
              </button>
            </div>

            {/* Dynamic Rows */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {lengths.map((row, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white rounded-xl border border-slate-200/80 grid grid-cols-2 sm:flex sm:items-center sm:gap-2.5 gap-2.5 shadow-2xs relative"
                >
                  <div className="col-span-1 sm:w-28">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                      Length (m)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={row.length_meters}
                      onChange={(e) =>
                        handleLengthChange(idx, "length_meters", e.target.value)
                      }
                      className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div className="col-span-1 sm:w-24">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                      Pieces
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={row.piece_count}
                      onChange={(e) =>
                        handleLengthChange(idx, "piece_count", e.target.value)
                      }
                      className="w-full px-2.5 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>

                    <div className="col-span-1 sm:w-32">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5" title="Manual weight input per billet cut">
                        Piece Wt (kg)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={row.weight_per_piece_kg}
                        onChange={(e) =>
                          handleLengthChange(idx, "weight_per_piece_kg", e.target.value)
                        }
                        className="w-full px-2.5 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                        placeholder="Manual wt (kg)"
                      />
                    </div>

                    <div className="col-span-1 sm:w-32">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5" title="Manual total weight in metric tons">
                        Total MT
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={row.total_weight_mt}
                        onChange={(e) =>
                          handleLengthChange(idx, "total_weight_mt", e.target.value)
                        }
                        className="w-full px-2.5 py-1.5 text-xs font-black bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                        placeholder="Manual MT"
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-1 flex justify-end sm:justify-center sm:pt-4">
                      <button
                        type="button"
                        disabled={lengths.length <= 1}
                        onClick={() => handleRemoveLengthRow(idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 transition-colors cursor-pointer"
                        title="Remove cut length"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {/* Live Combined Totals Header */}
            <div className="p-3 bg-orange-50 border border-orange-200/80 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-orange-800 font-bold">
                <CheckCircle2 className="w-4 h-4 text-orange-500" />
                <span>Aggregated Casting Totals:</span>
              </div>
              <div className="flex items-center gap-4 text-orange-950">
                <span>
                  Total Pieces: <strong className="text-sm font-black">{totalPiecesSum} pcs</strong>
                </span>
                <span>
                  Initial Weight: <strong className="text-sm font-black">{totalWeightSumMt} MT</strong>
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Remarks
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Prime heats cast for wire rod rolling"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-5 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-md shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {createMutation.isPending ? "Casting Heat..." : "Cast Heat & Save Lengths"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Selected Heat Length Details Modal */}
      {selectedHeat && (
        <Modal
          isOpen={Boolean(selectedHeat)}
          onClose={() => setSelectedHeat(null)}
          title={`Length Cuts & Piece Inventory: ${selectedHeat.heat_number}`}
          subtitle={`Grade: ${selectedHeat.grade} | Section: ${selectedHeat.section}`}
          maxWidth="xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Pieces</span>
                <span className="text-base font-extrabold text-slate-900">{selectedHeat.total_pieces} pcs</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Cast MT</span>
                <span className="text-base font-extrabold text-slate-900">{selectedHeat.total_weight_mt} MT</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-emerald-700 font-bold uppercase block">Available Pieces</span>
                <span className="text-base font-extrabold text-emerald-700">{selectedHeat.available_pieces} pcs</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-emerald-700 font-bold uppercase block">Available MT</span>
                <span className="text-base font-extrabold text-emerald-700">{selectedHeat.available_weight_mt} MT</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Length Variants Breakdown
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddingLength(!isAddingLength)}
                  className="px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingLength ? "Cancel" : "Add Length Variant"}</span>
                </button>
              </div>

              {/* Add Length Variant Inline Form */}
              {isAddingLength && (
                <form onSubmit={handleAddLengthSubmit} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3 font-sans">
                  <div className="text-xs font-bold text-slate-800">Add New Cut Length Specification</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Length (Meters) *</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        required
                        value={newLengthMeters}
                        onChange={(e) => setNewLengthMeters(e.target.value)}
                        placeholder="e.g. 7.4"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Piece Count *</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={newPieceCount}
                        onChange={(e) => setNewPieceCount(e.target.value)}
                        placeholder="e.g. 10"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Weight / Pc (kg) *</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        required
                        value={newWeightPerPieceKg}
                        onChange={(e) => setNewWeightPerPieceKg(e.target.value)}
                        placeholder="e.g. 836.5"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 font-bold"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingLength(false)}
                      className="px-3 py-1 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addLengthMutation.isPending}
                      className="px-3 py-1 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {addLengthMutation.isPending ? "Adding..." : "Save Cut Length"}
                    </button>
                  </div>
                </form>
              )}

              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {(selectedHeat.lengths || []).map((len: any) => (
                  <div key={len.id || len._id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900 font-mono text-sm">
                        {len.length_meters}m
                      </span>
                      <span className="text-slate-500">
                        ({len.piece_count} total pcs, {len.weight_per_piece_kg} kg/pc)
                      </span>
                    </div>
                    <div className="flex items-center gap-3 font-mono">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Dispatched</span>
                        <span className="font-semibold text-slate-700">{len.dispatched_pieces || 0} pcs</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 text-[10px] block">Remaining</span>
                        <span className="font-bold text-emerald-600">{len.remaining_pieces ?? len.available_pieces ?? len.piece_count} pcs</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Remove this ${len.length_meters}m cut length?`)) {
                            deleteLengthMutation.mutate(len.id || len._id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                        title="Delete Length Cut"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Link
                href={`/dashboard/traceability?heat=${selectedHeat.heat_number}`}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-md shadow-orange-500/25 transition-all flex items-center gap-1.5"
              >
                <span>Open Full 360° Traceability</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </Modal>
      )}

      {/* EDIT HEAT MASTER MODAL */}
      {editingHeat && (
        <Modal
          isOpen={!!editingHeat}
          onClose={() => setEditingHeat(null)}
          title={`Edit Cast Heat: ${editingHeat.heat_number}`}
          subtitle="Modify steel grade, billet section, or status clearance."
          maxWidth="md"
        >
          <form onSubmit={handleEditHeatSubmit} className="space-y-4 font-sans">
            {editError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Steel Grade *
              </label>
              <input
                type="text"
                required
                value={editGrade}
                onChange={(e) => setEditGrade(e.target.value)}
                placeholder="e.g. AISI 304 / IS 2062"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Billet Section (Cross-Section) *
              </label>
              <input
                type="text"
                required
                value={editSection}
                onChange={(e) => setEditSection(e.target.value)}
                placeholder="e.g. 120x120 mm"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold text-slate-900"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingHeat(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editHeatMutation.isPending}
                className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl shadow-md shadow-orange-500/25 transition-all cursor-pointer disabled:opacity-50"
              >
                {editHeatMutation.isPending ? "Saving..." : "Save Heat Changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
