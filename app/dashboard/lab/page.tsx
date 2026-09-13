"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShieldCheck,
  FlaskConical,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Pencil,
  Trash2,
  Flame,
  Sparkles,
  ExternalLink,
  SlidersHorizontal
} from "lucide-react";
import Topbar from "../../../components/Topbar";
import StatCard from "../../../components/StatCard";
import DataTable from "../../../components/DataTable";
import Modal from "../../../components/Modal";
import { ColumnDef } from "@tanstack/react-table";
import { api } from "../../../lib/api";
import { labCheckSchema } from "../../../lib/schemas";

// Standard ASTM element ranges for quick reference and pre-fill presets
const GRADE_PRESETS: Record<string, any> = {
  "AISI 304": {
    c_percent: 0.065,
    mn_percent: 1.82,
    si_percent: 0.54,
    s_percent: 0.012,
    p_percent: 0.028,
    cr_percent: 18.25,
    ni_percent: 8.15,
    mo_percent: 0.21,
    cu_percent: 0.18
  },
  "AISI 316L": {
    c_percent: 0.025,
    mn_percent: 1.65,
    si_percent: 0.52,
    s_percent: 0.011,
    p_percent: 0.026,
    cr_percent: 16.85,
    ni_percent: 10.25,
    mo_percent: 2.15,
    cu_percent: 0.15
  },
  "AISI 201": {
    c_percent: 0.095,
    mn_percent: 7.15,
    si_percent: 0.65,
    s_percent: 0.014,
    p_percent: 0.035,
    cr_percent: 16.20,
    ni_percent: 4.10,
    mo_percent: 0.08,
    cu_percent: 1.25
  },
  "EN8 / 080M40": {
    c_percent: 0.40,
    mn_percent: 0.80,
    si_percent: 0.25,
    s_percent: 0.025,
    p_percent: 0.025,
    cr_percent: 0.15,
    ni_percent: 0.10,
    mo_percent: 0.02,
    cu_percent: 0.12
  }
};

