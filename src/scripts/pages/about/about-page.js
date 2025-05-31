// src/pages/about/about-page.js
import L from "leaflet";

export default class AboutPage {
  async render() {
    return `
      <section class="container">
        <h1>About Page</h1>

        <div class="story-item">
          <h3>isi curhatan saat membuat project: </h3> 
          <p>
            Aplikasi ini merupakan Single Page Application (SPA) berbasis JavaScript yang memungkinkan pengguna untuk membuat cerita (story) lengkap dengan gambar dan lokasi secara interaktif yang bisa dilihat sama orang lain yang menggunakan aplikasi ini.
          </p>
          <ul>
            <li>Pada Project ini saya menggunakan webpack</li>
            <li>Dan untuk peta saya menggunakan leaflet</li>
            <li>Menggunakan API Dicoding Story sebagai backend untuk menyimpan dan mengambil data cerita.</li>
            <li>Untuk styling saya menggunakan CSS</li>
            <li>Saya selalu gagal terus saat menyambungkan API dan akhirnya sekarang bisa</li>
            <li>Butuh waktu 9 Hari untuk menyelesaikan project ini :( </li>
          </ul>

          <p>🗺️ Di bawah ini adalah peta interaktif yang dapat Anda geser dan zoom untuk melihat lokasi.</p>
          <div id="map" style="height: 400px; margin-top: 1rem;"></div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const map = L.map("map").setView([51.505, -0.09], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    this.setupSkipToContent(); // Panggil method setelah render
  }

  setupSkipToContent() {
  const mainContent = document.querySelector("#main-content"); 
  const skipLink = document.querySelector(".skip-link"); 

  if (skipLink && mainContent) {
    skipLink.addEventListener("click", function (event) {
      event.preventDefault(); // Mencegah refresh halaman
      skipLink.blur(); // Menghilangkan fokus dari tautan skip
      mainContent.focus(); // Fokus ke konten utama
      mainContent.scrollIntoView(); // Scroll ke konten utama
    });
  }
}
}
