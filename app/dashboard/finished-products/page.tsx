"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Package,
  Factory,
  Layers,
  RefreshCw,
  Plus,
  Box,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Trash2,
  Flame
} from "lucide-react";
import Topbar from "../../../components/Topbar";
import StatCard from "../../../components/StatCard";
import DataTable from "../../../components/DataTable";
import Modal from "../../../components/Modal";
import { ColumnDef } from "@tanstack/react-table";
import { api } from "../../../lib/api";
import { finishedProductSchema } from "../../../lib/schemas";
import { PLANT_CATEGORIES, formatPlantName } from "../../../lib/plants";

export default function FinishedProductsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit State
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editProductName, setEditProductName] = useState("");
  const [editProductSize, setEditProductSize] = useState("");
  const [editMillName, setEditMillName] = useState("");
  const [editInputWeightMt, setEditInputWeightMt] = useState<string>("");
  const [editFinishedWeightMt, setEditFinishedWeightMt] = useState<string>("");
  const [editFinishedPieces, setEditFinishedPieces] = useState<string>("");
  const [editRemarks, setEditRemarks] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    heat_number: "",
    dispatch_id: "",
    finished_product_name: "",
    finished_size: "",
    standard_specification: "ASTM A276 / EN 10088-3",
    input_billet_weight_mt: "",
    finished_pieces: "",
    finished_weight_mt: "",
    mill_name: "",
    lot_number: "",
    remarks: "",
    include_scrap: false,
    scrap_weight_mt: "",
    scrap_pieces: "",
    scrap_rejection_type: "END_CROP_SCRAP",
    scrap_reason: "Rolling mill crop scrap generated during production",
    include_return: false,
    returned_weight_mt: "",
    returned_pieces: "",
    returned_to: "Billet Yard Stock",
    return_reason: "Unused billet material returned to yard stock"
  });

  // Calculate yield & material consumption delta dynamically
  const numInput = parseFloat(formData.input_billet_weight_mt) || 0;
  const numOutput = parseFloat(formData.finished_weight_mt) || 0;
  const numScrap = formData.include_scrap ? (parseFloat(formData.scrap_weight_mt) || 0) : 0;
  const numReturn = formData.include_return ? (parseFloat(formData.returned_weight_mt) || 0) : 0;
  const calculatedYield = numInput > 0 ? Number(((numOutput / numInput) * 100).toFixed(2)) : 0;
  const consumptionDelta = numInput > numOutput ? Number((numInput - numOutput).toFixed(3)) : 0;
  const remainingScaleLoss = Math.max(0, Number((numInput - numOutput - numScrap - numReturn).toFixed(3)));
  const isOverAllocated = (numOutput + numScrap + numReturn) > numInput + 0.001;

  // Pagination & Search state for backend pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");

  // 1. Fetch Finished Products with backend pagination & search
  const {
    data: productsData,
    isLoading,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ["finished-products", page, pageSize, search],
    queryFn: () =>
      api.get(
        `/finished-products?page=${page}&limit=${pageSize}&search=${encodeURIComponent(search)}`
      )
  });

  // 2. Fetch Heats for selection
  const { data: heatsData } = useQuery({
    queryKey: ["heats-dropdown"],
    queryFn: () => api.get("/billets/heats")
  });

  // 3. Fetch Plants / Mills dynamically from database
  const { data: plantsData } = useQuery({
    queryKey: ["plants"],
    queryFn: () => api.get("/plants")
  });

  // 4. Fetch Dispatches for selected heat
  const { data: heatDispatchesData } = useQuery({
    queryKey: ["heat-dispatches", formData.heat_number],
    queryFn: () => api.get(`/dispatches?heat_number=${formData.heat_number}`),
    enabled: !!formData.heat_number
  });

  const products = productsData?.data || [];
  const pagination = productsData?.pagination;
  const heats = heatsData?.data || [];
  const plantsList = plantsData?.data || [];
  const heatDispatches = heatDispatchesData?.data || [];

  // Create Product Mutation
  const createMutation = useMutation({
    mutationFn: (newProd: any) => api.post("/finished-products", newProd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finished-products"] });
      queryClient.invalidateQueries({ queryKey: ["rejections"] });
      queryClient.invalidateQueries({ queryKey: ["returns"] });
      queryClient.invalidateQueries({ queryKey: ["heat-dispatches"] });
      queryClient.invalidateQueries({ queryKey: ["billet-heats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["traceability-summary"] });
      queryClient.invalidateQueries({ queryKey: ["heat-traceability"] });
      setIsModalOpen(false);
      setFormError(null);
      setFormData({
        heat_number: "",
        dispatch_id: "",
        finished_product_name: "",
        finished_size: "",
        standard_specification: "ASTM A276 / EN 10088-3",
        input_billet_weight_mt: "",
        finished_pieces: "",
        finished_weight_mt: "",
        mill_name: "",
        lot_number: "",
        remarks: "",
        include_scrap: false,
        scrap_weight_mt: "",
        scrap_pieces: "",
        scrap_rejection_type: "END_CROP_SCRAP",
        scrap_reason: "Rolling mill crop scrap generated during production",
        include_return: false,
        returned_weight_mt: "",
        returned_pieces: "",
        returned_to: "Billet Yard Stock",
        return_reason: "Unused billet material returned to yard stock"
      });
    },
    onError: (err: any) => {
      setFormError(err.message || "Failed to record finished product.");
    }
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/finished-products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finished-products"] });
      queryClient.invalidateQueries({ queryKey: ["billet-heats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["traceability-summary"] });
      queryClient.invalidateQueries({ queryKey: ["heat-traceability"] });
      setEditingProduct(null);
      setEditError(null);
    },
    onError: (err: any) => {
      setEditError(err.message || "Failed to update finished product.");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/finished-products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finished-products"] });
      queryClient.invalidateQueries({ queryKey: ["billet-heats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["traceability-summary"] });
      queryClient.invalidateQueries({ queryKey: ["heat-traceability"] });
    },
    onError: (err: any) => {
      alert(err.message || "Failed to delete product record.");
    }
  });

  const handleOpenEdit = (prod: any) => {
    setEditingProduct(prod);
    setEditProductName(prod.finished_product_name || "");
    setEditProductSize(prod.finished_size || "");
    setEditMillName(formatPlantName(prod.mill_name) || "RM10 - New Plant Rolling Mill 10");
    setEditInputWeightMt(prod.input_billet_weight_mt !== undefined ? String(prod.input_billet_weight_mt) : "");
    setEditFinishedWeightMt(prod.finished_weight_mt !== undefined ? String(prod.finished_weight_mt) : "");
    setEditFinishedPieces(prod.finished_pieces !== undefined ? String(prod.finished_pieces) : "");
    setEditRemarks(prod.remarks || "");
    setEditError(null);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    const fw = parseFloat(editFinishedWeightMt);
    if (isNaN(fw) || fw <= 0) {
      setEditError("Finished product weight must be a positive number greater than 0.");
      return;
    }
    editMutation.mutate({
      id: editingProduct.id || editingProduct._id,
      data: {
        finished_product_name: editProductName,
        finished_size: editProductSize,
        mill_name: editMillName,
        finished_weight_mt: fw,
        finished_pieces: parseInt(editFinishedPieces, 10) || 0,
        remarks: editRemarks
      }
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const inputWt = parseFloat(formData.input_billet_weight_mt);
    const finishWt = parseFloat(formData.finished_weight_mt);

    if (isNaN(inputWt) || inputWt <= 0) {
      setFormError("Input billet weight must be a positive number greater than 0.");
      return;
    }
    if (isNaN(finishWt) || finishWt <= 0) {
      setFormError("Finished product weight must be a positive number greater than 0.");
      return;
    }
    if (finishWt > inputWt) {
      setFormError(`Finished output weight (${finishWt} MT) cannot exceed input billet weight (${inputWt} MT).`);
      return;
    }

    if (isOverAllocated) {
      setFormError(
        `Total allocated outputs (${(finishWt + numScrap + numReturn).toFixed(3)} MT) exceed input billet consumption (${inputWt.toFixed(3)} MT)!`
      );
      return;
    }

    const payload: any = {
      heat_number: formData.heat_number.trim().toUpperCase(),
      dispatch_id: formData.dispatch_id || undefined,
      finished_product_name: formData.finished_product_name.trim(),
      finished_size: formData.finished_size.trim(),
      standard_specification: formData.standard_specification || "ASTM A276 / EN 10088-3",
      input_billet_weight_mt: inputWt,
      finished_pieces: parseInt(formData.finished_pieces, 10) || 0,
      finished_weight_mt: finishWt,
      mill_name: formData.mill_name || "RM10 - New Plant Rolling Mill 10",
      lot_number: formData.lot_number || undefined,
      remarks: formData.remarks || undefined
    };

    if (formData.include_scrap && numScrap > 0) {
      payload.scrap_weight_mt = numScrap;
      payload.scrap_pieces = parseInt(formData.scrap_pieces, 10) || 0;
      payload.scrap_rejection_type = formData.scrap_rejection_type;
      payload.scrap_reason = formData.scrap_reason;
    }

    if (formData.include_return && numReturn > 0) {
      payload.returned_weight_mt = numReturn;
      payload.returned_pieces = parseInt(formData.returned_pieces, 10) || 1;
      payload.returned_to = formData.returned_to;
      payload.return_reason = formData.return_reason;
    }

    try {
      const validated = finishedProductSchema.parse(payload);
      createMutation.mutate(validated);
    } catch (err: any) {
      if (err.errors && Array.isArray(err.errors)) {
        setFormError(err.errors[0]?.message || "Validation failed.");
      } else {
        setFormError(err.message);
      }
    }
  };

  // TanStack Table Column Definitions matching screenshot
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "production_batch_number",
      header: "PRODUCT CODE / BATCH",
      cell: ({ row }) => (
        <div className="font-bold text-slate-900 font-mono flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
          <span>{row.original.production_batch_number}</span>
        </div>
      )
    },
    {
      accessorKey: "finished_product_name",
      header: "SPECIFICATION & NAME",
      cell: ({ row }) => (
        <div>
          <div className="font-bold text-slate-800">
            {row.original.finished_product_name}
          </div>
          <div className="text-[10px] text-slate-500">
            {row.original.standard_specification}
          </div>
        </div>
      )
    },
    {
      accessorKey: "finished_size",
      header: "PROFILE TYPE / SIZE",
      cell: ({ row }) => (
        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800">
          {row.original.finished_size}
        </span>
      )
    },
    {
      accessorKey: "mill_name",
      header: "MILL / PLANT",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 font-medium text-slate-800 text-xs">
          <Factory className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="font-semibold text-xs text-slate-900">{formatPlantName(row.original.mill_name)}</span>
        </div>
      )
    },
    {
      accessorKey: "heat_number",
      header: "SOURCE HEAT",
      cell: ({ row }) => (
        <Link
          href={`/dashboard/traceability?heat=${row.original.heat_number}`}
          className="font-mono text-xs font-semibold text-slate-700 hover:text-orange-600 hover:underline flex items-center gap-1 transition-colors"
          title="Inspect in 360° Traceability"
        >
          <Flame className="w-3.5 h-3.5 text-orange-500" />
          <span>{row.original.heat_number}</span>
        </Link>
      )
    },
    {
      accessorKey: "input_billet_weight_mt",
      header: "INPUT MT",
      cell: ({ row }) => (
        <span className="font-medium text-slate-600">
          {row.original.input_billet_weight_mt} MT
        </span>
      )
    },
    {
      accessorKey: "finished_weight_mt",
      header: "OUTPUT MT",
      cell: ({ row }) => (
        <span className="font-bold text-slate-900">
          {row.original.finished_weight_mt} MT
        </span>
      )
    },
    {
      accessorKey: "yield_percentage",
      header: "ROLLING YIELD",
      cell: ({ row }) => {
        const y = Number(row.original.yield_percentage);
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
            {y}%
          </span>
        );
      }
    },
    {
      id: "actions",
      header: "ACTION",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleOpenEdit(row.original)}
            className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
            title="Edit Finished Product"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete product entry '${row.original.finished_product_name}'?`)) {
                deleteMutation.mutate(row.original.id || row.original._id);
              }
            }}
            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Delete Product Entry"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {row.original.heat_number && (
            <Link
              href={`/dashboard/traceability?heat=${row.original.heat_number}`}
              className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              title="Trace Heat"
            >
              <Flame className="w-4 h-4" />
            </Link>
          )}
        </div>
      )
    }
  ];

  return (
    <>
      <Topbar
        pageTitle="Finished Products Master"
        mobileTitle="Finished Goods"
        pageSubtitle="Prime rebar, wire rod & rolled steel specifications"
      />

      <main className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8 flex-1 font-sans">
        {/* Page Hero Banner matching screenshot */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-sans">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-orange-50 text-orange-600 border border-orange-200/60 shadow-xs shrink-0">
              <Box className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-sans">
                  Finished Prime Products Catalog
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-orange-100 text-orange-700 border border-orange-200">
                  Step 4: Finished Goods
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-sans">
                Manage manufactured prime steel products, rolled rebar specifications & mill lines
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => refetch()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-md shadow-orange-500/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Steel Product</span>
            </button>
          </div>
        </div>

        {/* 3 StatCards exactly as shown in screenshot */}
        {/* <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
          <StatCard
            title="TOTAL REGISTERED PRODUCTS"
            value={isLoading ? "..." : products.length}
            subtitle="Certified finished steel catalog"
            icon={Box}
            variant="orange"
          />
          <StatCard
            title="MANUFACTURING MILL LINES"
            value={3}
            subtitle="WRM, Bar Mill & Section Mills"
            icon={Factory}
            variant="slate"
          />
          <StatCard
            title="STANDARD PRODUCT PROFILES"
            value={4}
            subtitle="Rebar, Rounds, Wire Rod, Coils"
            icon={Layers}
            variant="emerald"
          />
        </div> */}

        {/* TanStack Table Card matching screenshot */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Finished Product Specifications
              </h2>
              <p className="text-xs text-slate-500">
                Official registered steel SKUs manufactured across all mills
              </p>
            </div>
            {pagination?.total !== undefined && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono">
                Total Products: {pagination.total}
              </span>
            )}
          </div>

          <DataTable
            columns={columns}
            data={products}
            searchPlaceholder="Search products..."
            isLoading={isLoading}
            serverPagination={{
              page,
              pageSize,
              total: pagination?.total ?? products.length,
              totalPages:
                pagination?.totalPages ??
                Math.max(1, Math.ceil((pagination?.total ?? products.length) / pageSize)),
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

      {/* New Steel Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record New Manufactured Steel Product"
        subtitle="Log rolled finished wire rod, rebar, or coils from cast heat billets"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Source Heat Number *
              </label>
              <select
                required
                value={formData.heat_number}
                onChange={(e) => setFormData({ ...formData, heat_number: e.target.value, dispatch_id: "" })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800"
              >
                <option value="">-- Select Source Heat --</option>
                {heats.map((h: any) => (
                  <option key={h.id || h._id} value={h.heat_number}>
                    {h.heat_number} ({h.grade} - {h.section})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Processing Mill / Plant Unit *
              </label>
              <select
                value={formatPlantName(formData.mill_name)}
                onChange={(e) => setFormData({ ...formData, mill_name: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800 cursor-pointer"
              >
                <option value="">-- Select Plant Unit (7 Units Only) --</option>
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

          {heatDispatches.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Linked Plant Transfer / Dispatch Manifest (Optional)
              </label>
              <select
                value={formData.dispatch_id}
                onChange={(e) => {
                  const dId = e.target.value;
                  const found = heatDispatches.find((d: any) => (d.id || d._id) === dId);
                  setFormData({
                    ...formData,
                    dispatch_id: dId,
                    mill_name: found ? formatPlantName(found.target_plant) : formData.mill_name,
                    input_billet_weight_mt: found?.dispatched_weight_mt ? String(found.dispatched_weight_mt) : formData.input_billet_weight_mt
                  });
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-sans"
              >
                <option value="">-- Optional: Link to Specific Dispatch Manifest --</option>
                {heatDispatches.map((d: any) => (
                  <option key={d.id || d._id} value={d.id || d._id}>
                    {d.dispatch_number} → {formatPlantName(d.target_plant)} ({d.dispatched_pieces} pcs / {d.dispatched_weight_mt} MT)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Product Specification & Name *
              </label>
              <input
                type="text"
                required
                value={formData.finished_product_name}
                onChange={(e) => setFormData({ ...formData, finished_product_name: e.target.value })}
                placeholder="e.g. SS 304 Wire Rod in Coils"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Finished Size / Profile *
              </label>
              <input
                type="text"
                required
                value={formData.finished_size}
                onChange={(e) => setFormData({ ...formData, finished_size: e.target.value })}
                placeholder="e.g. 5.5 mm"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Input Billet MT (Consumption) *
              </label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={formData.input_billet_weight_mt}
                onChange={(e) =>
                  setFormData({ ...formData, input_billet_weight_mt: e.target.value })
                }
                placeholder="e.g. 0.061"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Finished Output MT (Prime) *
              </label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={formData.finished_weight_mt}
                onChange={(e) =>
                  setFormData({ ...formData, finished_weight_mt: e.target.value })
                }
                placeholder="e.g. 0.050"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Calculated Yield %
              </label>
              <div className="w-full px-3 py-2 text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl flex items-center justify-between">
                <span>{calculatedYield}%</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
          </div>

          {/* MATERIAL CONSUMPTION & RECONCILIATION CARD (WHEN OUTPUT IS LESS THAN INPUT) */}
          {consumptionDelta > 0.0001 && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/90 via-orange-50/70 to-amber-50/90 border border-amber-200/90 shadow-xs space-y-3 font-sans">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                    Material Allocation: Output is Less Than Consumption
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-200/80 text-amber-900 border border-amber-300">
                  Δ {consumptionDelta.toFixed(3)} MT to account
                </span>
              </div>

              <p className="text-[11px] text-amber-800 leading-relaxed">
                Input billet material (<strong>{numInput.toFixed(3)} MT</strong>) exceeds prime finished output (<strong>{numOutput.toFixed(3)} MT</strong>) by <strong>{consumptionDelta.toFixed(3)} MT</strong>. You can add scrap loss and/or return unused billets below:
              </p>

              {/* Option 1: Add Scrap */}
              <div className="p-3 bg-white/90 rounded-xl border border-amber-200/80 space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.include_scrap}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFormData({
                        ...formData,
                        include_scrap: checked,
                        scrap_weight_mt: checked && !formData.scrap_weight_mt ? String(Number((consumptionDelta - numReturn).toFixed(3)) > 0 ? (consumptionDelta - numReturn).toFixed(3) : "") : formData.scrap_weight_mt
                      });
                    }}
                    className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500 cursor-pointer"
                  />
                  <span>Add Rejection Scrap (Send to SMS Furnace Remelt)</span>
                </label>

                {formData.include_scrap && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Scrap Weight (MT) *
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={formData.scrap_weight_mt}
                        onChange={(e) => setFormData({ ...formData, scrap_weight_mt: e.target.value })}
                        placeholder="e.g. 0.005"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-rose-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Defect / Scrap Type
                      </label>
                      <select
                        value={formData.scrap_rejection_type}
                        onChange={(e) => setFormData({ ...formData, scrap_rejection_type: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800"
                      >
                        <option value="END_CROP_SCRAP">End Crop Scrap (Head / Tail)</option>
                        <option value="COBBLE_SCRAP">Mill Cobble Scrap</option>
                        <option value="SURFACE_CRACKS">Surface Cracks / Seams</option>
                        <option value="SECTION_DEFECT">Section Size Distortion</option>
                        <option value="INTERNAL_POROSITY">Internal Porosity / Pipe</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Scrap Pieces
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.scrap_pieces}
                        onChange={(e) => setFormData({ ...formData, scrap_pieces: e.target.value })}
                        placeholder="0 pcs"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Option 2: Include Return Material */}
              <div className="p-3 bg-white/90 rounded-xl border border-amber-200/80 space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.include_return}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFormData({
                        ...formData,
                        include_return: checked,
                        returned_weight_mt: checked && !formData.returned_weight_mt ? String(Number((consumptionDelta - numScrap).toFixed(3)) > 0 ? (consumptionDelta - numScrap).toFixed(3) : "") : formData.returned_weight_mt
                      });
                    }}
                    className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500 cursor-pointer"
                  />
                  <span>Include Return Material (Unused Billets back to Yard Stock)</span>
                </label>

                {formData.include_return && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Return Weight (MT) *
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={formData.returned_weight_mt}
                        onChange={(e) => setFormData({ ...formData, returned_weight_mt: e.target.value })}
                        placeholder="e.g. 0.010"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-amber-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Receiving Yard / Unit
                      </label>
                      <select
                        value={formData.returned_to}
                        onChange={(e) => setFormData({ ...formData, returned_to: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800"
                      >
                        <option value="Billet Yard Stock">Billet Yard Stock (SMS Central)</option>
                        <option value="SMS Induction / Arc Furnace (Remelt Bay)">SMS Furnace Remelt Bay</option>
                        <option value="SMS Quality Hold Yard">SMS Quality Hold Yard</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Returned Pieces
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.returned_pieces}
                        onChange={(e) => setFormData({ ...formData, returned_pieces: e.target.value })}
                        placeholder="1 pcs"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Live Balance Summary */}
              <div className="p-3 bg-white/95 rounded-xl border border-amber-200/90 text-xs font-mono">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Input Consumed:</span>
                    <span className="font-bold text-slate-900">{numInput.toFixed(3)} MT</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Prime Output:</span>
                    <span className="font-bold text-emerald-700">{numOutput.toFixed(3)} MT</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Scrap + Return:</span>
                    <span className="font-bold text-amber-700">{(numScrap + numReturn).toFixed(3)} MT</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Scale Loss / Balance:</span>
                    <span className={`font-black ${isOverAllocated ? "text-rose-600" : "text-slate-900"}`}>
                      {remainingScaleLoss.toFixed(3)} MT
                    </span>
                  </div>
                </div>

                {isOverAllocated ? (
                  <p className="mt-2 text-[11px] text-rose-700 font-sans font-bold">
                    ⚠️ Total allocated outputs ({(numOutput + numScrap + numReturn).toFixed(3)} MT) exceed input billet consumption ({numInput.toFixed(3)} MT)!
                  </p>
                ) : (
                  <p className="mt-2 text-[11px] text-emerald-800 font-sans font-medium">
                    ✓ Material accounted for: Prime ({numOutput.toFixed(3)} MT) + Scrap ({numScrap.toFixed(3)} MT) + Return ({numReturn.toFixed(3)} MT) + Burning Loss ({remainingScaleLoss.toFixed(3)} MT) = {numInput.toFixed(3)} MT.
                  </p>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Finished Pieces (Bundles / Coils)
            </label>
            <input
              type="number"
              min="0"
              value={formData.finished_pieces}
              onChange={(e) =>
                setFormData({ ...formData, finished_pieces: e.target.value })
              }
              placeholder="e.g. 24 bundles"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800"
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
              disabled={createMutation.isPending || isOverAllocated}
              className="px-5 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-md shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {createMutation.isPending ? "Recording Product..." : "Save Finished Product"}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT FINISHED PRODUCT MODAL */}
      {editingProduct && (
        <Modal
          isOpen={!!editingProduct}
          onClose={() => setEditingProduct(null)}
          title={`Edit Product: ${editingProduct.finished_product_name}`}
          subtitle="Modify product specification, rolled size, piece count, or finished weight."
          maxWidth="md"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4 font-sans">
            {editError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Finished Product Name *
              </label>
              <input
                type="text"
                required
                value={editProductName}
                onChange={(e) => setEditProductName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Processing Mill / Plant Unit *
              </label>
              <select
                value={formatPlantName(editMillName)}
                onChange={(e) => setEditMillName(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800 font-sans cursor-pointer"
              >
                <option value="">-- Select Plant Unit (7 Units Only) --</option>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Finished Size *
                </label>
                <input
                  type="text"
                  required
                  value={editProductSize}
                  onChange={(e) => setEditProductSize(e.target.value)}
                  placeholder="e.g. 5.5 mm / 16 mm"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Finished Output MT *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={editFinishedWeightMt}
                  onChange={(e) => setEditFinishedWeightMt(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editMutation.isPending}
                className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl shadow-md shadow-orange-500/25 transition-all cursor-pointer disabled:opacity-50"
              >
                {editMutation.isPending ? "Updating..." : "Save Product Changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
