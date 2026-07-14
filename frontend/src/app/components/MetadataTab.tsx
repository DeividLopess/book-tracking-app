import { useEffect, useState } from "react";
import { Check, Edit2, Trash2, X } from "lucide-react";
import { getTranslation } from "../i18n";
import { apiRequest, type Language, type MetadataItem } from "./common";

type MetadataKind = "genres" | "authors";

export function MetadataTab({ language }: { language: Language }) {
  const t = getTranslation(language);
  const [genres, setGenres] = useState<MetadataItem[]>([]);
  const [authors, setAuthors] = useState<MetadataItem[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [newGenre, setNewGenre] = useState("");
  const [newAuthor, setNewAuthor] = useState("");

  const refresh = async () => {
    const [genresResponse, authorsResponse] = await Promise.all([apiRequest("/books/genres"), apiRequest("/books/authors")]);
    const [genresData, authorsData] = await Promise.all([
      genresResponse.json() as Promise<{ genres: MetadataItem[] }>,
      authorsResponse.json() as Promise<{ authors: MetadataItem[] }>,
    ]);
    setGenres(genresData.genres);
    setAuthors(authorsData.authors);
  };

  useEffect(() => { refresh().catch(() => undefined); }, []);

  const add = async (kind: MetadataKind) => {
    const value = (kind === "genres" ? newGenre : newAuthor).trim();
    const items = kind === "genres" ? genres : authors;
    if (!value || items.some((item) => item.name.toLowerCase() === value.toLowerCase())) return;
    await apiRequest(`/books/${kind}`, { method: "POST", body: JSON.stringify({ name: value }) });
    if (kind === "genres") setNewGenre(""); else setNewAuthor("");
    await refresh();
  };

  const update = async (kind: MetadataKind, item: MetadataItem) => {
    const key = `${kind}-${item.id}`;
    const value = (drafts[key] ?? "").trim();
    const items = kind === "genres" ? genres : authors;
    if (!value || items.some((current) => current.id !== item.id && current.name.toLowerCase() === value.toLowerCase())) return;
    await apiRequest(`/books/${kind}/${item.id}`, { method: "PUT", body: JSON.stringify({ name: value }) });
    setEditing(null);
    await refresh();
  };

  const remove = async (kind: MetadataKind, item: MetadataItem) => {
    if (!window.confirm(`${language === "pt" ? "Excluir" : "Delete"} ${item.name}?`)) return;
    await apiRequest(`/books/${kind}/${item.id}`, { method: "DELETE" });
    await refresh();
  };

  const section = (kind: MetadataKind, title: string, placeholder: string, items: MetadataItem[], value: string, setValue: (value: string) => void) => (
    <section className="space-y-4 border border-border bg-card p-4 sm:p-5">
      <h2 className="text-lg text-foreground" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>{title}</h2>
      <div className="flex gap-2">
        <input value={value} onChange={(event) => setValue(event.currentTarget.value)} placeholder={placeholder} className="flex-1 border border-border bg-input-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
        <button type="button" onClick={() => add(kind).catch(() => undefined)} disabled={!value.trim()} className="px-3 py-2 text-sm bg-primary text-primary-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40">{t.actions.save}</button>
      </div>
      <div className="space-y-2">
        {items.map((item) => {
          const key = `${kind}-${item.id}`;
          const isEditing = editing === key;
          return <div key={item.id} className="flex items-center justify-between gap-2 border border-border bg-background/40 px-3 py-2">
            {isEditing ? <input value={drafts[key] ?? item.name} onChange={(event) => setDrafts((current) => ({ ...current, [key]: event.currentTarget.value }))} className="flex-1 border border-border bg-input-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" /> : <span className="text-sm text-foreground">{item.name}</span>}
            <div className="flex gap-2">
              {isEditing ? <><button type="button" onClick={() => update(kind, item).catch(() => undefined)} className="p-1.5 text-primary hover:text-accent" aria-label={t.actions.save}><Check size={14} /></button><button type="button" onClick={() => setEditing(null)} className="p-1.5 text-muted-foreground hover:text-foreground" aria-label={t.actions.cancel}><X size={14} /></button></> : <><button type="button" onClick={() => { setEditing(key); setDrafts((current) => ({ ...current, [key]: item.name })); }} className="p-1.5 text-muted-foreground hover:text-accent" aria-label={t.actions.edit}><Edit2 size={14} /></button><button type="button" onClick={() => remove(kind, item).catch(() => undefined)} className="p-1.5 text-muted-foreground hover:text-destructive" aria-label={t.actions.delete}><Trash2 size={14} /></button></>}
            </div>
          </div>;
        })}
      </div>
    </section>
  );

  return <div className="grid grid-cols-1 gap-6 md:grid-cols-2">{section("authors", t.tabs.authors, t.metadata.authorPlaceholder, authors, newAuthor, setNewAuthor)}{section("genres", t.tabs.genres, t.metadata.genrePlaceholder, genres, newGenre, setNewGenre)}</div>;
}
