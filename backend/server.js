// server.js
import express from "express";
import mysql from "mysql2";
import cors from "cors";
import jwt from "jsonwebtoken";

const app = express();
app.use(cors());
app.use(express.json());

// ---------------------
// MySQL pool (adjust if needed)
// ---------------------
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "root",
  database: "sms",
  connectionLimit: 10,
  port: 3307,
});

// quick ping
pool.getConnection((err, conn) => {
  if (err) {
    console.error("❌ MySQL gagal konek:", err);
  } else {
    console.log("✔ MySQL connected");
    if (conn) conn.release();
  }
});

// helper to run queries with Promise
function queryPromise(sql, params = []) {
  return new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

// ---------------------
// Root
// ---------------------
app.get("/", (req, res) => {
  res.send("API SMS Berjalan ✔");
});

// ---------------------
// CRUD Jurusan (unchanged)
// ---------------------
app.get("/jurusan", async (req, res) => {
  try {
    const rows = await queryPromise(
      "SELECT * FROM jurusan ORDER BY nama_jurusan"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal fetch jurusan", error: err });
  }
});

app.post("/jurusan", async (req, res) => {
  const { kode_jurusan, nama_jurusan } = req.body;
  if (!kode_jurusan || !nama_jurusan)
    return res.status(400).json({ error: "kode_jurusan & nama_jurusan wajib" });

  try {
    const result = await queryPromise(
      "INSERT INTO jurusan (kode_jurusan, nama_jurusan) VALUES (?, ?)",
      [kode_jurusan, nama_jurusan]
    );
    res.json({ id: result.insertId, kode_jurusan, nama_jurusan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal menambah jurusan", error: err });
  }
});

app.put("/jurusan/:id", async (req, res) => {
  const { id } = req.params;
  const { kode_jurusan, nama_jurusan } = req.body;
  try {
    await queryPromise(
      "UPDATE jurusan SET kode_jurusan=?, nama_jurusan=? WHERE id=?",
      [kode_jurusan, nama_jurusan, id]
    );
    res.json({ id, kode_jurusan, nama_jurusan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal update jurusan", error: err });
  }
});

app.delete("/jurusan/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await queryPromise("DELETE FROM jurusan WHERE id=?", [id]);
    res.json({ message: "Jurusan berhasil dihapus" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal menghapus jurusan", error: err });
  }
});

// ---------------------
// CRUD Kelas (unchanged)
// ---------------------
app.get("/kelas", async (req, res) => {
  try {
    const rows = await queryPromise("SELECT * FROM kelas ORDER BY nama_kelas");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal fetch kelas", error: err });
  }
});

app.post("/kelas", async (req, res) => {
  const { nama_kelas } = req.body;
  if (!nama_kelas) return res.status(400).json({ error: "nama_kelas wajib" });

  try {
    const result = await queryPromise(
      "INSERT INTO kelas (nama_kelas) VALUES (?)",
      [nama_kelas]
    );
    res.json({ id: result.insertId, nama_kelas });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal menambah kelas", error: err });
  }
});

app.put("/kelas/:id", async (req, res) => {
  const { id } = req.params;
  const { nama_kelas } = req.body;
  try {
    await queryPromise("UPDATE kelas SET nama_kelas=? WHERE id=?", [
      nama_kelas,
      id,
    ]);
    res.json({ id, nama_kelas });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal update kelas", error: err });
  }
});

app.delete("/kelas/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await queryPromise("DELETE FROM kelas WHERE id=?", [id]);
    res.json({ message: "Kelas berhasil dihapus" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal menghapus kelas", error: err });
  }
});

// ---------------------
// CRUD SISWA (RELATIONAL)
// - frontend expects: POST/PUT with kelas_id, jurusan_id
// - GET /students returns joined rows with nama_kelas and nama_jurusan
// ---------------------

// GET all students (joined)
app.get("/students", async (req, res) => {
  try {
    const sql = `
      SELECT s.id, s.nis, s.nama, s.jk,
             s.kelas_id, s.jurusan_id,
             k.nama_kelas, j.nama_jurusan
      FROM siswa s
      LEFT JOIN kelas k ON s.kelas_id = k.id
      LEFT JOIN jurusan j ON s.jurusan_id = j.id
      ORDER BY s.nama
    `;
    const rows = await queryPromise(sql);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal fetch siswa", error: err });
  }
});

// CREATE student
app.post("/students", async (req, res) => {
  const { nis, nama, jk, kelas_id, jurusan_id } = req.body;

  if (!nis || !nama) {
    return res.status(400).json({ error: "nis & nama wajib" });
  }

  try {
    const sql =
      "INSERT INTO siswa (nis, nama, jk, kelas_id, jurusan_id) VALUES (?, ?, ?, ?, ?)";
    const result = await queryPromise(sql, [
      nis,
      nama,
      jk || null,
      kelas_id || null,
      jurusan_id || null,
    ]);

    // return created row (joined)
    const [created] = await queryPromise(
      `SELECT s.id, s.nis, s.nama, s.jk, s.kelas_id, s.jurusan_id, k.nama_kelas, j.nama_jurusan
       FROM siswa s
       LEFT JOIN kelas k ON s.kelas_id = k.id
       LEFT JOIN jurusan j ON s.jurusan_id = j.id
       WHERE s.id = ?`,
      [result.insertId]
    );

    res.json(created);
  } catch (err) {
    console.error("INSERT siswa error:", err);
    res.status(500).json({ message: "Gagal menambah siswa", error: err });
  }
});

// UPDATE student
app.put("/students/:id", async (req, res) => {
  const { id } = req.params;
  const { nis, nama, jk, kelas_id, jurusan_id } = req.body;

  try {
    await queryPromise(
      "UPDATE siswa SET nis=?, nama=?, jk=?, kelas_id=?, jurusan_id=? WHERE id=?",
      [nis, nama, jk || null, kelas_id || null, jurusan_id || null, id]
    );

    const [updated] = await queryPromise(
      `SELECT s.id, s.nis, s.nama, s.jk, s.kelas_id, s.jurusan_id, k.nama_kelas, j.nama_jurusan
       FROM siswa s
       LEFT JOIN kelas k ON s.kelas_id = k.id
       LEFT JOIN jurusan j ON s.jurusan_id = j.id
       WHERE s.id = ?`,
      [id]
    );

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal update siswa", error: err });
  }
});

// DELETE student
app.delete("/students/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await queryPromise("DELETE FROM siswa WHERE id=?", [id]);
    res.json({ message: "Siswa berhasil dihapus" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal menghapus siswa", error: err });
  }
});

// ---------------------
// START SERVER
// ---------------------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});

// ============================
// 📌 LOGIN USER
// ============================
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  pool.query(
    "SELECT * FROM users WHERE username = ? AND password = ?",
    [username, password],
    (err, rows) => {
      if (err)
        return res.status(500).json({ message: "Error server", error: err });
      if (rows.length === 0)
        return res
          .status(401)
          .json({ message: "Username atau password salah" });

      const user = rows[0];

      const token = jwt.sign({ id: user.id, role: user.role }, "sms-secret", {
        expiresIn: "1d",
      });

      res.json({
        token,
        username: user.username,
        role: user.role,
      });
    }
  );
});

// GET semua user (khusus Super User)
app.get("/users", (req, res) => {
  pool.query("SELECT id, username, password, role FROM users", (err, rows) => {
    if (err)
      return res.status(500).json({ message: "Gagal fetch users", error: err });
    res.json(rows);
  });
});

// Tambah user
app.post("/users", (req, res) => {
  const { username, password, role } = req.body;

  pool.query(
    "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
    [username, password, role],
    (err, result) => {
      if (err)
        return res
          .status(500)
          .json({ message: "Gagal menambah user", error: err });

      res.json({
        id: result.insertId,
        username,
        role,
      });
    }
  );
});

// Update user
app.put("/users/:id", (req, res) => {
  const { id } = req.params;
  const { username, password, role } = req.body;

  pool.query(
    "UPDATE users SET username = ?, password = ?, role = ? WHERE id = ?",
    [username, password, role, id],
    (err) => {
      if (err)
        return res
          .status(500)
          .json({ message: "Gagal update user", error: err });

      res.json({ id, username, password, role });
    }
  );
});

// Delete user
app.delete("/users/:id", (req, res) => {
  const { id } = req.params;

  pool.query("DELETE FROM users WHERE id = ?", [id], (err) => {
    if (err)
      return res.status(500).json({ message: "Gagal hapus user", error: err });
    res.json({ message: "User berhasil dihapus" });
  });
});

// ---------------------
// Helper untuk resolve id (bisa pakai id langsung atau nama)
// table: tabel (kelas/mapel/jurusan)
// idOrName: bisa id (number/string) atau nama/kode (string)
// idCol: nama kolom id di tabel (default 'id')
// nameCols: array kolom yang boleh dipakai untuk mencari (mis. ['nama_kelas','kode_kelas'])
// ---------------------
async function resolveId(table, idOrName, idCol = "id", nameCols = ["nama"]) {
  if (!idOrName && idOrName !== 0) return null;
  // jika numeric, anggap sebagai id
  if (!isNaN(Number(idOrName))) {
    const [row] = await queryPromise(
      `SELECT ${idCol} FROM ${table} WHERE ${idCol} = ? LIMIT 1`,
      [Number(idOrName)]
    );
    return row ? row[idCol] : null;
  }
  // else cari berdasarkan name/kode (cek semua nameCols)
  for (const col of nameCols) {
    const rows = await queryPromise(
      `SELECT ${idCol} FROM ${table} WHERE ${col} = ? LIMIT 1`,
      [String(idOrName)]
    );
    if (rows && rows.length > 0) return rows[0][idCol];
  }
  return null;
}

// ---------------------
// MAPEL CRUD + auto-generate kode
// ---------------------
async function generateKodeMapel() {
  const rows = await queryPromise(
    "SELECT kode_mapel FROM mapel ORDER BY id DESC LIMIT 1"
  );
  if (!rows || rows.length === 0) return "MPL01";
  const last = rows[0].kode_mapel || "";
  const num = parseInt(String(last).replace(/[^0-9]/g, "")) || 0;
  const next = num + 1;
  return "MPL" + String(next).padStart(2, "0");
}

app.get("/mapel", async (req, res) => {
  try {
    const rows = await queryPromise(
      "SELECT id, kode_mapel, nama_mapel FROM mapel ORDER BY id ASC"
    );
    res.json(rows);
  } catch (err) {
    console.error("GET /mapel error:", err);
    res.status(500).json({ message: "Gagal fetch mapel", error: err });
  }
});

app.post("/mapel", async (req, res) => {
  try {
    const { nama_mapel } = req.body;
    if (!nama_mapel || !String(nama_mapel).trim())
      return res.status(400).json({ message: "nama_mapel wajib" });

    const kode_mapel = await generateKodeMapel();
    const insert = await queryPromise(
      "INSERT INTO mapel (kode_mapel, nama_mapel) VALUES (?, ?)",
      [kode_mapel, nama_mapel]
    );
    const [created] = await queryPromise(
      "SELECT id, kode_mapel, nama_mapel FROM mapel WHERE id = ?",
      [insert.insertId]
    );
    res.json(created);
  } catch (err) {
    console.error("POST /mapel error:", err);
    res.status(500).json({ message: "Gagal tambah mapel", error: err });
  }
});

app.put("/mapel/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_mapel } = req.body;
    if (!nama_mapel || !String(nama_mapel).trim())
      return res.status(400).json({ message: "nama_mapel wajib" });
    await queryPromise("UPDATE mapel SET nama_mapel = ? WHERE id = ?", [
      nama_mapel,
      id,
    ]);
    const [updated] = await queryPromise(
      "SELECT id, kode_mapel, nama_mapel FROM mapel WHERE id = ?",
      [id]
    );
    res.json(updated);
  } catch (err) {
    console.error("PUT /mapel error:", err);
    res.status(500).json({ message: "Gagal update mapel", error: err });
  }
});

app.delete("/mapel/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await queryPromise("DELETE FROM mapel WHERE id = ?", [id]);
    res.json({ message: "Mapel berhasil dihapus" });
  } catch (err) {
    console.error("DELETE /mapel/:id error:", err);
    res.status(500).json({ message: "Gagal menghapus mapel", error: err });
  }
});

