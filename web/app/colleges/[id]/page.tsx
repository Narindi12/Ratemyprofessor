"use client";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import BackHomeButton from "@/components/BackHomeButton";
import { useState } from "react";

type Item = { id:number; name:string; department?:string; level?:string; email?:string; };

export default function CollegePage() {
  const { id } = useParams<{id:string}>();
  const router = useRouter();
  const [level, setLevel] = useState("");
  const [department, setDepartment] = useState("");
  const [search, setSearch] = useState("");

  const q = useQuery({
    queryKey: ["prof-by-school", id, level, department, search],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (level) p.set("level", level);
      if (department) p.set("department", department);
      if (search) p.set("search", search);
      const res = await api.get(`/schools/${id}/professors?` + p.toString());
      return res.data as { items: Item[] };
    }
  });

  return (
    <div className="space-y-4">
      {/* NEW: two back buttons */}
      <div className="sticky top-0 z-10 bg-gray-50/80 backdrop-blur py-2 flex gap-2">
        <button
          onClick={() => router.push("/colleges")}
          className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 bg-white hover:bg-gray-50 shadow-sm"
        >
          ← Back to Colleges
        </button>
        <BackHomeButton />
      </div>

      <h2 className="text-2xl font-semibold">Professors</h2>

      <div className="flex gap-2 flex-wrap">
        <select value={level} onChange={e=>setLevel(e.target.value)} className="border p-2 rounded">
          <option value="">All Levels</option>
          <option value="UG">Undergrad</option>
          <option value="Grad">Graduate</option>
        </select>
        <input value={department} onChange={e=>setDepartment(e.target.value)} placeholder="Add dept (e.g., Computer Science)" className="border p-2 rounded"/>
        <button onClick={()=>q.refetch()} className="px-3 py-2 rounded border">Add</button>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name" className="border p-2 rounded flex-1"/>
      </div>

      {!q.data?.items?.length ? <p>No professors found.</p> :
        <div className="grid md:grid-cols-2 gap-3">
          {q.data.items.map(p => (
            <a
              key={p.id}
              href={`/professors/${p.id}?school=${id}`}  // ← pass the college id!
              className="border rounded p-3 bg-white hover:shadow"
            >
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-gray-600">{p.department || "—"} · {p.level || "—"}</div>
              <div className="text-sm text-gray-500">{p.email || ""}</div>
            </a>
          ))}
        </div>
      }
    </div>
  );
}
