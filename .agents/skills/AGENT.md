# 🤖 AGENT DIRECTIVE: SKILLS MASTER INDEX & RUNBOOK

> **PANDUAN UNTUK AI AGENT (Antigravity, Gemini Code Assist, Claude Code, Cursor, Codex):**
> Direktori `.agents/skills/` ini mengandungi **34 kemahiran aras pertama (first-class modular skills)** yang mematuhi piawaian Agent Skills Protocol.
> Setiap skill mempunyai fail `SKILL.md` di aras folder masing-masing dan boleh dikesan (*auto-discovered*) secara automatik oleh runtime Antigravity.
> Gunakan jadual dan panduan di bawah untuk memilih skill yang paling tepat bagi setiap fasa pembangunan.

---

## ⚡ Index Pantas Kemahiran (34 Skills)

### 🏗️ 1. Architecture, TDD & Engineering Methodology (Superpowers Suite)
*Metodologi kejuruteraan perisian berdisiplin tinggi, pencegahan halusinasi, dan pengesahan ketat.*

| Skill | Folder / SKILL.md | Bila Perlu Digunakan |
| :--- | :--- | :--- |
| **`brainstorming`** | [`brainstorming/SKILL.md`](./brainstorming/SKILL.md) | Terokai kehendak pengguna, cabar andaian, dan hasilkan spesifikasi padu sebelum menulis kod. |
| **`writing-plans`** | [`writing-plans/SKILL.md`](./writing-plans/SKILL.md) | Bina pelan pelaksanaan langkah-demi-langkah (termasuk fail, diff, dan perintah ujian). |
| **`executing-plans`** | [`executing-plans/SKILL.md`](./executing-plans/SKILL.md) | Melaksanakan pelan bertulis dengan disiplin 100% tanpa melangkau langkah pengesahan. |
| **`subagent-driven-development`** | [`subagent-driven-development/SKILL.md`](./subagent-driven-development/SKILL.md) | Mengagihkan setiap tugasan kecil kepada subagent bebas dan semak diff secara modular. |
| **`dispatching-parallel-agents`** | [`dispatching-parallel-agents/SKILL.md`](./dispatching-parallel-agents/SKILL.md) | Jalankan beberapa subagent serentak untuk audit atau refactoring pantas. |
| **`test-driven-development`** | [`test-driven-development/SKILL.md`](./test-driven-development/SKILL.md) | Wajibkan kitaran Red-Green-Refactor sebelum menulis fungsi atau pembaikan ralat. |
| **`systematic-debugging`** | [`systematic-debugging/SKILL.md`](./systematic-debugging/SKILL.md) | 4 fasa siasatan punca ralat sebenar (Root Cause) sebelum mencuba sebarang tekaan. |
| **`verification-before-completion`** | [`verification-before-completion/SKILL.md`](./verification-before-completion/SKILL.md) | Wajibkan bukti konkrit (ujian unit melepasi, build berjaya) sebelum mendakwa tugasan siap. |
| **`using-git-worktrees`** | [`using-git-worktrees/SKILL.md`](./using-git-worktrees/SKILL.md) | Mengasingkan tugasan kod ke dalam git worktree agar tidak mencemarkan cawangan utama. |
| **`requesting-code-review`** | [`requesting-code-review/SKILL.md`](./requesting-code-review/SKILL.md) | Protokol meminta semakan kod formal daripada agent pemeriksa atau manusia. |
| **`receiving-code-review`** | [`receiving-code-review/SKILL.md`](./receiving-code-review/SKILL.md) | Cara membalas dan membetulkan maklum balas semakan kod tanpa defensif. |
| **`finishing-a-development-branch`** | [`finishing-a-development-branch/SKILL.md`](./finishing-a-development-branch/SKILL.md) | Membersihkan cawangan, mengesahkan ujian akhir, dan menggabungkan kerja (merge). |
| **`using-superpowers`** | [`using-superpowers/SKILL.md`](./using-superpowers/SKILL.md) | Meta-peraturan dan penyelarasan keseluruhan suite Superpowers. |
| **`writing-skills`** | [`writing-skills/SKILL.md`](./writing-skills/SKILL.md) | Panduan membina kemahiran agent baharu mengikut piawaian industri. |

---

### 🎨 2. Design Engineering & Anti-Slop Aesthetics (Taste Suite)
*Menghapuskan "AI Slop" generik dan menghasilkan antaramuka premium, berkarektor, dan mahal.*

