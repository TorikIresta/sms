import "./globals.css";
import Navbar from "./components/Navbar";

export const metadata = {
  title: "SMK Islam Permatasari 2",
  description: "Website resmi SMK Islam Permatasari 2",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-gray-50 antialiased text-gray-800">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
