MASTER PRD TEKNIS: CREATICXA HUB (MVP)
1. Ringkasan Produk
Creaticxa Hub adalah single workspace internal agensi untuk mengelola alur kerja konten. Sistem ini difokuskan pada MVP (Minimum Viable Product) yang menyelesaikan masalah data silo antara tim Strategist, Planner, dan Production, tanpa fitur otomatisasi yang over-engineered. Konsep utama UI/UX adalah memadukan kebersihan visual ala Notion dengan fungsionalitas manajemen tugas ala Trello.

2. Tech Stack & Arsitektur
AI diinstruksikan untuk mematuhi tumpukan teknologi dan aturan arsitektur berikut secara ketat:

Frontend: React + TypeScript + Vite.

Styling: Tailwind CSS.

State Management / Data Fetching: Supabase Client.

Komponen Tambahan Wajib: * @dnd-kit/core (untuk Kanban Drag & Drop)

framer-motion (untuk animasi micro-interactions & Drawer)

lucide-react (untuk ikon UI)

Aturan Arsitektur Komponen (Sangat Penting): Sistem harus dibangun dengan arsitektur kode yang sangat modular. Pisahkan antarmuka (UI) untuk membaca data (viewing) dan antarmuka untuk mengubah data (editing) ke dalam file yang berbeda. Jangan menggabungkan form input dengan teks presentasi statis dalam satu file komponen yang sama. Misalnya, buat file ClientDetailView.tsx terpisah dari ClientEditForm.tsx.

Struktur Folder Standar:

/src/pages/ (Halaman utama)

/src/components/ (UI reusable: tombol, kartu)

/src/features/ (Modul fitur spesifik yang berisi pemisahan View & Edit)

/src/services/ (Koneksi API / Supabase)

3. Skema Database (Supabase)
Gunakan skema relasional berikut (tipe data disesuaikan di Supabase):

Tabel 1: clients

id (UUID, Primary Key)

name (String)

logo_url (String - URL dari Supabase Storage)

industry (String)

description (Text)

value_proposition (Text)

brand_voice (Text)

content_pillars (Text)

gdrive_link (String)

design_link (String)

pic_name (String)

pic_whatsapp (String)

brand_guideline_link (String)

is_archived (Boolean, default: false)

created_at (Timestamp)

Tabel 2: content_ideas

id (UUID, Primary Key)

client_id (UUID, Foreign Key ke clients)

title (String)

description (Text)

format (String)

reference_link (String)

funnel_stage (String)

content_pillar (String)

status (String - enum: INBOX, APPROVED, REVISION)

created_at (Timestamp)

Tabel 3: productions

id (UUID, Primary Key)

idea_id (UUID, Foreign Key ke content_ideas)

client_id (UUID, Foreign Key ke clients)

title (String)

format (String)

script_hook (Text)

script_body (Text)

script_cta (Text)

visual_direction (Text)

needs_talent (String)

needs_location (String)

needs_props (Text)

take_date (Date, nullable)

post_date (Date, nullable)

status (String - enum: WAITING SCHEDULE, ON SHOOTING, ON EDITING, INTERNAL QC, WAIT CLIENT APPROVAL, REVISION, APPROVED, POSTING)

revision_notes (Text)

created_at (Timestamp)

4. Spesifikasi Modul UI/UX
Modul 1: Dashboard (Morning Briefing)
Konsep: Layar utama yang bersifat action-oriented.

Blok Kiri: Quick Actions (Tombol + Klien Baru, + Ide Baru).

Blok Tengah: Action Required. Menampilkan maksimal 5 Ide dengan status INBOX dan Naskah dengan status REVISION. Menggunakan ulang (import) komponen Card dari modul bersangkutan.

Blok Kanan: Upcoming Posting. Menampilkan konten dari tabel productions di mana post_date berada dalam rentang Hari Ini hingga H+7.

UX: Gunakan Skeleton Loading saat fetching data.

Modul 2: Brand Foundation (Clients)
Tampilan Utama: Grid layout menampilkan kartu Klien (Logo, Nama, Industri, Badge Aktif). Terdapat search bar dan filter toggle (Aktif/Arsip).

