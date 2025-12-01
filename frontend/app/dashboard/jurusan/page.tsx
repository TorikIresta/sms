"use client";

import { useEffect, useState } from "react";
import { UserPlus, Edit2, Trash2, Search } from "lucide-react";

type Jurusan = {
  id: number;
  kode_jurusan: string;
  nama_jurusan: string;
};

export default function JurusanPage() {
  const [jurusan, setJurusan] = useState<Jurusan[]>([]);
  const [search, setSearch] = useState("");

  // Modal
  const [openModal, setOpenModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  // Form
  const [kodeJurusan, setKodeJurusan] = useState("");
  const [namaJurusan, setNamaJurusan] = useState("");

  const [loading, setLoading] = useState(false);

  // ======================
  // Fetch Jurusan
  // ======================
  const fetchJurusan = async () => {
    try {
      const res = await fetch(
        "https://api.smkislampermatasari2.sch.id/jurusan"
      );
      const data = await res.json();
      setJurusan(data);
    } catch (err) {
      alert("Gagal mengambil data jurusan");
    }
  };

  useEffect(() => {
    fetchJurusan();
  }, []);

  const filtered = jurusan.filter(
    (j) =>
      j.nama_jurusan.toLowerCase().includes(search.toLowerCase()) ||
      j.kode_jurusan.toLowerCase().includes(search.toLowerCase())
  );

  // ======================
  // Open tambah modal
  // ======================
  const openAddModal = () => {
    setIsEditing(false);
    setEditId(null);
    setKodeJurusan("");
    setNamaJurusan("");
    setOpenModal(true);
  };

  // ======================
  // Open edit modal
  // ======================
  const openEditModal = (j: Jurusan) => {
    setIsEditing(true);
    setEditId(j.id);
    setKodeJurusan(j.kode_jurusan);
    setNamaJurusan(j.nama_jurusan);
    setOpenModal(true);
  };

  // ======================
  // Simpan
  // ======================
  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!kodeJurusan || !namaJurusan) {
      alert("Semua field wajib diisi");
      return;
    }

    const payload = {
      kode_jurusan: kodeJurusan,
      nama_jurusan: namaJurusan,
    };

    setLoading(true);

    const url = isEditing
      ? `https://api.smkislampermatasari2.sch.id/jurusan/${editId}`
      : "https://api.smkislampermatasari2.sch.id/jurusan";

    const method = isEditing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);
    setOpenModal(false);

    if (!res.ok) {
      alert("Terjadi kesalahan");
      return;
    }

    fetchJurusan();
  };

  // ======================
  // Hapus
  // ======================
  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus jurusan?")) return;

    await fetch(`https://api.smkislampermatasari2.sch.id/jurusan/${id}`, {
      method: "DELETE",
    });

    fetchJurusan();
  };

  // ======================
  // RENDER
  // ======================
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-semibold">Input Jurusan</h1>

        <button
          onClick={openAddModal}
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded gap-2 cursor-pointer"
        >
          <UserPlus className="w-5 h-5" /> Tambah Jurusan
        </button>
      </div>

      {/* SEARCH */}
      <div className="flex border border-gray-400 rounded pl-2 pr-3 items-center space-x-2 mb-4">
        <input
          type="text"
          placeholder="Cari jurusan..."
          className="w-full p-2 outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Search className="w-5 h-5 text-gray-600" />
      </div>

      {/* TABEL */}
      <div className="bg-white shadow-[0_0_2px_rgba(0,0,0,0.5)] rounded-sm overflow-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-blue-600 border-b border-gray-300 text-white">
            <tr>
              <th className="p-2 p-2 pl-3 text-left">Kode</th>
              <th className="p-2 pl-3 border-l border-gray-200 text-left">
                Nama Jurusan
              </th>
              <th className="p-2 pl-3 border-l border-gray-200 text-center">
                Aksi
              </th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((j) => (
              <tr
                key={j.id}
                className="odd:bg-white border-b border-gray-300 even:bg-gray-100 hover:bg-blue-200"
              >
                <td className="p-1 pl-3">{j.kode_jurusan}</td>
                <td className="p-1 pl-3 border-l border-gray-200">
                  {j.nama_jurusan}
                </td>

                <td className="p-1 pl-3 border-l border-gray-200 text-center">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => openEditModal(j)}
                      className="px-2 py-1 bg-yellow-400 text-white rounded flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" /> Edit
                    </button>

                    <button
                      onClick={() => handleDelete(j.id)}
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
                <td colSpan={3} className="p-4 text-center italic">
                  Tidak ada data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {openModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
