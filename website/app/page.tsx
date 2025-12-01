"use client";

import { useEffect, useState } from "react";

export default function Page() {
  const slides = [
    "/asets/upacara.webp",
    "/asets/g5.jpeg",
    "/asets/g6.jpeg",
    "/asets/lapangan.webp",
    "/asets/upacara.jpeg",
    "/asets/paskibraka.jpeg",
    "/asets/sumpahpemuda1.jpeg",
    "/asets/sumpahpemuda.jpeg",
    "/asets/pramuka.jpeg",
    "/asets/g4.jpeg",
  ];

  // Nav Active Highlighter
  useEffect(() => {
    const sections = document.querySelectorAll("section[id]");
    const navLinks = document.querySelectorAll(".nav-link");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("id");
            const link = document.querySelector(`a[href="#${id}"]`);

            navLinks.forEach((a) => a.classList.remove("active"));
            link?.classList.add("active");
          }
        });
      },
      {
        threshold: 0.25,
        rootMargin: "-80px 0px -60% 0px",
      }
    );

    sections.forEach((s) => observer.observe(s));

    return () => observer.disconnect();
  }, []);

  const [current, setCurrent] = useState(0);

  // Auto slide
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const prevSlide = () => {
    setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrent(index);
  };

  return (
    <>
      <section
        id="beranda"
        className="relative h-screen flex items-center justify-center"
      >
        {/* SLIDES */}
        <div className="absolute inset-0">
          {slides.map((src, idx) => (
            <img
              key={idx}
              src={src}
              className={`w-full h-full object-cover slideshow-image ${
                idx === current ? "active" : ""
              }`}
            />
          ))}
        </div>

        {/* DARK OVERLAY */}
        <div className="absolute inset-0 bg-black/35" />

        {/* BUTTON LEFT */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/10 hover:bg-white/30 backdrop-blur rounded-full text-white cursor-pointer"
        >
          <svg
            width="28"
            height="28"
            fill="none"
            stroke="white"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              d="M15 6l-6 6 6 6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* BUTTON RIGHT */}
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/10 hover:bg-white/30 backdrop-blur rounded-full text-white cursor-pointer"
        >
          <svg
            width="28"
            height="28"
            fill="none"
            stroke="white"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              d="M9 6l6 6-6 6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* TEXT CONTENT */}
        <div className="relative z-40 text-center px-4">
          <h1 className="text-3xl md:text-5xl font-bold text-white">
            SMK Islam Permatasari 2
          </h1>
          <p className="mt-4 text-lg md:text-xl text-white/90">
            Mencetak Generasi Emas Menuju Indonesia Emas
          </p>
          {/* <div className="mt-6">
            <a
              href="#ppdb"
              className="inline-block bg-yellow-400 text-blue-900 px-5 py-3 rounded-md font-semibold shadow hover:bg-yellow-300"
            >
              Daftar PPDB
            </a>
          </div> */}
        </div>

        {/* DOTS INDICATOR */}
        <div className="absolute bottom-10 z-20 w-full flex justify-center gap-3">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className={`w-3 h-3 rounded-full transition-all cursor-pointer ${
                idx === current
                  ? "bg-white/50 scale-125"
                  : "bg-white/20 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      </section>

      {/* PROFIL */}
      <section id="profil" className="py-10">
        <div className="container mx-auto px-4 md:px-20">
          <h2 className="text-3xl font-bold text-center mb-8">
            Profil & Sejarah Singkat
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-semibold mb-2">Sejarah Singkat</h3>
              <p className="text-gray-700 leading-relaxed text-justify">
                SMK Islam Permatasari 2 merupakan lembaga pendidikan menengah
                kejuruan di bawah naungan Yayasan SK yang berlokasi di Jl. Raya
                Sukamanah, No. 123, Desa Tamansari, Kec. Rumpin, Kab. Bogor ,
                berdiri tahun 2007 dengan status akreditasi B. Sekolah ini
                memiliki tenaga pendidik dengan kualifikasi S1 dan S2 yang
                sebagian besar telah bersertifikat pendidik dengan pengalaman
                mengajar yang memadai, serta didukung oleh tenaga kependidikan
                yang terdiri dari Kepala Tata Usaha, staf administrasi,
                pustakawan, teknisi, satpam, dan petugas kebersihan.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-bold mb-2">VISI</h3>
              <p className="text-gray-700 text-justify">
                Mewujudkan sumber daya manusia yang terampil, kreatif,
                berwawasan iptek dan imtaq serta menghasilkan Tamatan yang
                kompeten dan mandiri
              </p>
              <h3 className="font-bold my-2">MISI</h3>
              <ol className="mt-3 list-decimal ml-5 text-gray-700 space-y-2 text-justify">
                <li>
                  Membekali dan mendidik siswa dengan pembinaan budi pekerti dan
                  norma-norma agama untuk membentuk pribadi yang berakhlak
                  mulia.
                </li>
                <li>
                  Membiasakan dan melatih siswa untuk memiliki sikap hormat
                  kepada orang tua serta cinta kepada sesama.
                </li>
                <li>
                  Mendidik calon tenaga kerja agar memiliki keterampilan dalam
                  bidang teknologi industri sesuai dengan kebutuhan pasar kerja.
                </li>
                <li>
                  Mendidik calon wirausaha yang memiliki sikap kreatif, inovatif
                  dalam mengembangkan potensi diri dan lingkungannya.
                </li>
                <li>
                  Membekali tamatan dengan Teknologi dan komunikasi agar dapat
                  melanjutkan pendidikan kejenjang yang lebih tinggi.
                </li>
                <li>
                  Menumbuhkan kerjasama dan kemitraan dengan dunia usaha
                  industri, instansi terkait, masyarakat dalam meningkatkan mutu
                  lulusan.
                </li>
                <li>
                  Memanfaatkan setiap peluang yang ada menjadi aset bagi
                  perkembangansekolah kearah sekolah mandiri.
                </li>
                <li>
                  Meningkatkan kualitas pembelajaran, melalui peningkatan
                  kualitas tenaga pendidik dan kependidikan serta perlengkapan
                  sarana-prasarana.
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* KOMPETENSI */}
      <section id="kompetensi" className="py-10 bg-gray-50">
        <div className="container mx-auto px-4 md:px-20">
          <h2 className="text-3xl font-bold text-center mb-8">
            Kompetensi Keahlian
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* RPL */}
            <div className="p-6 rounded-lg bg-white shadow text-center">
              <div className="text-4xl mb-3">💻</div>
              <h3 className="font-semibold">Rekayasa Perangkat Lunak (RPL)</h3>
              <p className="mt-2 text-gray-700">
                Fokus pengembangan aplikasi, website, dan kecerdasan buatan.
              </p>
            </div>

            {/* TKJ */}
            <div className="p-6 rounded-lg bg-white shadow text-center">
              <div className="text-4xl mb-3">📶</div>
              <h3 className="font-semibold">
                Teknik Komputer & Jaringan (TKJ)
              </h3>
              <p className="mt-2 text-gray-700">
                Jaringan komputer, server, routing, dan keamanan siber.
              </p>
            </div>

            {/* DKV */}
            <div className="p-6 rounded-lg bg-white shadow text-center">
              <div className="text-4xl mb-3">🎨</div>
              <h3 className="font-semibold">Desain Komunikasi Visual (DKV)</h3>
              <p className="mt-2 text-gray-700">
                Desain grafis, fotografi, animasi, dan branding visual modern.
              </p>
            </div>

            {/* MM */}
            <div className="p-6 rounded-lg bg-white shadow text-center">
              <div className="text-4xl mb-3">🎥</div>
              <h3 className="font-semibold">Multi Media (MM)</h3>
              <p className="mt-2 text-gray-700">
                Editing video, animasi, broadcasting, dan produksi multimedia.
              </p>
            </div>

            {/* TBSM */}
            <div className="p-6 rounded-lg bg-white shadow text-center">
              <div className="text-4xl mb-3">🔧</div>
              <h3 className="font-semibold">
                Teknik Bisnis Sepeda Motor (TBSM)
              </h3>
              <p className="mt-2 text-gray-700">
                Perbaikan, perawatan, dan sistem manajemen bengkel sepeda motor.
              </p>
            </div>

            {/* TKRO */}
            <div className="p-6 rounded-lg bg-white shadow text-center">
              <div className="text-4xl mb-3">🚗</div>
              <h3 className="font-semibold">Teknik Kendaraan Ringan (TKRO)</h3>
              <p className="mt-2 text-gray-700">
                Servis, diagnosa, dan perbaikan mesin kendaraan ringan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FASILITAS / GALLERY */}
      <section id="fasilitas" className="py-10">
        <div className="container mx-auto px-4 md:px-20">
          <h2 className="text-3xl font-bold text-center mb-8">
            Fasilitas Sekolah
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <figure className="rounded overflow-hidden shadow">
              <img
                src="/asets/labkomputer2.jpeg"
                alt="lab"
                className="w-full h-44 object-cover"
              />
            </figure>
            <figure className="rounded overflow-hidden shadow">
              <img
                src="/asets/tbsm.jpeg"
                alt="perpus"
                className="w-full h-44 object-cover"
              />
            </figure>
            <figure className="rounded overflow-hidden shadow">
              <img
                src="/asets/labotomotif1.jpeg"
                alt="bengkel"
                className="w-full h-44 object-cover"
              />
            </figure>

            <figure className="rounded overflow-hidden shadow">
              <img
                src="/asets/lapangan.webp"
                alt="lapangan"
                className="w-full h-44 object-cover"
              />
            </figure>
          </div>
        </div>
      </section>

      {/* KEGIATAN & BERITA */}
      <section id="berita" className="py-10 bg-gray-50">
        <div className="container mx-auto px-4 md:px-20">
          <h2 className="text-3xl font-bold text-center mb-8">
            Kegiatan & Berita
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {/* PASKIBRAKA */}
            <div className="bg-white rounded shadow overflow-hidden">
              <img
                src="/asets/paskibraka.jpeg"
                alt="Paskibraka"
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="font-semibold text-lg">Paskibraka</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Kegiatan latihan baris-berbaris, kedisiplinan, dan persiapan
                  upacara bendera yang diikuti siswa terpilih.
                </p>
              </div>
            </div>

            {/* PERLOMBAAN */}
            <div className="bg-white rounded shadow overflow-hidden">
              <img
                src="/asets/perlombaan.jpeg"
                alt="Perlombaan"
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="font-semibold text-lg">Perlombaan</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Beragam perlombaan akademik maupun non-akademik yang diikuti
                  siswa untuk meningkatkan kreativitas dan prestasi.
                </p>
              </div>
            </div>

            {/* LDKS */}
            <div className="bg-white rounded shadow overflow-hidden">
              <img
                src="/asets/ldks.jpeg"
                alt="Latihan Dasar Kepemimpinan Siswa"
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="font-semibold text-lg">
                  Latihan Dasar Kepemimpinan Siswa (LDKS)
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Pembentukan karakter kepemimpinan, disiplin, mental, dan
                  kerjasama untuk calon pengurus OSIS.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KONTAK */}
      <section id="kontak" className="py-10">
        <div className="container mx-auto px-4 md:px-20">
          <h2 className="text-3xl font-bold text-center mb-8">Hubungi Kami</h2>
          <div className="flex flex-col md:flex-row gap-6">
            <form className="bg-white p-6 rounded shadow space-y-4 flex-1">
              <input
                className="w-full border border-gray-400 outline-none p-2 rounded"
                placeholder="Nama"
              />
              <input
                className="w-full border border-gray-400 outline-none p-2 rounded"
                placeholder="Email"
              />
              <textarea
                className="w-full border border-gray-400 outline-none p-2 rounded"
                rows={5}
                placeholder="Pesan"
              />
              <button className="px-4 py-2 bg-blue-600 text-white rounded">
                Kirim
              </button>
            </form>

            <div className="flex-1 overflow-hidden rounded shadow">
              <div
                id="map-lokasi"
                className="w-full h-full overflow-hidden rounded"
              >
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3965.0364324653674!2d106.6307044!3d-6.389300499999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69c5c68067dea5%3A0xc37eab33dc9702c7!2sSMK%20Islam%20Permatasari%202!5e0!3m2!1sid!2sid!4v1762959703820!5m2!1sid!2sid"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-blue-900 text-white py-10">
        <div className="container mx-auto px-4 md:px-20">
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold">Kontak Cepat</h4>

              {/* Telepon */}
              <p className="mt-2">📞 Telp. (021) 75790753</p>

              {/* Fax */}
              <p>📠 Fax. 021 75791633</p>

              {/* Email */}
              <p>✉️ Email. smkislampermatasari677@gmail.com</p>
            </div>

            <div>
              <h4 className="font-semibold">Tautan Cepat</h4>
              <ul className="mt-2 space-y-1">
                <li>
                  <a className="underline" href="#">
                    PPDB Online
                  </a>
                </li>
                <li>
                  <a className="underline" href="#">
                    Portal Siswa
                  </a>
                </li>
                <li>
                  <a className="underline" href="#">
                    E-Learning
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white">Ikuti Kami</h4>

              <div className="mt-2 flex gap-3">
                {/* FACEBOOK */}
                <a
                  href="https://www.facebook.com/SMKIslamPermatasari2"
                  target="_blank"
                  aria-label="Facebook SMK Islam Permatasari 2"
                  className="block w-8 h-8 rounded bg-white/10 hover:bg-white/20 transition grid place-items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                  >
                    <path d="M22 12.07C22 6.49 17.52 2 12 2S2 6.49 2 12.07C2 17.1 5.66 21.2 10.44 22v-6.99H7.9v-2.94h2.54v-2.24c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.91h2.78l-.44 2.94h-2.34V22C18.34 21.2 22 17.1 22 12.07Z" />
                  </svg>
                </a>

                {/* INSTAGRAM */}
                <a
                  href="https://www.instagram.com/smkislampermatasari2?igsh=MXJwcXpkeHVwb2plMw=="
                  target="_blank"
                  aria-label="Instagram SMK Islam Permatasari 2"
                  className="block w-8 h-8 rounded bg-white/10 hover:bg-white/20 transition grid place-items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                  >
                    <path d="M7 2C4.2 2 2 4.2 2 7v10c0 2.8 2.2 5 5 5h10c2.8 0 5-2.2 5-5V7c0-2.8-2.2-5-5-5H7zm10 2c1.7 0 3 1.3 3 3v10c0 1.7-1.3 3-3 3H7c-1.7 0-3-1.3-3-3V7c0-1.7 1.3-3 3-3h10zm-5 3.3A4.7 4.7 0 1 0 16.7 12 4.7 4.7 0 0 0 12 7.3zm0 7.7a3 3 0 1 1 3-3 3 3 0 0 1-3 3zm4.9-8.5a1.1 1.1 0 1 1-1.1-1.1 1.1 1.1 0 0 1 1.1 1.1z" />
                  </svg>
                </a>

                {/* YOUTUBE */}
                <a
                  href="https://youtube.com"
                  target="_blank"
                  aria-label="YouTube SMK Islam Permatasari 2"
                  className="block w-8 h-8 rounded bg-white/10 hover:bg-white/20 transition grid place-items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-white"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.1 3.5 12 3.5 12 3.5s-7.1 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c2.3.6 9.4.6 9.4.6s7.1 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM10 15.5v-7l6 3.5-6 3.5z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center text-sm opacity-80">
            &copy; 2025 SMK Permatasari 2
          </div>
        </div>
      </footer>
    </>
  );
}
