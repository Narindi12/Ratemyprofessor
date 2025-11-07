"use client";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useEffect, useMemo, useState } from "react";

type Item = { id:number; name:string; department?:string; level?:string; email?:string; photo_url?:string; avg_stars?:number; ratings_count?:number; };
type Response = { total:number; page:number; page_size:number; items: Item[] };

export default function ProfessorsPage() {
  const [level, setLevel] = useState<string>("");
  const [departments, setDepartments] = useState<string[]>([]);
  const [deptInput, setDeptInput] = useState("");
  const [search, setSearch] = useState<string>("");
  const [sort, setSort] = useState<string>("name_asc");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (level) params.set("level", level);
    if (departments.length) params.set("department", departments.join(",")); // backend expects a string; we’ll just send comma-joined
    if (search) params.set("search", search);
    if (sort) params.set("sort", sort);
    return params.toString();
  }, [level, departments, search, sort]);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["professors", queryString],
    queryFn: async () => {
      // We only filter by the first department for now (simple backend)
      const firstDept = departments[0];
      const url = `/schools/1/professors?${new URLSearchParams({
        ...(level ? { level } : {}),
        ...(firstDept ? { department: firstDept } : {}),
        ...(search ? { search } : {}),
        ...(sort ? { sort } : {}),
      }).toString()}`;
      const res = await api.get<Response>(url);
      return res.data;
    }
  });

  useEffect(()=>{ refetch(); }, [queryString]);

  const addDept = () => {
    const d = deptInput.trim();
    if (d && !departments.includes(d)) setDepartments([...departments, d]);
    setDeptInput("");
  };
  const removeDept = (d: string) => setDepartments(departments.filter(x=>x!==d));

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 bg-gray-50/80 backdrop-blur border-b py-3">
        <div className="flex gap-2 flex-wrap items-center">
          <select value={level} onChange={e=>setLevel(e.target.value)} className="border p-2 rounded">
            <option value="">All Levels</option>
            <option value="UG">Undergrad</option>
            <option value="Grad">Graduate</option>
          </select>
          <div className="flex items-center gap-2">
            <input value={deptInput} onChange={e=>setDeptInput(e.target.value)} placeholder="Add dept (e.g., Computer Science)" className="border p-2 rounded" />
            <button onClick={addDept} className="px-3 py-2 rounded border">Add</button>
            <div className="flex gap-2">
              {departments.map(d => (
                <span key={d} className="px-2 py-1 text-sm bg-white border rounded">
                  {d} <button onClick={()=>removeDept(d)} className="ml-1">✕</button>
                </span>
              ))}
            </div>
          </div>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name" className="border p-2 rounded flex-1" />
          <select value={sort} onChange={e=>setSort(e.target.value)} className="border p-2 rounded">
            <option value="name_asc">Name (A–Z)</option>
            <option value="rating_desc">Highest Rated</option>
            <option value="count_desc">Most Rated</option>
          </select>
        </div>
      </div>

      {(isLoading || isFetching) && <p>Loading…</p>}

      {data && (
        <div className="grid md:grid-cols-2 gap-3">
          {data.items.map(p => (
            <a key={p.id} href={`/professors/${p.id}`} className="border rounded p-3 bg-white hover:shadow transition">
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-gray-600">{p.department || "—"} · {p.level || "—"}</div>
              <div className="text-sm">⭐ {p.avg_stars ?? "—"} · {p.ratings_count ?? 0} ratings</div>
            </a>
          ))}
        </div>
      )}
      {!isLoading && data?.items?.length === 0 && <p className="text-sm text-gray-600">No professors match your filters.</p>}
    </div>
  );
}
