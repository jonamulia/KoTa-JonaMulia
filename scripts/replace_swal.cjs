const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/app/**/*.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  if (content.includes('alert(') || content.includes('confirm(')) {
    if (!content.includes("import Swal from 'sweetalert2';")) {
      content = `import Swal from 'sweetalert2';\n` + content;
    }
  }

  content = content.replace(/alert\(([^)]+)\);?/g, (match, p1) => {
    if (p1.toLowerCase().includes('berhasil')) {
      return `Swal.fire("Berhasil!", ${p1}, "success");`;
    } else if (p1.toLowerCase().includes('gagal') || p1.toLowerCase().includes('kesalahan') || p1.toLowerCase().includes('error')) {
      return `Swal.fire("Gagal!", ${p1}, "error");`;
    } else {
      return `Swal.fire("Informasi", ${p1}, "info");`;
    }
  });

  content = content.replace(/if\s*\(!?(window\.)?confirm\(([^)]+)\)\)\s*return;/g, (match, p1, p2) => {
    return `const swalResult = await Swal.fire({
      title: 'Konfirmasi',
      text: ${p2},
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya',
      cancelButtonText: 'Batal'
    });
    if (!swalResult.isConfirmed) return;`;
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
