"use client";

import { useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

// ---------- Types ----------

type School = {
  id: number;
  name: string;
  city: string;
  state: string;
  public_private: string;
  // backend may send either "tuition" or "tuition_text"
  tuition?: string | null;
  tuition_text?: string | null;
};

type ProfessorSummary = {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  name?: string | null;
  department?: string | null;
  level?: string | null;
  email?: string | null;
  rating?: number | null;
};

type ProfessorDetail = ProfessorSummary & {
  bio?: string | null;
};

type View =
  | "landing"
  | "filters"
  | "colleges"
  | "professors"
  | "professorDetail"
  | "compare";

// ---------- Component ----------

export default function Home() {
  const [view, setView] = useState<View>("landing");

  // Filters
  const [location, setLocation] = useState("");
  const [type, setType] = useState<"Public" | "Private" | "Any">("Public");
  const [maxTuition, setMaxTuition] = useState("");


  // Data
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [professors, setProfessors] = useState<ProfessorSummary[]>([]);
  const [selectedProfessor, setSelectedProfessor] =
    useState<ProfessorDetail | null>(null);

  const [compareList, setCompareList] = useState<
    { prof: ProfessorDetail; school: School | null }[]
  >([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------- Helpers ----------

  const formatRating = (rating: number | null | undefined) =>
    rating == null ? "N/A" : rating.toFixed(1);

  // Deduplicate professors and limit to 10
  function getUniqueProfessors(list: ProfessorSummary[]): ProfessorSummary[] {
    const seen = new Set<string>();
    const unique: ProfessorSummary[] = [];
    for (const p of list) {
      const key = `${p.first_name ?? ""}|${p.last_name ?? ""}|${p.email ?? ""}|${
        p.id
      }`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(p);
      if (unique.length >= 10) break;
    }
    return unique;
  }

  const MAX_COMPARE = 2;

  function isInCompare(id: number) {
    return compareList.some((c) => c.prof.id === id);
  }

  function removeFromCompare(id: number) {
    setCompareList((prev) => prev.filter((c) => c.prof.id !== id));
  }

  // ---------- API helpers ----------

  async function browseAllColleges() {
    setLocation("");
    setType("Any");
    setMaxTuition("");   // ← IMPORTANT
    loadColleges(); 

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append("page", "1");
      params.append("page_size", "50");

      const res = await fetch(`${API_BASE}/schools/search?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load colleges");

      const data = await res.json();
      const items: School[] = Array.isArray(data.items) ? data.items : [];
      setSchools(items);
      setView("colleges");
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to load colleges");
      setSchools([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadColleges() {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
if (location.trim()) params.append("state", location.trim());
if (type !== "Any") params.append("public_private", type);

// ✅ NEW: numeric tuition filter
if (maxTuition.trim()) {
  const value = Number(maxTuition.replace(/[^0-9.]/g, ""));
  if (!Number.isNaN(value) && value > 0) {
    params.append("max_tuition", String(value));
  }
}

params.append("page", "1");
params.append("page_size", "50");


      const res = await fetch(`${API_BASE}/schools/search?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load colleges");

      const data = await res.json();
      const items: School[] = Array.isArray(data.items) ? data.items : [];
      setSchools(items);
      setView("colleges");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load colleges");
      setSchools([]);
    } finally {
      setLoading(false);
    }
  }

  const searchColleges = () => {
    setSelectedSchool(null);
    setProfessors([]);
    setSelectedProfessor(null);
    loadColleges();
  };

  async function loadProfessorsForSchool(school: School) {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE}/schools/${school.id}/professors`);
      if (!res.ok) throw new Error("Failed to load professors");

      const raw = await res.json();
      const list: ProfessorSummary[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw.items)
        ? raw.items
        : [];

      const unique = getUniqueProfessors(list);

      setSelectedSchool(school);
      setProfessors(unique);
      setSelectedProfessor(null);
      setView("professors");
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Something went wrong");
      setProfessors([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadProfessorDetail(prof: ProfessorSummary) {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE}/professors/${prof.id}`);
      if (!res.ok) throw new Error("Failed to load professor");

      const data: ProfessorDetail = await res.json();
      setSelectedProfessor(data);
      setView("professorDetail");
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function addProfessorToCompare(
    prof: ProfessorSummary | ProfessorDetail,
    school: School | null
  ) {
    try {
      setError(null);
      if (isInCompare(prof.id)) return;

      let full: ProfessorDetail;
      if ("bio" in prof && prof.bio !== undefined) {
        full = prof as ProfessorDetail;
      } else {
        const res = await fetch(`${API_BASE}/professors/${prof.id}`);
        if (!res.ok) throw new Error("Failed to load professor for compare");
        full = await res.json();
      }

      setCompareList((prev) => {
        let next = [...prev];
        if (next.length >= MAX_COMPARE) {
          next = next.slice(1);
        }
        next.push({ prof: full, school });
        return next;
      });
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to add professor to compare");
    }
  }

  // ---------- Views ----------
  
  // Landing page
  if (view === "landing") {
  return (
    <main
      className="min-h-screen text-slate-800 flex items-center justify-center px-4"
      style={{
        backgroundImage: "url('/landing-books.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      
      {/* White glass card on top of the photo */}
      <div className="max-w-3xl w-full bg-white/85 backdrop-blur-md rounded-3xl shadow-xl border border-blue-100 px-8 py-10 md:px-12 md:py-14 text-center">
        <h1 className="text-3xl md:text-4xl font-semibold mb-4 bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-600 text-transparent bg-clip-text">
          Welcome to Rate My Professor
        </h1>
        <p className="text-sm md:text-base text-slate-600 mb-8">
          Explore universities, browse curated professors, and view ratings
          gathered from the original RateMyProfessors website. Start with a
          college search, then drill down to departments, professors, and
          comparisons.
        </p>
        <button
          onClick={() => setView("filters")}
          className="inline-flex items-center justify-center px-7 py-2.5 rounded-full bg-blue-600 text-white text-sm font-medium shadow-md hover:bg-blue-700 transition"
        >
          Enter
        </button>
      </div>
    </main>
  );
}


  return (
    <main
    className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed text-slate-800"
    style={{
      backgroundImage:
        view === "filters"
          ? "none" // No background image
          : "url('/library-bg.jpg')", // Image for all other pages
    }}
  >
      {/* Top bar */}
      <header className="border-b border-blue-100 bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          


          {compareList.length > 0 && (
            <button
              type="button"
              onClick={() => setView("compare")}
              className="text-xs md:text-sm px-3 py-1.5 rounded-full bg-blue-600 text-white shadow hover:bg-blue-700 transition"
            >
              Compare ({compareList.length})
            </button>
          )}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700 shadow-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-2 text-sm text-blue-700 shadow-sm">
            Loading…
          </div>
        )}

        {/* ---------- Filters View ---------- */}
        {view === "filters" && (
          <section className="min-h-screen w-full flex justify-center items-start py-16"
    style={{
      backgroundImage: "url('/campus-bg.jpg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundAttachment: "fixed",   // optional: elegant parallax effect
    }}
>
            <div className="w-full max-w-2xl bg-white/80 backdrop-blur-lg 
rounded-3xl shadow-xl border border-blue-100 px-8 py-10">

  <h2 className="text-3xl md:text-4xl font-semibold text-center mb-6 
    bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-600
    text-transparent bg-clip-text">
    Find the right college
  </h2>


              {/* Location */}
             {/* Location */}
<div className="mb-6">
  <label className="block text-sm font-medium text-slate-800 mb-2">
    Location (State or City)
  </label>

  <select
    value={location}
    onChange={(e) => setLocation(e.target.value)}
    className="w-full rounded-lg border border-blue-200 px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="">Any location</option>
    <option value="Georgia">Atlanta, Georgia</option>
    <option value="Massachusetts">Cambridge, Massachusetts</option>
    <option value="New Jersey">Princeton, New Jersey</option>
    <option value="California">Stanford, California</option>
    <option value="California">Berkeley, California</option>
    <option value="Michigan">Ann Arbor, Michigan</option>
    <option value="Virginia">Charlottesville, Virginia</option>
    <option value="Connecticut">New Haven, Connecticut</option>
  </select>

  <p className="mt-2 text-xs text-slate-500">
    Pick a popular city/state from the list, or leave this blank to search all locations.
  </p>
</div>


              {/* Type */}
              <div className="mb-6">
                <p className="block text-sm font-medium text-slate-800 mb-2">
                  Type
                </p>
                <div className="flex gap-3">
                  {(["Public", "Private", "Any"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`px-6 py-2 rounded-lg border text-sm font-medium transition ${
                        type === t
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-white text-slate-800 border-blue-200 hover:bg-blue-50"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tuition */}
              <div className="mb-8">
  <label className="block text-sm font-medium text-slate-800 mb-2">
    Tuition fees
  </label>
  <input
    type="number"
    min={0}
    value={maxTuition}
    onChange={(e) => setMaxTuition(e.target.value)}
    className="w-full rounded-lg border border-blue-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    placeholder="Enter max tuition, e.g., 50000"
  />
  <p className="mt-1 text-xs text-slate-500">
    Shows colleges where <span className="font-semibold">in-state or
    out-of-state</span> tuition is less than or equal to this amount.
  </p>
</div>


              {/* Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <button
                  type="button"
                  className="px-6 py-2 rounded-lg border border-blue-200 text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 transition"
                  onClick={browseAllColleges}
                >
                  Browse all
                </button>

                <button
                  type="button"
                  className="px-8 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium shadow-md hover:bg-blue-700 transition"
                  onClick={searchColleges}
                >
                  Search colleges
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ---------- Colleges View ---------- */}
        {/* ---------- Colleges View ---------- */}
{view === "colleges" && (
  <div
    className="min-h-[calc(100vh-80px)] -mx-4 px-4 py-6 bg-cover bg-center bg-no-repeat bg-fixed flex flex-col gap-4"
    style={{ backgroundImage: "url('/library-bg.jpg')" }}
  >
    <div className="flex justify-between items-center">
      <button
        className="text-sm text-blue-700 hover:text-blue-900 hover:underline underline-offset-2"
        onClick={() => setView("filters")}
      >
        ← Back to home
      </button>
      <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-600 text-transparent bg-clip-text">
        Colleges
      </h2>
    </div>

    <section className="space-y-3">
      {schools.length === 0 && (
        <p className="text-sm text-slate-600">
          No colleges found. Try adjusting your filters.
        </p>
      )}

      {schools.map((school) => (
        <button
          key={school.id}
          onClick={() => loadProfessorsForSchool(school)}
          className="w-full text-left bg-white/95 rounded-2xl border border-blue-100 px-4 py-4 shadow-sm hover:border-blue-300 hover:shadow-md transition flex justify-between items-center"
        >
          <div>
            <div className="font-medium text-slate-900">
              {school.name}
            </div>
            <div className="text-xs text-slate-600">
              {school.city}, {school.state} ·{" "}
              {school.public_private.toLowerCase()}
            </div>
          </div>
          <div className="text-right text-xs text-slate-600">
            <div className="font-semibold text-slate-800">
              Tuition &amp; Fees
            </div>
            <div className="mt-0.5">
              {school.tuition ||
                school.tuition_text ||
                "Tuition info not available"}
            </div>
          </div>
        </button>
      ))}
    </section>
  </div>
)}


        {/* ---------- Professors View ---------- */}
        {/* ---------- Professors View ---------- */}
{view === "professors" && selectedSchool && (
  <div
    className="min-h-[calc(100vh-80px)] -mx-4 px-4 py-6 bg-cover bg-center bg-no-repeat bg-fixed flex flex-col gap-4"
    style={{ backgroundImage: "url('/library-bg.jpg')" }}
  >
    <div className="flex justify-between items-center">
      <button
        className="text-sm text-blue-700 hover:text-blue-900 hover:underline underline-offset-2"
        onClick={() => {
          setSelectedSchool(null);
          setProfessors([]);
          setView("colleges");
        }}
      >
        ← Back to colleges
      </button>
      <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-600 text-transparent bg-clip-text">
        Professors at {selectedSchool.name}
      </h2>
    </div>

    <section className="grid md:grid-cols-3 gap-4 mt-4">
      {professors.map((prof) => {
        const displayName =
          [prof.first_name, prof.last_name].filter(Boolean).join(" ").trim() ||
          prof.name ||
          (prof.email ? prof.email.split("@")[0] : `Professor #${prof.id}`);

        return (
          <div
            key={prof.id}
            className="bg-white/95 rounded-2xl border border-blue-100 shadow-sm hover:shadow-md transition p-4 flex flex-col justify-between"
          >
            <div className="mb-2">
              <div className="font-semibold text-slate-900">
                {displayName}
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                {prof.department || "Department N/A"}
              </div>
              {prof.email && (
                <div className="mt-1 text-[11px] text-slate-500">
                  {prof.email}
                </div>
              )}
            </div>

            <div className="mt-3 flex gap-3">
              <button
                className="text-xs text-blue-600 hover:text-blue-800 hover:underline underline-offset-2"
                onClick={() => loadProfessorDetail(prof)}
              >
                View details
              </button>
              <button
                className="text-xs text-slate-600 hover:text-blue-700 hover:underline underline-offset-2"
                onClick={() => addProfessorToCompare(prof, selectedSchool)}
                disabled={isInCompare(prof.id)}
              >
                {isInCompare(prof.id) ? "In compare" : "+ Compare"}
              </button>
            </div>
          </div>
        );
      })}
    </section>
  </div>
)}


        {/* ---------- Professor Detail View ---------- */}
        {view === "professorDetail" && selectedProfessor && selectedSchool && (
          <div
            className="min-h-[calc(100vh-80px)] -mx-4 px-4 py-6 bg-cover bg-center bg-no-repeat bg-fixed flex items-start justify-center"
            style={{ backgroundImage: "url('/library-bg.jpg')" }}
          >
            <section className="bg-white/95 rounded-3xl border border-blue-100 shadow-lg p-6 md:p-8 max-w-3xl w-full">
              <button
                className="text-sm text-blue-700 hover:text-blue-900 hover:underline underline-offset-2 mb-4"
                onClick={() => setView("professors")}
              >
                ← Back to professors
              </button>

              <div className="flex flex-wrap gap-6 justify-between items-start">
                <div>
                  <h2 className="text-2xl font-semibold mb-1 bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-600 text-transparent bg-clip-text">
                    {selectedProfessor.first_name} {selectedProfessor.last_name}
                  </h2>
                  {selectedProfessor.bio && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-slate-800 mb-1">
                    Bio
                  </h3>
                  <p className="text-sm text-slate-600 whitespace-pre-line">
                    {selectedProfessor.bio}
                  </p>
                </div>
              )}
                  <p className="text-sm text-slate-600 mb-1">
                    {selectedProfessor.department || "Department N/A"} ·{" "}
                    {selectedProfessor.level || "Level N/A"}
                  </p>
                  <p className="text-sm text-slate-500 mb-2">
                    {selectedSchool.name} ({selectedSchool.city},{" "}
                    {selectedSchool.state})
                  </p>
                  {selectedProfessor.email && (
                    <p className="text-sm text-slate-500 mb-3">
                      {selectedProfessor.email}
                    </p>
                  )}
                </div>

                <div className="text-center">
                  <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">
                    Overall Rating
                  </div>
                  <div className="text-4xl font-semibold text-blue-600">
                    {formatRating(selectedProfessor.rating)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">out of 5</div>
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  className="px-4 py-1.5 text-xs rounded-full border border-blue-200 text-blue-700 bg-white hover:bg-blue-50 transition"
                  onClick={() =>
                    addProfessorToCompare(selectedProfessor, selectedSchool)
                  }
                  disabled={isInCompare(selectedProfessor.id)}
                >
                  {isInCompare(selectedProfessor.id)
                    ? "Already in compare"
                    : "Add to compare"}
                </button>
              </div>

              
            </section>
          </div>
        )}

        {/* ---------- Compare View ---------- */}
        {view === "compare" && (
          <div
            className="min-h-[calc(100vh-80px)] -mx-4 px-4 py-6 bg-cover bg-center bg-no-repeat bg-fixed flex items-start justify-center"
            style={{ backgroundImage: "url('/library-bg.jpg')" }}
          >
            <section className="bg-white/95 rounded-3xl border border-blue-100 shadow-lg p-6 md:p-8 max-w-4xl w-full">
              <div className="flex justify-between items-center mb-4">
                <button
                  className="text-sm text-blue-700 hover:text-blue-900 hover:underline underline-offset-2"
                  onClick={() => setView("professors")}
                >
                  ← Back to professors
                </button>
                <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-600 text-transparent bg-clip-text">
                  Compare Professors
                </h2>
              </div>

              {compareList.length === 0 ? (
                <p className="text-sm text-slate-600">
                  No professors selected. Go back and click{" "}
                  <span className="font-semibold">+ Compare</span> on a professor
                  card.
                </p>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {compareList.map(({ prof, school }) => {
                    const displayName =
                      [prof.first_name, prof.last_name]
                        .filter(Boolean)
                        .join(" ")
                        .trim() ||
                      prof.name ||
                      (prof.email
                        ? prof.email.split("@")[0]
                        : `Professor #${prof.id}`);

                    return (
                      <div
                        key={prof.id}
                        className="border border-blue-100 rounded-2xl p-5 shadow-sm bg-blue-50/40"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="text-lg font-semibold text-slate-900">
                              {displayName}
                            </div>
                            <div className="text-xs text-slate-600 mt-1">
                              {prof.department || "Department N/A"} ·{" "}
                              {prof.level || "Level N/A"}
                            </div>
                            {school && (
                              <div className="text-xs text-slate-500 mt-1">
                                {school.name} ({school.city}, {school.state})
                              </div>
                            )}
                            {prof.email && (
                              <div className="text-xs text-slate-500 mt-1">
                                {prof.email}
                              </div>
                            )}
                          </div>

                          <div className="text-center">
                            <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">
                              Rating
                            </div>
                            <div className="text-3xl font-semibold text-blue-600">
                              {formatRating(prof.rating)}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1">
                              out of 5
                            </div>
                          </div>
                        </div>

                        {prof.bio && (
                          <p className="text-xs text-slate-600 mb-3 whitespace-pre-line">
                            {prof.bio}
                          </p>
                        )}

                        <button
                          className="text-xs text-red-600 hover:text-red-700 hover:underline underline-offset-2"
                          onClick={() => removeFromCompare(prof.id)}
                        >
                          Remove from compare
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}