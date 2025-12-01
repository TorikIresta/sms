"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// =====================
// TYPES
// =====================
type StudentEntry = {
  nis: string;
  nama: string;
  nama_kelas?: string;
  kelas_id?: number;
  jurusan_id?: number;
};
type Mapel = { id: number; kode_mapel?: string; nama_mapel: string };
type Kelas = { id: number; nama_kelas: string };
type Jurusan = { id: number; nama_jurusan: string };

type StudentMonthRec = {
  year: number;
  month: number;
  days: number;
  dayMap: Record<number, string>;
};

type MonthResult = {
  days: number;
  year: number;
  month: number;
  students: { nis: string; statusByDate: Record<string, string> }[];
};

// =====================
// HELPERS
// =====================
function monthName(m: number) {
  return new Date(2020, m - 1, 1).toLocaleString(undefined, { month: "long" });
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// =====================
// COMPONENT
// =====================
export default function RekapPage() {
  // maps NIS -> Nama
  const [studentsMap, setStudentsMap] = useState<Record<string, string>>({});

  // filter lists
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [jurusanList, setJurusanList] = useState<Jurusan[]>([]);
  const [mapelList, setMapelList] = useState<Mapel[]>([]);

  // selected filters (store ids as strings)
  const [selectedKelasId, setSelectedKelasId] = useState<string>("");
  const [selectedJurusanId, setSelectedJurusanId] = useState<string>("");
  const [selectedMapelId, setSelectedMapelId] = useState<string>("");

  // bulan / tahun
  const [bulan, setBulan] = useState<number>(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState<number>(new Date().getFullYear());

  // hasil rekap
  const [data, setData] = useState<MonthResult | null>(null);
  const [loading, setLoading] = useState(false);

  // tanggal merah dari API
  const [tanggalMerah, setTanggalMerah] = useState<string[]>([]);

  // modal multi-bulan per siswa
  const [modalOpen, setModalOpen] = useState(false);
  const [modalNis, setModalNis] = useState("");
  const [modalMonths, setModalMonths] = useState<StudentMonthRec[]>([]);

  // ==========================================
  // 1) Load siswa, kelas, jurusan, mapel
  // ==========================================
  useEffect(() => {
    const loadInitial = async () => {
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

        // students -> build map NIS->nama and kelas set
        if (sres && sres.ok) {
          const sjson: StudentEntry[] = await sres.json();
          const map: Record<string, string> = {};
          const kelasSet = new Set<string>();
          sjson.forEach((r) => {
            map[r.nis] = r.nama;
            if (r.nama_kelas) kelasSet.add(r.nama_kelas);
          });
          setStudentsMap(map);

          // if kelas list not provided by /kelas endpoint, use names from students
          if (!kres || !kres.ok) {
            const names = Array.from(kelasSet).sort();
            setKelasList(names.map((n, i) => ({ id: i + 1, nama_kelas: n })));
            if (!selectedKelasId && names.length > 0) setSelectedKelasId("1");
          }
        }

        // kelas from /kelas (preferred)
        if (kres && kres.ok) {
          const kjson: Kelas[] = await kres.json();
          setKelasList(kjson);
          if (!selectedKelasId && kjson.length > 0)
            setSelectedKelasId(String(kjson[0].id));
        }

        // jurusan
        if (jres && jres.ok) {
          const jjson: Jurusan[] = await jres.json();
          setJurusanList(jjson);
          if (!selectedJurusanId && jjson.length > 0)
            setSelectedJurusanId(String(jjson[0].id));
        }

        // mapel -> normalized shape
        if (mres && mres.ok) {
          const mjson = await mres.json();
          // if backend returns array of strings -> map to ids
          if (
            Array.isArray(mjson) &&
            mjson.length > 0 &&
            typeof mjson[0] === "string"
          ) {
            const mapped: Mapel[] = (mjson as string[]).map((name, idx) => ({
              id: idx + 1,
              kode_mapel: `MPL${String(idx + 1).padStart(2, "0")}`,
              nama_mapel: name,
            }));
            setMapelList(mapped);
            if (!selectedMapelId && mapped.length > 0)
              setSelectedMapelId(String(mapped[0].id));
          } else if (Array.isArray(mjson)) {
            const mapped: Mapel[] = (mjson as any[]).map((it) => ({
              id: it.id,
              kode_mapel: it.kode_mapel ?? it.kode ?? "",
              nama_mapel: it.nama_mapel ?? it.nama ?? String(it),
            }));
            setMapelList(mapped);
            if (!selectedMapelId && mapped.length > 0)
              setSelectedMapelId(String(mapped[0].id));
          }
        }
      } catch (err) {
        console.error("loadInitial error", err);
      } finally {
        setLoading(false);
      }
    };

    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==========================================
  // 2) Load tanggal merah (libur nasional)
  // ==========================================
  useEffect(() => {
    const loadHolidays = async () => {
      try {
        const res = await fetch(
          `https://dayoffapi.vercel.app/api?year=${tahun}`
        );
        if (!res.ok) return;
        const json = await res.json();
        const normalized = Array.isArray(json)
          ? json.map((it: any) => {
              const parts = (it.date || "").split("-");
              const y = parts[0] ?? "";
              const m = pad(Number(parts[1] ?? 0));
              const d = pad(Number(parts[2] ?? 0));
              return `${y}-${m}-${d}`;
            })
          : [];
        setTanggalMerah(normalized);
      } catch (err) {
        console.warn("Tidak dapat memuat tanggal merah", err);
      }
    };

    loadHolidays();
  }, [tahun]);

  // ==========================================
  // helper - days in month
  // ==========================================
  function daysInMonth(year: number, month: number) {
    return new Date(year, month, 0).getDate();
  }

  // ==========================================
  // 3) LOAD REKAP BULAN (pakai ids)
  // ==========================================
  const loadMonth = async () => {
    if (!selectedKelasId || !selectedJurusanId || !selectedMapelId) return;

    try {
      setLoading(true);
      const q =
        `kelas_id=${encodeURIComponent(selectedKelasId)}` +
        `&jurusan_id=${encodeURIComponent(selectedJurusanId)}` +
        `&mapel_id=${encodeURIComponent(selectedMapelId)}` +
        `&bulan=${bulan}&tahun=${tahun}`;

      const res = await fetch(
        `https://api.smkislampermatasari2.sch.id/rekap/month?${q}`
      );
      if (!res.ok) {
        console.warn(
          "rekap/month fetch failed",
          await res.text().catch(() => "(no body)")
        );
        setData(null);
        return;
      }

      const json = await res.json();
      // normalize: if backend returns days/year/month + students array
      if (!json || typeof json !== "object" || !Array.isArray(json.students)) {
        console.warn("Unexpected rekap/month shape:", json);
        setData(null);
        return;
      }

      // ensure days property exists, fallback with helper
      if (!json.days) {
        json.days = daysInMonth(
          Number(json.year || tahun),
          Number(json.month || bulan)
        );
      }

      setData(json as MonthResult);
    } catch (err) {
      console.error("loadMonth error", err);
      alert("Gagal memuat data rekap.");
    } finally {
      setLoading(false);
    }
  };

  // auto reload when filters change
  useEffect(() => {
    if (selectedKelasId && selectedJurusanId && selectedMapelId) {
      loadMonth();
    } else {
      setData(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKelasId, selectedJurusanId, selectedMapelId, bulan, tahun]);

  // ==========================================
  // 4) modal per siswa (multi-month)
  // ==========================================
  const openStudentModal = async (nis: string) => {
    setModalOpen(true);
    setModalNis(nis);

    try {
      const startMonth = bulan - 4 >= 1 ? bulan - 4 : 1;
      const start = `${tahun}-${pad(startMonth)}`;
      const end = `${tahun}-${pad(bulan)}`;
      const q = `nis=${encodeURIComponent(nis)}&start=${encodeURIComponent(
        start
      )}&end=${encodeURIComponent(end)}`;

      const res = await fetch(
        `https://api.smkislampermatasari2.sch.id/rekap/siswa?${q}`
      );
      if (!res.ok) {
        console.warn("rekap/siswa failed", res.status);
        setModalMonths([]);
        return;
      }
      const json = await res.json();
      const months = Array.isArray(json.months) ? json.months : [];
      setModalMonths(months);
    } catch (err) {
      console.error("openStudentModal error", err);
      setModalMonths([]);
    }
  };

  // ==========================================
  // helpers: isSunday / tanggalMerah / statusClass
  // ==========================================
  function isSunday(y: number, m: number, d: number) {
    return new Date(y, m - 1, d).getDay() === 0;
  }

  function isTanggalMerahFunc(y: number, m: number, d: number) {
    return tanggalMerah.includes(`${y}-${pad(m)}-${pad(d)}`);
  }

  const statusClass = (s?: string) => {
    if (!s) return "";
    if (s === "hadir") return "bg-green-600 text-white";
    if (s === "izin") return "bg-yellow-400 text-black";
    if (s === "sakit") return "bg-blue-600 text-white";
    if (s === "alfa") return "bg-red-600 text-white";
    if (s === "telat" || s === "terlambat") return "bg-purple-600 text-white";
    return "";
  };

  // ==========================================
  // 5) EXPORT XLSX / PDF (tidy)
  // ==========================================
  const exportExcel = () => {
    if (!data) return;
    const rows = data.students.map((s) => {
      const row: any = { NIS: s.nis, Nama: studentsMap[s.nis] || s.nis };
      for (let d = 1; d <= data.days; d++) {
        const date = `${data.year}-${pad(data.month)}-${pad(d)}`;
        row[`T${d}`] = s.statusByDate[date] || "";
      }
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), `rekap-${bulan}-${tahun}.xlsx`);
  };

  const exportPDF = () => {
    if (!data) return;
    const doc = new jsPDF({ orientation: "landscape" });
    const head = [
      [
        "No",
        "NIS",
        "Nama",
        ...Array.from({ length: data.days }, (_, i) => `${i + 1}`),
      ],
    ];
    const body = data.students.map((s, idx) => {
      const row: any[] = [String(idx + 1), s.nis, studentsMap[s.nis] || s.nis];
      for (let d = 1; d <= data.days; d++) {
        const date = `${data.year}-${pad(data.month)}-${pad(d)}`;
        row.push(s.statusByDate[date] || "");
      }
      return row;
    });

    autoTable(doc, { head, body, startY: 10, styles: { fontSize: 7 } });
    doc.save(`rekap-${bulan}-${tahun}.pdf`);
  };

  // ==========================================
  // UI (styling)
  // ==========================================
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-3">Rekap Absensi</h1>

      {/* FILTER */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <select
          className="p-2 cursor-pointer border rounded"
          value={selectedKelasId}
          onChange={(e) => setSelectedKelasId(e.target.value)}
        >
          {kelasList.map((k) => (
            <option key={k.id} value={k.id}>
              {k.nama_kelas}
            </option>
          ))}
        </select>

        <select
          className="p-2 cursor-pointer border rounded max-w-[200px]"
          value={selectedJurusanId}
          onChange={(e) => setSelectedJurusanId(e.target.value)}
        >
          {jurusanList.map((j) => (
            <option key={j.id} value={j.id}>
              {j.nama_jurusan}
            </option>
          ))}
        </select>

        <select
          className="p-2 cursor-pointer border rounded max-w-[200px]"
          value={selectedMapelId}
          onChange={(e) => setSelectedMapelId(e.target.value)}
        >
          {mapelList.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nama_mapel}
            </option>
          ))}
        </select>

        <select
          className="p-2 cursor-pointer border rounded"
          value={bulan}
          onChange={(e) => setBulan(Number(e.target.value))}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <option key={i + 1} value={i + 1}>
              {monthName(i + 1)}
            </option>
          ))}
        </select>

        <input
          type="number"
          className="p-2 cursor-pointer border rounded w-24"
          value={tahun}
          onChange={(e) => setTahun(Number(e.target.value))}
        />

        <button
          className="px-4 py-2 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white rounded"
          onClick={loadMonth}
        >
          Tampilkan
        </button>

        <div className="ml-auto flex gap-2">
          <button
            className="flex items-center px-2 py-2 gap-2 cursor-pointer bg-green-500 hover:bg-green-600 text-white rounded"
            onClick={exportExcel}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M14.3905 2.20247H9.3255V1.00897L1 2.29397V13.5575L9.3255 14.9915V13.2225H14.3905C14.544 13.2305 14.6943 13.1773 14.8086 13.0746C14.9229 12.9718 14.9917 12.8279 15 12.6745V2.74997C14.9916 2.59661 14.9227 2.45284 14.8085 2.3502C14.6942 2.24756 14.5439 2.19443 14.3905 2.20247ZM14.4705 12.7655H9.3085L9.3 11.821H10.5435V10.721H9.2905L9.2845 10.071H10.5435V8.97097H9.275L9.269 8.32097H10.5435V7.22097H9.265V6.57097H10.5435V5.47097H9.265V4.82097H10.5435V3.72097H9.265V2.72097H14.4705V12.7655Z"
                fill="#20744A"
              />
              <path
                d="M11.2432 3.71948H13.4047V4.81948H11.2432V3.71948ZM11.2432 5.46998H13.4047V6.56998H11.2432V5.46998ZM11.2432 7.22048H13.4047V8.32048H11.2432V7.22048ZM11.2432 8.97098H13.4047V10.071H11.2432V8.97098ZM11.2432 10.7215H13.4047V11.8215H11.2432V10.7215Z"
                fill="#20744A"
              />
              <path
                d="M3.17305 5.33652L4.24605 5.27502L4.92055 7.12952L5.71755 5.19852L6.79055 5.13702L5.48755 7.77002L6.79055 10.4095L5.65605 10.333L4.89005 8.32102L4.12355 10.2565L3.08105 10.1645L4.29205 7.83302L3.17305 5.33652Z"
                fill="white"
              />
            </svg>
            Export
          </button>

          <button
            className="flex items-center px-2 py-2 gap-2 cursor-pointer bg-red-600 hover:bg-red-700 text-white rounded"
            onClick={exportPDF}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12.05 1.03601L14.832 3.93601V14.964H4.43945V15H14.8675V3.97251L12.05 1.03601Z"
                fill="#909090"
              />
              <path
                d="M12.0158 1H4.4043V14.964H14.8323V3.9365L12.0158 1Z"
                fill="#F4F4F4"
              />
              <path
                d="M4.32781 1.75H1.13281V5.1635H11.1828V1.75H4.32781Z"
                fill="#7A7B7C"
              />
              <path
                d="M11.2358 5.10551H1.19727V1.68951H11.2358V5.10551Z"
                fill="#DD2025"
              />
              <path
                d="M4.52557 2.26702H3.87207V4.66702H4.38607V3.85752L4.49957 3.86402C4.60989 3.8625 4.7192 3.84273 4.82307 3.80552C4.91438 3.77452 4.9983 3.72498 5.06957 3.66002C5.14265 3.59874 5.20007 3.52092 5.23707 3.43302C5.28769 3.28738 5.30562 3.13237 5.28957 2.97902C5.28672 2.86945 5.26751 2.76091 5.23257 2.65702C5.20109 2.58193 5.15427 2.51423 5.09512 2.45827C5.03597 2.4023 4.96579 2.3593 4.88907 2.33202C4.82293 2.30752 4.75438 2.29009 4.68457 2.28002C4.63184 2.27143 4.5785 2.26709 4.52507 2.26702M4.43057 3.41402H4.38607V2.67402H4.48257C4.52516 2.67095 4.5679 2.67749 4.60762 2.69315C4.64734 2.70882 4.68304 2.73321 4.71207 2.76452C4.77223 2.84503 4.80437 2.94302 4.80357 3.04352C4.80357 3.16652 4.80357 3.27802 4.69257 3.35652C4.61262 3.40056 4.52159 3.42086 4.43057 3.41402ZM6.26607 2.26052C6.21057 2.26052 6.15657 2.26452 6.11857 2.26602L5.99957 2.26902H5.60957V4.66902H6.06857C6.24396 4.67353 6.41855 4.64381 6.58257 4.58152C6.71463 4.52937 6.83152 4.44497 6.92257 4.33602C7.01179 4.2266 7.07551 4.09866 7.10907 3.96152C7.14851 3.80648 7.16767 3.64699 7.16607 3.48702C7.17586 3.2981 7.16124 3.1087 7.12257 2.92352C7.08555 2.78737 7.01704 2.66182 6.92257 2.55702C6.84847 2.47228 6.75732 2.40412 6.65507 2.35702C6.56748 2.31642 6.47532 2.28654 6.38057 2.26802C6.34289 2.26184 6.30475 2.259 6.26657 2.25952M6.17557 4.22802H6.12557V2.69602H6.13207C6.23515 2.6841 6.33946 2.7027 6.43207 2.74952C6.4999 2.80368 6.55517 2.87192 6.59407 2.94952C6.63605 3.03119 6.66025 3.12082 6.66507 3.21252C6.66957 3.32252 6.66507 3.41252 6.66507 3.48702C6.66692 3.57284 6.6614 3.65865 6.64857 3.74352C6.63284 3.83055 6.60437 3.91479 6.56407 3.99352C6.51855 4.06694 6.45637 4.12861 6.38257 4.17352C6.32093 4.21352 6.24784 4.23215 6.17457 4.22652M8.71457 2.26902H7.49957V4.66902H8.01357V3.71702H8.66357V3.27102H8.01357V2.71502H8.71357V2.26902"
                fill="#464648"
              />
              <path
                d="M10.8903 10.1275C10.8903 10.1275 12.4843 9.83851 12.4843 10.383C12.4843 10.9275 11.4968 10.706 10.8903 10.1275ZM9.71185 10.169C9.45855 10.2248 9.21173 10.3068 8.97535 10.4135L9.17535 9.96351C9.37535 9.51351 9.58285 8.9 9.58285 8.9C9.82091 9.30207 10.0986 9.67928 10.4118 10.026C10.176 10.0611 9.94236 10.1092 9.71185 10.17V10.169ZM9.08085 6.91901C9.08085 6.44451 9.23435 6.31501 9.35385 6.31501C9.47335 6.31501 9.60785 6.37251 9.61235 6.78451C9.57336 7.19878 9.48661 7.60715 9.35385 8.00151C9.17136 7.67064 9.07717 7.29835 9.08035 6.9205L9.08085 6.91901ZM6.75635 12.177C6.26735 11.8845 7.78185 10.984 8.05635 10.955C8.05485 10.9555 7.26835 12.483 6.75635 12.177ZM12.9498 10.4475C12.9448 10.3975 12.8998 9.84401 11.9148 9.86751C11.5043 9.86031 11.0939 9.88925 10.6883 9.95401C10.2953 9.55837 9.95695 9.11191 9.68235 8.62651C9.85525 8.12615 9.96002 7.60481 9.99385 7.07651C9.97935 6.47651 9.83585 6.1325 9.37585 6.1375C8.91585 6.1425 8.84885 6.54501 8.90935 7.14401C8.96856 7.54654 9.08035 7.93956 9.24185 8.313C9.24185 8.313 9.02935 8.9745 8.74835 9.6325C8.46735 10.2905 8.27535 10.6355 8.27535 10.6355C7.78664 10.7944 7.32661 11.0307 6.91285 11.3355C6.50085 11.719 6.33335 12.0135 6.55035 12.308C6.73735 12.562 7.39185 12.6195 7.97685 11.853C8.28714 11.4567 8.57108 11.0405 8.82685 10.607C8.82685 10.607 9.71885 10.3625 9.99635 10.2955C10.2738 10.2285 10.6093 10.1755 10.6093 10.1755C10.6093 10.1755 11.4238 10.995 12.2093 10.966C12.9948 10.937 12.9568 10.4965 12.9518 10.4485"
                fill="#DD2025"
              />
              <path
                d="M11.9766 1.03851V3.97501H14.7931L11.9766 1.03851Z"
                fill="#909090"
              />
              <path d="M12.0156 1V3.9365H14.8321L12.0156 1Z" fill="#F4F4F4" />
              <path
                d="M4.48748 2.22851H3.83398V4.62851H4.34998V3.81951L4.46398 3.82601C4.57431 3.82449 4.68362 3.80472 4.78748 3.76751C4.8788 3.7365 4.96272 3.68697 5.03398 3.62201C5.10652 3.56056 5.16341 3.48276 5.19998 3.39501C5.25061 3.24936 5.26853 3.09436 5.25248 2.94101C5.24963 2.83143 5.23042 2.7229 5.19548 2.61901C5.164 2.54391 5.11719 2.47622 5.05804 2.42025C4.99889 2.36429 4.92871 2.32129 4.85198 2.29401C4.78554 2.26927 4.71665 2.25167 4.64648 2.24151C4.59375 2.23292 4.54041 2.22857 4.48698 2.22851M4.39248 3.37551H4.34798V2.63551H4.44498C4.48757 2.63244 4.53031 2.63897 4.57003 2.65464C4.60976 2.6703 4.64545 2.69469 4.67448 2.72601C4.73464 2.80652 4.76678 2.90451 4.76598 3.00501C4.76598 3.12801 4.76598 3.23951 4.65498 3.31801C4.57504 3.36204 4.484 3.38185 4.39298 3.37501M6.22798 2.22201C6.17248 2.22201 6.11848 2.22601 6.08048 2.22751L5.96298 2.23051H5.57298V4.63051H6.03198C6.20738 4.63502 6.38196 4.6053 6.54598 4.54301C6.67804 4.49086 6.79493 4.40645 6.88598 4.29751C6.97521 4.18808 7.03892 4.06015 7.07248 3.92301C7.11192 3.76797 7.13108 3.60847 7.12948 3.44851C7.13927 3.25959 7.12465 3.07019 7.08598 2.88501C7.04897 2.74885 6.98046 2.62331 6.88598 2.51851C6.81188 2.43376 6.72073 2.36561 6.61848 2.31851C6.5309 2.27791 6.43873 2.24802 6.34398 2.22951C6.30631 2.22333 6.26816 2.22049 6.22998 2.22101M6.13898 4.18951H6.08898V2.65751H6.09548C6.19857 2.64559 6.30288 2.66419 6.39548 2.71101C6.46332 2.76517 6.51859 2.83341 6.55748 2.91101C6.59946 2.99268 6.62366 3.08231 6.62848 3.17401C6.63298 3.28401 6.62848 3.37401 6.62848 3.44851C6.63033 3.53432 6.62481 3.62014 6.61198 3.70501C6.59625 3.79204 6.56778 3.87628 6.52748 3.95501C6.48196 4.02843 6.41978 4.09009 6.34598 4.13501C6.28434 4.17501 6.21125 4.19363 6.13798 4.18801M8.67648 2.23051H7.46148V4.63051H7.97548V3.67851H8.62548V3.23251H7.97548V2.67651H8.67548V2.23051"
                fill="white"
              />
            </svg>
            Export
          </button>

          <button
            className="flex items-center px-2 py-2 gap-2 cursor-pointer bg-gray-600 hover:bg-gray-800 text-white rounded"
            onClick={() => window.print()}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 7H6V3H18V7ZM18 12.5C18.2833 12.5 18.521 12.404 18.713 12.212C18.905 12.02 19.0007 11.7827 19 11.5C18.9993 11.2173 18.9033 10.98 18.712 10.788C18.5207 10.596 18.2833 10.5 18 10.5C17.7167 10.5 17.4793 10.596 17.288 10.788C17.0967 10.98 17.0007 11.2173 17 11.5C16.9993 11.7827 17.0953 12.0203 17.288 12.213C17.4807 12.4057 17.718 12.5013 18 12.5ZM16 19V15H8V19H16ZM18 21H6V17H2V11C2 10.15 2.29167 9.43767 2.875 8.863C3.45833 8.28833 4.16667 8.00067 5 8H19C19.85 8 20.5627 8.28767 21.138 8.863C21.7133 9.43833 22.0007 10.1507 22 11V17H18V21Z"
                fill="white"
              />
            </svg>
            Print
          </button>
        </div>
      </div>

      {/* TABLE */}
      {data ? (
        <div className="shadow-[0_0_2px_rgba(0,0,0,0.5)] overflow-auto rounded-sm w-full">
          <table className="print-area w-full m-3 border-collapse table-auto">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-1 border">No</th>
                <th className="p-1 border">NIS</th>
                <th className="p-1 border min-w-[300px] whitespace-nowrap">
                  Nama
                </th>

                {Array.from({ length: data.days }).map((_, i) => {
                  const d = i + 1;
                  return (
                    <th
                      key={i}
                      className={`p-1 border text-xs min-w-[25px] text-center ${
                        isSunday(data.year, data.month, d) ||
                        isTanggalMerahFunc(data.year, data.month, d)
                          ? "bg-red-200"
                          : ""
                      }`}
                    >
                      {d}
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="text-xs">
              {Array.isArray(data?.students) && data.students.length > 0 ? (
                data.students.map((s, idx) => (
                  <tr key={s.nis}>
                    <td className="p-1 border">{idx + 1}</td>
                    <td className="p-1 border">{s.nis}</td>
                    <td className="p-1 border">
                      <button
                        onClick={() => openStudentModal(s.nis)}
                        className="text-blue-600 cursor-pointer underline"
                      >
                        {studentsMap[s.nis] || s.nis}
                      </button>
                    </td>

                    {Array.from({ length: data.days }).map((_, i) => {
                      const d = i + 1;
                      const date = `${data.year}-${pad(data.month)}-${pad(d)}`;
                      const status = s.statusByDate[date];
                      const isHoliday =
                        isSunday(data.year, data.month, d) ||
                        isTanggalMerahFunc(data.year, data.month, d);

                      return (
                        <td
                          key={i}
                          className={`p-1 border text-center min-w-[25px] ${
                            isHoliday ? "bg-red-100" : ""
                          }`}
                        >
                          <div
                            className={`px-2 py-0.5 text-xs rounded ${statusClass(
                              status
                            )}`}
                          >
                            {status ? status.charAt(0).toUpperCase() : ""}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={data?.days ? data.days + 3 : 5}
                    className="p-3 text-center text-gray-600"
                  >
                    Tidak ada data absensi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-gray-600">Memuat...</div>
      )}

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start p-6 overflow-auto">
          <div className="bg-white p-6 rounded w-full max-w-4xl">
            <div className="flex justify-between mb-3">
              <h2 className="text-xl font-bold">
                Riwayat: {studentsMap[modalNis]}
              </h2>
              <button
                className="px-4 py-1 cursor-pointer bg-gray-300 rounded"
                onClick={() => setModalOpen(false)}
              >
                Tutup
              </button>
            </div>

            {modalMonths.map((m, i) => (
              <div key={i} className="mb-6 border rounded overflow-auto">
                <div className="p-2 bg-gray-100 font-semibold">
                  {monthName(m.month)} {m.year}
                </div>

                <table className="w-max border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 border">#</th>
                      <th className="p-2 border">Nama</th>
                      {Array.from({ length: m.days }).map((_, d) => (
                        <th key={d} className="p-1 border text-xs">
                          {d + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    <tr>
                      <td className="p-2 border">1</td>
                      <td className="p-2 border">{studentsMap[modalNis]}</td>
                      {Array.from({ length: m.days }).map((_, d) => {
                        const status = m.dayMap[d + 1];
                        return (
                          <td key={d} className="p-1 border text-center">
                            <div
                              className={`px-2 py-0.5 text-xs rounded ${statusClass(
                                status
                              )}`}
                            >
                              {status ? status.charAt(0).toUpperCase() : ""}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PRINT CSS (tetap sama) */}
      <style jsx global>
        {`
          table button.text-blue-600.underline,
          .print-area table button.text-blue-600.underline {
            color: inherit !important;
            text-decoration: none !important;
            box-shadow: none !important;
            cursor: pointer;
          }

          table button.text-blue-600.underline:hover,
          .print-area table button.text-blue-600.underline:hover {
            color: #1d4ed8 !important;
            font-weight: 600;
          }

          @page {
            size: landscape;
            margin: 10;
          }

          @media print {
            body * {
              visibility: hidden;
            }

            .print-area,
            .print-area * {
              visibility: visible;
            }

            .print-area table button.text-blue-600.underline {
              color: inherit !important;
              text-decoration: none !important;
            }

            .print-area {
              position: absolute !important;
              top: 10px !important;
              left: 10px !important;
              width: auto !important;
              overflow: visible !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .print-area table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
            }

            .print-area thead {
              display: table-header-group;
            }
            .print-area tfoot {
              display: table-footer-group;
            }

            tr,
            td,
            th {
              page-break-inside: avoid;
            }

            tbody {
              page-break-inside: auto;
            }

            button,
            select,
            input {
              display: none !important;
            }
            /* Override: tampilkan nama siswa (button) saat print */
            .print-area button {
              display: inline-block !important;
              visibility: visible !important;
              color: inherit !important;
              text-decoration: none !important;
              box-shadow: none !important;
            }
          }
        `}
      </style>
    </div>
  );
}
