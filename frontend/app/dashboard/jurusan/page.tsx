"use client";

import { useEffect, useState } from "react";
import { UserPlus, Edit2, Trash2, Search } from "lucide-react";

/* =======================
   TYPES
======================= */
type Jurusan = {
  id: number;
  kode_jurusan: string;
  nama_jurusan: string;
};

/* =======================
   COMPONENT
======================= */
export default function JurusanPage() {
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [jurusan, setJurusan] = useState<Jurusan[]>([]);
  const [search, setSearch] = useState("");

  // Modal
  const [openModal, setOpenModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  // Form (DIBIARKAN SAMA)
  const [kodeJurusan, setKodeJurusan] = useState("");
  const [namaJurusan, setNamaJurusan] = useState("");

  const [loading, setLoading] = useState(false);

  /* =======================
     HELPERS
  ======================= */
  const resetForm = () => {
    setKodeJurusan("");
    setNamaJurusan("");
  };

  /* =======================
     FETCH JURUSAN
  ======================= */
  const fetchJurusan = async () => {
    try {
      const res = await fetch(`${API}/jurusan`);
      if (!res.ok) throw new Error("Fetch failed");

      const data = (await res.json()) as Jurusan[];
      setJurusan(data);
    } catch (err) {
      console.error(err);
      alert("Gagal mengambil data jurusan");
    }
  };

  useEffect(() => {
    fetchJurusan();
  }, []);

  /* =======================
     FILTER
  ======================= */
  const filtered = jurusan.filter(
    (j) =>
      j.nama_jurusan.toLowerCase().includes(search.toLowerCase()) ||
      j.kode_jurusan.toLowerCase().includes(search.toLowerCase())
  );

  /* =======================
     MODAL HANDLERS
  ======================= */
  const openAddModal = () => {
    setIsEditing(false);
    setEditId(null);
    resetForm();
    setOpenModal(true);
  };

  const openEditModal = (j: Jurusan) => {
    setIsEditing(true);
    setEditId(j.id);
    setKodeJurusan(j.kode_jurusan);
    setNamaJurusan(j.nama_jurusan);
    setOpenModal(true);
  };

  /* =======================
     SUBMIT
  ======================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!kodeJurusan || !namaJurusan) {
      alert("Semua field wajib diisi");
      return;
    }

    const payload = {
      kode_jurusan: kodeJurusan,
      nama_jurusan: namaJurusan,
    };

    try {
      setLoading(true);

      const url = isEditing ? `${API}/jurusan/${editId}` : `${API}/jurusan`;

      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Submit failed");

      setOpenModal(false);
      fetchJurusan();
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     DELETE
  ======================= */
  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus jurusan?")) return;

    try {
      const res = await fetch(`${API}/jurusan/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Delete failed");

      fetchJurusan();
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus jurusan");
    }
  };

  // ======================
  // RENDER
  // ======================
  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <h1 className="text-2xl font-semibold">Input Jurusan</h1>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded gap-2 cursor-pointer w-full sm:w-auto"
        >
          <UserPlus className="w-5 h-5" />
          <span>Tambah Jurusan</span>
        </button>
      </div>

      {/* SEARCH */}
      <div className="flex border border-gray-400 rounded pl-2 pr-3 items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Cari jurusan..."
          className="w-full p-2 outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Search className="w-5 h-5 text-gray-600 shrink-0" />
      </div>

      {/* TABLE */}
      <div className="bg-white shadow-[0_0_2px_rgba(0,0,0,0.5)] rounded-sm overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse">
          <thead className="bg-blue-600 text-white text-sm uppercase">
            <tr>
              <th className="p-3 text-left font-semibold">Kode</th>
              <th className="p-3 text-left border-l border-gray-200 font-semibold">
                Nama Jurusan
              </th>
              <th className="p-3 text-center border-l border-gray-200 font-semibold w-[160px]">
                Aksi
              </th>
            </tr>
          </thead>

          <tbody className="text-sm divide-y divide-gray-200">
            {filtered.map((j) => (
              <tr
                key={j.id}
                className="odd:bg-white even:bg-gray-50 hover:bg-blue-100 transition-colors"
              >
                <td className="p-3">{j.kode_jurusan}</td>

                <td className="p-3 border-l border-gray-200">
                  {j.nama_jurusan}
                </td>

                <td className="p-2 border-l border-gray-200">
                  <div className="flex justify-center gap-2">
                    {/* EDIT */}
                    <button
                      onClick={() => openEditModal(j)}
                      className="
                      flex items-center gap-1
                      bg-yellow-400 hover:bg-yellow-500
                      text-white rounded
                      px-2 py-1
                      cursor-pointer text-xs
                    "
                    >
                      <Edit2 className="w-4 h-6" />
                      <span>Edit</span>
                    </button>

                    {/* HAPUS */}
                    <button
                      onClick={() => handleDelete(j.id)}
                      className="
                      flex items-center gap-1
                      bg-red-500 hover:bg-red-600
                      text-white rounded
                      px-2 py-1
                      cursor-pointer text-xs
                    "
                    >
                      <Trash2 className="w-4 h-6" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="p-4 text-center italic text-gray-500"
                >
                  Tidak ada data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {openModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold mb-4">
              {isEditing ? "Edit Jurusan" : "Tambah Jurusan"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Kode Jurusan (ex: TKR)"
                className="w-full p-2 border rounded"
                value={kodeJurusan}
                onChange={(e) => setKodeJurusan(e.target.value)}
              />

              <input
                type="text"
                placeholder="Nama Jurusan (ex: Teknik Kendaraan Ringan)"
                className="w-full p-2 border rounded"
                value={namaJurusan}
                onChange={(e) => setNamaJurusan(e.target.value)}
              />

              <div className="flex justify-end gap-2 pt-2">
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
                  {loading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
