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

  const status =
    data.discord_status === "offline"
      ? "offline"
      : "online";

  let listening = "nothing";
  let songLink = "https://open.spotify.com/user/31ikvkn2ygnqroneptawkkyr2yp4";

  if (data.listening_to_spotify && data.spotify) {
    const song = data.spotify.song || "";
    const artist = data.spotify.artist || "";
    const trackId = data.spotify.track_id || "";

    if (song && artist) {
      listening = `${song} — ${artist}`;
    } else if (song) {
      listening = song;
    }

    if (trackId) {
      songLink = `https://open.spotify.com/track/${trackId}`;
    }
  }

  fs.mkdirSync("generated", { recursive: true });

  const onlineChanged = writeIfChanged(
    "generated/status-online.svg",
    badge(
      "currently",
      status,
      status === "online" ? "#22c55e" : "#ef4444"
    )
  );

  const listeningChanged = writeIfChanged(
    "generated/status-listening.svg",
    badge(
      "listening to",
      listening,
      "#10b981"
    )
  );

  updateReadme(songLink, onlineChanged, listeningChanged);
}

function writeIfChanged(path, content) {
  const existing = fs.existsSync(path) ? fs.readFileSync(path, "utf8") : null;

  if (existing === content) {
    return false;
  }

  fs.writeFileSync(path, content);
  return true;
}

function updateReadme(songLink, onlineChanged, listeningChanged) {
  const readmePath = "README.md";
  const original = fs.readFileSync(readmePath, "utf8");
  let readme = original;

  readme = readme.replace(
    /(<a href=")[^"]*("\s+id="spotify-link">)/,
    `$1${songLink}$2`
  );

  if (onlineChanged) {
    readme = readme.replace(
      /(status-online\.svg\?v=)\d+/,
      `$1${Date.now()}`
    );
  }

  if (listeningChanged) {
    readme = readme.replace(
      /(status-listening\.svg\?v=)\d+/,
      `$1${Date.now()}`
    );
  }

  if (readme !== original) {
    fs.writeFileSync(readmePath, readme);
  }
}

function formatXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function badge(label, value, color) {
  label = formatXml(label);
  value = formatXml(value);
  color = formatXml(color);

  const labelWidth = Math.max(90, label.length * 7 + 24);
  const valueWidth = Math.max(100, value.length * 7 + 24);
  const width = labelWidth + valueWidth;

  const content = `
    <rect
      width="${labelWidth}"
      height="28"
      fill="#555"
    />

    <rect
      x="${labelWidth}"
      width="${valueWidth}"
      height="28"
      fill="${color}"
    />

    <text
      x="${labelWidth / 2}"
      y="18"
      fill="#fff"
      text-anchor="middle"
      font-family="Arial,sans-serif"
      font-size="12"
    >${label}</text>

    <text
      x="${labelWidth + valueWidth / 2}"
      y="18"
      fill="#fff"
      text-anchor="middle"
      font-family="Arial,sans-serif"
      font-size="12"
    >${value}</text>
  `;

  return `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${width}"
  height="28"
  role="img"
>
  ${content}
</svg>`;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});