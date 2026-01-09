"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";

/* =======================
   TYPES
======================= */
type Kelas = {
  id: number;
  nama_kelas: string;
};

/* =======================
   COMPONENT
======================= */
export default function KelasPage() {
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal
  const [openModal, setOpenModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form
  const [namaKelas, setNamaKelas] = useState("");

  /* =======================
     HELPERS
  ======================= */
  const resetForm = () => {
    setNamaKelas("");
    setIsEditing(false);
    setEditingId(null);
  };

  /* =======================
     FETCH DATA
  ======================= */
  const fetchKelas = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API}/kelas`);
      if (!res.ok) throw new Error("Fetch failed");

      const data = await res.json();
      if (!Array.isArray(data)) {
        console.error("Invalid kelas data:", data);
        setKelasList([]);
        return;
      }

      setKelasList(data);
    } catch (err) {
      console.error(err);
      alert("Gagal mengambil data kelas!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKelas();
  }, []);

  /* =======================
     MODAL HANDLERS
  ======================= */
  const openAddModal = () => {
    resetForm();
    setOpenModal(true);
  };

  const openEditModal = (kelas: Kelas) => {
    setNamaKelas(kelas.nama_kelas);
    setEditingId(kelas.id);
    setIsEditing(true);
    setOpenModal(true);
  };

  /* =======================
     SUBMIT (ADD / EDIT)
  ======================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!namaKelas.trim()) {
      alert("Nama kelas wajib diisi");
      return;
    }

    try {
      setLoading(true);

      const url =
        isEditing && editingId ? `${API}/kelas/${editingId}` : `${API}/kelas`;

      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama_kelas: namaKelas }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        alert("Gagal menyimpan data");
        return;
      }

      if (isEditing && editingId) {
        // UPDATE LOCAL STATE
        setKelasList((prev) =>
          prev.map((k) =>
            k.id === editingId ? { ...k, nama_kelas: namaKelas } : k
          )
        );
        alert("Kelas berhasil diperbarui");
      } else if (data?.id) {
        // ADD LOCAL STATE
        setKelasList((prev) => [
          ...prev,
          { id: data.id, nama_kelas: data.nama_kelas },
        ]);
        alert("Kelas berhasil ditambahkan");
      }

      setOpenModal(false);
      resetForm();
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
    if (!confirm("Yakin ingin menghapus kelas?")) return;

    try {
      setLoading(true);

      const res = await fetch(`${API}/kelas/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Delete failed");

      setKelasList((prev) => prev.filter((k) => k.id !== id));
      alert("Kelas berhasil dihapus");
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus kelas");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------
  // RENDER
  // -------------------------------------------------------
  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Input Kelas</h1>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Tambah Kelas
        </button>
      </div>

      {/* Table */}
      <div className="bg-white shadow-[0_0_2px_rgba(0,0,0,0.5)] rounded-sm overflow-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-blue-600 border-b border-gray-300 text-white">
            <tr>
              <th className="p-2 pl-3 text-center">Nama Kelas</th>
              <th className="p-2 pl-3 text-center border-l border-gray-200">
                Aksi
              </th>
            </tr>
          </thead>

          <tbody>
            {kelasList.map((k) => (
              <tr
                key={k.id}
                className="odd:bg-white border-b border-gray-300 even:bg-gray-100 hover:bg-blue-200"
              >
                <td className="p-2 text-center">{k?.nama_kelas || "-"}</td>

                <td className="p-1 pl-3 border-l border-gray-200">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => openEditModal(k)}
                      className="bg-yellow-500 text-white px-2 py-1 rounded flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" /> Edit
                    </button>

                    <button
                      onClick={() => handleDelete(k.id)}
                      className="bg-red-500 text-white px-2 py-1 rounded flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" /> Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {kelasList.length === 0 && (
              <tr>
                <td className="p-4 text-center" colSpan={2}>
                  {loading ? "Memuat..." : "Belum ada data kelas"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {openModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold mb-4">
              {isEditing ? "Edit Kelas" : "Tambah Kelas"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                value={namaKelas}
                onChange={(e) => setNamaKelas(e.target.value)}
                placeholder="Nama Kelas"
                className="w-full p-2 border rounded"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpenModal(false)}
                  className="px-3 py-2 bg-gray-300 rounded cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="px-3 py-2 bg-blue-600 text-white rounded cursor-pointer"
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
