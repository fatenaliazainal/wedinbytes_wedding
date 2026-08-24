# Database Backup & Recovery

Dokumen ini menerangkan status backup semasa, kandungan backup, dan cara
mengambil semula data jika berlaku masalah.

## Status semasa

### Yang sudah tersedia

API server mempunyai script backup production:

```bash
pnpm --filter @workspace/api-server run backup:db
```

Script ini:

1. Hanya berjalan apabila `NODE_ENV=production`.
2. Menggunakan `pg_dump` untuk membuat salinan PostgreSQL.
3. Menghasilkan SQL plain-text dan memampatkannya dengan gzip.
4. Upload fail `.sql.gz` ke private Cloudflare R2.
5. Memadam fail sementara selepas upload berjaya.
6. Verify saiz object selepas upload.
7. Menyimpan 30 backup terbaru di R2 dan membersihkan backup lama.

Backup R2 disimpan di bawah prefix:

```text
db-backups/weekly/
```

Script memerlukan `DATABASE_URL`, credential R2, dan
`CF_R2_BACKUP_BUCKET_NAME`. Jika mana-mana variable tidak tersedia, backup
akan berhenti tanpa menghasilkan fail separa.

### Yang belum tersedia

Perkara berikut belum aktif:

- GitHub Secrets production belum dimasukkan ke repository GitHub.
- Manual run pertama dan restore test ke temporary database belum dibuat.
- Fail `backups/backup-YYYY-MM-DD.sql` dalam repository.
- Backup berasingan untuk fail media di R2.
- Restore catalog secara satu klik.

Workflow GitHub sudah ditambah dalam `.github/workflows/database-backup.yml`.
Ia hanya akan berjalan selepas workflow berada di default branch dan semua
GitHub Secrets yang diperlukan telah dikonfigurasi. Buat masa ini backup
boleh dijalankan melalui script production atau manual workflow selepas
konfigurasi tersebut lengkap.

## Apa yang diliputi oleh backup PostgreSQL

`pg_dump` semasa membuat backup schema dan data PostgreSQL, termasuk:

- Users dan admin accounts
- Business profiles, business clients dan shared forms
- Invitations dan semua kandungan invitation
- Orders dan payment references/status
- Pricing packages dan pricing features
- Card designs dan catalog settings
- Wax seals
- RSVP dan wishes
- Gift registry
- Reviews
- Site settings dan payment method configuration
- Indexes, constraints, defaults dan sequence ID

Table operasi `session` dan `rate_limit_hits` dikecualikan kerana kedua-duanya
ialah data sementara. User boleh login semula selepas restore dan rate limit
counter tidak perlu dipulihkan.

## Apa yang tidak diliputi

PostgreSQL hanya menyimpan URL atau object key untuk fail R2. `pg_dump`
tidak menyimpan bytes untuk:

- Card preview, thumbnail dan envelope images
- Invitation gallery images
- Business logos dan cover images
- Initials artwork
- Gift QR images
- Wax seal images
- Music, audio atau video
- Email blast banner images

Jika database dipulihkan tetapi fail R2 hilang, rekod catalog masih ada
tetapi imej atau media mungkin tidak dapat dipaparkan. Backup R2 media
perlu dirancang sebagai proses berasingan.

## Cara retrieve backup dari R2

Backup database berada dalam private R2 bucket, bukan melalui public image
URL.

1. Buka Cloudflare R2 dan pilih backup bucket.
2. Buka prefix `db-backups/weekly/`.
3. Pilih fail dengan tarikh sebelum masalah berlaku.
4. Download fail `wedinstudio-db-YYYY-MM-DD-HHmm.sql.gz` ke komputer yang
   dipercayai.
5. Jangan share fail tersebut atau commit fail SQL yang belum dienkripsi
   ke GitHub.

Semak fail sebelum extract:

```bash
gzip -t wedinstudio-db-YYYY-MM-DD-HHmm.sql.gz
```

Extract ke folder yang private:

```bash
gzip -dk wedinstudio-db-YYYY-MM-DD-HHmm.sql.gz
```

Hasilnya ialah fail SQL plain-text yang mengandungi schema dan data.
Padamkan fail plain-text selepas selesai digunakan:

