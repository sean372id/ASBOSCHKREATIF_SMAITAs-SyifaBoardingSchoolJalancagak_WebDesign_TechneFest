
// --- Pricing Estimator Logic ---
function initPricingEstimator() {
    const form = document.getElementById('calcForm');
    // The contract page also has a calcForm, so we need a more specific check.
    // Let's check for an element unique to the pricing page.
    const priceBox = document.getElementById('hargaMin');
    if (!form || !priceBox) return;

    let dataKalkulasiGlobal = {};

    function formatRupiah(angka) {
        // Menggunakan Regex yang 100% aman untuk pemisah ribuan
        return 'Rp ' + Math.round(angka).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    function hitungUlang() { 
        const lamaKerja = parseFloat(document.getElementById('lamaPengerjaan').value) || 0;
        const kuotaGratis = parseInt(document.getElementById('kuotaRevisiGratis').value) || 0;
        const jlhRevisi = parseInt(document.getElementById('jumlahRevisi').value) || 0;
        const bobotKesulitan = parseFloat(document.getElementById('tingkatEditing').value);
        const tarifPerJam = parseFloat(document.getElementById('levelPengalaman').value) * 5000;
        const inputMargin = parseFloat(document.getElementById('targetMargin').value) || 0;
        const selectTujuan = document.getElementById('tujuanPelayanan');
        const tujuanPelayanan = parseFloat(selectTujuan.value);
        const marginMultiplier = 1 + (inputMargin / 100);
        const tujuanPelayananTeks = selectTujuan.options[selectTujuan.selectedIndex].text;

        const totalHargaJasaDasar = (lamaKerja * tarifPerJam) * bobotKesulitan * tujuanPelayanan;
        
        const revisiBerbayar = Math.max(0, jlhRevisi - kuotaGratis);
        const totalHargaRevisi = revisiBerbayar * (tarifPerJam * 0.5);
        const hargaMinimumFinal = totalHargaJasaDasar + totalHargaRevisi;

        const jasaDasarPlusMargin = totalHargaJasaDasar * marginMultiplier;
        const revisiPlusMargin = totalHargaRevisi * marginMultiplier;
        
        const hargaRekomendasiFinal = jasaDasarPlusMargin + revisiPlusMargin;
        const hargaMaksimumFinal = hargaRekomendasiFinal * 1.30;
        const nominalMarginBersih = hargaRekomendasiFinal - hargaMinimumFinal;

        document.getElementById('hargaMin').innerText = formatRupiah(hargaMinimumFinal);
        document.getElementById('hargaRek').innerText = formatRupiah(hargaRekomendasiFinal);
        document.getElementById('hargaMax').innerText = formatRupiah(hargaMaksimumFinal);
        document.getElementById('labelMarginPersen').innerText = `(Target Margin +${inputMargin}%)`;

        document.getElementById('bdJasaDasar').innerText = formatRupiah(totalHargaJasaDasar);
        document.getElementById('bdRevisi').innerText = formatRupiah(totalHargaRevisi);
        document.getElementById('bdMargin').innerText = formatRupiah(nominalMarginBersih);

        dataKalkulasiGlobal = {
            jenisPelayanan: document.getElementById('jenisPelayanan').value,
            tujuanPelayananTeks: tujuanPelayananTeks,
            lamaKerja: lamaKerja,
            tingkatKesulitanTeks: document.getElementById('labelEditing').innerText,
            jlhRevisi: jlhRevisi,
            kuotaGratis: kuotaGratis,
            revisiBerbayar: revisiBerbayar,
            jasaDasarPlusMargin: jasaDasarPlusMargin,
            revisiPlusMargin: revisiPlusMargin,
            hargaFinal: hargaRekomendasiFinal
        };
    }

    form.addEventListener('input', hitungUlang);
    form.addEventListener('change', hitungUlang); 
    
    document.getElementById('btnKirim').addEventListener('click', () => {
        localStorage.setItem('shared_project_data', JSON.stringify(dataKalkulasiGlobal));
        window.open('/ASBOSCHKREATIF_SMAITAs-SyifaBoardingSchoolJalancagak_WebDesign_TechneFest/invoice-generator/index.html', '_blank');
    });

    hitungUlang();
}

// --- Invoice Generator Logic ---
function initInvoiceGenerator() {
    const invoiceTable = document.getElementById('tabelBodyInvoice');
    if (!invoiceTable) return;

    const dt = new Date(); dt.setDate(dt.getDate() + 7);
    const inputJatuhTempo = document.getElementById('inputJatuhTempo');
    if (inputJatuhTempo) {
        inputJatuhTempo.value = dt.toISOString().split('T')[0];
    }

    function formatRupiah(angka) { 
        return 'Rp ' + Math.round(angka).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."); 
    }
    function formatTanggal(str) { return str ? new Date(str).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'; }

    
    const sharedData = JSON.parse(localStorage.getItem('shared_project_data'));
    if (sharedData) {
        if(document.getElementById('inputHargaJasa')) document.getElementById('inputHargaJasa').value = Math.round(sharedData.jasaDasarPlusMargin);
        
        // Calculate per-revision cost from total, as the input is for per-revision cost.
        const perRevisionCost = sharedData.revisiBerbayar > 0 
            ? sharedData.revisiPlusMargin / sharedData.revisiBerbayar
            : 0;
        if(document.getElementById('inputHargaRevisi')) document.getElementById('inputHargaRevisi').value = Math.round(perRevisionCost);

        if(document.getElementById('inputRevisiGratis')) document.getElementById('inputRevisiGratis').value = sharedData.kuotaGratis;
        if(document.getElementById('inputRevisiTotal')) document.getElementById('inputRevisiTotal').value = sharedData.jlhRevisi;
    }

        function perbaruiInvoiceLive() {
            const backupData = sharedData || {
                jenisPelayanan: 'UI/UX Design (Web/Mobile)', 
                tujuanPelayananTeks: 'Penggunaan Komersial',
                lamaKerja: 10, 
                tingkatKesulitanTeks: 'Sedang'
            };

            const nominalJasaManual = parseFloat(document.getElementById('inputHargaJasa').value) || 0;
            const nominalPerRevisiManual = parseFloat(document.getElementById('inputHargaRevisi').value) || 0;
            
            const gratis = parseInt(document.getElementById('inputRevisiGratis').value) || 0;
            const total = parseInt(document.getElementById('inputRevisiTotal').value) || 0;

            
                        // LOGIC KUOTA REVISI GRATIS:
            // Jika total revisi lebih kecil dari kuota gratis, maka revisi berbayar = 0 (bukan minus)
            const berbayar = Math.max(0, total - gratis);
            const totalBiayaRevisi = berbayar * nominalPerRevisiManual;

            // Update Teks Identitas atas
            if(document.getElementById('viewDari')) document.getElementById('viewDari').innerText = document.getElementById('inputDari').value || 'Nama Anda / Studio';
            if(document.getElementById('viewUntuk')) document.getElementById('viewUntuk').innerText = document.getElementById('inputUntuk').value || 'Nama Klien';
            if(document.getElementById('viewNoInvoice')) document.getElementById('viewNoInvoice').innerText = document.getElementById('inputNoInvoice').value;
            if(document.getElementById('viewJatuhTempo')) document.getElementById('viewJatuhTempo').innerText = formatTanggal(document.getElementById('inputJatuhTempo').value);
            if(document.getElementById('viewMetodeBayar')) document.getElementById('viewMetodeBayar').innerText = document.getElementById('inputMetodeBayar').value || '—';

            // Pembuatan Baris Deskripsi Biaya Revisi secara dinamis berdasarkan Logika Kuota Gratis
            let revisiDescription = '';
            if (total <= gratis) {
                revisiDescription = `Kuota mencakup ${gratis}x revisi gratis. Total revisi saat ini ${total}x (Masih dalam batas kuota gratis).`;
            } else {
                revisiDescription = `Kuota mencakup ${berbayar}x revisi berbayar tambahan (@${formatRupiah(nominalPerRevisiManual)} / revisi).`;
            }

            const itemTitle = backupData.tujuanPelayananTeks 
                ? `${backupData.jenisPelayanan} untuk ${backupData.tujuanPelayananTeks}`
                : backupData.jenisPelayanan;

            const htmlTabel = `
                <tr class="border-b border-slate-100">
                    <td class="py-3 px-3">
                        <span class="item-title font-bold block text-slate-700">${itemTitle}</span>
                        <span class="item-desc text-[11px] text-slate-400 block mt-0.5">Biaya pengerjaan proyek desain utama. Estimasi waktu kerja: ${backupData.lamaKerja} Jam (${backupData.tingkatKesulitanTeks}).</span>
                    </td>
                    <td class="py-3 px-3 text-right valign-top font-mono font-bold text-slate-700">${formatRupiah(nominalJasaManual)}</td>
                </tr>
                <tr class="border-b border-slate-100">
                    <td class="py-3 px-3">
                        <span class="item-title font-bold block text-slate-700">Kuota & Paket Revisi Dokumentasi</span>
                        <span class="item-desc text-[11px] text-slate-400 block mt-0.5">${revisiDescription}</span>
                    </td>
                    <td class="py-3 px-3 text-right valign-top font-mono font-bold text-slate-700">${formatRupiah(totalBiayaRevisi)}</td>
                </tr>
            `;
            document.getElementById('tabelBodyInvoice').innerHTML = htmlTabel;

            // Kalkulasi Grand Total Finansial
            const subtotal = nominalJasaManual + totalBiayaRevisi;
            const persenPajak = parseFloat(document.getElementById('inputPajak').value) || 0;
            const nominalPajak = subtotal * (persenPajak / 100);
            const totalTagihan = subtotal + nominalPajak;

            if(document.getElementById('viewSubtotal')) document.getElementById('viewSubtotal').innerText = formatRupiah(subtotal);
            if(document.getElementById('viewPajakPersen')) document.getElementById('viewPajakPersen').innerText = persenPajak;
            if(document.getElementById('viewPajakNominal')) document.getElementById('viewPajakNominal').innerText = formatRupiah(nominalPajak);
            if(document.getElementById('viewTotalTagihan')) document.getElementById('viewTotalTagihan').innerText = formatRupiah(totalTagihan);
        }

        const inputsInvoice = ['inputDari', 'inputUntuk', 'inputNoInvoice', 'inputJatuhTempo', 'inputPajak', 'inputMetodeBayar', 'inputHargaJasa', 'inputHargaRevisi', 'inputRevisiGratis', 'inputRevisiTotal'];
        inputsInvoice.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', perbaruiInvoiceLive);
                el.addEventListener('change', perbaruiInvoiceLive);
            }
        });

        perbaruiInvoiceLive();
        
    // Hook untuk Tombol Download PDF - Menggunakan jsPDF.html() untuk teks selectable
    const btnDownloadInvoice = document.getElementById('btnDownloadInvoice');
    if (btnDownloadInvoice) {
        btnDownloadInvoice.onclick = () => {
            window.print();
        };
    }
}

