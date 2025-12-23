// Tambahkan ini di paling atas script.js atau di dalam tag <script> eduexam.html
(function checkPaidStatus() {
    const user = JSON.parse(localStorage.getItem('userAccount'));
    if (!user) {
        window.location.href = "login.html";
    } else if (user.privilege !== 'Admin' && !user.isPaid) {
        alert("Akses ditolak. Silakan selesaikan pembayaran aktivasi.");
        window.location.href = "payment.html";
    }
})();

document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generateBtn');
    const copyBtn = document.getElementById('copyBtn');

    if (generateBtn) {
        generateBtn.addEventListener('click', generatePrompt);
    }
    if (copyBtn) {
        copyBtn.addEventListener('click', copyToClipboard);
    }
});

function showToast(message, type) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');
    
    // Reset classes
    toast.className = 'toast';
    
    // Set content and style
    toastMessage.innerText = message;
    if (type === 'success') {
        toast.classList.add('success');
        toastIcon.innerText = '✅';
    } else if (type === 'error') {
        toast.classList.add('error');
        toastIcon.innerText = '⚠️';
    }
    
    // Show
    toast.classList.add('visible');
    
    // Hide after 3s
    setTimeout(() => {
        toast.classList.remove('visible');
    }, 3000);
}

function generatePrompt() {
    // --- 1. AMBIL NILAI INPUT ---
    const mapel = document.getElementById('mapel').value.trim();
    const kelas = document.getElementById('kelas').value;
    const kurikulum = document.getElementById('kurikulum').value;
    const topik = document.getElementById('topik').value.trim();
    const indikator = document.getElementById('indikator').value.trim();
    const useImage = document.getElementById('use_image').checked;

    // --- 2. VALIDASI DATA IDENTITAS ---
    if (!mapel || !kelas || !kurikulum || !topik || !indikator) {
        showToast("Harap lengkapi Identitas & Materi!", "error");
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    // --- 3. HITUNG & VALIDASI JENIS SOAL ---
    let totalSoalRequest = 0;
    let typeText = "";
    let hasMultipleChoice = false;

    function processType(checkboxId, inputId, labelName) {
        const checkbox = document.getElementById(checkboxId);
        if (checkbox && checkbox.checked) {
            let qty = parseInt(document.getElementById(inputId).value) || 0;
            if (qty > 0) {
                totalSoalRequest += qty;
                if (checkboxId === 'type_pg' || checkboxId === 'type_pgk') hasMultipleChoice = true;
                return `- ${qty} butir ${labelName}\n`;
            }
        }
        return "";
    }

    typeText += processType('type_pg', 'qty_pg', 'Pilihan Ganda');
    typeText += processType('type_pgk', 'qty_pgk', 'Pilihan Ganda Kompleks');
    typeText += processType('type_bs', 'qty_bs', 'Benar/Salah');
    typeText += processType('type_match', 'qty_match', 'Menjodohkan');
    typeText += processType('type_short', 'qty_short', 'Isian Singkat');
    typeText += processType('type_essay', 'qty_essay', 'Uraian/Esai');

    if (totalSoalRequest === 0) {
        showToast("Pilih minimal satu jenis soal & jumlahnya!", "error");
        return;
    }

    // --- 4. LOGIKA JENJANG & BAHASA ---
    let optionRule = "";
    if (hasMultipleChoice) {
        if (kelas.includes("SD")) optionRule = "Khusus PG: Buat 3 Opsi (A, B, C) - Jenjang SD.";
        else if (kelas.includes("SMP")) optionRule = "Khusus PG: Buat 4 Opsi (A, B, C, D) - Jenjang SMP.";
        else if (kelas.includes("SMA")) optionRule = "Khusus PG: Buat 5 Opsi (A, B, C, D, E) - Jenjang SMA.";
    }

    const mapelLower = mapel.toLowerCase();
    const isEnglishSubject = mapelLower.includes('inggris') || mapelLower.includes('english');
    const langInstruction = isEnglishSubject ? "Bahasa Inggris" : "Bahasa Indonesia";

    let blooms = [];
    document.querySelectorAll('input[name="bloom"]:checked').forEach((el) => blooms.push(el.value));

    let difficultyText = "";
    if (document.getElementById('diff_mudah').checked) difficultyText += `- ${document.getElementById('qty_mudah').value || 0} soal Mudah\n`;
    if (document.getElementById('diff_sedang').checked) difficultyText += `- ${document.getElementById('qty_sedang').value || 0} soal Sedang\n`;
    if (document.getElementById('diff_sukar').checked) difficultyText += `- ${document.getElementById('qty_sukar').value || 0} soal Sukar\n`;

    // --- 5. RAKIT PROMPT ---
    // (LOGIC PRESERVED EXACTLY AS REQUESTED)
    let prompt = `Bertindaklah sebagai ahli pembuat soal ujian profesional. \n`;
    prompt += `Tugas: Menyusun perangkat ujian lengkap (Kisi-kisi, Soal, Kunci Jawaban) dengan spesifikasi:\n\n`;
    
    prompt += `=== DATA UJIAN ===\n`;
    prompt += `• Mapel: ${mapel} (${kelas})\n`;
    prompt += `• Kurikulum: ${kurikulum}\n`;
    prompt += `• Topik: ${topik}\n`;
    prompt += `• Indikator: ${indikator}\n\n`;

    prompt += `=== SPESIFIKASI SOAL ===\n`;
    prompt += `1. Kesulitan:\n${difficultyText || " (Proporsional)"}`;
    prompt += `2. Kognitif: ${blooms.join(", ") || "Sesuaikan"}\n`;
    prompt += `3. Bentuk Soal:\n${typeText}`;
    if (optionRule) prompt += `   CATATAN: ${optionRule}\n`;
    
    if (isEnglishSubject) {
        prompt += `\n4. ATURAN BAHASA (ENGLISH SUBJECT):\n`;
        prompt += `[PENTING] Karena mapel Bahasa Inggris, **SEMUA SOAL, NARASI, & OPSI** harus dalam **BAHASA INGGRIS**.\n`;
    }

    if (useImage) {
        prompt += `\n5. VISUALISASI GAMBAR:\n`;
        prompt += `Sertakan 'Image Generation Prompt' **HANYA JIKA** soal butuh ilustrasi.\n`;
        prompt += `Bahasa Prompt Gambar: **${langInstruction}**.\n`;
    }

    prompt += `\n=== FORMAT OUTPUT (WAJIB TABEL) ===\n`;
    prompt += `**BAGIAN 1: KISI-KISI SOAL (Tabel)**\n`;
    prompt += `Kolom: No | Indikator | Materi | Indikator Soal | Level Kognitif | Bentuk Soal | No. Soal\n\n`;

    prompt += `**BAGIAN 2: BUTIR SOAL (Tabel)**\n`;
    prompt += `Buat tabel dengan header kolom persis seperti ini:\n`;
    prompt += `| Nomor | Soal |\n`;
    
    if (useImage) {
        prompt += `\n[PENTING] FORMAT SOAL BERGAMBAR:\n`;
        prompt += `Urutan dalam sel Soal: [PROMPT GAMBAR] -> Teks Soal -> Opsi Jawaban.\n`;
    } else {
            prompt += `Catatan: Tulis pertanyaan dan opsi jawaban lengkap di kolom Soal.\n`;
    }

    prompt += `\n**BAGIAN 3: KUNCI JAWABAN (Tabel)**\n`;
    prompt += `Kolom: No. Soal | Kunci Jawaban | Pembahasan\n\n`;
    prompt += `Kerjakan sekarang.`;

    // --- 6. OUTPUT ---
    const outputBox = document.getElementById('outputPrompt');
    outputBox.value = prompt;
    
    // Visual Feedback
    showToast("Prompt Berhasil Dibuat!", "success");
    outputBox.focus();
}

function copyToClipboard() {
    const copyText = document.getElementById("outputPrompt");
    if (!copyText.value) {
        showToast("Belum ada prompt untuk disalin!", "error");
        return;
    }
    copyText.select();
    copyText.setSelectionRange(0, 99999); // Mobile compatibility
    
    navigator.clipboard.writeText(copyText.value)
        .then(() => {
            showToast("Prompt Tersalin ke Clipboard!", "success");
        })
        .catch(() => {
            // Fallback for older browsers
            try {
                document.execCommand('copy');
                showToast("Prompt Tersalin ke Clipboard!", "success");
            } catch (err) {
                showToast("Gagal menyalin!", "error");
            }
        });
}
