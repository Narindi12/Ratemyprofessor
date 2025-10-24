import Image from "next/image";

export default function Home() {
  return (
    <div className="font-sans flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8 space-y-6">
      <Image
        src="/next.svg"
        alt="Next.js logo"
        width={120}
        height={26}
        className="dark:invert"
        priority
      />

      <h2 className="text-3xl font-semibold text-gray-800">Welcome</h2>
      <p className="text-gray-700">Use the pages below:</p>

      <div className="flex gap-4">
        <a
          className="px-6 py-3 rounded bg-black text-white hover:bg-gray-800 transition"
          href="/professors"
        >
          Browse Professors
        </a>

        <a
          className="px-6 py-3 rounded border border-gray-400 hover:bg-gray-100 transition"
          href="/auth/login"
        >
          Login / Register
        </a>
      </div>
    </div>
  );
}
