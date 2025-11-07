"use client";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import BackHomeButton from "@/components/BackHomeButton";

type School = { id:number; name:string; city?:string; state?:string; public_private?:string; tuition?:string; };
type Resp = { total:number; items: School[] };
<div className="sticky top-0 z-10 bg-gray-50/80 backdrop-blur py-2">
  <BackHomeButton label="← Back to Home" />
</div>
export default function CollegesPage() {
  const sp = useSearchParams();
  const params = Object.fromEntries(sp.entries());

  const { data, isLoading } = useQuery({
    queryKey: ["colleges", params],
    queryFn: async () => {
      const qs = new URLSearchParams(params as any).toString();
      const res = await api.get<Resp>(`/schools/search?${qs}`);
      return res.data;
    }
  });

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 bg-gray-50/80 backdrop-blur py-2">
        <BackHomeButton label="Back to filters" fallbackHref="/" />
      </div>
      <h2 className="text-2xl font-semibold">Colleges</h2>
      {isLoading && <p>Loading…</p>}
      {!isLoading && !data?.items?.length && <p>No results. Try widening your filters.</p>}
      <div className="grid md:grid-cols-2 gap-4">
        {data?.items.map(s => (
          <a key={s.id} href={`/colleges/${s.id}`} className="block border rounded-2xl p-4 bg-white hover:shadow transition">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-lg font-medium">{s.name}</div>
                <div className="text-sm text-gray-600">{s.city || "—"}, {s.state || "—"} · {s.public_private || "—"}</div>
              </div>
              <div className="text-right text-sm text-gray-700 max-w-[220px]">
                <div className="text-gray-500">Tuition & Fees</div>
                <div className="font-medium leading-tight">{s.tuition || "—"}</div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
