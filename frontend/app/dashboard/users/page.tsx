"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/* =======================
   TYPES
======================= */
type User = {
  id: number;
  username: string;
  password: string;
  role: string;
};

/* =======================
   COMPONENT
======================= */
export default function UsersPage() {
  const API = process.env.NEXT_PUBLIC_API_URL;
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

  /* =======================
     HELPERS
  ======================= */
  const resetForm = () => {
    setUsername("");
    setPassword("");
    setUserRole("Guru");
    setEditingId(null);
    setIsEditing(false);
  };

  /* =======================
     AUTH CHECK
  ======================= */
  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedRole = localStorage.getItem("role");

    if (!token) {
      router.push("/");
      return;
    }

    if (savedRole !== "Super User") {
      router.push("/dashboard");
      return;
    }

    setRole(savedRole);
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  /* =======================
     FETCH USERS
  ======================= */
  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API}/users`);
      if (!res.ok) throw new Error("Fetch users failed");

      const data = (await res.json()) as User[];
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      alert("Gagal mengambil data user");
      setUsers([]);
    }
  };

  /* =======================
     MODAL HANDLERS
  ======================= */
  const openAddModal = () => {
    resetForm();
    setOpenModal(true);
  };

  const openEditModal = (u: User) => {
    setIsEditing(true);
    setEditingId(u.id);
    setUsername(u.username);
    setPassword(u.password);
    setUserRole(u.role);
    setOpenModal(true);
  };

  /* =======================
     SAVE USER (ADD / EDIT)
  ======================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      alert("Username dan password wajib diisi!");
      return;
    }

    const payload = {
      username,
      password,
      role: userRole,
    };

    try {
      const url = isEditing ? `${API}/users/${editingId}` : `${API}/users`;

      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Save user failed");
      }

      await fetchUsers();
      setOpenModal(false);
      resetForm();
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan user!");
    }
  };

  /* =======================
     DELETE USER
  ======================= */
  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus user ini?")) return;

    try {
      const res = await fetch(`${API}/users/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Delete failed");

      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus user!");
    }
  };

  /* =======================
   RENDER
======================= */
  return (
    <div className="p-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold">Manajemen User</h1>

        <button
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded cursor-pointer w-full sm:w-auto"
        >
          + Tambah User
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white shadow-[0_0_2px_rgba(0,0,0,0.5)] rounded-sm overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse text-sm">
          <thead className="bg-blue-600 text-white uppercase text-xs">
            <tr>
              <th className="p-3 text-left">Username</th>
              <th className="p-3 text-left border-l border-gray-200">
                Password
              </th>
              <th className="p-3 text-left border-l border-gray-200">Role</th>
              <th className="p-3 text-center border-l border-gray-200 w-36">
                Aksi
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {users.map((u) => (
              <tr
                key={u.id}
                className="odd:bg-white even:bg-gray-50 hover:bg-blue-100 transition-colors"
              >
                <td className="p-3">{u.username}</td>

                <td className="p-3 border-l border-gray-200">{u.password}</td>

                <td className="p-3 border-l border-gray-200">{u.role}</td>

                <td className="p-2 border-l border-gray-200">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => openEditModal(u)}
                      className="px-2 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded cursor-pointer"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(u.id)}
                      className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-gray-500">
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
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