// --- Contract Generator Logic ---
function initContractGenerator() {
    const contractContent = document.getElementById('contractContent');
    if (!contractContent) return;

    const inputStudio = document.getElementById('inputStudio');
    const inputClient = document.getElementById('inputClient');
    const inputProject = document.getElementById('inputProject');
    const inputFee = document.getElementById('inputFee');
    const inputDeadline = document.getElementById('inputDeadline');
    const inputScope = document.getElementById('inputScope');
    const inputLogo = document.getElementById('inputLogo');

    const p1TextTop = document.getElementById('p1TextTop');
    const p1Text = document.getElementById('p1Text');
    const p2Text = document.getElementById('p2Text');
    const projectText = document.getElementById('projectText');
    const feeText = document.getElementById('feeText');
    const deadlineText = document.getElementById('deadlineText');
    const scopeText = document.getElementById('scopeText');
    const p1Sig = document.getElementById('p1Sig');
    const p2Sig = document.getElementById('p2Sig');
    const logoContainer = document.getElementById('logoContainer');

    if (inputStudio) {
        inputStudio.addEventListener('input', (e) => {
            const val = e.target.value || '[Nama Desainer/Studio]';
            if (p1Text) p1Text.innerText = val;
            if (p1TextTop) p1TextTop.innerText = val;
            if (p1Sig) p1Sig.innerText = val;
        });
    }

    if (inputClient) {
        inputClient.addEventListener('input', (e) => {
            const val = e.target.value || '[Nama Klien]';
            if (p2Text) p2Text.innerText = val;
            if (p2Sig) p2Sig.innerText = val;
        });
    }

    if (inputProject) {
        inputProject.addEventListener('input', (e) => {
            if (projectText) projectText.innerText = e.target.value || '[Nama Proyek]';
        });
    }

    if (inputFee) {
        inputFee.addEventListener('input', (e) => {
            // Format angka secara Live dengan titik setiap 3 digit saat diketik
            const rawVal = e.target.value.replace(/[^0-9]/g, '');
            if (rawVal) {
                const formatted = rawVal.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                e.target.value = formatted;
                if (feeText) feeText.innerText = formatted;
            } else {
                e.target.value = '';
                if (feeText) feeText.innerText = '0';
            }
        });
    }

    if (inputDeadline) {
        inputDeadline.addEventListener('input', (e) => {
            if (!deadlineText) return;
            if(e.target.value) {
                const date = new Date(e.target.value);
                deadlineText.innerText = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
            } else {
                deadlineText.innerText = '[Tanggal Batas Waktu]';
            }
        });
    }

    if (inputScope) {
        inputScope.addEventListener('input', (e) => {
            if (scopeText) scopeText.innerText = e.target.value || '[Ketentuan Revisi]';
        });
    }

    if (inputLogo) {
        inputLogo.addEventListener('change', function(e) {
            if (!logoContainer) return;
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    logoContainer.innerHTML = `<img src="${event.target.result}" class="logo-preview" alt="Studio Logo">`;
                }
                reader.readAsDataURL(file);
            }
        });
    }

    // Hook untuk Tombol Download PDF Kontrak - Menggunakan jsPDF.html() untuk teks selectable
    const btnDownloadContract = document.getElementById('btnDownloadContract');
    if (btnDownloadContract) {
        btnDownloadContract.onclick = () => {
            window.print();
        };
    }
}

