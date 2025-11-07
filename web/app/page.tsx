"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const sp = useSearchParams();

  // Start empty; if URL has values (when coming back), use those
  const [stateOrCity, setStateOrCity] = useState<string>(sp.get("state") ?? "");
  const [type, setType] = useState<"" | "public" | "private">((sp.get("public_private") as any) ?? "");
  const [tuition, setTuition] = useState<string>(sp.get("tuition_contains") ?? "");

  const go = () => {
    const p = new URLSearchParams();
    if (stateOrCity) p.set("state", stateOrCity);
    if (type) p.set("public_private", type);
    if (tuition) p.set("tuition_contains", tuition);
    router.push(`/colleges?${p.toString()}`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-3xl font-semibold text-center">Find the right college</h2>

      <div className="grid gap-4 bg-white p-6 rounded-2xl shadow">
        {/* Location input with your fixed list only */}
        <div>
          <label className="block text-sm font-medium mb-1">Location (State or City)</label>
          <input
            list="locations"
            value={stateOrCity}
            onChange={(e) => setStateOrCity(e.target.value)}
            placeholder='Type "Georgia" or select "Atlanta, Georgia"'
            className="w-full border p-2 rounded"
          />
          <datalist id="locations">
            <option value="Atlanta, Georgia" />
            <option value="Berkeley, California" />
            <option value="Ann Arbor, Michigan" />
            <option value="Charlottesville, Virginia" />
            <option value="Cambridge, Massachusetts" />
            <option value="Stanford, California" />
            <option value="New Haven, Connecticut" />
            <option value="Princeton, New Jersey" />
          </datalist>
          <p className="text-xs text-gray-500 mt-1">
            Tip: you can type a state (e.g., <b>Georgia</b>) or pick a city/state.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <div className="flex gap-2">
            <button
              onClick={() => setType("public")}
              className={`px-4 py-2 rounded border ${type === "public" ? "bg-black text-white" : "bg-white"}`}
            >
              Public
            </button>
            <button
              onClick={() => setType("private")}
              className={`px-4 py-2 rounded border ${type === "private" ? "bg-black text-white" : "bg-white"}`}
            >
              Private
            </button>
            <button
              onClick={() => setType("")}
              className={`px-4 py-2 rounded border ${type === "" ? "bg-black text-white" : "bg-white"}`}
            >
              Any
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tuition fees</label>
          <input
            value={tuition}
            onChange={(e) => setTuition(e.target.value)}
            placeholder='e.g., "in-state", "57,986", "out-of-state"'
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="flex justify-end">
          <a href="/colleges" className="px-4 py-2 rounded border mr-auto">Browse all</a>
          <button onClick={go} className="px-5 py-2 rounded-xl bg-black text-white shadow">Search colleges</button>
        </div>
      </div>
    </div>
  );
}
