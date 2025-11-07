"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import BackSmartButton from "@/components/BackSmartButton";
import BackHomeButton from "@/components/BackHomeButton";
import { useState } from "react";

export default function ProfessorDetail() {
  const { id } = useParams<{ id: string }>();
  const sp = useSearchParams();
  const school = sp.get("school");                 // ← read the college id
  const qc = useQueryClient();

  const prof = useQuery({
    queryKey: ["prof", id],
    queryFn: async () => (await api.get(`/professors/${id}`)).data
  });

  const ratings = useQuery({
    queryKey: ["ratings", id],
    queryFn: async () => (await api.get(`/professors/${id}/ratings`)).data
  });

  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");

  const add = async () => {
    await api.post(`/professors/${id}/ratings`, { stars, comment });
    await qc.invalidateQueries({ queryKey: ["prof", id] });
    await qc.invalidateQueries({ queryKey: ["ratings", id] });
    setComment("");
  };

  if (prof.isLoading) return <p>Loading…</p>;
  const p = prof.data;

  const dist = p?.distribution || {5:0,4:0,3:0,2:0,1:0};
  const total = p?.ratings_count || 0;
  const rows = [
    { label: "Awesome 5", value: 5, count: dist[5] || 0 },
    { label: "Great 4",   value: 4, count: dist[4] || 0 },
    { label: "Good 3",    value: 3, count: dist[3] || 0 },
    { label: "OK 2",      value: 2, count: dist[2] || 0 },
    { label: "Awful 1",   value: 1, count: dist[1] || 0 },
  ];

  const barWidth = (c:number) => total ? `${(c/total)*100}%` : "0%";

  return (
    <div className="space-y-5">
    {/* Top bar: Back to the professors list of the selected college, plus optional Home */}
    <div className="sticky top-0 z-10 bg-gray-50/80 backdrop-blur py-2 flex gap-2">
      <BackSmartButton
        label="← Back to Colleges"
        fallbackHref={school ? `/colleges/${school}` : "/colleges"}   // ← go back to that college’s list
      />
      <BackHomeButton />
    </div>


      <div className="grid md:grid-cols-2 gap-6">
        {/* Left column: headline */}
        <div className="space-y-2">
          <div className="text-5xl font-bold">{p?.avg_stars ?? "—"} <span className="text-2xl text-gray-500">/ 5</span></div>
          <div className="text-sm text-gray-600">
            Overall Quality based on <b>{p?.ratings_count ?? 0}</b> ratings
          </div>
          <h2 className="text-4xl font-extrabold leading-tight">{p.first_name} {p.last_name}</h2>
          <div className="text-gray-700">
            {p.department ? <>Professor in {p.department}</> : "Professor"}
          </div>
          {p.profile_url && (
            <a className="text-blue-700 underline" href={p.profile_url} target="_blank">University profile</a>
          )}
          <div className="flex gap-8 mt-3">
            <div>
              <div className="text-3xl font-semibold">{p.would_take_again_pct ?? "—"}%</div>
              <div className="text-xs text-gray-500">Would take again (⭐ ≥ 4)</div>
            </div>
          </div>
        </div>

        {/* Right column: bar distribution */}
        <div className="border rounded-xl p-4 bg-white">
          <div className="font-semibold mb-3">Rating Distribution</div>
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.value} className="flex items-center gap-3">
                <div className="w-24 text-sm">{r.label}</div>
                <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600"
                    style={{ width: barWidth(r.count) }}
                    aria-label={`${r.label} ${r.count}`}
                  />
                </div>
                <div className="w-10 text-right text-sm">{r.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bio */}
      {p.bio && (
        <div className="border rounded-xl p-4 bg-white">
          <div className="font-semibold mb-1">About</div>
          <p className="text-sm text-gray-800">{p.bio}</p>
        </div>
      )}

      {/* Add rating */}
      <div className="border rounded-xl p-4 bg-white">
        <h3 className="font-medium mb-2">Add a rating</h3>
        <div className="flex items-center gap-2">
          <select value={stars} onChange={(e)=>setStars(parseInt(e.target.value))}
                  className="border p-2 rounded">
            {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <input
            value={comment}
            onChange={(e)=>setComment(e.target.value)}
            placeholder="Comment (optional)"
            className="flex-1 border p-2 rounded"
          />
          <button onClick={add} className="px-4 py-2 rounded bg-black text-white">Submit</button>
        </div>
      </div>

      {/* Ratings list */}
      <div className="space-y-2">
        <h3 className="font-medium">Recent ratings</h3>
        {ratings.isLoading ? <p>Loading…</p> :
          ratings.data?.length ? ratings.data.map((r:any)=>
            <div key={r.id} className="border bg-white rounded p-3">
              <div className="font-medium">⭐ {r.stars}</div>
              <div className="text-sm text-gray-700">{r.comment || ""}</div>
            </div>
          ) : <p className="text-sm text-gray-600">No ratings yet.</p>
        }
      </div>
    </div>
  );
}
