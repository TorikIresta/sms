"use client";

import { useEffect, useState } from "react";
import { Users, Calendar, Save } from "lucide-react";

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
type Jurusan = { id: number; kode_jurusan?: string; nama_jurusan: string };
type Mapel = { id: number; kode_mapel?: string; nama_mapel: string };

type AttendanceItem = { nis: string; status: string }; // status: hadir|sakit|izin|alfa

function todayYYYYMMDD(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function AbsensiPage() {
  // data lists
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [jurusanList, setJurusanList] = useState<Jurusan[]>([]);
  const [mapelList, setMapelList] = useState<Mapel[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  // selected filters (we store ids as strings for <select> values)
  const [selectedKelasId, setSelectedKelasId] = useState<string>("");
  const [selectedJurusanId, setSelectedJurusanId] = useState<string>("");
  const [selectedMapelId, setSelectedMapelId] = useState<string>("");

  const [tanggal, setTanggal] = useState(todayYYYYMMDD());
  const [attendance, setAttendance] = useState<Record<string, string>>({}); // nis -> status
  const [loading, setLoading] = useState(false);

  // -------------------------
  // Fetch initial lists: students, kelas, jurusan, mapel
  // -------------------------
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);

        const [sres, kres, jres, mres] = await Promise.all([
          fetch("https://api.smkislampermatasari2.sch.id/students").catch(
            () => null
          ),
          fetch("https://api.smkislampermatasari2.sch.id/kelas").catch(
            () => null
          ),
          fetch("https://api.smkislampermatasari2.sch.id/jurusan").catch(
            () => null
          ),
          fetch("https://api.smkislampermatasari2.sch.id/mapel").catch(
            () => null
          ),
        ]);

        // students
        if (sres && sres.ok) {
          const sdata = (await sres.json()) as Student[];
          setStudents(sdata);
        } else {
          setStudents([]);
        }

        // kelas
        if (kres && kres.ok) {
          const kdata = (await kres.json()) as Kelas[];
          setKelasList(kdata);
          if (kdata.length > 0 && !selectedKelasId) {
            setSelectedKelasId(String(kdata[0].id));
          }
        } else {
          setKelasList([]);
        }

        // jurusan
        if (jres && jres.ok) {
          const jdata = (await jres.json()) as Jurusan[];
          setJurusanList(jdata);
          if (jdata.length > 0 && !selectedJurusanId) {
            setSelectedJurusanId(String(jdata[0].id));
          }
        } else {
          setJurusanList([]);
        }

        // mapel
        if (mres && mres.ok) {
          const mdata = (await mres.json()) as Mapel[];
          setMapelList(mdata);
          if (mdata.length > 0 && !selectedMapelId) {
            setSelectedMapelId(String(mdata[0].id));
          }
        } else {
          // fallback mapel (if backend doesn't provide)
          const fallback = [
            { id: -1, kode_mapel: "MTK", nama_mapel: "Matematika" },
            { id: -2, kode_mapel: "BIN", nama_mapel: "Bahasa Indonesia" },
          ];
          setMapelList(fallback);
          if (!selectedMapelId) setSelectedMapelId(String(fallback[0].id));
        }
      } catch (err) {
        console.error(err);
        alert("Gagal memuat data awal. Pastikan backend berjalan!");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------
  // Compute studentsOfClass based on selected kelas_id + jurusan_id
  // (we filter local students array)
  // -------------------------
  const studentsOfClass = students.filter((s) => {
    // both selected IDs might be empty initially
    const matchKelas =
      selectedKelasId === ""
        ? true
        : String(s.kelas_id) === String(selectedKelasId);
    const matchJurusan =
      selectedJurusanId === ""
        ? true
        : String(s.jurusan_id) === String(selectedJurusanId);

    return matchKelas && matchJurusan;
  });

  // -------------------------
  // When filter (kelas/jurusan/mapel/tanggal) changes, fetch existing absensi record
  // Expect backend to accept ids: kelas_id, jurusan_id, mapel_id, tanggal
  // If backend still expects names, you can adjust to send names; current code sends ids.
  // -------------------------
  useEffect(() => {
    // require all filters to be set (mapel optional? but we require it)
    if (
      !selectedKelasId ||
      !selectedMapelId ||
      !selectedJurusanId ||
      !tanggal
    ) {
      setAttendance({});
      return;
    }

    const fetchAbsensi = async () => {
      try {
        setLoading(true);

        const q = `kelas_id=${encodeURIComponent(
          selectedKelasId
        )}&jurusan_id=${encodeURIComponent(
          selectedJurusanId
        )}&mapel_id=${encodeURIComponent(
          selectedMapelId
        )}&tanggal=${encodeURIComponent(tanggal)}`;

        const res = await fetch(
          `https://api.smkislampermatasari2.sch.id/absensi?${q}`
        );
        if (!res.ok) {
          // if backend returns 404/no record, treat as empty
          setAttendance({});
          return;
        }

        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const record = data[0];
          const map: Record<string, string> = {};
          if (Array.isArray(record.siswa)) {
            record.siswa.forEach((it: AttendanceItem) => {
              map[it.nis] = it.status;
            });
          }
          setAttendance(map);
        } else {
          setAttendance({});
        }
      } catch (err) {
        console.error(err);
        alert("Gagal mengambil data absensi");
      } finally {
        setLoading(false);
      }
    };

    fetchAbsensi();
  }, [selectedKelasId, selectedJurusanId, selectedMapelId, tanggal]);

  const setStatus = (nis: string, status: string) => {
    setAttendance((prev) => ({ ...prev, [nis]: status }));
  };

  // -------------------------
  // Save absensi: send kelas_id, jurusan_id, mapel_id, tanggal, siswa[]
  // backend expected response: { record: { ... } }
  // -------------------------
  const handleSave = async () => {
    if (!selectedKelasId) return alert("Pilih kelas terlebih dahulu");
    if (!selectedJurusanId) return alert("Pilih jurusan terlebih dahulu");
    if (!selectedMapelId) return alert("Pilih mata pelajaran terlebih dahulu");

    const payload = studentsOfClass.map((s) => ({
      nis: s.nis,
      status: attendance[s.nis] || "alfa",
    }));

    try {
      setLoading(true);

      const res = await fetch(
        "https://api.smkislampermatasari2.sch.id/absensi",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kelas_id: Number(selectedKelasId),
            jurusan_id: Number(selectedJurusanId),
            mapel_id: Number(selectedMapelId),
            tanggal,
            siswa: payload,
          }),
        }
      );

      // parse response body (may contain error message)
      const out = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = out.message || "Gagal menyimpan absensi";
        throw new Error(msg);
      }

      // success
      const record = out.record || {
        kelas_id: selectedKelasId,
        jurusan_id: selectedJurusanId,
        mapel_id: selectedMapelId,
        tanggal,
      };

      // for user-friendly message, map ids to names if possible
      const kelasName =
        kelasList.find((k) => String(k.id) === String(record.kelas_id))
          ?.nama_kelas || String(record.kelas_id);
      const jurusanName =
        jurusanList.find((j) => String(j.id) === String(record.jurusan_id))
          ?.nama_jurusan || String(record.jurusan_id);
      const mapelName =
        mapelList.find((m) => String(m.id) === String(record.mapel_id))
          ?.nama_mapel || String(record.mapel_id);

      alert(
        "Absensi tersimpan untuk " +
          kelasName +
          " / " +
          jurusanName +
          " - " +
          mapelName +
          " tanggal " +
          record.tanggal
      );
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Terjadi kesalahan saat menyimpan");
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
            className="flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 w-full md:w-auto h-9"
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