app.get("/mapel/next-kode", async (req, res) => {
  try {
    const kode = await generateKodeMapel();
    res.json({ kode });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal generate kode" });
  }
});

// ---------------------
// ABSENSI (POST + GET tunggal, konsisten pakai IDs atau resolve dari names)
// ---------------------
// POST /absensi
app.post("/absensi", async (req, res) => {
  const { kelas_id, jurusan_id, mapel_id, tanggal, siswa } = req.body;

  if (!kelas_id || !jurusan_id || !mapel_id || !tanggal || !siswa) {
    return res.status(400).json({ message: "Payload tidak lengkap" });
  }

  try {
    // Cek apakah header absensi sudah ada
    const existing = await queryPromise(
      `SELECT id FROM absensi 
       WHERE kelas_id=? AND jurusan_id=? AND mapel_id=? AND tanggal=?
       LIMIT 1`,
      [kelas_id, jurusan_id, mapel_id, tanggal]
    );

    let absensi_id;

    if (existing.length > 0) {
      absensi_id = existing[0].id;
      await queryPromise("DELETE FROM absensi_siswa WHERE absensi_id=?", [
        absensi_id,
      ]);
    } else {
      const insertHeader = await queryPromise(
        `INSERT INTO absensi (kelas_id, jurusan_id, mapel_id, tanggal)
         VALUES (?, ?, ?, ?)`,
        [kelas_id, jurusan_id, mapel_id, tanggal]
      );
      absensi_id = insertHeader.insertId;
    }

    // Insert detail absensi
    const values = siswa.map((v) => [absensi_id, v.nis, v.status]);

    await queryPromise(
      "INSERT INTO absensi_siswa (absensi_id, nis, status) VALUES ?",
      [values]
    );

    res.json({
      message: "Absensi tersimpan",
      record: {
        id: absensi_id,
        kelas_id,
        jurusan_id,
        mapel_id,
        tanggal,
      },
    });
  } catch (err) {
    console.error("POST /absensi error:", err);
    res.status(500).json({ message: "Gagal menyimpan absensi" });
  }
});

