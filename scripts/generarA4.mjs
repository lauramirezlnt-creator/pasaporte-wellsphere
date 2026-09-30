// Genera las 5 plantillas imprimibles tamaño A4 (HTML listo para imprimir /
// exportar a PDF desde el navegador con Ctrl+P > Guardar como PDF).
// Requiere haber corrido antes "npm run qr" (usa los PNG generados ahí).
//
// Uso:
//   npm run qr        (primero, genera los QR)
//   npm run qr:a4      (luego, genera las piezas A4)
//
// Salida: public/qr/a4/<stamp_id>.html

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "./_loadEnv.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const qrDir = path.join(rootDir, "public", "qr");
const outDir = path.join(rootDir, "public", "qr", "a4");
const logoPath = path.join(rootDir, "public", "brand", "wellsphere-logo.svg");


// Debe coincidir exactamente con lib/stamps.ts (STAMPS).
const STAMPS = [
  { id: "thoughts", label: "Tus pensamientos", displayDate: "Miércoles 07 de octubre" },
  { id: "emotions", label: "Tus emociones", displayDate: "Miércoles 14 de octubre" },
  { id: "body", label: "Tu cuerpo", displayDate: "Miércoles 21 de octubre" },
  { id: "connections", label: "Tus conexiones", displayDate: "Miércoles 28 de octubre" },
  {
    id: "values_fair",
    label: "Lo que es importante para ti (Feria)",
    displayDate: "Miércoles 04 de noviembre"
  }
];

fs.mkdirSync(outDir, { recursive: true });

if (!fs.existsSync(logoPath)) {
  console.error(`\n[ERROR] No se encontró el logo en ${logoPath}\n`);
  process.exit(1);
}

const logoSvg = fs.readFileSync(logoPath, "utf-8");
const logoBase64 = Buffer.from(logoSvg, "utf-8").toString("base64");
const logoDataUri = `data:image/svg+xml;base64,${logoBase64}`;

function buildHtml(stamp, qrDataUri) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>QR — ${stamp.label}</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: 'Segoe UI', Arial, sans-serif;
    background: #FBF7F0;
  }
  .sheet {
    width: 210mm;
    height: 297mm;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: 18mm 16mm;
    position: relative;
    overflow: hidden;
  }
  .cover {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #FF7A00 0%, #FF3D8A 45%, #B14EFF 75%, #6E3AF0 100%);
    clip-path: polygon(0 0, 100% 0, 100% 22%, 0 30%);
  }
  .content { position: relative; z-index: 1; width: 100%; display: flex; flex-direction: column; align-items: center; }
  .logo { width: 200px; margin-top: 4mm; }
  .eyebrow {
    color: #fff;
    font-size: 13px;
    letter-spacing: 3px;
    text-transform: uppercase;
    font-weight: 700;
    margin-top: 14mm;
    text-align: center;
  }
  .title {
    color: #241C33;
    font-size: 30px;
    font-weight: 800;
    text-align: center;
    margin-top: 6mm;
    max-width: 150mm;
  }
  .date {
    color: #4A3F5C;
    font-size: 16px;
    font-weight: 600;
    margin-top: 4mm;
    text-align: center;
  }
  .qr-box {
    margin-top: 16mm;
    background: #fff;
    border: 3px solid #241C33;
    border-radius: 14px;
    padding: 8mm;
  }
  .qr-box img { width: 85mm; height: 85mm; display: block; }
  .instruction {
    margin-top: 12mm;
    text-align: center;
    color: #241C33;
    font-size: 15px;
    font-weight: 700;
    max-width: 140mm;
  }
  .note {
    margin-top: 4mm;
    text-align: center;
    color: #8B7F9C;
    font-size: 12.5px;
    max-width: 140mm;
  }
  .footer {
    position: relative;
    z-index: 1;
    text-align: center;
    color: #8B7F9C;
    font-size: 11px;
    margin-bottom: 4mm;
  }
</style>
</head>
<body>
  <div class="sheet">
    <div class="cover"></div>
    <div class="content">
      <img class="logo" src="${logoDataUri}" alt="WellSphere LATAM" />
      <div class="eyebrow">Next Stop: WellSphere Wellness</div>
      <div class="title">Sello: "${stamp.label}"</div>
      <div class="date">${stamp.displayDate}</div>
      <div class="qr-box">
        <img src="${qrDataUri}" alt="Código QR" />
      </div>
      <div class="instruction">
        Escanea para registrar tu sello (solo 8:00 a.m. a 12:00 p.m. COT)
      </div>
    </div>
    <div class="footer">WellSphere LATAM · Pasaporte digital de bienestar</div>
  </div>
</body>
</html>`;
}

async function main() {
  console.log("Generando plantillas A4...\n");

  for (const stamp of STAMPS) {
    const pngPath = path.join(qrDir, `${stamp.id}.png`);

    if (!fs.existsSync(pngPath)) {
      console.error(
        `[ERROR] No existe ${path.relative(rootDir, pngPath)}. Corre primero "npm run qr".`
      );
      process.exit(1);
    }

    const qrBase64 = fs.readFileSync(pngPath).toString("base64");
    const qrDataUri = `data:image/png;base64,${qrBase64}`;

    const html = buildHtml(stamp, qrDataUri);
    const outPath = path.join(outDir, `${stamp.id}.html`);
    fs.writeFileSync(outPath, html, "utf-8");

    console.log(`✓ ${stamp.id.padEnd(14)} → ${path.relative(rootDir, outPath)}`);
  }

  console.log(
    "\nListo. Abre cada archivo .html en el navegador y usa Ctrl+P > Guardar como PDF (tamaño A4, sin márgenes) para obtener la pieza imprimible.\n"
  );
}

main();
