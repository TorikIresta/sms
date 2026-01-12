// @ts-ignore: allow importing global CSS without type declarations
import "./globals.css";

export const metadata = {
  title: "Aplikasi Absensi SMK",
  description: "Sistem Absensi Siswa",
  icons: {
    icon: "/smk.png", // Ini akan mencari file di folder public atau app
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