// GET /absensi?kelas_id=&jurusan_id=&mapel_id=&tanggal=   (also allow kelas/mapel/jurusan names)
app.get("/absensi", async (req, res) => {
  const { kelas_id, jurusan_id, mapel_id, tanggal } = req.query;

  try {
    const where = [];
    const params = [];

    if (kelas_id) {
      where.push("a.kelas_id = ?");
      params.push(kelas_id);
    }
    if (jurusan_id) {
      where.push("a.jurusan_id = ?");
      params.push(jurusan_id);
    }
    if (mapel_id) {
      where.push("a.mapel_id = ?");
      params.push(mapel_id);
    }
    if (tanggal) {
      where.push("a.tanggal = ?");
      params.push(tanggal);
    }

    const sql = `
      SELECT a.id, a.kelas_id, a.jurusan_id, a.mapel_id,
             DATE_FORMAT(a.tanggal, '%Y-%m-%d') AS tanggal
      FROM absensi a
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY a.tanggal DESC
    `;

    const rows = await queryPromise(sql, params);

    const result = [];
    for (const r of rows) {
      const siswa = await queryPromise(
        "SELECT nis, status FROM absensi_siswa WHERE absensi_id = ?",
        [r.id]
      );
      result.push({ ...r, siswa });
    }

    res.json(result);
  } catch (err) {
    console.error("GET /absensi error:", err);
    res.status(500).json({ message: "Gagal mengambil absensi", error: err });
  }
});