| Skill | Folder / SKILL.md | Estetik & Peranan |
| :--- | :--- | :--- |
| **`taste-skill`** | [`taste-skill/SKILL.md`](./taste-skill/SKILL.md) | Enjin penalaan 3 dial: **VARIANCE**, **MOTION**, dan **DENSITY**. Dilengkapi rangka kod GSAP. |
| **`minimalist-skill`** | [`minimalist-skill/SKILL.md`](./minimalist-skill/SKILL.md) | Gaya editorial produk (vibes Linear / Notion), monokrom hangat, tipografi berbeza, bento grid. |
| **`brutalist-skill`** | [`brutalist-skill/SKILL.md`](./brutalist-skill/SKILL.md) | Brutalisme industri, tipografi Swiss tebal, kontras monokrom tajam, susun atur radikal. |
| **`soft-skill`** | [`soft-skill/SKILL.md`](./soft-skill/SKILL.md) | Kemasan lembut mewah (*quiet luxury*), ruang putih bernafas, pastel tenang, pergerakan spring. |
| **`gpt-tasteskill`** | [`gpt-tasteskill/SKILL.md`](./gpt-tasteskill/SKILL.md) | Garis panduan anti-slop yang sangat tegas khusus untuk model berasaskan GPT/Codex. |
| **`redesign-skill`** | [`redesign-skill/SKILL.md`](./redesign-skill/SKILL.md) | Protokol merombak UI sedia ada: audit susun atur, tipografi, dan warna sebelum menyentuh kod. |
| **`image-to-code-skill`** | [`image-to-code-skill/SKILL.md`](./image-to-code-skill/SKILL.md) | Aliran kerja berasaskan rujukan: analisis imej inspirasi dahulu, kemudian terjemah ke kod. |
| **`output-skill`** | [`output-skill/SKILL.md`](./output-skill/SKILL.md) | Memaksa agent menulis kod 100% lengkap tanpa komen pemalas seperti `// rest of code here`. |
| **`stitch-skill`** | [`stitch-skill/SKILL.md`](./stitch-skill/SKILL.md) | Penyesuaian reka bentuk Google Stitch dan eksport `DESIGN.md`. |
| **`taste-skill-v1`** | [`taste-skill-v1/SKILL.md`](./taste-skill-v1/SKILL.md) | Versi stabil asal Taste-Skill (disimpan untuk keserasian projek lama). |
| **`brandkit`** | [`brandkit/SKILL.md`](./brandkit/SKILL.md) | Prompt penjanaan visual identiti jenama, warna teras, dan papan mood (moodboard). |
| **`imagegen-frontend-web`** | [`imagegen-frontend-web/SKILL.md`](./imagegen-frontend-web/SKILL.md) | Prompt penjanaan mockup laman web penuh berestetik tinggi untuk rujukan visual. |
| **`imagegen-frontend-mobile`** | [`imagegen-frontend-mobile/SKILL.md`](./imagegen-frontend-mobile/SKILL.md) | Prompt penjanaan skrin antaramuka telefon pintar (iOS/Android). |

---

### 🚀 3. Specialist UI Suites, Motion & 3D
*Komponen animasi, semakan piawaian antarabangsa, dan interaktiviti maju.*

| Skill | Folder / SKILL.md | Penerangan & Skop |
| :--- | :--- | :--- |
| **`3d-scroll-website`** | [`3d-scroll-website/SKILL.md`](./3d-scroll-website/SKILL.md) | **Canvas Frame-Sequence 3D Web (Apple/Lusion style).** Menggunakan Next.js, Lenis Scroll, Framer Motion, dan Neumorphic tokens. |
| **`apple-design`** | [`apple-design/SKILL.md`](./apple-design/SKILL.md) | **Apple HIG Universal Reviewer.** Audit kebolehcapaian (WCAG AAA), touch targets (min 44px), hierarki visual, dan integrasi platform. |
| **`emil-design-eng`** | [`emil-design-eng/SKILL.md`](./emil-design-eng/SKILL.md) | **Emil Kowalski Design Engineering.** Sentuhan mikro, fizik spring, zero Cumulative Layout Shift, jadual semakan `| Before | After | Why |`. |
| **`impeccable`** | [`impeccable/SKILL.md`](./impeccable/SKILL.md) | **23 Design Commands.** `/impeccable init`, `craft`, `shape`, `critique`, `audit`, `polish`, `bolder`, `quieter`, `animate`, `harden`. |
| **`improve`** | [`improve/SKILL.md`](./improve/SKILL.md) | **Senior Codebase Advisor (shadcn).** Audit komprehensif kod sumber secara *read-only* merentasi 9 domain, menjana pelan terperinci di `plans/`. |
| **`transitions-dev`** | [`transitions-dev/SKILL.md`](./transitions-dev/SKILL.md) | **21 Animasi CSS Sedia Tampal.** Zero-dependency, nama kelas `t-*`, perlindungan `prefers-reduced-motion` untuk modal, dropdown, tabs, tilt, dll. |
| **`ui-ux-pro-max`** | [`ui-ux-pro-max/SKILL.md`](./ui-ux-pro-max/SKILL.md) | **UI/UX Reasoning Engine.** Skrip Python & fail data CSV untuk padanan fon, warna, dan susun atur berasaskan jenis produk dan industri. |

---

## 🛠️ Contoh Perintah Terminal Berguna

### 1. Menjana Sistem Rekabentuk Menggunakan `ui-ux-pro-max`:
```bash
python .agents/skills/ui-ux-pro-max/scripts/search.py "fintech dashboard clean" --design-system -p "NOCTARA"
```

### 2. Membaca Rujukan Spesifik Apple HIG:
Semak fail indeks routing di [`.agents/skills/apple-design/references/hig-lookup.md`](./apple-design/references/hig-lookup.md).

### 3. Menggunakan Animasi CSS Transitions:
Semak katalog 21 fail markdown dalam [`.agents/skills/transitions-dev/`](./transitions-dev/) (contoh: `05-menu-dropdown.md`, `16-tabs-sliding.md`, `19-card-tilt.md`).

---

## 🎯 Protokol Tindakan AI Agent Semasa Mula Projek
1. **Fasa Perancangan:** Aktifkan `brainstorming` atau `writing-plans`.
2. **Fasa Audit / Refactoring:** Aktifkan `improve` (read-only) atau `systematic-debugging`.
3. **Fasa Reka Bentuk UI:** Tentukan estetik (`taste-skill`, `minimalist-skill`, `soft-skill`, atau `apple-design`).
4. **Fasa Animasi & Sentuhan Akhir:** Rujuk `emil-design-eng` dan `transitions-dev`.
5. **Fasa Pengesahan:** Jalankan `verification-before-completion` sebelum menyatakan tugas selesai.
