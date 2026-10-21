# Petualangan Matematika

Game edukasi platformer 2D berbasis HTML, CSS, JavaScript, Firebase Authentication, dan Cloud Firestore.

## Struktur file
- `index.html`: halaman permainan dan form identitas siswa.
- `style.css`: tampilan responsif dan pixel-art UI.
- `game.js`: gerakan, collision, musuh, soal, skor, dan penyimpanan hasil.
- `teacher.html`: halaman login dan tabel hasil guru.
- `teacher.js`: autentikasi guru dan pembacaan hasil.
- `firebase.js`: inisialisasi Firebase serta fungsi Auth/Firestore.
- `firebase-config.js`: konfigurasi aplikasi Firebase.
- `firestore.rules`: aturan akses database.

## A. Konfigurasi Firebase
1. Buka https://console.firebase.google.com/ lalu buat project.
2. Tambahkan aplikasi Web dan salin konfigurasi ke `firebase-config.js`.
3. Di Build > Authentication > Sign-in method, aktifkan **Anonymous** dan **Email/Password**.
4. Di Build > Firestore Database, buat database.
5. Di Firestore > Rules, salin isi `firestore.rules`, lalu ganti `UID_GURU_1` dengan UID akun guru.
6. Di Authentication > Users, buat akun guru. Salin UID akun tersebut ke rules. Publikasikan rules.
7. Jalankan aplikasi melalui server lokal/hosting (jangan membuka `index.html` langsung dengan `file://`, karena JavaScript module perlu server HTTP/HTTPS).

## B. Jalankan di komputer
Pilihan sederhana dengan Python:
```bash
python3 -m http.server 8000
```
Lalu buka `http://localhost:8000`. Jalankan perintah dari folder project ini.

## C. Deploy online dengan GitHub Pages
1. Buat repository GitHub baru dan unggah semua file project.
2. Buka Settings > Pages, pilih deploy dari branch utama dan folder root.
3. Simpan. Setelah proses selesai, gunakan URL yang diberikan GitHub Pages.
4. Uji URL HTTPS dari perangkat siswa dan perangkat guru.

Alternatif hosting statis: Firebase Hosting atau Vercel. Pastikan file `firebase-config.js` ikut ter-deploy.

## D. Membuat akun guru
1. Di Firebase Console > Authentication > Users, tambahkan pengguna dengan email/password.
2. Salin UID pengguna tersebut.
3. Ganti `UID_GURU_1` di `firestore.rules` dengan UID tersebut, misalnya `abc123...`.
4. Publish rules. Hanya UID yang terdaftar yang dapat membaca koleksi `results`.
5. Buka `teacher.html` di URL hosting, lalu login.

## E. Cara bermain
1. Siswa memasukkan nama dan memilih kelas.
2. Gerakkan karakter dengan panah kiri/kanan, lompat dengan spasi.
3. Dekati musuh untuk memunculkan soal.
4. Jawaban benar memberikan 10 poin dan mengalahkan musuh.
5. Setelah empat musuh dikalahkan, lanjutkan ke bendera di sisi kanan untuk menyelesaikan level.
6. Hasil dikirim ke Firestore dan dapat dilihat guru.

## Catatan keamanan penting
- Firebase web config bukan rahasia; Firestore Rules adalah lapisan akses utama.
- Rules membatasi baca hasil kepada UID guru yang ditentukan. Siswa tidak dapat membaca atau mengubah hasil yang sudah tersimpan.
- Versi ini merupakan prototipe kelas. Karena game berjalan di browser siswa, siswa yang paham developer tools dapat memalsukan nilai yang dikirim. Validasi di Firestore Rules membatasi format dan rentang, tetapi tidak membuktikan bahwa setiap jawaban benar-benar dikerjakan.
- Untuk penilaian resmi, gunakan backend tepercaya (mis. Cloud Functions) yang mengeluarkan soal dan memvalidasi jawaban di server, serta jangan menerima skor mentah dari browser.
- Jangan kumpulkan data pribadi yang tidak diperlukan. Nama dan kelas siswa tetap merupakan data yang perlu dijaga.
