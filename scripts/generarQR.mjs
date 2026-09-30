// Genera los 5 códigos QR (PNG + SVG) para el pasaporte digital.
// Uso:
//   1. Define NEXT_PUBLIC_APP_URL en tu .env.local con la URL final de producción.
//   2. npm run qr
// Salida: public/qr/<stamp_id>.png y public/qr/<stamp_id>.svg

import QRCode from "qrcode";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "./_loadEnv.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const outDir = path.join(rootDir, "public", "qr");

// Debe coincidir exactamente con lib/stamps.ts (STAMPS).
const STAMPS = [
  { id: "thoughts", label: "Tus pensamientos", date: "07 de octubre" },
  { id: "emotions", label: "Tus emociones", date: "14 de octubre" },
  { id: "body", label: "Tu cuerpo", date: "21 de octubre" },
  { id: "connections", label: "Tus conexiones", date: "28 de octubre" },
  { id: "values_fair", label: "Lo que es importante para ti (Feria)", date: "04 de noviembre" }
];

const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").trim().replace(/\/$/, "");

if (!appUrl) {
  console.error(
    "\n[ERROR] Falta NEXT_PUBLIC_APP_URL en tu .env.local.\n" +
      "Define la URL final de producción antes de generar los QR, por ejemplo:\n" +
      "NEXT_PUBLIC_APP_URL=https://pasaporte-wellsphere.vercel.app\n"
  );
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

async function main() {
  console.log(`Generando QR con base URL: ${appUrl}\n`);

  for (const stamp of STAMPS) {
    const url = `${appUrl}/checkin/${stamp.id}`;
    const pngPath = path.join(outDir, `${stamp.id}.png`);
    const svgPath = path.join(outDir, `${stamp.id}.svg`);

    await QRCode.toFile(pngPath, url, {
      type: "png",
      width: 900,
      margin: 2,
      color: { dark: "#241C33", light: "#FFFFFF" }
    });

    const svgString = await QRCode.toString(url, {
      type: "svg",
      margin: 2,
      color: { dark: "#241C33", light: "#FFFFFF" }
    });
    fs.writeFileSync(svgPath, svgString, "utf-8");

    console.log(`✓ ${stamp.id.padEnd(14)} → ${url}`);
  }

  console.log(`\nListo. Archivos en: ${path.relative(rootDir, outDir)}\n`);
}

main().catch((err) => {
  console.error("Error generando los QR:", err);
  process.exit(1);
});