// -----------------------------
// REKAP MONTH (pakai kelas_id/jurusan_id/mapel_id atau nama-nilai)
// -----------------------------
// GET /rekap/month?kelas_id=&jurusan_id=&mapel_id=&bulan=&tahun=
app.get("/rekap/month", async (req, res) => {
  const { kelas_id, jurusan_id, mapel_id, bulan, tahun } = req.query;

  if (!kelas_id || !jurusan_id || !mapel_id || !bulan || !tahun) {
    return res.status(400).json({ message: "Missing parameter" });
  }

  const month = Number(bulan);
  const year = Number(tahun);

  try {
    // 1️⃣ Ambil daftar NIS siswa berdasarkan kelas_id + jurusan_id
    const studentsRows = await queryPromise(
      `SELECT s.nis
       FROM siswa s
       WHERE s.kelas_id = ? AND s.jurusan_id = ?
       ORDER BY s.nama`,
      [kelas_id, jurusan_id]
    );

    const nisList = studentsRows.map((r) => r.nis);

    // 2️⃣ Ambil data absensi untuk kelas/jurusan/mapel di bulan tersebut
    const rows = await queryPromise(
      `SELECT a.tanggal, asu.nis, asu.status
       FROM absensi a
       JOIN absensi_siswa asu ON asu.absensi_id = a.id
       WHERE a.kelas_id = ?
         AND a.jurusan_id = ?
         AND a.mapel_id = ?
         AND YEAR(a.tanggal) = ?
         AND MONTH(a.tanggal) = ?`,
      [kelas_id, jurusan_id, mapel_id, year, month]
    );

    const days = daysInMonth(year, month);

    // 3️⃣ Build struktur data
    const studentsMap = {};
    nisList.forEach((nis) => {
      studentsMap[nis] = { nis, statusByDate: {} };
    });

    rows.forEach((r) => {
      let d = new Date(r.tanggal); // MySQL → string YYYY-MM-DD
      // Format tanggal lokal tanpa UTC shift
      const dateStr =
        `${d.getFullYear()}-` +
        `${String(d.getMonth() + 1).padStart(2, "0")}-` +
        `${String(d.getDate()).padStart(2, "0")}`;

      if (!studentsMap[r.nis]) {
        studentsMap[r.nis] = { nis: r.nis, statusByDate: {} };
      }
      studentsMap[r.nis].statusByDate[dateStr] = r.status;
    });

    res.json({
      year,
      month,
      days,
      students: Object.values(studentsMap),
    });
  } catch (err) {
    console.error("GET /rekap/month error:", err);
    res.status(500).json({
      message: "Gagal membangun rekap bulan",
      error: err,
    });
  }
});

