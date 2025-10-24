"use client";
import { useState } from "react";
import api, { setAuthToken } from "@/lib/api";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("student1@gsu.edu");
  const [password, setPassword] = useState("secret123");
  const [name, setName] = useState("Test Student");
  const [mode, setMode] = useState<"login"|"register">("register");
  const [err, setErr] = useState("");
  const router = useRouter();

  const submit = async () => {
    try {
      const endpoint = mode === "register" ? "/auth/register" : "/auth/login";
      const res = await api.post(endpoint, { name, email, password });
      const token = mode === "register"
        ? (await api.post("/auth/login", { name, email, password })).data.access_token
        : res.data.access_token;
      Cookies.set("token", token);
      setAuthToken(token);
      router.push("/professors");
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "Error");
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h2 className="text-xl font-semibold">{mode === "register" ? "Register" : "Login"}</h2>
      {err && <p className="text-red-600">{err}</p>}
      {mode==="register" && (
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name" className="w-full border p-2 rounded" />
      )}
      <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="GSU Email" className="w-full border p-2 rounded" />
      <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password" className="w-full border p-2 rounded" />
      <div className="flex gap-2">
        <button onClick={submit} className="px-4 py-2 rounded bg-black text-white">Submit</button>
        <button onClick={()=>setMode(mode==="register"?"login":"register")} className="px-4 py-2 rounded border">
          Switch to {mode==="register"?"Login":"Register"}
        </button>
      </div>
    </div>
  );
}
