import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getTranslation } from "../i18n";
import { bookDate, type Book, type Language } from "./common";
import { StarRating } from "./StarRating";

export function StatsTab({ books, language }: { books: Book[]; language: Language }) {
  const t = getTranslation(language);
  const finishedBooks = useMemo(() => books.filter((book) => book.status === "finished"), [books]);
  const monthlyData = useMemo(() => {
    const map = new Map<string, { books: number; pages: number }>();
    finishedBooks.forEach((b) => {
      const key = bookDate(b).slice(0, 7);
      if (!key) return;
      if (!map.has(key)) map.set(key, { books: 0, pages: 0 });
      const entry = map.get(key)!;
      entry.books++;
      entry.pages += b.pages;
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([key, val]) => {
      const [, month] = key.split("-");
      return { month: new Date(2024, parseInt(month) - 1, 1).toLocaleDateString(language === "pt" ? "pt-BR" : "en-US", { month: "short" }), ...val };
    });
  }, [finishedBooks, language]);

  const cumulativeData = useMemo(() => {
    let total = 0;
    return monthlyData.map((d) => ({ ...d, cumulative: (total += d.books) }));
  }, [monthlyData]);

  const genreData = useMemo(() => {
    const map = new Map<string, number>();
    finishedBooks.forEach((b) => map.set(b.genre, (map.get(b.genre) || 0) + 1));
    return Array.from(map.entries()).map(([genre, count]) => ({ genre, count })).sort((a, b) => b.count - a.count);
  }, [finishedBooks]);

  const ratingDist = useMemo(() => [5, 4, 3, 2, 1].map((rating) => ({ rating, count: finishedBooks.filter((b) => b.rating === rating).length })), [finishedBooks]);
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border px-3 py-2 text-xs text-foreground shadow" style={{ fontFamily: "'DM Mono', monospace" }}>
        <div className="font-medium mb-1">{label}</div>
        {payload.map((p: any) => <div key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</div>)}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="bg-card border border-border p-5">
        <div className="mb-4">
          <h3 className="text-foreground" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, fontSize: "1rem" }}>{t.stats.booksByMonth}</h3>
          <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: "'Nunito', sans-serif" }}>{t.stats.booksByMonthHint}</p>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs><linearGradient id="booksGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#B8731A" stopOpacity={0.25} /><stop offset="95%" stopColor="#B8731A" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(44,26,14,0.08)" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: "'DM Mono', monospace", fill: "#7A6A55" }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fontFamily: "'DM Mono', monospace", fill: "#7A6A55" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="books" name={t.stats.chartBooks} stroke="#B8731A" strokeWidth={2} fill="url(#booksGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-card border border-border p-5">
        <div className="mb-4">
          <h3 className="text-foreground" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, fontSize: "1rem" }}>{t.stats.totalAccumulated}</h3>
          <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: "'Nunito', sans-serif" }}>{t.stats.totalAccumulatedHint}</p>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={cumulativeData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(44,26,14,0.08)" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: "'DM Mono', monospace", fill: "#7A6A55" }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fontFamily: "'DM Mono', monospace", fill: "#7A6A55" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="cumulative" name={t.stats.chartTotal} stroke="#2C4A6E" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="bg-card border border-border p-4 space-y-2">
          {genreData.map(({ genre, count }) => {
            const pct = finishedBooks.length ? Math.round((count / finishedBooks.length) * 100) : 0;
            return <div key={genre}><div className="flex justify-between text-xs mb-1" style={{ fontFamily: "'DM Mono', monospace" }}><span>{genre}</span><span>{count}</span></div><div className="h-1 bg-muted rounded-full overflow-hidden"><div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} /></div></div>;
          })}
        </div>
        <div className="bg-card border border-border p-4 space-y-2">
          {ratingDist.map(({ rating, count }) => {
            const pct = finishedBooks.length ? Math.round((count / finishedBooks.length) * 100) : 0;
            return <div key={rating}><div className="flex items-center justify-between text-xs mb-1"><StarRating value={rating} /><span>{count}</span></div><div className="h-1 bg-muted rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: "#B8731A" }} /></div></div>;
          })}
        </div>
      </div>
    </div>
  );
}