// GET /rekap/siswa?nis=...&start=YYYY-MM&end=YYYY-MM
app.get("/rekap/siswa", async (req, res) => {
  const { nis, start, end } = req.query;
  if (!nis || !start || !end) {
    return res.status(400).json({ message: "Missing parameter" });
  }

  try {
    const [sYear, sMonth] = String(start).split("-").map(Number);
    const [eYear, eMonth] = String(end).split("-").map(Number);

    const months = [];
    let curYear = sYear;
    let curMonth = sMonth;

    while (curYear < eYear || (curYear === eYear && curMonth <= eMonth)) {
      months.push({ year: curYear, month: curMonth });
      curMonth++;
      if (curMonth > 12) {
        curMonth = 1;
        curYear++;
      }
    }

    const resultMonths = [];

    for (const m of months) {
      const { year, month } = m;
      const days = new Date(year, month, 0).getDate();

      const rows = await queryPromise(
        `SELECT a.tanggal, asu.status
         FROM absensi a
         JOIN absensi_siswa asu ON asu.absensi_id = a.id
         WHERE asu.nis = ? AND YEAR(a.tanggal) = ? AND MONTH(a.tanggal) = ?`,
        [nis, year, month]
      );

      const dayMap = {};

      for (const r of rows) {
        const dObj = new Date(r.tanggal);
        const d = dObj.getDate();
        dayMap[d] = r.status;
      }

      resultMonths.push({
        year,
        month,
        days,
        dayMap,
      });
    }

    res.json({ months: resultMonths });
  } catch (err) {
    console.error("GET /rekap/siswa error:", err);
    res.status(500).json({ message: "Gagal memuat rekap siswa", error: err });
  }
});