Aksi Buka: Klik kartu memunculkan Drawer dari sisi kanan.

Drawer Behavior: * Default state: Komponen View-only (Teks bersih, URL dapat diklik).

Edit state: Terdapat tombol/tab untuk mengalihkan Drawer ke mode form Edit.

Aksi Simpan: Fitur unggah gambar logo menggunakan Supabase Storage, mengubah status Klien menggunakan metode soft-delete (toggle is_archived).

Modul 3: Content Planning (Ideas)
Tampilan Utama: Navigasi berbasis Tab (INBOX dan APPROVED). Terdapat dropdown filter berdasarkan Klien.

Aksi Buka: Membuka Drawer atau Modal terpisah (View & Edit dipisah).

Pembuatan Ide: Form memuat Klien, Judul, Deskripsi, Format, Funnel, Pilar, dan Link Referensi.

Magic Trigger (Flow): Saat tombol "Approve" ditekan:

Ubah status ide menjadi APPROVED.

Sistem otomatis membuat rekaman baru (duplicate) di tabel productions dengan status awal WAITING SCHEDULE, mewariskan client_id dan title.

Modul 4: Production Content (The Core)
Tampilan Utama: Kanban Board horizontal scroll dengan 8 kolom status secara berurutan.

Card UI: Menampilkan Judul, Klien (Warna Badge), Tanggal Posting, dan Indikator H-1 (Border merah jika dekat deadline).

Interaksi Kanban: Drag-and-drop antar status. Validasi: Tolak drop ke kolom eksekusi jika take_date belum diisi (kembalikan kartu dan munculkan toast error).

Ruang Kerja (Drawer): Saat kartu diklik, buka Drawer yang memiliki 3 Tab:

Tab SCRIPT: Form untuk Hook, Body, CTA, Visual Direction. Sediakan tombol "Generate Client View".

Tab NEEDS: Form text untuk Talent, Location, Props.

Tab SCHEDULE: Date picker untuk Take & Post Date, kolom Revision Notes.

Client View Link: Halaman dinamis (route khusus: /view/:id) yang read-only, tanpa navigasi aplikasi, menampilkan konten Script dengan rapi untuk klien.

Modul 5: Schedule Production (Calendar)
Tampilan Utama: Kalender Bulanan (Grid).

Data: Read-only, menarik data take_date dan post_date dari tabel productions. Sembunyikan naskah jika kliennya berstatus is_archived.

UX: Jadwal ditampilkan dalam bentuk pill warna (Kuning = Take, Hijau = Post). Batasi 3 pill per kotak hari, gunakan teks "+X lainnya" jika lebih.

Interaksi: Menekan pill akan membuka Drawer Produksi yang sama persis seperti di Modul 4.

5. Panduan Eksekusi untuk AI (Milestones)
(Berikan instruksi ini kepada AI per fase. Jangan mengeksekusi fase berikutnya sebelum fase saat ini selesai dan bebas bug).

Fase 1: Inisialisasi & Layout. Setup Vite, Tailwind, dan struktur folder. Buat komponen Layouting utama (Sidebar & Topbar) statis, konfigurasi Router dasar untuk 5 halaman.

Fase 2: Supabase & Modul Client. Setup koneksi Supabase. Buat CRUD lengkap untuk Modul Brand Foundation. Implementasikan Drawer, pemisahan View/Edit components, dan Supabase Storage untuk unggah logo.

Fase 3: Modul Ide Konten. Buat antarmuka Tab dan form Ide. Buat fungsi CRUD dan implementasikan logika Magic Trigger (Pemisahan data ke tabel produksi).

Fase 4: Modul Produksi Kanban. Integrasikan @dnd-kit/core. Buat 8 kolom status. Buat logika drag-and-drop dengan validasi. Buat detail Drawer 3 Tab dan route Client View.

Fase 5: Dashboard & Kalender. Buat UI Kalender read-only dengan data fetching. Rangkai Dashboard dengan mengimpor ulang komponen Card dan daftar dari modul sebelumnya.