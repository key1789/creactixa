# CREACTIXA Hub

Dashboard operasional konten untuk alur kerja editorial:

- Brand Foundation (manajemen client)
- Content Planning (ide dari INBOX ke APPROVED)
- Production Board (kanban status produksi)
- Schedule Calendar (take date dan post date)
- Client Script View (link share ke client)
- Activity Log (audit trail aktivitas penting)
- Command Palette (`Ctrl/Cmd + K`)
- Saved Views (preset filter per halaman)
- Notification Center sederhana (berbasis activity log)
- Auth + role-based access control (RBAC)

## Tech Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS
- Framer Motion
- Supabase (database + storage + auth)

## Setup Environment

Buat file `.env.local` di root project:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Scripts

- `npm run dev` menjalankan development server
- `npm run build` menjalankan type-check dan build production
- `npm run lint` menjalankan ESLint
- `npm run preview` preview build production secara lokal

## Menjalankan Project

```bash
npm install
npm run dev
```

Lalu buka `http://localhost:5173`.

## Catatan

- Pastikan bucket storage `brand-logos` tersedia di Supabase untuk upload logo client.
- Jalankan migration `supabase/migrations/20260425173800_create_activity_logs.sql` untuk fitur Activity Log.
- Route `/view/:id` dipakai untuk membagikan script production ke client.
