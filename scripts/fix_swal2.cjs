const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/app/**/*.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // 1. Fix "use client" order
  if (content.includes("import Swal from 'sweetalert2';\n\"use client\";")) {
    content = content.replace("import Swal from 'sweetalert2';\n\"use client\";", "\"use client\";\nimport Swal from 'sweetalert2';");
  } else if (content.includes("import Swal from 'sweetalert2';\n'use client';")) {
    content = content.replace("import Swal from 'sweetalert2';\n'use client';", "'use client';\nimport Swal from 'sweetalert2';");
  }

  // 2. Fix `););` syntax error
  content = content.replace(/\);\);/g, ');');

  // 3. Fix broken Swal.fire calls that look like:
  // Swal.fire("Gagal!", "Gagal menyimpan pesanan: " + (errorData.error || "Unknown error", "error");
  // They should be: Swal.fire("Gagal!", "Gagal menyimpan pesanan: " + (errorData.error || "Unknown error"), "error");
  
  // Specific fixes:
  content = content.replace(/errorData\.error \|\| "Unknown error", "error"\);/g, 'errorData.error || "Unknown error"), "error");');
  content = content.replace(/d\.error \|\| "Terjadi kesalahan", "error"\);/g, 'd.error || "Terjadi kesalahan"), "error");');
  content = content.replace(/d\.error \|\| "Gagal menghapus barang \(mungkin sedang digunakan", "error"\);\."\);/g, 'd.error || "Gagal menghapus barang (mungkin sedang digunakan)"), "error");');
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed ${file}`);
  }
});
