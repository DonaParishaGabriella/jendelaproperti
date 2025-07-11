// script.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  "https://wkqvfgbmggmwrvrglkgj.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrcXZmZ2JtZ2dtd3J2cmdsa2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MzQ4MzUsImV4cCI6MjA2NjQxMDgzNX0.PPLV0UWBSd8vDVDpC2krQjeanTcrSupgWEQohztyipE"
);

let SQL, db;
const SQL_READY = initSqlJs({
  locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.2/${file}`
}).then(SQLLib => {
  SQL = SQLLib;
  db = new SQL.Database();

  db.run(`CREATE TABLE IF NOT EXISTS rumah (
    judul TEXT,
    harga INTEGER,
    lokasi TEXT,
    ukuran TEXT,
    no_telp TEXT,
    gambar TEXT,
    category_id INTEGER
  )`);

  const saved = localStorage.getItem('sqliteRumah');
  if (saved) {
    db = new SQL.Database(new Uint8Array(JSON.parse(saved)));
    console.log("Database rumah dipulihkan dari localStorage");
  } else {
    console.log("Database rumah SQLite baru dibuat");
  }
});

function downloadSQLiteFile() {
  const binaryArray = db.export();
  const blob = new Blob([binaryArray], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'data_rumah.sqlite';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const downloadSQLiteBtn = document.getElementById('downloadSQLiteBtn');
downloadSQLiteBtn.addEventListener('click', async () => {
  await SQL_READY;
  downloadSQLiteFile();
});

function formatRupiah(angka) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(angka);
}

function setActiveKategori(id) {
  document.querySelectorAll(".kategori-item span").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(`.kategori-item span[data-id='${id}']`).forEach(el => el.classList.add("active"));
}

async function tampilkanKategori() {
  const ul = document.getElementById("kategoriList");
  ul.innerHTML = "<li>Memuat data...</li>";

  const { data, error } = await supabase.from("category").select("*");

  if (error) {
    ul.innerHTML = "<li style='color:red;'>Gagal memuat kategori</li>";
    Swal.fire("Error", "Gagal memuat data kategori", "error");
    return;
  }

  ul.innerHTML = "";

  const semua = document.createElement("li");
  semua.className = "kategori-item";
  const spanAll = document.createElement("span");
  spanAll.setAttribute("data-id", "all");
  spanAll.textContent = "Semua";
  spanAll.style.cursor = "pointer";
  spanAll.classList.add("active");
  spanAll.onclick = () => {
    tampilkanRumah();
    setActiveKategori("all");
  };
  semua.appendChild(spanAll);
  ul.appendChild(semua);

  if (!data || data.length === 0) {
    ul.innerHTML += "<li>Kategori belum tersedia</li>";
    return;
  }

  data.forEach(item => {
    const li = document.createElement("li");
    li.className = "kategori-item";
    const span = document.createElement("span");
    span.setAttribute("data-id", item.id);
    span.textContent = item.name;
    span.style.cursor = "pointer";
    span.onclick = () => {
      tampilkanRumah(item.id);
      setActiveKategori(item.id);
    };
    li.appendChild(span);
    ul.appendChild(li);
  });
}

async function tampilkanKategoricanvas() {
  const ul = document.getElementById("kategoriListcanvas");
  ul.innerHTML = "<li>Memuat data...</li>";

  const { data, error } = await supabase.from("category").select("*");

  if (error) {
    ul.innerHTML = "<li style='color:red;'>Gagal memuat kategori</li>";
    Swal.fire("Error", "Gagal memuat data kategori", "error");
    return;
  }

  ul.innerHTML = "";

  const semua = document.createElement("li");
  semua.className = "kategori-item";
  const spanAll = document.createElement("span");
  spanAll.setAttribute("data-id", "all");
  spanAll.textContent = "Semua";
  spanAll.style.cursor = "pointer";
  spanAll.classList.add("active");
  spanAll.onclick = () => {
    tampilkanRumah();
    setActiveKategori("all");
    const offcanvasEl = document.querySelector(".offcanvas.show");
    if (offcanvasEl) {
      const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvasEl);
      bsOffcanvas.hide();
    }
  };
  semua.appendChild(spanAll);
  ul.appendChild(semua);

  if (!data || data.length === 0) {
    ul.innerHTML += "<li>Kategori belum tersedia</li>";
    return;
  }

  data.forEach(item => {
    const li = document.createElement("li");
    li.className = "kategori-item";
    const span = document.createElement("span");
    span.setAttribute("data-id", item.id);
    span.textContent = item.name;
    span.style.cursor = "pointer";
    span.onclick = () => {
      tampilkanRumah(item.id);
      setActiveKategori(item.id);
      const offcanvasEl = document.querySelector(".offcanvas.show");
      if (offcanvasEl) {
        const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvasEl);
        bsOffcanvas.hide();
      }
    };
    li.appendChild(span);
    ul.appendChild(li);
  });
}

async function isiKategoriSelect() {
  const select = document.getElementById("kategori-select");
  select.innerHTML = `<option disabled selected>Pilih Kategori</option>`;
  const { data, error } = await supabase.from("category").select("*");
  if (error) return;
  data.forEach(kategori => {
    const opt = document.createElement("option");
    opt.value = kategori.id;
    opt.textContent = kategori.name;
    select.appendChild(opt);
  });
}


async function tambahRumah() {
  const btn = document.querySelector("#modalTambahRumah .btn-success");
  btn.disabled = true;
  btn.textContent = "Menyimpan...";

  const judul = document.getElementById("judul").value.trim();
  const harga = document.getElementById("harga").value.trim();
  const lokasi = document.getElementById("lokasi").value.trim();
  const ukuran = document.getElementById("ukuran").value.trim();
  const no_telp = document.getElementById("no_telp").value.trim();
  const category_id = document.getElementById("kategori-select").value;
  const fileInput = document.getElementById("gambar");
  const file = fileInput.files[0];

  if (!judul || !harga || !lokasi || !file || !category_id || !no_telp) {
    Swal.fire("Oops!", "Semua field wajib diisi dan gambar harus dipilih!", "warning");
    btn.disabled = false;
    btn.textContent = "Simpan Rumah";
    return;
  }

  const fileName = `${Date.now()}_${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("rumah-gambar")
    .upload(fileName, file);

  if (uploadError) {
    Swal.fire("Gagal", "Upload gambar gagal", "error");
    btn.disabled = false;
    btn.textContent = "Simpan Rumah";
    return;
  }

  const { error } = await supabase.from("asset").insert([{
    judul,
    harga,
    lokasi,
    ukuran,
    no_telp,
    gambar: fileName,
    category_id: parseInt(category_id)
  }]);

  if (error) {
    Swal.fire("Gagal", "Gagal menyimpan data rumah", "error");
  } else {
    Swal.fire("Berhasil", "Data rumah berhasil ditambahkan", "success");
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalTambahRumah'));
    modal.hide();
    ["judul", "harga", "lokasi", "ukuran"].forEach(id => document.getElementById(id).value = "");
    document.getElementById("kategori-select").selectedIndex = 0;
    fileInput.value = "";
    tampilkanRumah();

    // --- Simpan ke SQLite lokal ---
    await SQL_READY;
    db.run("INSERT INTO rumah (judul, harga, lokasi, ukuran, no_telp, gambar, category_id) VALUES (?, ?, ?, ?, ?, ?, ?)", [
      judul,
      parseInt(harga),
      lokasi,
      ukuran,
      no_telp,
      fileName,
      parseInt(category_id)
    ]);

    const backup = db.export();
    localStorage.setItem('sqliteRumah', JSON.stringify(Array.from(backup)));
    console.log("Data rumah juga disimpan ke SQLite lokal");
  }

  btn.disabled = false;
  btn.textContent = "Simpan Rumah";
}


async function hapusRumah(id, namaFile) {
  const konfirmasi = await Swal.fire({
    title: "Yakin ingin menghapus?",
    text: "Data rumah dan gambar akan dihapus permanen.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: "Hapus",
    cancelButtonText: "Batal"
  });

  if (!konfirmasi.isConfirmed) return;

  try {
    console.log("🔧 Menghapus gambar:", namaFile);
    const { error: fileError, data: fileData } = await supabase.storage
      .from("rumah-gambar")
      .remove([namaFile]);

    if (fileError) {
      console.error("❌ Gagal hapus gambar:", fileError.message);
      Swal.fire("Error", "Gagal menghapus gambar dari storage", "error");
      return;
    }

    console.log("✅ Gambar dihapus:", fileData);

    const { error: dbError } = await supabase.from("asset").delete().eq("id", id);
    if (dbError) {
      console.error("❌ Gagal hapus DB:", dbError.message);
      Swal.fire("Error", "Gambar terhapus, tapi data gagal dihapus", "warning");
      return;
    }

    Swal.fire("Sukses", "Data rumah dan gambar terhapus", "success");
    tampilkanRumah();

  } catch (err) {
    console.error("🔥 Error tidak terduga:", err);
    Swal.fire("Error", "Terjadi kesalahan saat menghapus", "error");
  }
}


async function tampilkanRumah(kategoriId = null) {
  const totalEl = document.getElementById("total-rumah");
  const container = document.getElementById("daftar-rumah");
  container.innerHTML = "<div class='text-muted'>Memuat data rumah...</div>";

  let query = supabase.from("asset").select("*, category(name)").order("id", { ascending: false });
  if (kategoriId && kategoriId !== "all") {
    query = query.eq("category_id", kategoriId);
  }

  const { data, error } = await query;

  if (error) {
    totalEl.textContent = "Gagal memuat data";
    container.innerHTML = `<p style='color:red;'>${error.message}</p>`;
    return;
  }

  totalEl.textContent = `Total Rumah: ${data.length} unit`;
  container.innerHTML = "";

  if (!data.length) {
    container.innerHTML = "<div class='text-muted'>Belum ada data rumah.</div>";
    return;
  }

  container.className = "row g-3";

  data.forEach(rumah => {
    const gambarURL = `https://wkqvfgbmggmwrvrglkgj.supabase.co/storage/v1/object/public/rumah-gambar/${rumah.gambar}`;

    const col = document.createElement("div");
    col.className = "col-12 col-md-6 col-lg-3 d-flex";

    const card = document.createElement("div");
    card.className = "card h-100 shadow-sm w-100";
    card.style.minHeight = "360px";
    card.style.maxHeight = "420px";
    card.innerHTML = `
      <img src="${gambarURL}" alt="${rumah.judul}" class="card-img-top" style="height: 180px; object-fit: cover;">
      <div class="card-body">
        <h5 class="card-title">${rumah.judul}</h5>
        <p><strong>${formatRupiah(rumah.harga)}</strong></p>
        <p>${rumah.ukuran || '-'}</p>
        <p>${rumah.lokasi}</p>
        <p>Hubungi : ${rumah.no_telp}</p>
        <div class="d-flex justify-content-between">
          <p><em>Kategori: ${rumah.category?.name || '-'}</em></p>
          <button class="btn btn-outline-danger btn-sm" onclick="hapusRumah(${rumah.id}, '${rumah.gambar}')" title="Hapus"><i class="bi bi-trash"></i></button>
        </div>
      </div>
    `;

    col.appendChild(card);
    container.appendChild(col);
  });
}

async function simpan() {
  const name = document.getElementById("name").value.trim();
  if (!name) {
    Swal.fire("Oops!", "Masukkan nama kategori!", "warning");
    return;
  }

  const { error } = await supabase.from("category").insert([{ name }]);

  if (error) {
    Swal.fire("Gagal", "Gagal menambahkan data", "error");
  } else {
    Swal.fire("Sukses", "Data berhasil ditambahkan", "success").then(() => {
      const modal = bootstrap.Modal.getInstance(document.getElementById('create_category'));
      modal.hide();
      document.getElementById("name").value = "";
      tampilkanKategori();
    });
  }
}

window.tambahRumah = tambahRumah;
window.hapusRumah = hapusRumah;
window.simpan = simpan;
window.onload = () => {
  tampilkanKategori();
  tampilkanKategoricanvas();
  tampilkanRumah();
  isiKategoriSelect();
};
