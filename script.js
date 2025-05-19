// script.js
document.addEventListener('DOMContentLoaded', () => {
    const enableNotificationsButton = document.getElementById('enableNotifications');
    const jadwalHariIniList = document.getElementById('jadwalHariIniList');
    const jadwalLengkapList = document.getElementById('jadwalLengkapList');
    let serviceWorkerRegistration;

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

    function tampilkanJadwal() {
        const today = new Date().getDay();
        jadwalHariIniList.innerHTML = '';
        jadwalLengkapList.innerHTML = '';

        jadwalPiket.sort((a,b) => { // Urutkan jadwal
            if(a.day !== b.day) return a.day - b.day;
            if(a.hour !== b.hour) return a.hour - b.hour;
            return a.minute - b.minute;
        });

        jadwalPiket.forEach(item => {
            const listItemText = `${namaHari[item.day]}, ${String(item.hour).padStart(2, '0')}:${String(item.minute).padStart(2, '0')} - ${item.person}: ${item.task}`;
            
            const liLengkap = document.createElement('li');
            liLengkap.textContent = listItemText;
            jadwalLengkapList.appendChild(liLengkap);

            if (item.day === today) {
                const liHariIni = document.createElement('li');
                liHariIni.textContent = `${String(item.hour).padStart(2, '0')}:${String(item.minute).padStart(2, '0')} - ${item.person}: ${item.task}`;
                jadwalHariIniList.appendChild(liHariIni);
            }
        });
        if (jadwalHariIniList.children.length === 0) {
            jadwalHariIniList.innerHTML = '<li>Tidak ada jadwal piket hari ini.</li>';
        }
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
    tampilkanJadwal();
});