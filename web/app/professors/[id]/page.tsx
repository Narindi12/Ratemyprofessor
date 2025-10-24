"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import api, { setAuthToken } from "@/lib/api";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";

export default function ProfessorDetail() {
  const params = useParams<{id:string}>();
  const id = params.id;
  const qc = useQueryClient();
  const router = useRouter();

  const token = Cookies.get("token");
  useEffect(()=>{ setAuthToken(token); }, [token]);

  const prof = useQuery({
    queryKey: ["prof", id],
    queryFn: async () => (await api.get(`/professors/${id}`)).data
  });

  const ratings = useQuery({
    queryKey: ["ratings", id],
    queryFn: async () => (await api.get(`/professors/${id}/ratings`)).data
  });

  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("Excellent");

  const add = async () => {
    if (!token) { router.push("/auth/login"); return; }
    await api.post(`/professors/${id}/ratings`, { stars, comment });
    await qc.invalidateQueries({ queryKey: ["prof", id] });
    await qc.invalidateQueries({ queryKey: ["ratings", id] });
    setComment("");
  };

  if (prof.isLoading) return <p>Loading…</p>;
  const p = prof.data;

  return (
    <div className="space-y-4">
      <a href="/professors" className="text-sm text-blue-700">← Back</a>
      <h2 className="text-2xl font-semibold">{p.first_name} {p.last_name}</h2>
      <div className="text-gray-700">{p.department || "—"} · {p.level || "—"}</div>
      <div className="text-sm text-gray-500">{p.email || ""}</div>
      <div className="text-sm">{p.bio || ""}</div>
      <div className="mt-2">Avg ⭐: {p.avg_stars ?? "—"} ({p.ratings_count} ratings)</div>

      <div className="border rounded p-3 bg-white">
        <h3 className="font-medium mb-2">Add a rating</h3>
        {!token && <p className="text-sm text-red-600 mb-2">Login with @gsu.edu to rate/comment.</p>}
        <div className="flex items-center gap-2">
          <select value={stars} onChange={e=>setStars(parseInt(e.target.value))} className="border p-2 rounded">
            {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <input value={comment} onChange={e=>setComment(e.target.value)} placeholder="Comment (optional)" className="flex-1 border p-2 rounded" />
          <button onClick={add} className="px-4 py-2 rounded bg-black text-white">Submit</button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-medium">Recent ratings</h3>
        {ratings.isLoading ? <p>Loading…</p> :
          ratings.data?.length ? ratings.data.map((r:any)=>
            <div key={r.id} className="border bg-white rounded p-3">
              <div>⭐ {r.stars}</div>
              <div className="text-sm text-gray-700">{r.comment || ""}</div>
            </div>
          ) : <p className="text-sm text-gray-600">No ratings yet.</p>
        }
      </div>
    </div>
  );
}