// --- Accordion Logic (Homepage) ---
function initAccordion() {
    const accordionContainer = document.querySelector(".accordion-wrapper");
    if (!accordionContainer) return;

    const accordionItems = accordionContainer.querySelectorAll(".accordion-item");
    const imageWrapper = document.querySelector('.accordion-image-wrapper');
    if (!imageWrapper) return;
    const accordionImages = imageWrapper.querySelectorAll(".accordion-image");

    accordionItems.forEach(item => {
        const header = item.querySelector('.accordion-header');
        if (!header) return;

        header.addEventListener("click", () => {
            const content = item.querySelector('.accordion-content');
            const accordionId = item.dataset.accordionId;
            const isAlreadyActive = item.classList.contains('active');

            // Jika sudah aktif, jangan lakukan apa-apa
            if (isAlreadyActive) return;

            // Tutup semua item lain
            accordionItems.forEach(otherItem => {
                otherItem.classList.remove('active');
                otherItem.querySelector('.accordion-content').style.maxHeight = null;
            });
            accordionImages.forEach(image => image.classList.remove('active'));

            // Aktifkan yang diklik
            item.classList.add('active');
            content.style.maxHeight = content.scrollHeight + "px";
            const activeImage = imageWrapper.querySelector(`.accordion-image[data-accordion-id="${accordionId}"]`);
            if (activeImage) {
                activeImage.classList.add('active');
            }
        });
    });

    // Atur state awal untuk item yang sudah memiliki kelas 'active' dari HTML
    // Ini penting agar akordeon terbuka saat halaman pertama kali dimuat.
    const initialActiveItem = accordionContainer.querySelector('.accordion-item.active');
    if (initialActiveItem) {
        const content = initialActiveItem.querySelector('.accordion-content');
        content.style.maxHeight = content.scrollHeight + "px";
    }
}

