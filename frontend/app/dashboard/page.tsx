"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const name = localStorage.getItem("username");

    if (!token) {
      router.push("/");
    } else {
      setUsername(name || "Pengguna");
    }
  }, [router]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-gray-700 mt-2">
        Selamat datang, <b>{username}</b> 👋
      </p>
    </div>
  );
}