```bash
shred -u wedinstudio-db-YYYY-MM-DD-HHmm.sql
```

Jika `shred` tidak tersedia pada sistem, padamkan fail secara manual dan
kosongkan Trash/Recycle Bin.

## Restore penuh database

### Peraturan keselamatan

- Jangan restore terus ke production database yang sedang digunakan.
- Untuk kes besar, hentikan sementara proses yang menulis ke database.
- Restore dahulu ke database temporary atau database replacement.
- Pastikan backup dipilih daripada tarikh yang betul.
- Jangan jalankan arahan restore tanpa pengesahan yang jelas.

Backup semasa ialah plain SQL. Untuk restore ke database yang kosong:

```bash
psql "$TARGET_DATABASE_URL" \
  -v ON_ERROR_STOP=1 \
  -f wedinstudio-db-YYYY-MM-DD-HHmm.sql
```

`TARGET_DATABASE_URL` mesti menunjuk ke database temporary atau replacement
yang telah disahkan, bukan URL production live secara tidak sengaja.

Selepas restore:

1. Semak table dan row count.
2. Pastikan user/admin boleh login.
3. Semak catalog dan preview card.
4. Semak invitation public.
5. Semak order dan payment history.
6. Semak RSVP dan wishes.
7. Semak link serta media R2.
8. Hanya selepas semua pemeriksaan lulus, jadikan database replacement
   sebagai database yang digunakan aplikasi.

## Restore catalog sahaja

Backup semasa ialah full database dump dan bukan export catalog khusus.
Jangan terus pipe full dump ke database live kerana ia boleh memberi kesan
kepada order, payment, user, invitation dan RSVP.

Cara selamat:

1. Restore full dump ke database temporary.
2. Bandingkan catalog temporary dengan catalog semasa.
3. Pulihkan data catalog yang diperlukan sahaja:
   - `card_design`
   - `wax_seal`
   - `pricing_package`
   - `pricing_feature`
   - `card`
4. Pulihkan fail media R2 yang sepadan.
5. Semak catalog dalam Admin dan public homepage.
6. Jangan ubah table order atau payment semasa catalog recovery.

Catalog-only restore yang lebih mudah boleh ditambah kemudian sebagai
export/import khusus, tetapi ia mesti mengambil kira foreign key, sequence
ID, serta hubungan antara design dan fail media R2.

## GitHub Actions

Automation GitHub menggunakan jadual Malaysia 5:00 pagi:

```yaml
schedule:
  - cron: "0 21 * * *"
```

Workflow juga menyediakan `workflow_dispatch` untuk manual run. Scheduled
workflow perlu berada di default branch repository GitHub sebelum jadual
automatiknya aktif. GitHub Actions boleh lewat sedikit dan tidak patut
dianggap sebagai satu-satunya salinan backup.

GitHub Actions memerlukan GitHub Secrets berikut:

- `PRODUCTION_DATABASE_URL`
- `CF_R2_ACCOUNT_ID`
- `CF_R2_ACCESS_KEY_ID`
- `CF_R2_SECRET_ACCESS_KEY`
- `CF_R2_BACKUP_BUCKET_NAME`

Secret production database perlu menunjuk ke database production yang betul,
bukan development database.

Gunakan database role khas yang hanya boleh membaca data backup dan tidak
mempunyai hak `INSERT`, `UPDATE`, `DELETE`, `CREATE`, atau `DROP`. R2 access
key untuk workflow perlu dihadkan kepada private backup bucket dan hanya
mempunyai hak list, upload, read metadata, serta delete untuk prefix backup.

Backup yang mengandungi data sebenar tidak patut disimpan sebagai SQL
plain-text dalam Git history. Jika GitHub perlu digunakan:

- Gunakan private repository.
- Compress dan encrypt backup sebelum push.
- Simpan encryption key hanya sebagai GitHub Secret.
- Jangan log `DATABASE_URL` atau credential.
- Simpan manifest/checksum bersama backup.
- Tetapkan retention supaya repository tidak membesar tanpa had.

Private R2 dengan encryption dan retention kekal lebih sesuai untuk fail
backup sebenar; GitHub digunakan untuk automation dan rekod run, bukan
menyimpan SQL customer secara plain-text dalam Git history.