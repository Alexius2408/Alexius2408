const fs = require("fs");

const DISCORD_ID = process.env.DISCORD_ID;

if (!DISCORD_ID) {
  throw new Error("DISCORD_ID is not set");
}

async function main() {
  const response = await fetch(
    `https://api.lanyard.rest/v1/users/${DISCORD_ID}`
  );

  if (!response.ok) {
    throw new Error(`Lanyard returned ${response.status}`);
  }

  const json = await response.json();

  if (!json.success || !json.data) {
    throw new Error("Invalid Lanyard response");
  }

  const data = json.data;

  // ONLY expose these two values.
  const status =
    data.discord_status === "offline"
      ? "offline"
      : "online";

  let listening = "nothing";

  if (data.listening_to_spotify && data.spotify) {
    const song = data.spotify.song || "";
    const artist = data.spotify.artist || "";

    if (song && artist) {
      listening = `${song} — ${artist}`;
    } else if (song) {
      listening = song;
    }
  }

  fs.mkdirSync("generated", { recursive: true });

  fs.writeFileSync(
    "generated/status-online.svg",
    badge(
      "currently",
      status,
      status === "online" ? "#22c55e" : "#ef4444"
    )
  );

  fs.writeFileSync(
    "generated/status-listening.svg",
    badge(
      "listening to",
      listening,
      "#10b981"
    )
  );

  console.log({
    status,
    listening,
  });
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function badge(label, value, color) {
  label = escapeXml(label);
  value = escapeXml(value);

  const labelWidth = Math.max(90, label.length * 7 + 24);
  const valueWidth = Math.max(100, value.length * 7 + 24);

  const width = labelWidth + valueWidth;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="28" role="img">
  <rect width="${labelWidth}" height="28" fill="#555"/>
  <rect x="${labelWidth}" width="${valueWidth}" height="28" fill="${color}"/>
  <text x="${labelWidth / 2}" y="18" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif" font-size="12">${label}</text>
  <text x="${labelWidth + valueWidth / 2}" y="18" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif" font-size="12">${value}</text>
</svg>`;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});