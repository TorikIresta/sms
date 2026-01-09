"use client";

import { useEffect, useState } from "react";
import { UserPlus, Search, Edit2, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";

// =======================
// TYPES
// =======================
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
type Jurusan = {
  id: number;
  nama_jurusan: string;
  kode_jurusan: string;
};

type FormState = {
  nis: string;
  nama: string;
  jk: "L" | "P";
  kelasId: string;
  jurusanId: string;
};

type ExcelRow = {
  NIS: string;
  NAMA: string;
  JK: "L" | "P";
  KELAS: string;
  JURUSAN: string;
};

// =======================
// COMPONENT
// =======================
export default function DataSiswaPage() {
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [students, setStudents] = useState<Siswa[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [jurusanList, setJurusanList] = useState<Jurusan[]>([]);
  const [search, setSearch] = useState("");

  // Modal
  const [openModal, setOpenModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form (REFactor TANPA ubah UI)
  const [form, setForm] = useState<FormState>({
    nis: "",
    nama: "",
    jk: "L",
    kelasId: "",
    jurusanId: "",
  });

  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // =======================
  // HELPERS
  // =======================
  const resetForm = () => {
    setForm({
      nis: "",
      nama: "",
      jk: "L",
      kelasId: "",
      jurusanId: "",
    });
  };

  // =======================
  //   FETCH DATA
  // =======================
  const fetchAll = async () => {
    try {
      setLoading(true);

      const [res1, res2, res3] = await Promise.all([
        fetch(`${API}/students`),
        fetch(`${API}/kelas`),
        fetch(`${API}/jurusan`),
      ]);

      setStudents(await res1.json());
      setKelasList(await res2.json());
      setJurusanList(await res3.json());
      setCurrentPage(1);
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

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // =======================
  //  IMPORT EXCEL
  // =======================
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!kelasList.length || !jurusanList.length) {
      alert(
        "Data kelas dan jurusan belum siap. Tolong tunggu sebentar lalu upload ulang."
      );
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      if (!bstr) return;

      const workbook = XLSX.read(bstr, { type: "binary" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);

      const mapped = jsonData
        .map((row) => {
          if (!row.NIS || !row.NAMA || !row.JK) return null;

          const kelas = kelasList.find(
            (k) =>
              k.nama_kelas.trim().toLowerCase() ===
              row.KELAS.trim().toLowerCase()
          );

          const jurusan = jurusanList.find(
            (j) =>
              j.nama_jurusan.trim().toLowerCase() ===
              row.JURUSAN.trim().toLowerCase()
          );

          if (!kelas || !jurusan) return null;

          return {
            nis: row.NIS,
            nama: row.NAMA,
            jk: row.JK,
            kelas_id: kelas.id,
            jurusan_id: jurusan.id,
          };
        })
        .filter(Boolean);

      await Promise.all(
        mapped.map((item) =>
          fetch(`${API}/students`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item),
          })
        )
      );

      alert("Import Excel Berhasil!");
      fetchAll();
    };

    reader.readAsBinaryString(file);
  };

  // =======================
  // MODAL
  // =======================
  const openAddModal = () => {
    setIsEditing(false);
    setEditingId(null);
    resetForm();
    setOpenModal(true);
  };

  const openEditModal = (s: Siswa) => {
    setIsEditing(true);
    setEditingId(s.id);
    setForm({
      nis: s.nis,
      nama: s.nama,
      jk: s.jk,
      kelasId: String(s.kelas_id),
      jurusanId: String(s.jurusan_id),
    });
    setOpenModal(true);
  };

  // =======================
  // SUBMIT
  // =======================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nis || !form.nama || !form.kelasId || !form.jurusanId) {
      alert("Semua field wajib diisi");
      return;
    }

    const payload = {
      nis: form.nis,
      nama: form.nama,
      jk: form.jk,
      kelas_id: Number(form.kelasId),
      jurusan_id: Number(form.jurusanId),
    };

    try {
      setLoading(true);

      await fetch(
        isEditing ? `${API}/students/${editingId}` : `${API}/students`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

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

  // =======================
  // DELETE
  // =======================
  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus?")) return;
    await fetch(`${API}/students/${id}`, {
      method: "DELETE",
    });
    fetchAll();
  };

  // =======================
  // FILTER & PAGINATION
  // =======================
  const filtered = students.filter(
    (s) =>
      s.nama.toLowerCase().includes(search.toLowerCase()) ||
      s.nis.includes(search)
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getPages = () => {
    const pages: (number | "...")[] = [];
    const jump = 5;

    if (totalPages <= 1) return [1];

    pages.push(1);

    if (currentPage > jump + 2) pages.push("...");

    const start = Math.max(2, currentPage - 2);
    const end = Math.min(totalPages - 1, currentPage + 2);

    for (let i = start; i <= end; i++) pages.push(i);

    if (currentPage < totalPages - (jump + 1)) pages.push("...");

    pages.push(totalPages);

    return pages;
  };

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="p-4 pt-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-3">
        <h1 className="text-2xl font-semibold text-center sm:text-left">
          Input Data Siswa
        </h1>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <label
            htmlFor="file-upload"
            className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded cursor-pointer w-full sm:w-auto"
          >
            {/* SVG */}
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
            className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded cursor-pointer w-full sm:w-auto"
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
        <Search className="w-5 h-5 text-gray-600 shrink-0" />
      </div>

      {/* TABLE */}
      <div className="bg-white shadow-[0_0_2px_rgba(0,0,0,0.5)] rounded-sm overflow-auto">
        <table className="w-full min-w-[600px] border-collapse">
          <thead className="bg-blue-600 text-white">
            <tr className="text-sm uppercase tracking-wide">
              <th className="p-3 text-left font-semibold">NIS</th>
              <th className="p-3 text-left font-semibold">Nama</th>
              <th className="p-3 text-left font-semibold">JK</th>
              <th className="p-3 text-left font-semibold">Kelas</th>
              <th className="p-3 text-left font-semibold">Jurusan</th>
              <th className="p-3 text-center font-semibold">Aksi</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 text-sm">
            {paginated.map((s) => (
              <tr
                key={s.id}
                className="odd:bg-white even:bg-gray-50 hover:bg-blue-100 transition-colors"
              >
                <td className="px-3 py-2 whitespace-nowrap">{s.nis}</td>

                <td className="px-3 py-2 font-medium text-gray-800">
                  {s.nama}
                </td>

                <td className="px-3 py-2">{s.jk}</td>

                <td className="px-3 py-2">{s.nama_kelas}</td>

                <td className="px-3 py-2">{s.nama_jurusan}</td>

                <td className="px-3 py-2">
                  <div className="flex justify-center gap-2">
                    {/* EDIT */}
                    <button
                      onClick={() => openEditModal(s)}
                      className="w-9 h-9 sm:w-auto sm:h-auto px-0 sm:px-3 py-0 sm:py-1
                 bg-yellow-400 hover:bg-yellow-500 text-white rounded
                 flex items-center justify-center gap-1 cursor-pointer text-xs"
                      aria-label="Edit"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-6" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>

                    {/* HAPUS */}
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="w-9 h-9 sm:w-auto sm:h-auto px-0 sm:px-3 py-0 sm:py-1
                 bg-red-500 hover:bg-red-600 text-white rounded
                 flex items-center justify-center gap-1 cursor-pointer text-xs"
                      aria-label="Hapus"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-6" />
                      <span className="hidden sm:inline">Hapus</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">
                  {loading ? "Memuat..." : "Tidak ada data"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 gap-3">
        <div className="text-sm text-gray-600 text-center sm:text-left">
          Halaman {currentPage} dari {totalPages}
        </div>

        <div className="flex flex-wrap justify-center sm:justify-end gap-1">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1 border rounded cursor-pointer hover:bg-gray-100 disabled:opacity-50"
          >
            Prev
          </button>

          {getPages().map((p, i) =>
            p === "..." ? (
              <span key={i} className="px-3 py-1 text-gray-400">
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`px-3 py-1 border cursor-pointer rounded ${
                  p === currentPage
                    ? "bg-blue-600 text-white"
                    : "bg-white hover:bg-gray-100"
                }`}
              >
                {p}
              </button>
            )
          )}

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1 border rounded cursor-pointer hover:bg-gray-100 disabled:opacity-50"
          >
            Next
          </button>
        </div>
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
                value={form.nis}
                onChange={(e) => setForm({ ...form, nis: e.target.value })}
              />

              <input
                className="w-full p-2 border rounded"
                placeholder="Nama"
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
              />

              <select
                className="w-full p-2 border rounded"
                value={form.jk}
                onChange={(e) =>
                  setForm({
                    ...form,
                    jk: e.target.value as "L" | "P",
                  })
                }
              >
                <option value="L">Laki-Laki</option>
                <option value="P">Perempuan</option>
              </select>

              <select
                className="w-full p-2 border rounded"
                value={form.kelasId}
                onChange={(e) => setForm({ ...form, kelasId: e.target.value })}
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
                value={form.jurusanId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    jurusanId: e.target.value,
                  })
                }
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
