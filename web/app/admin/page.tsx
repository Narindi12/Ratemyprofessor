"use client";
import { useState } from "react";
import api from "@/lib/api";

export default function AdminPage() {
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState("");

  const upload = async () => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    setMsg("Uploading…");
    try {
      const res = await api.post("/admin/seed", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setMsg(`Inserted ${res.data.inserted} professors`);
    } catch (e: any) {
      setMsg(e?.response?.data?.detail || "Upload failed");
    }
  };

  return (
    <div className="space-y-4 max-w-lg">
      <h2 className="text-xl font-semibold">Admin: Upload Professors CSV</h2>
      <input type="file" accept=".csv" onChange={e=>setFile(e.target.files?.[0] || null)} />
      <button onClick={upload} className="px-4 py-2 rounded bg-black text-white">Upload</button>
      {msg && <p className="text-sm">{msg}</p>}
    </div>
  );
}
