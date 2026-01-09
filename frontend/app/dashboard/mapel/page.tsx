"use client";

import { useEffect, useState } from "react";
import { PlusCircle, Upload, Pencil, Trash2, Search } from "lucide-react";
import * as XLSX from "xlsx";

/* =======================
   TYPES
======================= */
type Mapel = {
  id: number;
  kode_mapel: string;
  nama_mapel: string;
};

type ExcelRow = {
  NAMA: string;
};

/* =======================
   COMPONENT
======================= */
export default function DataMapelPage() {
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [listMapel, setListMapel] = useState<Mapel[]>([]);
  const [search, setSearch] = useState("");

  // Form
  const [nama, setNama] = useState("");
  const [kode, setKode] = useState("");
  const [editId, setEditId] = useState<number | null>(null);

  // UI
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);

  /* =======================
     HELPERS
  ======================= */
  const resetForm = () => {
    setNama("");
    setKode("");
    setEditId(null);
  };

  /* =======================
     FETCH MAPEL
  ======================= */
  const fetchMapel = async () => {
    try {
      const res = await fetch(`${API}/mapel`);
      if (!res.ok) throw new Error("Fetch failed");

      const data = (await res.json()) as Mapel[];
      setListMapel(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      alert("Gagal memuat daftar mapel!");
      setListMapel([]);
    }
  };

  useEffect(() => {
    fetchMapel();
  }, []);

  /* =======================
     FILTER SEARCH
  ======================= */
  const filteredMapel = listMapel.filter(
    (m) =>
      m.nama_mapel.toLowerCase().includes(search.toLowerCase()) ||
      m.kode_mapel.toLowerCase().includes(search.toLowerCase())
  );

  /* =======================
     ADD MAPEL (AUTO KODE)
  ======================= */
  const openModalAdd = async () => {
    resetForm();

    try {
      const res = await fetch(`${API}/mapel/next-kode`);
      if (!res.ok) throw new Error();

      const data = await res.json();
      setKode(data.kode ?? "");
    } catch {
      alert("Gagal mendapatkan kode otomatis");
      setKode("");
    }

    setModal(true);
  };

  /* =======================
     EDIT MAPEL
  ======================= */
  const openModalEdit = (id: number) => {
    const m = listMapel.find((x) => x.id === id);
    if (!m) return;

    setEditId(id);
    setNama(m.nama_mapel);
    setKode(m.kode_mapel);
    setModal(true);
  };

  /* =======================
     IMPORT EXCEL
     (kolom: NAMA)
  ======================= */
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        if (!data) return;

        const workbook = XLSX.read(data, { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet);

        if (!rows.length || rows.some((r) => !r.NAMA)) {
          alert("Format Excel SALAH!\nGunakan minimal kolom: NAMA");
          return;
        }

        await Promise.all(
          rows.map((row) =>
            fetch(`${API}/mapel`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                nama_mapel: String(row.NAMA).trim(),
              }),
            })
          )
        );

        alert("Import selesai!");
        fetchMapel();
      } catch (err) {
        console.error(err);
        alert("Gagal memproses file Excel");
      }
    };

    reader.readAsBinaryString(file);
  };

  /* =======================
     SAVE MAPEL
  ======================= */
  const handleSave = async () => {
    if (!nama.trim()) {
      alert("Nama mapel wajib diisi!");
      return;
    }

    try {
      setLoading(true);

      const url = editId ? `${API}/mapel/${editId}` : `${API}/mapel`;

      const method = editId ? "PUT" : "POST";

      const body = editId
        ? { kode_mapel: kode, nama_mapel: nama }
        : { nama_mapel: nama };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error(
          editId ? "Gagal memperbarui mapel" : "Gagal menambah mapel"
        );
      }

      alert(
        editId ? "Mapel berhasil diperbarui" : "Mapel berhasil ditambahkan"
      );

      setModal(false);
      fetchMapel();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     DELETE MAPEL
  ======================= */
  const handleDelete = async (id: number) => {
    if (!confirm("Hapus mata pelajaran ini?")) return;

    try {
      const res = await fetch(`${API}/mapel/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      fetchMapel();
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus mapel");
    }
  };

  // ========================================
  // RENDER
  // ========================================
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Daftar Mata Pelajaran</h1>

      {/* ACTION BAR */}
      <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
        {/* LEFT ACTIONS */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
          <label
            htmlFor="file-upload"
            className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-green-700 w-full sm:w-auto"
          >
            <Upload className="w-5 h-5" />
            <span>Upload Mapel</span>
          </label>

          <input
            id="file-upload"
            type="file"
            accept=".xlsx, .xls"
            className="hidden"
            onChange={handleImportExcel}
          />

          <button
            onClick={openModalAdd}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer w-full sm:w-auto"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Tambah Mapel</span>
          </button>
        </div>

        {/* SEARCH */}
        <div className="flex items-center border rounded px-2 w-full sm:w-64">
          <Search className="w-5 h-5 text-gray-500 shrink-0" />
          <input
            type="text"
            placeholder="Cari mapel..."
            className="p-2 outline-none w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white shadow-[0_0_2px_rgba(0,0,0,0.5)] rounded-sm overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm border-collapse">
          <thead className="bg-blue-600 text-white uppercase text-xs">
            <tr>
              <th className="p-3 text-left w-12">No</th>
              <th className="p-3 text-left border-l border-gray-200 w-32">
                Kode
              </th>
              <th className="p-3 text-left border-l border-gray-200">
                Nama Mata Pelajaran
              </th>
              <th className="p-3 text-center border-l border-gray-200 w-28">
                Aksi
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {filteredMapel.map((m, i) => (
              <tr
                key={m.id}
                className="odd:bg-white even:bg-gray-50 hover:bg-blue-100 transition-colors"
              >
                <td className="p-3">{i + 1}</td>
                <td className="p-3 border-l border-gray-200">{m.kode_mapel}</td>
                <td className="p-3 border-l border-gray-200">{m.nama_mapel}</td>

                <td className="p-2 border-l border-gray-200">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => openModalEdit(m.id)}
                      className="p-2 bg-yellow-400 hover:bg-yellow-500 text-white rounded cursor-pointer"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(m.id)}
                      className="p-2 bg-red-500 hover:bg-red-600 text-white rounded cursor-pointer"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredMapel.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="p-4 text-center text-gray-500 italic"
                >
                  Tidak ada data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded shadow w-full max-w-md space-y-3">
            <h2 className="text-xl font-bold">
              {editId ? "Edit Mapel" : "Tambah Mapel"}
            </h2>

            <input
              type="text"
              placeholder="Kode mapel"
              className="w-full p-2 border rounded bg-gray-100"
              value={kode}
              readOnly
            />

            <input
              type="text"
              placeholder="Nama mapel"
              className="w-full p-2 border rounded"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                className="px-4 py-2 bg-gray-300 cursor-pointer rounded"
                onClick={() => setModal(false)}
              >
                Batal
              </button>

              <button
                className="px-4 py-2 bg-blue-600 cursor-pointer text-white rounded"
                onClick={handleSave}
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
