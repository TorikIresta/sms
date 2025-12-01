"use client";

import { useEffect, useState } from "react";
import { Upload, UserPlus, Search, Edit2, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";

type Siswa = {
  id: number;
  nis: string;
  nama: string;
  jk: "L" | "P";
  kelas_id: number;
  jurusan_id: number;
  nama_kelas?: string;
  nama_jurusan?: string;
};

type Kelas = { id: number; nama_kelas: string };
type Jurusan = { id: number; nama_jurusan: string; kode_jurusan: string };

export default function DataSiswaPage() {
  const [students, setStudents] = useState<Siswa[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [jurusanList, setJurusanList] = useState<Jurusan[]>([]);
  const [search, setSearch] = useState("");

  // Modal
  const [openModal, setOpenModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form fields
  const [nis, setNis] = useState("");
  const [nama, setNama] = useState("");
  const [jk, setJk] = useState("L");
  const [kelasId, setKelasId] = useState("");
  const [jurusanId, setJurusanId] = useState("");

  const [loading, setLoading] = useState(false);

  // ==========================================
  // FETCH DATA
  // ==========================================
  const fetchAll = async () => {
    try {
      setLoading(true);

      const [res1, res2, res3] = await Promise.all([
        fetch("https://api.smkislampermatasari2.sch.id/students"),
        fetch("https://api.smkislampermatasari2.sch.id/kelas"),
        fetch("https://api.smkislampermatasari2.sch.id/jurusan"),
      ]);

      const students = await res1.json();
      const kelas = await res2.json();
      const jurusan = await res3.json();

      setStudents(students);
      setKelasList(kelas);
      setJurusanList(jurusan);
    } catch (err) {
      console.error(err);
      alert("Gagal memuat data. Pastikan backend berjalan!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // ==========================================
  // IMPORT EXCEL
  // ==========================================
  const handleImportExcel = (e: any) => {
    if (kelasList.length === 0 || jurusanList.length === 0) {
      alert(
        "Data kelas dan jurusan belum siap. Tolong tunggu sebentar lalu upload ulang."
      );
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (evt: any) => {
      const bstr = evt.target.result;
      const workbook = XLSX.read(bstr, { type: "binary" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

      const mapped = [];

      for (const row of jsonData) {
        if (!row.NIS || !row.NAMA || !row.JK) continue;

        const kelas = kelasList.find(
          (k) =>
            k.nama_kelas.trim().toLowerCase() ===
            String(row.KELAS).trim().toLowerCase()
        );

        const jurusan = jurusanList.find(
          (j) =>
            j.nama_jurusan.trim().toLowerCase() ===
            String(row.JURUSAN).trim().toLowerCase()
        );

        if (!kelas || !jurusan) {
          alert("Kelas atau jurusan tidak ditemukan di database!");
          console.log("Excel:", row.KELAS, row.JURUSAN);
          console.log("DB kelas:", kelasList);
          console.log("DB jurusan:", jurusanList);
          return;
        }

        mapped.push({
          nis: String(row.NIS),
          nama: String(row.NAMA),
          jk: row.JK === "L" ? "L" : "P",
          kelas_id: kelas.id,
          jurusan_id: jurusan.id,
        });
      }

      for (const item of mapped) {
        await fetch("https://api.smkislampermatasari2.sch.id/students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
      }

      alert("Import Excel Berhasil!");
      fetchAll();
    };

    reader.readAsBinaryString(file);
  };

  // ==========================================
  // OPEN MODAL TAMBAH
  // ==========================================
  const openAddModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setNama("");
    setNis("");
    setJk("L");
    setKelasId("");
    setJurusanId("");
    setOpenModal(true);
  };

  // ==========================================
  // OPEN MODAL EDIT
  // ==========================================
  const openEditModal = (s: Siswa) => {
    setIsEditing(true);
    setEditingId(s.id);
    setNama(s.nama);
    setNis(s.nis);
    setJk(s.jk);
    setKelasId(String(s.kelas_id));
    setJurusanId(String(s.jurusan_id));
    setOpenModal(true);
  };

  // ==========================================
  // SIMPAN TAMBAH / EDIT
  // ==========================================
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!nis || !nama || !kelasId || !jurusanId) {
      alert("Semua field wajib diisi");
      return;
    }

    const payload = {
      nis,
      nama,
      jk,
      kelas_id: Number(kelasId),
      jurusan_id: Number(jurusanId),
    };

    try {
      setLoading(true);

      const url = isEditing
        ? `https://api.smkislampermatasari2.sch.id/students/${editingId}`
        : "https://api.smkislampermatasari2.sch.id/students";

      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        alert("Gagal menyimpan data!");
        return;
      }

      alert(isEditing ? "Berhasil diperbarui" : "Berhasil ditambahkan");
      setOpenModal(false);
      fetchAll();
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan!");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // DELETE
  // ==========================================
  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus?")) return;

    await fetch(`https://api.smkislampermatasari2.sch.id/students/${id}`, {
      method: "DELETE",
    });

    fetchAll();
  };

  // ==========================================
  // FILTER SEARCH
  // ==========================================
  const filtered = students.filter(
    (s) =>
      s.nama.toLowerCase().includes(search.toLowerCase()) ||
      s.nis.includes(search)
  );

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="p-4 pt-3">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-semibold">Input Data Siswa</h1>

        <div className="flex items-center space-x-2">
          <label
            htmlFor="file-upload"
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded cursor-pointer"
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
            <span>Import</span>
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".xlsx, .xls"
            className="hidden"
            onChange={handleImportExcel}
          />

          <button
            onClick={openAddModal}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded cursor-pointer"
          >
            <UserPlus className="w-5 h-5" /> <span>Tambah</span>
          </button>
        </div>
      </div>

      {/* SEARCH */}
      <div className="flex border border-gray-400 rounded pl-2 pr-3 items-center space-x-2 mb-4">
        <input
          type="text"
          placeholder="Cari nama atau NIS..."
          className="w-full p-2 outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Search className="w-5 h-5 text-gray-600" />
      </div>

      {/* TABLE */}
      <div className="bg-white shadow-[0_0_2px_rgba(0,0,0,0.5)] rounded-sm overflow-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-blue-600 border-b border-gray-300 text-white">
            <tr>
              <th className="p-2 text-left">NIS</th>
              <th className="p-2 text-left border-l border-gray-200">Nama</th>
              <th className="p-2 text-left border-l border-gray-200">JK</th>
              <th className="p-2 text-left border-l border-gray-200">Kelas</th>
              <th className="p-2 text-left border-l border-gray-200">
                Jurusan
              </th>
              <th className="p-2 text-center border-l border-gray-200">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((s) => (
              <tr
                key={s.id}
                className="odd:bg-white border-b border-gray-300 even:bg-gray-100 hover:bg-blue-200"
              >
                <td className="p-1 pl-2">{s.nis}</td>
                <td className="p-1 pl-2 border-l border-gray-200">{s.nama}</td>
                <td className="p-1 pl-2 border-l border-gray-200">{s.jk}</td>
                <td className="p-1 pl-2 border-l border-gray-200">
                  {s.nama_kelas}
                </td>
                <td className="p-1 pl-2 border-l border-gray-200">
                  {s.nama_jurusan}
                </td>

                <td className="p-1 text-center border-l border-gray-200">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => openEditModal(s)}
                      className="px-2 py-1 bg-yellow-400 text-white rounded flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" /> Edit
                    </button>

                    <button
                      onClick={() => handleDelete(s.id)}
                      className="px-2 py-1 bg-red-500 text-white rounded flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" /> Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td className="p-4 text-center" colSpan={6}>
                  {loading ? "Memuat..." : "Tidak ada data"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {openModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {isEditing ? "Edit Siswa" : "Tambah Siswa"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                className="w-full p-2 border rounded"
                placeholder="NIS"
                value={nis}
                onChange={(e) => setNis(e.target.value)}
              />

              <input
                className="w-full p-2 border rounded"
                placeholder="Nama"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
              />

              <select
                className="w-full p-2 border rounded"
                value={jk}
                onChange={(e) => setJk(e.target.value)}
              >
                <option value="L">Laki-Laki</option>
                <option value="P">Perempuan</option>
              </select>

              <select
                className="w-full p-2 border rounded"
                value={kelasId}
                onChange={(e) => setKelasId(e.target.value)}
              >
                <option value="">-- Pilih Kelas --</option>
                {kelasList.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama_kelas}
                  </option>
                ))}
              </select>

              <select
                className="w-full p-2 border rounded"
                value={jurusanId}
                onChange={(e) => setJurusanId(e.target.value)}
              >
                <option value="">-- Pilih Jurusan --</option>
                {jurusanList.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.nama_jurusan}
                  </option>
                ))}
              </select>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-300 rounded cursor-pointer"
                  onClick={() => setOpenModal(false)}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded cursor-pointer"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