export default function LabPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedChemicalAnalysis, setSelectedChemicalAnalysis] = useState<any | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Pagination & Search state for backend pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    heat_id: "",
    test_certificate_no: "TC-CH-2026-0809",
    c_percent: 0.065,
    mn_percent: 1.82,
    si_percent: 0.54,
    s_percent: 0.012,
    p_percent: 0.028,
    cr_percent: 18.25,
    ni_percent: 8.15,
    mo_percent: 0.21,
    cu_percent: 0.18,
    surface_quality: "Clean, crack-free sound surface",
    internal_soundness: "Sound macrostructure",
    verdict: "APPROVED" as const,
    lab_remarks: "Chemical and metallurgical test compliant with ASTM A276 specification"
  });

  // 1. Fetch Heats with Backend Pagination & Search
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

  // Submit Lab Check Mutation
  const labMutation = useMutation({
    mutationFn: (payload: any) => api.post("/lab/check", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billet-heats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      setIsModalOpen(false);
      setSelectedChemicalAnalysis(null);
      setFormError(null);
    },
    onError: (err: any) => {
      setFormError(err.message || "Failed to submit lab quality check.");
    }
  });

  const deleteLabMutation = useMutation({
    mutationFn: (labId: string) => api.delete(`/lab/${labId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billet-heats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
    onError: (err: any) => {
      alert(err.message || "Failed to delete lab certificate.");
    }
  });

  const handleOpenModal = (heatId?: string, heatNo?: string, existingLab?: any) => {
    if (heatId) {
      setFormData({
        heat_id: heatId,
        test_certificate_no: existingLab?.lab_certificate_no || existingLab?.test_certificate_no || `TC-${heatNo || "CH"}`,
        c_percent: existingLab?.c_percent ?? 0.08,
        mn_percent: existingLab?.mn_percent ?? 1.45,
        si_percent: existingLab?.si_percent ?? 0.42,
        s_percent: existingLab?.s_percent ?? 0.015,
        p_percent: existingLab?.p_percent ?? 0.025,
        cr_percent: existingLab?.cr_percent ?? 18.25,
        ni_percent: existingLab?.ni_percent ?? 8.15,
        mo_percent: existingLab?.mo_percent ?? 0.22,
        cu_percent: existingLab?.cu_percent ?? 0.18,
        surface_quality: existingLab?.surface_quality || "Clean, crack-free sound surface",
        internal_soundness: existingLab?.internal_soundness || "Sound macrostructure",
        verdict: (existingLab?.lab_verdict || existingLab?.verdict || "APPROVED") as any,
        lab_remarks: existingLab?.lab_remarks || existingLab?.remarks || "Spectro check completed"
      });
    } else if (heats.length > 0) {
      const defaultHeat = heats[0];
      setFormData({
        heat_id: defaultHeat.id || defaultHeat._id,
        test_certificate_no: defaultHeat.lab_certificate_no || `TC-${defaultHeat.heat_number}`,
        c_percent: defaultHeat.c_percent ?? 0.08,
        mn_percent: defaultHeat.mn_percent ?? 1.45,
        si_percent: defaultHeat.si_percent ?? 0.42,
        s_percent: defaultHeat.s_percent ?? 0.015,
        p_percent: defaultHeat.p_percent ?? 0.025,
        cr_percent: defaultHeat.cr_percent ?? 18.25,
        ni_percent: defaultHeat.ni_percent ?? 8.15,
        mo_percent: defaultHeat.mo_percent ?? 0.22,
        cu_percent: defaultHeat.cu_percent ?? 0.18,
        surface_quality: defaultHeat.surface_quality || "Clean, crack-free sound surface",
        internal_soundness: defaultHeat.internal_soundness || "Sound macrostructure",
        verdict: (defaultHeat.lab_verdict || "APPROVED") as any,
        lab_remarks: defaultHeat.lab_remarks || "Spectro check completed"
      });
    }
    setIsModalOpen(true);
  };

  const handleApplyPreset = (presetKey: string) => {
    const p = GRADE_PRESETS[presetKey];
    if (p) {
      setFormData((prev) => ({
        ...prev,
        ...p,
        lab_remarks: `Applied standard nominal chemistry for ${presetKey}`
      }));
    }
  };

  const handleLabSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      const validated = labCheckSchema.parse({
        ...formData,
        c_percent: Number(formData.c_percent),
        mn_percent: Number(formData.mn_percent),
        si_percent: Number(formData.si_percent),
        s_percent: Number(formData.s_percent),
        p_percent: Number(formData.p_percent),
        cr_percent: Number(formData.cr_percent),
        ni_percent: Number(formData.ni_percent),
        mo_percent: Number(formData.mo_percent),
        cu_percent: Number(formData.cu_percent)
      });
      labMutation.mutate(validated);
    } catch (err: any) {
      if (err.errors && Array.isArray(err.errors)) {
        setFormError(err.errors[0]?.message || "Validation failed.");
      } else {
        setFormError(err.message);
      }
    }
  };

  // Aggregates based on current list
  const approvedCount = heats.filter(
    (h: any) => h.lab_verdict === "APPROVED" || h.status === "LAB_APPROVED"
  ).length;
  const pendingCount = heats.filter(
    (h: any) => !h.lab_verdict || h.lab_verdict === "PENDING" || h.status === "LAB_PENDING"
  ).length;

  // Table Columns
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "heat_number",
      header: "HEAT NUMBER",
      cell: ({ row }) => (
        <div className="font-bold text-slate-900 font-mono flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
          <Link
            href={`/dashboard/billets?search=${row.original.heat_number}`}
            className="hover:text-orange-600 hover:underline transition-colors"
            title="View Billet in Master Inventory"
          >
            {row.original.heat_number}
          </Link>
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
      id: "chemical_analysis",
      header: "CHEMICAL ANALYSIS (%)",
      cell: ({ row }) => {
        const heat = row.original;
        const hasAnalysis = heat.c_percent !== null && heat.c_percent !== undefined;
        if (!hasAnalysis) {
          return (
            <button
              onClick={() => handleOpenModal(heat.id || heat._id, heat.heat_number, heat)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-slate-500 hover:text-orange-600 hover:bg-orange-50 text-[11px] font-semibold transition-colors border border-dashed border-slate-300 hover:border-orange-300 cursor-pointer"
              title="Add Chemical Analysis"
            >
              <FlaskConical className="w-3.5 h-3.5 text-slate-400" />
              <span>+ Add Chemical Test</span>
            </button>
          );
        }
        return (
          <button
            onClick={() => setSelectedChemicalAnalysis(heat)}
            className="text-left group/chem p-2 rounded-xl bg-slate-50 hover:bg-orange-50/70 border border-slate-200 hover:border-orange-200 transition-all cursor-pointer block max-w-sm"
            title="Click to view full 9-element chemical spectrometry analysis"
          >
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-mono font-bold text-slate-700 group-hover/chem:text-orange-950">
              <span><strong className="text-orange-600 font-extrabold">C:</strong> {heat.c_percent}%</span>
              <span><strong className="text-orange-600 font-extrabold">Mn:</strong> {heat.mn_percent}%</span>
              <span><strong className="text-orange-600 font-extrabold">Cr:</strong> {heat.cr_percent}%</span>
              <span><strong className="text-orange-600 font-extrabold">Ni:</strong> {heat.ni_percent}%</span>
            </div>
            <div className="text-[10px] text-slate-400 group-hover/chem:text-orange-600 font-semibold mt-1 flex items-center gap-1">
              <FlaskConical className="w-3 h-3 text-orange-500" />
              <span>View Full Chemical Analysis &rarr;</span>
            </div>
          </button>
        );
      }
    },
    {
      accessorKey: "lab_certificate_no",
      header: "TEST CERTIFICATE",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold text-slate-700">
          {row.original.lab_certificate_no || "TC-PENDING"}
        </span>
      )
    },
    {
      accessorKey: "lab_verdict",
      header: "LAB VERDICT",
      cell: ({ row }) => {
        const v = row.original.lab_verdict || "PENDING";
        const isApproved = v === "APPROVED";
        const isRejected = v === "REJECTED";
        return (
          <span
            className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase border ${
              isApproved
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : isRejected
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            {v}
          </span>
        );
      }
    },
    {
      id: "actions",
      header: "ACTION",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          {/* Chemical Analysis View Option */}
          <button
            onClick={() => setSelectedChemicalAnalysis(row.original)}
            className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
            title="View Full Chemical Spectrometry Report"
          >
            <FlaskConical className="w-4 h-4" />
          </button>
          {/* Edit or Add QA Check */}
          <button
            onClick={() =>
              handleOpenModal(
                row.original.id || row.original._id,
                row.original.heat_number,
                row.original
              )
            }
            className="px-2 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            title="Submit / Edit Chemical Test"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>{row.original.lab_verdict ? "Edit QA" : "+ Check"}</span>
          </button>
          {row.original.lab_verdict && (
            <button
              onClick={() => {
                if (
                  confirm(
                    `Are you sure you want to delete the lab certification for Heat ${row.original.heat_number}?`
                  )
                ) {
                  deleteLabMutation.mutate(
                    row.original.lab_id || row.original.id || row.original._id
                  );
                }
              }}
              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Delete Lab Certificate"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <Link
            href={`/dashboard/traceability?heat=${row.original.heat_number}`}
            className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
            title="Trace 360°"
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
        pageTitle="Metallurgical Quality Lab & Chemical Analysis"
        pageSubtitle="Optical emission spectrometry (OES), chemical composition breakdown & casting clearance"
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 lg:space-y-8 flex-1 font-sans">
        {/* Hero Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-sans">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-orange-50 text-orange-600 border border-orange-200/60 shadow-xs shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-sans">
                  Metallurgical Lab & Spectrometry Checks
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-orange-100 text-orange-700 border border-orange-200">
                  Step 2: Quality Gate
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-sans">
                Chemical composition analysis (C, Mn, Si, S, P, Cr, Ni, Mo, Cu) & heat approval for mill rolling
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
              onClick={() => handleOpenModal()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-md shadow-orange-500/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Enter Lab Test</span>
            </button>
          </div>
        </div>

        {/* StatCards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          <StatCard
            title="TOTAL HEATS TESTED"
            value={pagination?.total ?? heats.length}
            subtitle="Registered SMS heats in system"
            icon={FlaskConical}
            variant="slate"
          />
          <StatCard
            title="APPROVED FOR ROLLING"
            value={approvedCount}
            subtitle="Meets steel grade chemistry specifications"
            icon={CheckCircle2}
            variant="emerald"
          />
          <StatCard
            title="PENDING VERDICTS"
            value={pendingCount}
            subtitle="Requires spectrometer approval"
            icon={AlertTriangle}
            variant="orange"
          />
        </div>

        {/* Table with Backend Pagination */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Spectrometer Quality Reports & Chemical Analysis
              </h2>
              <p className="text-xs text-slate-500">
                Live backend paginated list of cast heats and certified element percentages
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
            searchPlaceholder="Search by heat #, grade, section, certificate..."
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

      {/* CHEMICAL ANALYSIS DETAIL MODAL (Option to view chemical analysis) */}
      {selectedChemicalAnalysis && (
        <Modal
          isOpen={!!selectedChemicalAnalysis}
          onClose={() => setSelectedChemicalAnalysis(null)}
          title={`Chemical Analysis: Heat ${selectedChemicalAnalysis.heat_number}`}
          subtitle={`Grade: ${selectedChemicalAnalysis.grade} | Section: ${selectedChemicalAnalysis.section} | Status: ${selectedChemicalAnalysis.lab_verdict || "PENDING"}`}
          maxWidth="2xl"
        >
          <div className="space-y-5 font-sans">
            {/* Header info strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Certificate No.</span>
                <span className="font-mono font-bold text-slate-800">
                  {selectedChemicalAnalysis.lab_certificate_no || "TC-PENDING"}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Steel Grade</span>
                <span className="font-bold text-slate-800">{selectedChemicalAnalysis.grade}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Quality Verdict</span>
                <span className={`font-black uppercase ${
                  selectedChemicalAnalysis.lab_verdict === "APPROVED"
                    ? "text-emerald-700"
                    : selectedChemicalAnalysis.lab_verdict === "REJECTED"
                    ? "text-rose-700"
                    : "text-amber-700"
                }`}>
                  {selectedChemicalAnalysis.lab_verdict || "PENDING"}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Tested Date</span>
                <span className="font-medium text-slate-600">
                  {selectedChemicalAnalysis.lab_tested_at
                    ? new Date(selectedChemicalAnalysis.lab_tested_at).toLocaleDateString()
                    : "Pending"}
                </span>
              </div>
            </div>

            {/* 9 Chemical Elements Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FlaskConical className="w-4 h-4 text-orange-600" />
                  <span>Optical Emission Spectrometry (OES) Results</span>
                </h4>
                <span className="text-[11px] text-slate-500 font-medium">Standard ASTM A276 / EN 10088-3</span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
                {[
                  { name: "Carbon", symbol: "C", val: selectedChemicalAnalysis.c_percent, nominal: "< 0.08%" },
                  { name: "Manganese", symbol: "Mn", val: selectedChemicalAnalysis.mn_percent, nominal: "1.0 - 2.0%" },
                  { name: "Silicon", symbol: "Si", val: selectedChemicalAnalysis.si_percent, nominal: "< 0.75%" },
                  { name: "Sulphur", symbol: "S", val: selectedChemicalAnalysis.s_percent, nominal: "< 0.030%" },
                  { name: "Phosphorus", symbol: "P", val: selectedChemicalAnalysis.p_percent, nominal: "< 0.045%" },
                  { name: "Chromium", symbol: "Cr", val: selectedChemicalAnalysis.cr_percent, nominal: "18.0 - 20.0%" },
                  { name: "Nickel", symbol: "Ni", val: selectedChemicalAnalysis.ni_percent, nominal: "8.0 - 10.5%" },
                  { name: "Molybdenum", symbol: "Mo", val: selectedChemicalAnalysis.mo_percent, nominal: "< 0.30%" },
                  { name: "Copper", symbol: "Cu", val: selectedChemicalAnalysis.cu_percent, nominal: "< 0.50%" }
                ].map((elem) => {
                  const hasVal = elem.val !== null && elem.val !== undefined;
                  return (
                    <div
                      key={elem.symbol}
                      className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-orange-200 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-extrabold text-slate-800">
                          {elem.symbol} <span className="text-slate-400 font-normal text-[11px]">({elem.name})</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{elem.nominal}</span>
                      </div>
                      <div className="text-lg font-black font-mono text-slate-900">
                        {hasVal ? `${elem.val}%` : <span className="text-slate-300 text-sm font-normal">--</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Remarks / Quality Notes */}
            {selectedChemicalAnalysis.lab_remarks && (
              <div className="p-3 rounded-xl bg-orange-50/50 border border-orange-200 text-xs">
                <span className="font-bold text-orange-950 block mb-0.5">Lab Metallurgist Remarks:</span>
                <p className="text-orange-900">{selectedChemicalAnalysis.lab_remarks}</p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <Link
                href={`/dashboard/traceability?heat=${selectedChemicalAnalysis.heat_number}`}
                className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Open Full 360° Traceability</span>
              </Link>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const heat = selectedChemicalAnalysis;
                    setSelectedChemicalAnalysis(null);
                    handleOpenModal(heat.id || heat._id, heat.heat_number, heat);
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                >
                  Edit Test
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedChemicalAnalysis(null)}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Lab Check / Test Certification Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Submit Spectrometry Chemical Lab Test"
        subtitle="Analyze spectrometer element percentages and certify for plant dispatch"
        maxWidth="2xl"
      >
        <form onSubmit={handleLabSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
              {formError}
            </div>
          )}

          <div className="grid w-full gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Cast Heat *
              </label>
              <select
                value={formData.heat_id}
                onChange={(e) => {
                  const selected = heats.find((h: any) => (h.id || h._id) === e.target.value);
                  if (selected) {
                    setFormData((prev) => ({
                      ...prev,
                      heat_id: selected.id || selected._id,
                      test_certificate_no: selected.lab_certificate_no || `TC-${selected.heat_number}`,
                      c_percent: selected.c_percent ?? prev.c_percent,
                      mn_percent: selected.mn_percent ?? prev.mn_percent,
                      si_percent: selected.si_percent ?? prev.si_percent,
                      s_percent: selected.s_percent ?? prev.s_percent,
                      p_percent: selected.p_percent ?? prev.p_percent,
                      cr_percent: selected.cr_percent ?? prev.cr_percent,
                      ni_percent: selected.ni_percent ?? prev.ni_percent,
                      mo_percent: selected.mo_percent ?? prev.mo_percent,
                      cu_percent: selected.cu_percent ?? prev.cu_percent,
                      verdict: (selected.lab_verdict || prev.verdict) as any
                    }));
                  } else {
                    setFormData({ ...formData, heat_id: e.target.value });
                  }
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                <option value="">-- Select a heat to analyze --</option>
                {heats.map((h: any) => (
                  <option key={h.id || h._id} value={h.id || h._id}>
                    {h.heat_number} ({h.grade} - {h.section})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Chemical Spectrometry Percentages Grid */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FlaskConical className="w-4 h-4 text-orange-600" />
                <span>Chemical Spectrometry Analysis (%)</span>
              </h4>
              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-[10px] text-slate-400 font-semibold mr-1">Presets:</span>
                {Object.keys(GRADE_PRESETS).map((pKey) => (
                  <button
                    key={pKey}
                    type="button"
                    onClick={() => handleApplyPreset(pKey)}
                    className="px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:border-orange-300 hover:text-orange-600 text-[10px] font-bold text-slate-600 transition-colors cursor-pointer"
                  >
                    {pKey}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {[
                { label: "C %", key: "c_percent" },
                { label: "Mn %", key: "mn_percent" },
                { label: "Si %", key: "si_percent" },
                { label: "S %", key: "s_percent" },
                { label: "P %", key: "p_percent" },
                { label: "Cr %", key: "cr_percent" },
                { label: "Ni %", key: "ni_percent" },
                { label: "Mo %", key: "mo_percent" },
                { label: "Cu %", key: "cu_percent" }
              ].map((elem) => (
                <div key={elem.key}>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                    {elem.label}
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={(formData as any)[elem.key]}
                    onChange={(e) =>
                      setFormData({ ...formData, [elem.key]: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-2 py-1.5 text-xs font-mono font-bold bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Quality Verdict *
              </label>
              <select
                value={formData.verdict}
                onChange={(e) => setFormData({ ...formData, verdict: e.target.value as any })}
                className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-emerald-700"
              >
                <option value="APPROVED">APPROVED (Clear for plant rolling)</option>
                <option value="ON_HOLD">ON_HOLD (Re-testing required)</option>
                <option value="REJECTED">REJECTED (Defective chemistry)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Lab Remarks
            </label>
            <input
              type="text"
              value={formData.lab_remarks}
              onChange={(e) => setFormData({ ...formData, lab_remarks: e.target.value })}
              placeholder="e.g. Spectro check approved per ASTM A276"
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
              disabled={labMutation.isPending}
              className="px-5 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-md shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {labMutation.isPending ? "Certifying..." : "Certify Lab Test"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
