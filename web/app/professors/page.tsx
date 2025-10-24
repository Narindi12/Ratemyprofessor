"use client";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useEffect, useState } from "react";

type Item = { id:number; name:string; department?:string; level?:string; email?:string; photo_url?:string; };
type Response = { total:number; page:number; page_size:number; items: Item[] };

export default function ProfessorsPage() {
  const [level, setLevel] = useState("");
  const [department, setDepartment] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["professors", level, department, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (level) params.set("level", level);
      if (department) params.set("department", department);
      if (search) params.set("search", search);
      const res = await api.get<Response>(`/schools/1/professors?${params.toString()}`);
      return res.data;
    }
  });

  useEffect(()=>{ refetch(); }, [level, department, search]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Professors</h2>
      <div className="flex gap-2 flex-wrap">
        <select value={level} onChange={e=>setLevel(e.target.value)} className="border p-2 rounded">
          <option value="">All Levels</option>
          <option value="UG">Undergrad</option>
          <option value="Grad">Graduate</option>
        </select>
        <input value={department} onChange={e=>setDepartment(e.target.value)} placeholder="Department (e.g., Computer Science)" className="border p-2 rounded flex-1" />
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name" className="border p-2 rounded flex-1" />
      </div>

      {isLoading && <p>Loading…</p>}
      {data && (
        <div className="grid md:grid-cols-2 gap-3">
          {data.items.map(p => (
            <a key={p.id} href={`/professors/${p.id}`} className="border rounded p-3 bg-white hover:shadow">
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-gray-600">{p.department || "—"} · {p.level || "—"}</div>
              <div className="text-sm text-gray-500">{p.email || ""}</div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
