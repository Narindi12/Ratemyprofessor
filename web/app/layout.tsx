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
            <h1 className="text-2xl font-semibold">Rate My Professor</h1> {/* ← update */}
          </header>
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
