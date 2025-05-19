// script.js
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded. Inisialisasi PWA Jadwal Piket.');

    const enableNotificationsButton = document.getElementById('enableNotifications');
    const jadwalHariIniList = document.getElementById('jadwalHariIniList');
    const jadwalLengkapList = document.getElementById('jadwalLengkapList');
    let serviceWorkerRegistration;

    if (!enableNotificationsButton || !jadwalHariIniList || !jadwalLengkapList) {
        console.error('Satu atau lebih elemen UI penting tidak ditemukan. Periksa ID HTML Anda.');
        // Anda bisa menghentikan eksekusi di sini jika elemen ini krusial
    } else {
        console.log('Elemen UI dasar berhasil ditemukan.');
    }

    const namaHari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

    // Contoh Jadwal Piket (day: 0=Minggu, 1=Senin, ..., 6=Sabtu)
    const jadwalPiket = [
        { day: 1, hour: 8, minute: 0, person: "Andi", task: "Sapu & Pel Lantai Utama" },
        { day: 1, hour: 14, minute: 0, person: "Budi", task: "Bersihkan Toilet & Wastafel" },
        { day: 2, hour: 8, minute: 30, person: "Citra", task: "Buang Sampah & Ganti Plastik" },
        { day: 2, hour: 15, minute: 0, person: "Dewi", task: "Lap Meja & Kursi" },
        { day: 3, hour: 9, minute: 0, person: "Eko", task: "Bersihkan Area Dapur" },
        { day: 4, hour: 8, minute: 0, person: "Fani", task: "Siram Tanaman & Tata Pot" },
        { day: 5, hour: 10, minute: 0, person: "Gilang", task: "Cek & Isi Ulang Perlengkapan (Sabun, Tisu)" },
        // Untuk testing, tambahkan jadwal yang akan datang dalam 1-2 menit dari sekarang:
        { day: new Date(Date.now() + 10 * 60000).getDay(), hour: new Date(Date.now() + 10 * 60000).getHours(), minute: new Date(Date.now() + 10 * 60000).getMinutes(), person: "Tester", task: "Tes Notifikasi 10 Menit" }
    ];    
    console.log('Data jadwal piket awal:', JSON.parse(JSON.stringify(jadwalPiket)));

    function tampilkanJadwal() {
        console.log('Memanggil tampilkanJadwal().');
        const today = new Date().getDay();
        jadwalHariIniList.innerHTML = '';
        jadwalLengkapList.innerHTML = '';

        if (!jadwalPiket || jadwalPiket.length === 0) {
            console.warn('Array jadwalPiket kosong atau tidak terdefinisi.');
            const liEmptyLengkap = document.createElement('li');
            liEmptyLengkap.textContent = 'Tidak ada data jadwal yang tersedia.';
            liEmptyLengkap.classList.add('no-schedule-message');
            jadwalLengkapList.appendChild(liEmptyLengkap);

            const liEmptyHariIni = document.createElement('li');
            liEmptyHariIni.textContent = 'Tidak ada jadwal piket untuk hari ini.';
            liEmptyHariIni.classList.add('no-schedule-message');
            jadwalHariIniList.appendChild(liEmptyHariIni);
            return;
        }

        // Salin array sebelum diurutkan agar tidak memodifikasi array asli jika tidak diinginkan
        const jadwalUrut = [...jadwalPiket].sort((a, b) => {
            if (a.day !== b.day) return a.day - b.day;
            if (a.hour !== b.hour) return a.hour - b.hour;
            return a.minute - b.minute;
        });
        console.log('Jadwal setelah diurutkan:', JSON.parse(JSON.stringify(jadwalUrut)));

        let adaJadwalHariIni = false;
        jadwalUrut.forEach(item => {
            const listItemText = `${namaHari[item.day]}, ${String(item.hour).padStart(2, '0')}:${String(item.minute).padStart(2, '0')} - ${item.person}: ${item.task}`;
            
            const liLengkap = document.createElement('li');
            liLengkap.textContent = listItemText;
            jadwalLengkapList.appendChild(liLengkap);

            if (item.day === today) {
                const liHariIni = document.createElement('li');
                liHariIni.textContent = `${String(item.hour).padStart(2, '0')}:${String(item.minute).padStart(2, '0')} - ${item.person}: ${item.task}`;
                jadwalHariIniList.appendChild(liHariIni);
                adaJadwalHariIni = true;
            }
        });

        if (!adaJadwalHariIni) {
            const li = document.createElement('li');
            li.textContent = 'Tidak ada jadwal piket untuk hari ini.';
            li.classList.add('no-schedule-message');
            jadwalHariIniList.appendChild(li);
        }
        console.log('tampilkanJadwal() selesai.');
    }

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/pwa-jadwal-piket/sw.js', { scope: '/pwa-jadwal-piket/' })
            .then(registration => {
                console.log('Service Worker berhasil diregistrasi:', registration);
                serviceWorkerRegistration = registration;
                checkNotificationPermission(false); // Cek izin tanpa langsung meminta
            })
            .catch(error => console.error('Registrasi Service Worker gagal:', error));
    }

    function checkNotificationPermission(requestIfDefault = true) {
        if (!('Notification' in window) || !serviceWorkerRegistration) {
            enableNotificationsButton.style.display = 'none';
            return;
        }
        if (Notification.permission === 'granted') {
            enableNotificationsButton.style.display = 'none';
            setInterval(cekJadwalDanKirimNotifikasi, 60000); // Cek setiap menit
            cekJadwalDanKirimNotifikasi(); // Cek langsung
        } else if (Notification.permission === 'denied') {
            enableNotificationsButton.style.display = 'block';
            enableNotificationsButton.textContent = 'Izin Notifikasi Ditolak';
            enableNotificationsButton.disabled = true;
        } else { // default
            enableNotificationsButton.style.display = 'block';
            enableNotificationsButton.textContent = 'Aktifkan Notifikasi Piket';
            if (requestIfDefault) requestNotificationPermission();
        }
    }

    function requestNotificationPermission() {
        Notification.requestPermission().then(permission => {
            checkNotificationPermission(false); // Update UI berdasarkan hasil baru
            if (permission === 'granted') {
                console.log('Izin notifikasi diberikan!');
            }
        });
    }

    enableNotificationsButton.addEventListener('click', requestNotificationPermission);

    const notifiedTasksToday = new Set();

    function cekJadwalDanKirimNotifikasi() {
        if (Notification.permission !== 'granted' || !serviceWorkerRegistration) return;

        const now = new Date();
        const currentDay = now.getDay();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // Reset notifiedTasksToday setiap tengah malam
        if (currentHour === 0 && currentMinute === 0) notifiedTasksToday.clear();

        jadwalPiket.forEach(item => {
            const taskIdentifier = `${item.day}-${item.hour}-${item.minute}-${item.person}`;
            if (item.day === currentDay && item.hour === currentHour && item.minute === currentMinute) {
                if (!notifiedTasksToday.has(taskIdentifier)) {
                    const title = `🔔 Waktunya Piket!`;
                    const options = {
                        body: `${item.person}, saatnya ${item.task}.`,
                        icon: '/pwa-jadwal-piket/icons/icon-192x192.png',
                        badge: '/pwa-jadwal-piket/icons/icon-192x192.png', // Untuk Android
                        tag: taskIdentifier, // Mencegah notifikasi duplikat untuk task yang sama
                        data: { url: '/pwa-jadwal-piket/index.html' } // URL untuk dibuka saat notifikasi diklik
                    };
                    serviceWorkerRegistration.showNotification(title, options)
                        .then(() => notifiedTasksToday.add(taskIdentifier));
                }
            }
        });
    }
    
    try {
        tampilkanJadwal();
    } catch (error) {
        console.error('Error saat menjalankan tampilkanJadwal():', error);
        if(jadwalLengkapList) jadwalLengkapList.innerHTML = '<li>Terjadi kesalahan saat memuat jadwal. Periksa konsol.</li>';
        if(jadwalHariIniList) jadwalHariIniList.innerHTML = '<li>Terjadi kesalahan saat memuat jadwal. Periksa konsol.</li>';
    }
});