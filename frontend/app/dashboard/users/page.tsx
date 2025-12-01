"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: number;
  username: string;
  password: string;
  role: string;
};

export default function UsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [role, setRole] = useState("");

  // Modal states
  const [openModal, setOpenModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [userRole, setUserRole] = useState("Guru");

  // =============================
  // CEK ROLE DI LOCAL STORAGE
  // =============================
  useEffect(() => {
    const token = localStorage.getItem("token");
    const r = localStorage.getItem("role");

    if (!token) {
      router.push("/");
      return;
    }

    if (r !== "Super User") {
      router.push("/dashboard");
      return;
    }

    setRole(r);
    fetchUsers();
  }, [router]);

  // =============================
  // GET USERS
  // =============================
  const fetchUsers = async () => {
    const res = await fetch("https://api.smkislampermatasari2.sch.id/users");
    const data = await res.json();
    setUsers(data);
  };

  // =============================
  // OPEN ADD MODAL
  // =============================
  const openAddModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setUsername("");
    setPassword("");
    setUserRole("Guru");
    setOpenModal(true);
  };

  // =============================
  // OPEN EDIT MODAL
  // =============================
  const openEditModal = (u: User) => {
    setIsEditing(true);
    setEditingId(u.id);
    setUsername(u.username);
    setPassword(u.password);
    setUserRole(u.role);
    setOpenModal(true);
  };

  // =============================
  // SAVE USER (ADD / EDIT)
  // =============================
  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!username || !password) {
      alert("Username dan password wajib diisi!");
      return;
    }

    const payload = { username, password, role: userRole };

    const url = isEditing
      ? `https://api.smkislampermatasari2.sch.id/users/${editingId}`
      : "https://api.smkislampermatasari2.sch.id/users";

    const method = isEditing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      alert("Gagal menyimpan user!");
      return;
    }

    await fetchUsers();
    setOpenModal(false);
  };

  // =============================
  // DELETE USER
  // =============================
  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus user ini?")) return;

    await fetch(`https://api.smkislampermatasari2.sch.id/users/${id}`, {
      method: "DELETE",
    });

    fetchUsers();
  };

  return (
    <div className="p-4">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Manajemen User</h1>

        <button
          onClick={openAddModal}
          className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer"
        >
          + Tambah User
        </button>
      </div>

      <div className="bg-white shadow-[0_0_2px_rgba(0,0,0,0.5)] rounded-sm overflow-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-blue-600 border-b border-gray-300 text-white">
            <tr>
              <th className="p-2 text-left">Username</th>
              <th className="p-2 text-left border-l border-gray-200">
                Password
              </th>
              <th className="p-2 text-left border-l border-gray-200">Role</th>
              <th className="p-2 text-center border-l border-gray-200">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                className="odd:bg-white border-b border-gray-300 even:bg-gray-100 hover:bg-blue-200"
              >
                <td className="p-2 ">{u.username}</td>
                <td className="p-2 pl-3 border-l border-gray-200">
                  {u.password}
                </td>
                <td className="p-2 pl-3 border-l border-gray-200">{u.role}</td>

                <td className="p-2 pl-3 text-center border-l border-gray-200">
                  <button
                    onClick={() => openEditModal(u)}
                    className="bg-yellow-500 text-white px-2 py-1 mr-2 rounded cursor-pointer"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(u.id)}
                    className="bg-red-600 text-white px-2 py-1 rounded cursor-pointer"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}

            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center p-4">
                  Tidak ada user
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ============================= */}
      {/* MODAL TAMBAH / EDIT USER */}
      {/* ============================= */}
      {openModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow">
            <h2 className="text-xl font-bold mb-4">
              {isEditing ? "Edit User" : "Tambah User"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                className="w-full p-2 border rounded"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />

              <input
                className="w-full p-2 border rounded"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <select
                className="w-full p-2 border rounded"
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
              >
                <option value="Super User">Super User</option>
                <option value="Guru">Guru</option>
                <option value="Admin">Admin</option>
              </select>

              <div className="flex justify-end gap-2 pt-3">
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
