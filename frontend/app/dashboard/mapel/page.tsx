"use client";

import { useEffect, useState } from "react";
import { PlusCircle, Upload, Pencil, Trash2, Search } from "lucide-react";
import * as XLSX from "xlsx";

type Mapel = { id: number; kode_mapel: string; nama_mapel: string };

export default function DataMapelPage() {
  const [listMapel, setListMapel] = useState<Mapel[]>([]);
  const [search, setSearch] = useState("");

  const [nama, setNama] = useState("");
  const [kode, setKode] = useState("");
  const [editId, setEditId] = useState<number | null>(null);

  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // ========================================
  // FETCH MAPEL
  // ========================================
  const fetchMapel = async () => {
    try {
      const res = await fetch("https://api.smkislampermatasari2.sch.id/mapel");
      const data = await res.json();
      setListMapel(data);
    } catch (err) {
      console.error(err);
      alert("Gagal memuat daftar mapel!");
    }
  };

  useEffect(() => {
    fetchMapel();
  }, []);

  // Filter pencarian
  const filteredMapel = listMapel.filter(
    (m) =>
      m.nama_mapel.toLowerCase().includes(search.toLowerCase()) ||
      m.kode_mapel.toLowerCase().includes(search.toLowerCase())
  );

  // ========================================
  // TAMBAH MAPEL (ambil kode otomatis)
  // ========================================
  const openModalAdd = async () => {
    setNama("");
    setEditId(null);

    try {
      const res = await fetch(
        "https://api.smkislampermatasari2.sch.id/mapel/next-kode"
      );
      const data = await res.json();
      setKode(data.kode);
    } catch {
      alert("Gagal mendapatkan kode otomatis");
      setKode("");
    }

    setModal(true);
  };

  // ========================================
  // EDIT MAPEL
  // ========================================
  const openModalEdit = (id: number) => {
    const m = listMapel.find((x) => x.id === id);
    if (!m) return;

    setEditId(id);
    setNama(m.nama_mapel);
    setKode(m.kode_mapel);
    setModal(true);
  };

  // ========================================
  // IMPORT EXCEL (hanya kolom NAMA)
  // ========================================
  const handleImportExcel = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (evt: any) => {
      try {
        const workbook = XLSX.read(evt.target.result, { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet);

        const valid = rows.every((r) => r.NAMA);

        if (!valid) {
          return alert("Format Excel SALAH!\nGunakan minimal kolom: NAMA");
        }

        for (const row of rows) {
          const nama_mapel = String(row.NAMA).trim();

          const res = await fetch(
            "https://api.smkislampermatasari2.sch.id/mapel",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ nama_mapel }),
            }
          );

          if (!res.ok) {
            console.error("GAGAL IMPORT:", nama_mapel);
          }
        }

        alert("Import selesai!");
        fetchMapel();
      } catch (err) {
        console.error(err);
        alert("Gagal memproses file Excel");
      }
    };

    reader.readAsBinaryString(file);
  };

  // ========================================
  // SIMPAN MAPEL
  // ========================================
  const handleSave = async () => {
    if (!nama.trim()) return alert("Nama mapel wajib diisi!");

    try {
      setLoading(true);

      if (editId) {
        // UPDATE
        const res = await fetch(
          `https://api.smkislampermatasari2.sch.id/mapel/${editId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ kode_mapel: kode, nama_mapel: nama }),
          }
        );

        if (!res.ok) throw new Error("Gagal memperbarui mapel");

        alert("Mapel berhasil diperbarui");
      } else {
        // CREATE (kode otomatis dari server)
        const res = await fetch(
          "https://api.smkislampermatasari2.sch.id/mapel",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nama_mapel: nama }),
          }
        );

        if (!res.ok) throw new Error("Gagal menambah mapel");

        alert("Mapel berhasil ditambahkan");
      }

      setModal(false);
      fetchMapel();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // HAPUS MAPEL
  // ========================================
  const handleDelete = async (id: number) => {
    if (!confirm("Hapus mata pelajaran ini?")) return;
    try {
      await fetch(`https://api.smkislampermatasari2.sch.id/mapel/${id}`, {
        method: "DELETE",
      });
      fetchMapel();
    } catch (err) {
      alert("Gagal menghapus mapel");
    }
  };

  // ========================================
  // UI (STYLE PUNYA KAMU, TIDAK DIUBAH SEDIKITPUN)
  // ========================================
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Daftar Mata Pelajaran</h1>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <label
            htmlFor="file-upload"
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-green-700"
          >
            <Upload className="w-5 h-5" /> Upload Mapel
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
            className="flex items-center cursor-pointer space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Tambah Mapel</span>
          </button>
        </div>

        <div className="flex items-center border rounded px-2">
          <Search className="w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Cari mapel..."
            className="p-2 outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white shadow-[0_0_2px_rgba(0,0,0,0.5)] rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="p-3 text-left">No</th>
              <th className="p-3 border-l border-gray-200 text-left">Kode</th>
              <th className="p-3 border-l border-gray-200 text-left">
                Nama Mata Pelajaran
              </th>
              <th className="p-3 border-l border-gray-200 w-32">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {filteredMapel.map((m, i) => (
              <tr
                key={m.id}
                className="odd:bg-white border-b border-gray-300 even:bg-gray-100 hover:bg-blue-200"
              >
                <td className="p-3">{i + 1}</td>
                <td className="p-3 border-l border-gray-200">{m.kode_mapel}</td>
                <td className="p-3 border-l border-gray-200">{m.nama_mapel}</td>

                <td className="p-3 border-l border-gray-200 text-center flex gap-2 justify-center">
                  <button
                    onClick={() => openModalEdit(m.id)}
                    className="p-1 bg-yellow-400 text-white rounded"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(m.id)}
                    className="p-1 bg-red-500 text-white rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}

            {filteredMapel.length === 0 && (
              <tr>
                <td
                  className="p-3 border text-center text-gray-500 italic"
                  colSpan={4}
                >
                  Tidak ada data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow w-full max-w-md space-y-3">
            <h2 className="text-xl font-bold mb-2">
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

            <div className="flex justify-end gap-2">
              <button
                className="px-3 py-1 bg-gray-300 cursor-pointer rounded"
                onClick={() => setModal(false)}
              >
                Batal
              </button>

              <button
                className="px-3 py-1 bg-blue-600 cursor-pointer text-white rounded"
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
