"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  School,
  BookOpen,
  ClipboardList,
  ClipboardCheck,
  FileBarChart2,
} from "lucide-react";

function today() {
  return new Date().toISOString().split("T")[0];
}

export default function DashboardPage() {
  const router = useRouter();

  const [username, setUsername] = useState("Pengguna");
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    siswa: 0,
    kelas: 0,
    mapel: 0,
    absensiHariIni: "Belum diisi",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const name = localStorage.getItem("username");

    if (!token) {
      router.push("/");
      return;
    }

    setUsername(name || "Pengguna");

    const fetchStats = async () => {
      try {
        setLoading(true);

        const [siswaRes, kelasRes, mapelRes, absensiRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/students`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/kelas`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/mapel`),
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/absensi?tanggal=${today()}`
          ),
        ]);

        const siswa = await siswaRes.json();
        const kelas = await kelasRes.json();
        const mapel = await mapelRes.json();
        const absensi = await absensiRes.json();

        setStats({
          siswa: Array.isArray(siswa) ? siswa.length : 0,
          kelas: Array.isArray(kelas) ? kelas.length : 0,
          mapel: Array.isArray(mapel) ? mapel.length : 0,
          absensiHariIni:
            Array.isArray(absensi) && absensi.length > 0
              ? "Sudah diisi"
              : "Belum diisi",
        });
      } catch (err) {
        console.error("Gagal load dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [router]);

  return (
    <div className="p-4 space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-700 mt-1">
          Selamat datang, <b>{username}</b> 👋
        </p>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-7 h-7 text-blue-600" />}
          label="Total Siswa"
          value={loading ? "..." : stats.siswa}
        />
        <StatCard
          icon={<School className="w-7 h-7 text-green-600" />}
          label="Total Kelas"
          value={loading ? "..." : stats.kelas}
        />
        <StatCard
          icon={<BookOpen className="w-7 h-7 text-purple-600" />}
          label="Mata Pelajaran"
          value={loading ? "..." : stats.mapel}
        />
        <StatCard
          icon={<ClipboardList className="w-7 h-7 text-orange-600" />}
          label="Absensi Hari Ini"
          value={loading ? "..." : stats.absensiHariIni}
        />
      </div>

      {/* QUICK ACTION */}
      <div className="bg-gray-50 shadow-[0_0_2px_rgba(0,0,0,0.3)] rounded p-4">
        <h2 className="text-lg font-semibold mb-3">Aksi Cepat</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => router.push("/dashboard/absensi")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700"
          >
            <ClipboardCheck className="w-5 h-12" />
            Input Absensi
          </button>

          <button
            onClick={() => router.push("/dashboard/rekap")}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded cursor-pointer hover:bg-green-700"
          >
            <FileBarChart2 className="w-5 h-12" />
            Rekap Absensi
          </button>

          <button
            onClick={() => router.push("/dashboard/siswa")}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded cursor-pointer hover:bg-gray-700"
          >
            <Users className="w-5 h-12" />
            Data Siswa
          </button>
        </div>
      </div>
    </div>
  );
}

/* ======================
   STAT CARD
====================== */
function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="bg-gray-50 shadow-[0_0_2px_rgba(0,0,0,0.3)] rounded p-4 flex items-center gap-3">
      {icon}
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}
