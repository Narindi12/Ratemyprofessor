import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "Rate My Professor",            // ← update
  description: "College & professor ratings",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <div className="mx-auto max-w-6xl p-4">
          <header className="py-4 mb-6 border-b">
           <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-600 text-transparent bg-clip-text">
      Rate My Professor
    </h1>
          </header>
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
