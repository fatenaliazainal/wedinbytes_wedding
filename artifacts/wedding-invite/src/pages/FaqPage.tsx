import React, { useState } from "react";
import { useLocation } from "wouter";
import { Heart, User, Plus, Minus, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SharedNavDrawer from "@/components/SharedNavDrawer";
import type { SiteNavItem } from "@/components/SiteHeader";
import { dashboardPathForUser } from "@/lib/dashboard-path";
import { usePageMeta } from "@/hooks/usePageMeta";

const PACKAGE_SUPPORT_WHATSAPP = "https://wa.me/601128134211";

const NAV_ITEMS: SiteNavItem[] = [
  { label: "HOME", href: "/" },
  { label: "CATALOG", href: "/weddingcards/home" },
  { label: "PACKAGES", href: "/pricing" },
  { label: "FAQs", href: "/faq" },
  { label: "REVIEWS", href: "/reviews" },
  { label: "FOR BUSINESS", href: "/for-business" },
];

const WA = (
  <a
    href={PACKAGE_SUPPORT_WHATSAPP}
    target="_blank"
    rel="noreferrer"
    className="font-semibold text-[#3d5a3e] underline underline-offset-2 hover:opacity-80"
  >
    WhatsApp
  </a>
);

const FAQS = [
  {
    category: "General",
    items: [
      {
        question: "Apa itu Wedinstudio?",
        answer:
          "Wedinstudio ialah platform kad kahwin digital Malaysia. Anda boleh cipta, edit, dan kongsikan jemputan kahwin anda melalui link — tanpa perlu cetak, pos, atau whatsapp satu per satu secara manual.",
      },
      {
        question: "Apa bezanya kad kahwin digital dengan kad kahwin biasa?",
        answer:
          "Kad kahwin digital dikongsi melalui link. Tetamu buka link tu dalam telefon atau komputer mereka, dan akan nampak jemputan yang cantik dengan animasi, muzik latar, butang lokasi GPS, dan RSVP online. Tiada kos cetak, tiada kad yang tertinggal di rumah.",
      },
    ],
  },
  {
    category: "Cara Guna",
    items: [
      {
        question: "Macam mana nak buat kad kahwin digital saya?",
        answer: (
          <>
            Mudah sahaja — ikut 4 langkah ini:
            <ol className="mt-2 space-y-1 list-decimal list-inside">
              <li>Pilih pakej yang sesuai (Standard, Premium, atau Signature)</li>
              <li>Isi maklumat majlis — nama pengantin, tarikh, tempat, dan lain-lain</li>
              <li>Buat pembayaran untuk aktifkan kad</li>
              <li>Kongsi link unik anda kepada tetamu melalui WhatsApp atau media sosial</li>
            </ol>
          </>
        ),
      },
      {
        question: "Adakah saya perlu tahu coding atau IT untuk guna Wedinstudio?",
        answer:
          "Langsung tidak perlu. Semua dilakukan melalui borang isian yang mudah. Anda cuma perlu taip maklumat majlis anda, dan Wedinstudio akan hasilkan kad yang cantik secara automatik.",
      },
      {
        question: "Boleh saya tengok dulu macam mana rupanya sebelum bayar?",
        answer:
          "Boleh. Selepas daftar dan isi maklumat asas, anda akan dapat preview kad anda secara percuma. Bayaran hanya diperlukan untuk aktifkan dan kongsikan link kepada tetamu.",
      },
    ],
  },
  {
    category: "Ciri-Ciri Kad",
    items: [
      {
        question: "Adakah tetamu boleh RSVP melalui kad kahwin digital?",
        answer:
          "Ya. Tetamu boleh sahkan kehadiran mereka terus melalui kad — pilih sama ada hadir atau tidak, nyatakan bilangan tetamu, dan tinggalkan nama mereka. Semua respons akan dikumpul dalam dashboard anda.",
      },
      {
        question: "Boleh tetamu tinggalkan ucapan untuk pengantin?",
        answer:
          "Ya. Terdapat ruangan ucapan khas dalam kad. Tetamu boleh tulis kata-kata tahniah atau doa restu, dan semuanya akan tersimpan dalam kad anda untuk anda baca bila-bila masa.",
      },
      {
        question: "Adakah saya dapat notifikasi email bila tetamu RSVP?",
        answer:
          "Ya — setiap kali tetamu hantar RSVP, anda akan terima notifikasi ke emel yang didaftarkan. Ciri ini aktif sebaik sahaja anda selesai bayaran.",
      },
      {
        question: "Boleh saya tambah muzik latar dalam kad?",
        answer:
          "Ya. Muzik latar tersedia dalam semua pakej — Standard, Premium, dan Signature. Tetamu boleh mute atau unmute ikut pilihan mereka.",
      },
      {
        question: "Boleh saya tambah galeri gambar?",
        answer:
          "Ya — Galeri Foto tersedia dalam pakej Premium dan Signature. Anda boleh muat naik gambar-gambar kenangan untuk dipaparkan dalam kad.",
      },
      {
        question: "Adakah ada ciri Dress Code dalam kad?",
        answer:
          "Ya — Dress Code tersedia dalam pakej Premium dan Signature. Anda boleh tetapkan warna atau tema pakaian untuk tetamu, lengkap dengan paparan palet warna.",
      },
      {
        question: "Boleh saya tambah ciri Money Gift atau QR bank?",
        answer:
          "Ya — Money Gift tersedia dalam pakej Premium dan Signature. Anda boleh muatnaik QR code akaun bank atau e-wallet untuk memudahkan tetamu menghantar hadiah wang.",
      },
      {
        question: "Apa itu Gift Corner dan Gift Registry?",
        answer:
          "Gift Corner dan Gift Registry adalah ciri eksklusif pakej Signature. Gift Corner membolehkan anda senaraikan item hadiah yang diingini, manakala Gift Registry membolehkan tetamu 'tandakan' hadiah yang mereka akan bawa — elakkan hadiah berganda.",
      },
    ],
  },
  {
    category: "Edit & Penyesuaian",
    items: [
      {
        question: "Boleh saya edit maklumat kad selepas bayar?",
        answer:
          "Ya. Anda bebas edit maklumat majlis — tempat, masa, muzik, galeri, tetapan RSVP, dan banyak lagi — bila-bila masa sebelum tarikh majlis. Selepas tarikh majlis berlalu, kad akan dikunci secara automatik (hanya baca sahaja).",
      },
      {
        question: "Boleh saya tukar nama pengantin selepas bayar?",
        answer:
          "Untuk nama kandungan (yang terpapar dalam kad), boleh ditukar bila-bila masa. Tetapi Cover Name — iaitu nama yang digunakan untuk membentuk link URL anda — tidak boleh ditukar selepas bayaran. Ini untuk memastikan link yang sudah dikongsi kepada tetamu tidak rosak atau digunakan semula.",
      },
      {
        question: "Boleh saya pilih bahasa untuk kad saya?",
        answer:
          "Ya. Anda boleh pilih sama ada Bahasa Melayu atau English untuk teks dalam kad anda.",
      },
      {
        question: "Berapa lama kad saya aktif?",
        answer:
          "Kad anda akan aktif selama tiga bulan selepas tarikh majlis anda. Contohnya, jika majlis pada 1 Ogos 2026, kad anda akan tamat tempoh pada 1 November 2026. Ini membolehkan tetamu yang terlewat membuka kad tetap dapat akses selepas majlis.",
      },
    ],
  },
  {
    category: "Perkongsian",
    items: [
      {
        question: "Macam mana nak kongsi kad kahwin digital saya kepada tetamu?",
        answer:
          "Anda akan dapat satu link unik seperti wedinstudio.com/invite/260814/amirul-amira. Kongsi link tu melalui WhatsApp, Telegram, Instagram, atau mana-mana platform mesej. Tetamu tekan link, kad terus terbuka — tiada app yang perlu dipasang.",
      },
      {
        question: "Adakah kad boleh dibuka dalam telefon?",
        answer:
          "Ya. Kad Wedinstudio direka khas untuk telefon bimbit. Ia juga berfungsi pada tablet dan komputer. Tetamu tidak perlu muat turun sebarang aplikasi.",
      },
    ],
  },
  {
    category: "Pakej & Bayaran",
    items: [
      {
        question: "Apakah pakej yang tersedia dan berapakah harganya?",
        answer: (
          <>
            Kami menawarkan tiga pakej:
            <ul className="mt-2 space-y-1.5">
              <li><span className="font-semibold text-gray-800">Standard — RM50:</span> RSVP &amp; Ucapan, Lokasi GPS, Countdown, Muzik Latar, Kalendar</li>
              <li><span className="font-semibold text-gray-800">Premium — RM60:</span> Semua Standard + Galeri Foto, Money Gift, Dress Code</li>
              <li><span className="font-semibold text-gray-800">Signature — RM70:</span> Semua Premium + Gift Corner &amp; Gift Registry</li>
            </ul>
            <p className="mt-2">Lawati halaman <a href="/pricing" className="font-semibold text-[#3d5a3e] underline underline-offset-2">Pakej</a> untuk perbandingan lengkap.</p>
          </>
        ),
      },
      {
        question: "Apa bezanya Standard, Premium, dan Signature?",
        answer:
          "Standard merangkumi semua ciri asas untuk jemputan yang lengkap. Premium menambah Galeri Foto, Money Gift, dan Dress Code — sesuai untuk pasangan yang mahu lebih personalisasi. Signature pula menambah Gift Corner dan Gift Registry untuk pengalaman jemputan yang paling lengkap.",
      },
      {
        question: "Apa yang perlu saya isi sebelum boleh buat bayaran?",
        answer:
          "Sebelum bayaran, anda perlu lengkapkan nama pengantin lelaki, nama pengantin perempuan, dan tarikh majlis dalam bahagian Edit. Maklumat ini diperlukan untuk menjana link URL unik kad anda. Selepas bayaran selesai, link URL tidak boleh diubah.",
      },
      {
        question: "Apakah kaedah pembayaran yang diterima?",
        answer:
          "Kami menerima pembayaran melalui FPX (semua bank Malaysia utama), kad kredit/debit, dan e-wallet melalui gateway pembayaran ToyyibPay dan Billplz. Pembayaran selamat dan serta-merta.",
      },
      {
        question: "Boleh saya tukar pakej selepas bayar?",
        answer: (
          <>
            Pakej tidak boleh ditukar selepas pembayaran dibuat. Jika anda perlukan bantuan lanjut, sila hubungi kami melalui {WA}.
          </>
        ),
      },
      {
        question: "Adakah ada caj tambahan selepas bayaran pertama?",
        answer:
          "Tidak. Bayaran adalah sekali sahaja. Tiada yuran bulanan, tiada caj tersembunyi. Kad anda akan kekal aktif sehingga tiga bulan selepas tarikh majlis.",
      },
    ],
  },
  {
    category: "Sokongan",
    items: [
      {
        question: "Macam mana nak hubungi Wedinstudio jika ada masalah?",
        answer: (
          <>
            Anda boleh hubungi kami terus melalui {WA}. Kami sedia membantu dari Isnin hingga Sabtu.
          </>
        ),
      },
    ],
  },
];

function FaqItem({ question, answer }: { question: string; answer: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
      >
        <span className="text-sm font-semibold text-gray-900">{question}</span>
        <span className="shrink-0 w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
          {open ? <Minus size={14} /> : <Plus size={14} />}
        </span>
      </button>
      <div
        className="overflow-hidden text-sm text-gray-500 leading-relaxed transition-all duration-300"
        style={{ maxHeight: open ? 500 : 0, opacity: open ? 1 : 0, paddingBottom: open ? 20 : 0 }}
      >
        {answer}
      </div>
    </div>
  );
}

export default function FaqPage() {
  usePageMeta({
    title: "Soalan Lazim (FAQ) Kad Kahwin Digital | Wedinstudio",
    description: "Jawapan kepada soalan-soalan lazim tentang kad kahwin digital Wedinstudio — cara buat, harga, RSVP, editing, tempoh aktif, dan lebih banyak lagi.",
    canonical: "https://wedinstudio.com/faq",
  });
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <SiteHeader
        navItems={NAV_ITEMS}
        activeLabel="FAQs"
        navOpen={navOpen}
        setNavOpen={setNavOpen}
        rightSlot={
          user ? (
            <button
              onClick={() => navigate(dashboardPathForUser(user))}
              className="inline-flex items-center justify-center text-gray-700 hover:text-gray-900 transition-colors"
              aria-label="Dashboard"
              title="Dashboard"
            >
              <User size={18} />
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate("/login")}
                className="text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors tracking-widest"
              >
                LOG IN
              </button>
              <button
                onClick={() => navigate("/register")}
                className="hidden sm:inline-flex items-center gap-1.5 bg-[#3d5a3e] text-white text-xs font-bold px-4 py-2 rounded hover:bg-[#2d4330] transition-colors tracking-widest"
              >
                <Heart size={12} />
                SIGN UP
              </button>
            </>
          )
        }
      />

      <SharedNavDrawer
        navItems={NAV_ITEMS}
        navOpen={navOpen}
        setNavOpen={setNavOpen}
        drawerFooter={
          user ? (
            <div className="px-5 py-5 flex flex-col gap-2">
              <button
                onClick={() => { navigate(dashboardPathForUser(user)); setNavOpen(false); }}
                className="w-full rounded bg-[#3d5a3e] text-white text-sm font-bold py-2.5 tracking-widest"
              >
                GO TO DASHBOARD
              </button>
            </div>
          ) : (
            <div className="px-5 py-5 flex flex-col gap-2">
              <button
                onClick={() => { navigate("/register"); setNavOpen(false); }}
                className="w-full rounded bg-[#3d5a3e] text-white text-sm font-bold py-2.5 tracking-widest"
              >
                SIGN UP FREE
              </button>
              <button
                onClick={() => { navigate("/login"); setNavOpen(false); }}
                className="w-full rounded border border-gray-200 text-sm font-bold py-2.5 tracking-widest text-gray-600"
              >
                LOG IN
              </button>
            </div>
          )
        }
      />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-white py-6 px-4 sm:px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">Soalan Lazim (FAQ)</h1>
            <p className="mt-2 text-base text-gray-500 max-w-xl mx-auto leading-relaxed">
              Semua yang anda perlu tahu tentang kad kahwin digital Wedinstudio.
            </p>
          </div>
        </section>

        {/* FAQ Categories */}
        <section className="pt-5 pb-10 px-4 sm:px-6 bg-gray-50">
          <div className="max-w-2xl mx-auto space-y-6">
            {FAQS.map((category) => (
              <div key={category.category}>
                <h2 className="text-xs font-bold tracking-widest text-[#3d5a3e] uppercase mb-3">{category.category}</h2>
                <div className="rounded-2xl bg-white border border-gray-100 shadow-sm px-5 sm:px-8">
                  {category.items.map((faq) => (
                    <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-12 px-4 sm:px-6 bg-white text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Ada soalan lain?
            </h2>
            <p className="mt-3 text-sm text-gray-500 max-w-md mx-auto">
              Hubungi kami terus melalui WhatsApp — kami sedia bantu dari Isnin hingga Sabtu.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={PACKAGE_SUPPORT_WHATSAPP}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-[#3d5a3e] text-white text-xs font-bold tracking-widest px-8 py-4 rounded hover:bg-[#2d4330] transition-colors"
              >
                Hubungi Kami di WhatsApp
              </a>
              <button
                onClick={() => navigate("/editor")}
                className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-700 text-xs font-bold tracking-widest px-8 py-4 rounded hover:bg-gray-50 transition-colors"
              >
                Buat Kad Kahwin Saya
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />

      <div className="bg-[#2d4330] text-white/60 text-xs text-center py-4 tracking-wide">
        © {new Date().getFullYear()} Wedinstudio · All rights reserved
      </div>
    </div>
  );
}
