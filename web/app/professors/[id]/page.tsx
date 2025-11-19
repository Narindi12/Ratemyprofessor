"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export default function ProfessorDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["professor", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await api.get(`/professors/${id}`);
      return res.data;
    },
  });

  if (!id) {
    return (
      <div className="max-w-3xl mx-auto py-10">
        <h1 className="text-2xl font-semibold mb-2">Rate My Professor</h1>
        <hr className="mb-4" />
        <p className="text-red-600">No professor id in URL.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-10">
        <h1 className="text-2xl font-semibold mb-2">Rate My Professor</h1>
        <hr className="mb-4" />
        <p>Loading professor...</p>
      </div>
    );
  }

  if (isError) {
    console.error(error);
    return (
      <div className="max-w-3xl mx-auto py-10">
        <h1 className="text-2xl font-semibold mb-2">Rate My Professor</h1>
        <hr className="mb-4" />
        <p className="text-red-600">
          Professor not found or failed to load.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-4">
      <h1 className="text-2xl font-semibold mb-2">Rate My Professor</h1>
      <hr />

      <div className="space-y-1">
        <div className="text-4xl font-extrabold">
          {data.rating ?? "—"} <span className="text-lg text-gray-500">/ 5</span>
        </div>
        <div className="text-sm text-gray-600">
          Overall Quality
          {typeof data.ratings_count === "number" && (
            <> · Based on {data.ratings_count} ratings</>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-2xl font-bold">{data.name}</div>
        <div className="text-sm text-gray-700">
          {data.department || "—"} · {data.level || "—"}
        </div>
        <div className="text-sm text-gray-500">{data.email || ""}</div>
      </div>

      {data.bio && (
        <div className="mt-2 text-sm text-gray-800">
          <span className="font-semibold">Bio: </span>
          {data.bio}
        </div>
      )}
    </div>
  );
}