// --- Main Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const menuPositions = {};
    const indicator = document.getElementById('nav-indicator');
    const menuList = document.querySelector('.menu-list');

    // 1. Fungsi untuk menghitung dan menyimpan posisi semua item menu sekali saja
    function calculateMenuPositions() {
        const menuItems = document.querySelectorAll('.menu-item');
        if (!menuList) return;
        const parentRect = menuList.getBoundingClientRect();

        menuItems.forEach(item => {
            const pageName = item.dataset.page;
            if (pageName) {
                const itemRect = item.getBoundingClientRect();
                menuPositions[pageName] = {
                    left: itemRect.left - parentRect.left,
                    width: itemRect.width
                };
            }
        });
    }

    // 2. Fungsi untuk menggerakkan indikator menggunakan data posisi yang sudah dihitung
    function moveIndicator(pageName) {
        if (!indicator || !menuPositions[pageName]) {
            // Jika data posisi belum siap, coba hitung ulang.
            calculateMenuPositions();
            // Coba lagi setelah dihitung
            if (!indicator || !menuPositions[pageName]) return;
        };

        const { left, width } = menuPositions[pageName];

        // Guard clause untuk mencegah indikator mengecil
        if (width === 0) return;

        indicator.style.width = `${width}px`;
        indicator.style.transform = `translateX(${left}px)`;
    }
    
    // 3. Fungsi untuk update kelas 'active'
    function updateMenuActiveState(pageName) {
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === pageName);
        });
    }

    function initializePageScripts() {
        initPricingEstimator();
        initInvoiceGenerator();
        initContractGenerator();
        initAccordion();
    }

    // 4. Inisialisasi Barba.js
    barba.init({
        transitions: [{
            name: 'default-transition',
            leave(data) {
                const pageName = data.trigger.dataset.page;
                if (pageName) {
                    moveIndicator(pageName); // Animasikan ke posisi target dari data tersimpan
                }
                // Tunggu animasi fade-out selesai
                return new Promise(resolve => {
                    data.current.container.style.transition = 'opacity 0.5s';
                    data.current.container.style.opacity = 0;
                    setTimeout(resolve, 500);
                });
            },
            enter(data) {
                // Pastikan halaman baru terlihat sebelum animasi masuk
                data.next.container.style.opacity = 1;
            }
        }]
    });

    // 5. Hooks untuk sinkronisasi state setelah transisi
    barba.hooks.beforeEnter((data) => {
        const path = data.next.url.path;
        let nextPage = 'home';
        if (path.includes('pricing-estimator')) nextPage = 'estimator';
        else if (path.includes('invoice-generator')) nextPage = 'invoice';
        else if (path.includes('contract-generator')) nextPage = 'contract';
        
        data.next.namespace = nextPage;
        updateMenuActiveState(nextPage);
    });

    barba.hooks.afterEnter((data) => {
        // Posisikan ulang indikator setelah halaman baru masuk, untuk memastikan akurasi
        const pageName = data.next.namespace;
        moveIndicator(pageName);
        // Re-run initializations for the new page
        initializePageScripts();
    });

    // 6. Setup awal saat halaman dimuat
    // Beri sedikit waktu agar layout stabil sebelum mengukur
    setTimeout(() => {
        calculateMenuPositions();
        const initialPage = document.querySelector('.menu-item.active')?.dataset.page || 'home';
        updateMenuActiveState(initialPage);
        moveIndicator(initialPage);
        initializePageScripts(); // Panggil inisialisasi di sini
    }, 100);


    // 7. Opsional: Hitung ulang posisi jika ukuran window berubah
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            calculateMenuPositions();
            const currentPage = document.querySelector('.menu-item.active')?.dataset.page;
            if (currentPage) {
                moveIndicator(currentPage);
            }
        }, 250);
    });
});