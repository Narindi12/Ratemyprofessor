"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

type ProfItem = {
  id: number;
  name: string;
  first_name?: string;
  last_name?: string;
  department?: string;
  level?: string;
  school_id?: number;
};

export default function ComparePage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ProfItem[]>([]);
  const qc = useQueryClient();

  const searchQuery = useQuery({
    queryKey: ["search", search],
    enabled: search.length > 0,
    queryFn: async () => {
      const res = await api.get(`/professors/search?q=${encodeURIComponent(search)}&limit=20`);
      return res.data.items as ProfItem[];
    }
  });

  async function addProfessor(p: ProfItem) {
    if (selected.find(s => s.id === p.id)) return;
    setSelected(s => [...s, p]);
  }

  function removeProfessor(id: number) {
    setSelected(s => s.filter(x => x.id !== id));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Compare Professors</h1>

      <div className="bg-white p-4 rounded shadow">
        <div className="flex gap-2 items-center">
          <input
            className="flex-1 border p-2 rounded"
            placeholder="Search professor name (e.g., 'Tushara')"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button onClick={() => setSearch("")} className="px-3 py-2 rounded border">Clear</button>
        </div>

        {searchQuery.isSuccess && (
          <div className="mt-3 grid gap-2">
            {searchQuery.data.map(p => (
              <div key={p.id} className="flex items-center justify-between border rounded p-2">
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm text-gray-600">{p.department || "—"} · {p.level || "—"}</div>
                </div>
                <div>
                  <button onClick={() => addProfessor(p)} className="px-3 py-1 rounded bg-black text-white">Add</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {selected.length === 0 && <p className="text-gray-600">No professors selected. Use the search above to add them.</p>}
        {selected.map(p => (
          <ProfessorCompareCard key={p.id} prof={p} onRemove={() => removeProfessor(p.id)} qc={qc} />
        ))}
      </div>
    </div>
  );
}

function ProfessorCompareCard({ prof, onRemove, qc }: { prof: ProfItem; onRemove: () => void; qc: any }) {
  const profQuery = useQuery({
    queryKey: ["prof", prof.id],
    queryFn: async () => (await api.get(`/professors/${prof.id}`)).data,
  });

  const ratingsQuery = useQuery({
    queryKey: ["ratings", prof.id],
    queryFn: async () => (await api.get(`/professors/${prof.id}/ratings`)).data,
  });

  const [stars, setStars] = useState<number>(5);
  const [comment, setComment] = useState<string>("");

  async function submitRating() {
    try {
      await api.post(`/professors/${prof.id}/ratings`, { stars, comment });
      // refresh
      qc.invalidateQueries({ queryKey: ["ratings", prof.id] });
      qc.invalidateQueries({ queryKey: ["prof", prof.id] });
      setComment("");
      alert("Rating submitted");
    } catch (err: any) {
      alert("Error: " + (err?.response?.data?.detail || err.message || "unknown"));
    }
  }

  // build a simple histogram
  const histogram = (() => {
    const arr = ratingsQuery.data || [];
    const counts = [0,0,0,0,0]; // index 0->star1
    arr.forEach((r: any) => {
      const s = Number(r.stars);
      if (s >= 1 && s <= 5) counts[s-1] += 1;
    });
    return counts;
  })();

  return (
    <div className="border rounded p-4 bg-white">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-lg font-bold">{prof.name}</div>
          <div className="text-sm text-gray-600">{prof.department || "—"}</div>
        </div>
        <button onClick={onRemove} className="text-gray-400">✕</button>
      </div>

      <div className="mt-3">
        <div className="text-sm">Average</div>
        <div className="text-3xl font-extrabold">{profQuery.data?.avg_stars ?? "—"}</div>
        <div className="text-xs text-gray-500">{profQuery.data?.ratings_count ?? 0} ratings</div>
      </div>

      <div className="mt-3">
        <div className="text-sm mb-1">Distribution</div>
        {histogram.slice().reverse().map((c, i) => {
          const star = 5 - i;
          const total = histogram.reduce((a,b)=>a+b,0) || 1;
          const pct = Math.round((c/total)*100);
          return (
            <div key={star} className="flex items-center gap-2 text-sm mb-1">
              <div style={{width: "24px"}}>{star}</div>
              <div className="flex-1 bg-gray-200 rounded h-4">
                <div style={{width: `${pct}%`}} className="h-4 bg-blue-600 rounded"></div>
              </div>
              <div style={{width:"40px"}} className="text-right">{c}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 border-t pt-3">
        <div className="flex items-center gap-2">
          <label className="text-sm">Your rating</label>
          <select value={stars} onChange={e => setStars(Number(e.target.value))} className="border p-1 rounded">
            {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Optional comment" className="flex-1 border p-1 rounded" />
          <button onClick={submitRating} className="px-3 py-1 rounded bg-black text-white">Submit</button>
        </div>
      </div>
    </div>
  );
}
