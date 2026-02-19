"use client";

import React, { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/admin/layout/DashboardLayout";
import { Icon } from "@iconify/react";
import {
  getPeriods,
  createPeriod,
  updatePeriod,
  deletePeriod,
  Period,
  CreatePeriodRequest,
} from "@/lib/api/admin/periods";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function monthName(m: number) {
  return MONTHS[m - 1] ?? `Month ${m}`;
}

export default function PeriodsPage() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);
  const [formData, setFormData] = useState<CreatePeriodRequest>({ name: "", start_month: 1, end_month: 6 });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Period | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchPeriods();
  }, []);

  async function fetchPeriods() {
    try {
      setIsLoading(true);
      const data = await getPeriods();
      setPeriods(data);
    } catch (error) {
      showErrorToast("Failed to load periods. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return periods;
    const q = search.toLowerCase();
    return periods.filter((p) => p.name.toLowerCase().includes(q));
  }, [periods, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [search]);

  function openCreateForm() {
    setEditingPeriod(null);
    setFormData({ name: "", start_month: 1, end_month: 6 });
    setFormErrors({});
    setIsFormOpen(true);
  }

  function openEditForm(period: Period) {
    setEditingPeriod(period);
    setFormData({ name: period.name, start_month: period.start_month, end_month: period.end_month });
    setFormErrors({});
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingPeriod(null);
    setFormErrors({});
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Period name is required.";
    if (formData.start_month < 1 || formData.start_month > 12) errors.start_month = "Must be 1-12.";
    if (formData.end_month < 1 || formData.end_month > 12) errors.end_month = "Must be 1-12.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSave() {
    if (!validateForm()) return;
    setIsSaving(true);
    try {
      if (editingPeriod) {
        const updated = await updatePeriod(editingPeriod.id, formData);
        setPeriods((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        showSuccessToast("Period updated successfully.");
      } else {
        const created = await createPeriod(formData);
        setPeriods((prev) => [...prev, created]);
        showSuccessToast("Period created successfully.");
      }
      closeForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save period.";
      showErrorToast(message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deletePeriod(deleteTarget.id);
      setPeriods((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      showSuccessToast("Period deleted successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete period.";
      showErrorToast(message);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Periods</h1>
            <p className="mt-0.5 text-sm text-gray-500">Manage academic periods for lesson scheduling</p>
          </div>
          <button
            onClick={openCreateForm}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
          >
            <Icon icon="solar:add-circle-bold" className="h-5 w-5" />
            Add Period
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Icon icon="solar:magnifer-linear" className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search periods..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-lg border border-gray-300 pl-10 pr-4 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          {!isLoading && filtered.length > 0 && (
            <span className="text-sm text-gray-500">
              <span className="font-medium text-gray-700">{filtered.length}</span> {filtered.length === 1 ? "period" : "periods"}
            </span>
          )}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white p-5">
                <div className="flex items-center gap-4">
                  <div className="h-4 w-1/4 rounded bg-gray-200" />
                  <div className="h-4 w-1/6 rounded bg-gray-100" />
                  <div className="h-4 w-1/6 rounded bg-gray-100" />
                  <div className="ml-auto h-8 w-20 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <Icon icon="solar:calendar-bold" className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-sm font-semibold text-gray-900">
              {search.trim() ? "No periods match your search" : "No periods yet"}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {search.trim() ? "Try a different search term." : "Create your first academic period to get started."}
            </p>
            {!search.trim() && (
              <button
                onClick={openCreateForm}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <Icon icon="solar:add-circle-bold" className="h-4 w-4" />
                Add Period
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 bg-white">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50 text-left text-sm font-semibold text-gray-700">
                    <th className="px-5 py-4">Name</th>
                    <th className="px-5 py-4">Start Month</th>
                    <th className="px-5 py-4">End Month</th>
                    <th className="px-5 py-4">Created</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paged.map((period) => (
                    <tr key={period.id} className="text-sm hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 font-medium text-gray-900">{period.name}</td>
                      <td className="px-5 py-4 text-gray-600">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                          {monthName(period.start_month)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700">
                          {monthName(period.end_month)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-500">
                        {new Date(period.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditForm(period)}
                            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-emerald-600 transition-colors"
                            aria-label="Edit"
                          >
                            <Icon icon="solar:pen-bold" className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(period)}
                            className="rounded-lg p-2 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                            aria-label="Delete"
                          >
                            <Icon icon="solar:trash-bin-trash-bold" className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {paged.map((period) => (
                <div key={period.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{period.name}</h3>
                      <p className="mt-1 text-xs text-gray-500">
                        {new Date(period.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditForm(period)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-emerald-600"
                        aria-label="Edit"
                      >
                        <Icon icon="solar:pen-bold" className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(period)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-rose-50 hover:text-rose-600"
                        aria-label="Delete"
                      >
                        <Icon icon="solar:trash-bin-trash-bold" className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                      {monthName(period.start_month)}
                    </span>
                    <Icon icon="solar:arrow-right-linear" className="h-3.5 w-3.5 text-gray-400" />
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700">
                      {monthName(period.end_month)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${currentPage === 1 ? "border-gray-200 text-gray-300 cursor-not-allowed" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                >
                  &lt;
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${i + 1 === currentPage ? "border-emerald-600 bg-emerald-600 text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${currentPage === totalPages ? "border-gray-200 text-gray-300 cursor-not-allowed" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                >
                  &gt;
                </button>
              </div>
            )}
          </>
        )}

        {/* Create / Edit Modal */}
        {isFormOpen && (
          <div
            className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 px-4"
            onClick={(e) => { if (e.target === e.currentTarget && !isSaving) closeForm(); }}
          >
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingPeriod ? "Edit Period" : "Add New Period"}
                </h3>
                <button onClick={closeForm} disabled={isSaving} className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50" aria-label="Close">
                  <Icon icon="solar:close-circle-bold" className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4 px-6 py-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-800">
                    Period Name<span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. First Semester"
                    className={`h-11 w-full rounded-lg border px-4 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${formErrors.name ? "border-rose-400" : "border-gray-300"}`}
                  />
                  {formErrors.name && <p className="mt-1 text-xs text-rose-600">{formErrors.name}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-800">
                      Start Month<span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={formData.start_month}
                      onChange={(e) => setFormData((prev) => ({ ...prev, start_month: Number(e.target.value) }))}
                      className={`h-11 w-full rounded-lg border px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${formErrors.start_month ? "border-rose-400" : "border-gray-300"}`}
                    >
                      {MONTHS.map((month, i) => (
                        <option key={i + 1} value={i + 1}>{month}</option>
                      ))}
                    </select>
                    {formErrors.start_month && <p className="mt-1 text-xs text-rose-600">{formErrors.start_month}</p>}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-800">
                      End Month<span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={formData.end_month}
                      onChange={(e) => setFormData((prev) => ({ ...prev, end_month: Number(e.target.value) }))}
                      className={`h-11 w-full rounded-lg border px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${formErrors.end_month ? "border-rose-400" : "border-gray-300"}`}
                    >
                      {MONTHS.map((month, i) => (
                        <option key={i + 1} value={i + 1}>{month}</option>
                      ))}
                    </select>
                    {formErrors.end_month && <p className="mt-1 text-xs text-rose-600">{formErrors.end_month}</p>}
                  </div>
                </div>
                {/* Preview */}
                {formData.name.trim() && (
                  <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase text-gray-400">Preview</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {formData.name} &middot; {monthName(formData.start_month)} &ndash; {monthName(formData.end_month)}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
                <button
                  onClick={closeForm}
                  disabled={isSaving}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      {editingPeriod ? "Updating..." : "Creating..."}
                    </span>
                  ) : editingPeriod ? "Update Period" : "Create Period"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <div
            className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 px-4"
            onClick={(e) => { if (e.target === e.currentTarget && !isDeleting) setDeleteTarget(null); }}
          >
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100">
                  <Icon icon="solar:trash-bin-trash-bold" className="h-7 w-7 text-rose-600" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">Delete Period</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Are you sure you want to delete <span className="font-semibold text-gray-900">{deleteTarget.name}</span>? This action cannot be undone.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Deleting...
                    </span>
                  ) : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
