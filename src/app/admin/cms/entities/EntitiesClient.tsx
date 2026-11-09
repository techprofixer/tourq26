"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type EntityRow = {
  id: string;
  slug: string;
  name: string;
  pageId?: string | null;
  summary?: string | null;
  category?: string | null;
  icon?: string | null;
  sortOrder?: number;
};

type Tab = "services" | "solutions" | "industries" | "technologies" | "locations";

const KIND_MAP = {
  services: "SERVICE",
  solutions: "SOLUTION",
  industries: "INDUSTRY",
  technologies: "TECHNOLOGY",
  locations: "LOCATION",
} as const;

type FormState = {
  name: string;
  slug: string;
  summary: string;
  category: string;
  icon: string;
  sortOrder: string;
};

const EMPTY_FORM: FormState = { name: "", slug: "", summary: "", category: "", icon: "", sortOrder: "0" };

function toFormState(row: EntityRow): FormState {
  return {
    name: row.name,
    slug: row.slug,
    summary: row.summary ?? "",
    category: row.category ?? "",
    icon: row.icon ?? "",
    sortOrder: String(row.sortOrder ?? 0),
  };
}

export function EntitiesClient({
  initial,
}: {
  initial: {
    services: EntityRow[];
    solutions: EntityRow[];
    industries: EntityRow[];
    technologies: EntityRow[];
    locations: EntityRow[];
  };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("services");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);
  const [addingNew, setAddingNew] = useState(false);
  const [newForm, setNewForm] = useState<FormState>(EMPTY_FORM);

  async function ensurePage(
    kind: "SERVICE" | "SOLUTION" | "INDUSTRY" | "TECHNOLOGY" | "LOCATION",
    slug: string,
  ) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/cms/entities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ensure-page", kind, slug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMessage(`Page ready: ${data.path}`);
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function createRow() {
    if (!newForm.name.trim()) {
      setMessage("Name is required");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/cms/entities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          kind: KIND_MAP[tab],
          name: newForm.name,
          slug: newForm.slug || undefined,
          summary: newForm.summary,
          category: newForm.category,
          icon: newForm.icon,
          sortOrder: Number(newForm.sortOrder) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Create failed");
      setMessage(`Added "${newForm.name}".`);
      setNewForm(EMPTY_FORM);
      setAddingNew(false);
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit(id: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/cms/entities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          kind: KIND_MAP[tab],
          id,
          name: editForm.name,
          slug: editForm.slug,
          summary: editForm.summary,
          category: editForm.category,
          icon: editForm.icon,
          sortOrder: Number(editForm.sortOrder) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setMessage(`Updated "${editForm.name}".`);
      setEditingId(null);
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function deleteRow(row: EntityRow) {
    if (!confirm(`Delete "${row.name}"? This does not delete any page it links to.`)) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/cms/entities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", kind: KIND_MAP[tab], id: row.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setMessage(`Deleted "${row.name}".`);
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  const rows =
    tab === "services"
      ? initial.services
      : tab === "solutions"
        ? initial.solutions
        : tab === "industries"
          ? initial.industries
          : tab === "technologies"
            ? initial.technologies
            : initial.locations;

  return (
    <div className="mt-8 space-y-6">
      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["services", "Services"],
            ["solutions", "Solutions"],
            ["industries", "Industries"],
            ["technologies", "Technologies"],
            ["locations", "Locations"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`btn-base ${tab === id ? "btn-primary" : "btn-secondary"}`}
            onClick={() => {
              setTab(id);
              setEditingId(null);
              setAddingNew(false);
            }}
          >
            {label} ({initial[id].length})
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-md border border-border/60">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-border/60 bg-muted/40">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Summary</th>
              <th className="px-4 py-3 font-medium">Page</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) =>
              editingId === row.id ? (
                <tr key={row.id} className="border-b border-border/40 bg-muted/20 last:border-0">
                  <td className="px-4 py-2">
                    <input
                      className="w-full rounded-md border border-border bg-background px-2 py-1"
                      value={editForm.name}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      className="w-full rounded-md border border-border bg-background px-2 py-1 font-mono text-xs"
                      value={editForm.slug}
                      onChange={(e) => setEditForm((f) => ({ ...f, slug: e.target.value }))}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      className="w-full rounded-md border border-border bg-background px-2 py-1"
                      value={editForm.category}
                      onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      className="w-full rounded-md border border-border bg-background px-2 py-1"
                      value={editForm.summary}
                      onChange={(e) => setEditForm((f) => ({ ...f, summary: e.target.value }))}
                    />
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {row.pageId ? "—" : "no page yet"}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        className="btn-base btn-primary !px-2 !py-1 text-xs"
                        disabled={busy}
                        onClick={() => void saveEdit(row.id)}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="btn-base btn-secondary !px-2 !py-1 text-xs"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={row.id} className="border-b border-border/40 last:border-0">
                  <td className="px-4 py-3 font-medium">{row.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {row.slug}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{row.category || "—"}</td>
                  <td className="max-w-[260px] truncate px-4 py-3 text-muted-foreground">
                    {row.summary || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {row.pageId ? (
                      <Link
                        href={`/admin/cms/pages/${row.pageId}`}
                        className="text-foreground underline"
                      >
                        Edit page
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="btn-base btn-secondary !px-2 !py-1 text-xs"
                        disabled={busy}
                        onClick={() => void ensurePage(KIND_MAP[tab], row.slug)}
                      >
                        Create page
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        className="btn-base btn-secondary !px-2 !py-1 text-xs"
                        onClick={() => {
                          setEditingId(row.id);
                          setEditForm(toFormState(row));
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-base btn-secondary !px-2 !py-1 text-xs"
                        disabled={busy}
                        onClick={() => void deleteRow(row)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      {addingNew ? (
        <div className="rounded-md border border-border/60 bg-muted/20 p-4">
          <p className="mono-label mb-3 text-muted-foreground">Add new</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mono-label text-muted-foreground">
                Name <span className="text-[color:var(--app-destructive)]">*</span>
              </span>
              <input
                className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2"
                value={newForm.name}
                onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))}
              />
            </label>
            <label className="block text-sm">
              <span className="mono-label text-muted-foreground">Slug</span>
              <input
                className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2"
                value={newForm.slug}
                placeholder="auto from name"
                onChange={(e) => setNewForm((f) => ({ ...f, slug: e.target.value }))}
              />
            </label>
            <label className="block text-sm">
              <span className="mono-label text-muted-foreground">Category</span>
              <input
                className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2"
                value={newForm.category}
                onChange={(e) => setNewForm((f) => ({ ...f, category: e.target.value }))}
              />
            </label>
            <label className="block text-sm">
              <span className="mono-label text-muted-foreground">Sort order</span>
              <input
                type="number"
                className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2"
                value={newForm.sortOrder}
                onChange={(e) => setNewForm((f) => ({ ...f, sortOrder: e.target.value }))}
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="mono-label text-muted-foreground">Summary</span>
              <textarea
                className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2"
                rows={2}
                value={newForm.summary}
                onChange={(e) => setNewForm((f) => ({ ...f, summary: e.target.value }))}
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="mono-label text-muted-foreground">Icon URL</span>
              <input
                className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2"
                placeholder="https://…/icon.svg"
                value={newForm.icon}
                onChange={(e) => setNewForm((f) => ({ ...f, icon: e.target.value }))}
              />
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              className="btn-base btn-primary"
              disabled={busy}
              onClick={() => void createRow()}
            >
              {busy ? "Adding…" : "Add"}
            </button>
            <button
              type="button"
              className="btn-base btn-secondary"
              onClick={() => {
                setAddingNew(false);
                setNewForm(EMPTY_FORM);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="btn-base btn-secondary"
          onClick={() => setAddingNew(true)}
        >
          + Add new
        </button>
      )}
    </div>
  );
}
