"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";

/* =======================
   TYPES
======================= */
type Student = {
  id: number;
  nis: string;
  nama: string;
  jk?: "L" | "P";
  kelas_id?: number | null;
  jurusan_id?: number | null;
  nama_kelas?: string | null;
  nama_jurusan?: string | null;
};

type Kelas = { id: number; nama_kelas: string };
type Jurusan = { id: number; nama_jurusan: string; kode_jurusan?: string };
type Mapel = { id: number; nama_mapel: string; kode_mapel?: string };

type AttendanceItem = {
  nis: string;
  status: "hadir" | "izin" | "sakit" | "alfa";
};

/* =======================
   HELPERS
======================= */
const todayYYYYMMDD = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

/* =======================
   COMPONENT
======================= */
export default function AbsensiPage() {
  const API = process.env.NEXT_PUBLIC_API_URL;

  /* ===== DATA ===== */
  const [students, setStudents] = useState<Student[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [jurusanList, setJurusanList] = useState<Jurusan[]>([]);
  const [mapelList, setMapelList] = useState<Mapel[]>([]);

  /* ===== FILTER ===== */
  const [selectedKelasId, setSelectedKelasId] = useState("");
  const [selectedJurusanId, setSelectedJurusanId] = useState("");
  const [selectedMapelId, setSelectedMapelId] = useState("");
  const [tanggal, setTanggal] = useState(todayYYYYMMDD());

  /* ===== STATE ===== */
  const [attendance, setAttendance] = useState<
    Record<string, AttendanceItem["status"]>
  >({});
  const [loading, setLoading] = useState(false);

  /* =======================
     FETCH INITIAL DATA
  ======================= */
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        setLoading(true);

        const [sRes, kRes, jRes, mRes] = await Promise.all([
          fetch(`${API}/students`),
          fetch(`${API}/kelas`),
          fetch(`${API}/jurusan`),
          fetch(`${API}/mapel`),
        ]);

        if (sRes.ok) setStudents(await sRes.json());
        if (kRes.ok) {
          const data = await kRes.json();
          setKelasList(data);
          if (!selectedKelasId && data[0])
            setSelectedKelasId(String(data[0].id));
        }
        if (jRes.ok) {
          const data = await jRes.json();
          setJurusanList(data);
          if (!selectedJurusanId && data[0])
            setSelectedJurusanId(String(data[0].id));
        }
        if (mRes.ok) {
          const data = await mRes.json();
          setMapelList(data);
          if (!selectedMapelId && data[0])
            setSelectedMapelId(String(data[0].id));
        }
      } catch (err) {
        console.error(err);
        alert("Gagal memuat data awal");
      } finally {
        setLoading(false);
      }
    };

    fetchInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =======================
     FILTER SISWA
  ======================= */
  const studentsOfClass = students.filter((s) => {
    const matchKelas =
      !selectedKelasId || String(s.kelas_id) === selectedKelasId;
    const matchJurusan =
      !selectedJurusanId || String(s.jurusan_id) === selectedJurusanId;
    return matchKelas && matchJurusan;
  });

  /* =======================
     FETCH ABSENSI
  ======================= */
  useEffect(() => {
    if (
      !selectedKelasId ||
      !selectedJurusanId ||
      !selectedMapelId ||
      !tanggal
    ) {
      setAttendance({});
      return;
    }

    const fetchAbsensi = async () => {
      try {
        setLoading(true);

        const query = new URLSearchParams({
          kelas_id: selectedKelasId,
          jurusan_id: selectedJurusanId,
          mapel_id: selectedMapelId,
          tanggal,
        });

        const res = await fetch(`${API}/absensi?${query.toString()}`);
        if (!res.ok) {
          setAttendance({});
          return;
        }

        const data = await res.json();
        const map: Record<string, AttendanceItem["status"]> = {};

        if (Array.isArray(data?.[0]?.siswa)) {
          data[0].siswa.forEach((it: AttendanceItem) => {
            map[it.nis] = it.status;
          });
        }

        setAttendance(map);
      } catch (err) {
        console.error(err);
        alert("Gagal mengambil data absensi");
      } finally {
        setLoading(false);
      }
    };

    fetchAbsensi();
  }, [selectedKelasId, selectedJurusanId, selectedMapelId, tanggal]);

  /* =======================
     HANDLERS
  ======================= */
  const setStatus = (nis: string, status: AttendanceItem["status"]) => {
    setAttendance((prev) => ({ ...prev, [nis]: status }));
  };

  const handleSave = async () => {
    if (!selectedKelasId || !selectedJurusanId || !selectedMapelId) {
      alert("Lengkapi filter terlebih dahulu");
      return;
    }

    const payload = studentsOfClass.map((s) => ({
      nis: s.nis,
      status: attendance[s.nis] || "alfa",
    }));

    try {
      setLoading(true);

      const res = await fetch(`${API}/absensi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kelas_id: Number(selectedKelasId),
          jurusan_id: Number(selectedJurusanId),
          mapel_id: Number(selectedMapelId),
          tanggal,
          siswa: payload,
        }),
      });

      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.message || "Gagal menyimpan absensi");

      alert("Absensi berhasil disimpan");
    } catch (err: unknown) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 pt-3">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3 gap-3">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-semibold">Absensi</h1>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center md:space-x-2 gap-1">
          {/* Date */}
          <div className="flex items-center cursor-pointer bg-white border p-2 rounded shadow w-full md:w-auto">
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full md:w-auto h-5 cursor-pointer outline-none"
            />
          </div>

          {/* Kelas */}
          <select
            value={selectedKelasId}
            onChange={(e) => setSelectedKelasId(e.target.value)}
            className="p-2 cursor-pointer border rounded w-full md:w-auto"
          >
            {kelasList.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama_kelas}
              </option>
            ))}
          </select>

          {/* Jurusan */}
          <select
            value={selectedJurusanId}
            onChange={(e) => setSelectedJurusanId(e.target.value)}
            className="p-2 cursor-pointer border rounded w-full md:w-auto max-w-full md:max-w-[200px]"
          >
            {jurusanList.map((j) => (
              <option key={j.id} value={j.id}>
                {j.nama_jurusan}
              </option>
            ))}
          </select>

          {/* Mapel */}
          <select
            className="p-2 cursor-pointer border rounded w-full md:w-auto max-w-full md:max-w-[300px]"
            value={selectedMapelId}
            onChange={(e) => setSelectedMapelId(e.target.value)}
          >
            {mapelList.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nama_mapel}
              </option>
            ))}
          </select>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="flex items-center justify-center cursor-pointer space-x-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 w-full md:w-auto h-9"
            disabled={loading}
          >
            <Save className="w-4 h-4" />
            <span>{loading ? "Menyimpan..." : "Simpan"}</span>
          </button>
        </div>
      </div>

      <div className="bg-white shadow-[0_0_2px_rgba(0,0,0,0.5)] rounded-sm overflow-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-blue-600 border-b border-gray-300 text-white">
            <tr>
              <th className="p-2 pl-3 text-left">No</th>
              <th className="p-2 pl-3 border-l border-gray-200 text-left">
                Nama
              </th>
              <th className="p-2 pl-3 border-l border-gray-200 text-left hidden md:table-cell">
                NIS
              </th>
              <th className="p-2 pl-3 border-l border-gray-200 text-center">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {studentsOfClass.map((s, idx) => {
              const status = attendance[s.nis] || "";
              return (
                <tr
                  key={s.nis}
                  className="odd:bg-white border-b border-gray-300 even:bg-gray-100 hover:bg-blue-200"
                >
                  <td className="p-1 pl-3">{idx + 1}</td>
                  <td className="p-1 pl-3 border-l border-gray-200">
                    {s.nama}
                  </td>
                  <td className="p-1 pl-3 border-l border-gray-200 hidden md:table-cell">
                    {s.nis}
                  </td>
                  <td className="p-1 pl-3 border-l border-gray-200 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => setStatus(s.nis, "hadir")}
                        className={`px-3 cursor-pointer py-1 rounded ${
                          status === "hadir"
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "bg-gray-200 hover:bg-gray-300 border border-gray-300 hover:border-gray-200"
                        }`}
                      >
                        Hadir
                      </button>
                      <button
                        onClick={() => setStatus(s.nis, "izin")}
                        className={`px-3 cursor-pointer py-1 rounded ${
                          status === "izin"
                            ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                            : "bg-gray-200 hover:bg-gray-300 border border-gray-300 hover:border-gray-200"
                        }`}
                      >
                        Izin
                      </button>
                      <button
                        onClick={() => setStatus(s.nis, "sakit")}
                        className={`px-3 cursor-pointer py-1 rounded ${
                          status === "sakit"
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : "bg-gray-200 hover:bg-gray-300 border border-gray-300 hover:border-gray-200"
                        }`}
                      >
                        Sakit
                      </button>
                      <button
                        onClick={() => setStatus(s.nis, "alfa")}
                        className={`px-3 cursor-pointer py-1 rounded ${
                          status === "alfa"
                            ? "bg-red-600 hover:bg-red-700 text-white"
                            : "bg-gray-200 hover:bg-gray-300 border border-gray-300 hover:border-gray-200"
                        }`}
                      >
                        Alfa
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {studentsOfClass.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-gray-600 text-center">
                  Tidak ada siswa pada kelas / jurusan ini
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
