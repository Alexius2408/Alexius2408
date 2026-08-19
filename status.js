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

  const offline = data.discord_status === "offline"

  let songTitle = "Nothing";
  let artists = ""
  let songLink = "https://open.spotify.com/user/31ikvkn2ygnqroneptawkkyr2yp4";

  if (data.listening_to_spotify && data.spotify) {
    const song = data.spotify.song || "";
    const artists = data.spotify.artist || ""
    const trackId = data.spotify.track_id || "";

    if (song) {
      songTitle = song;
    }

    if (artists) {
      songTitle = `${songTitle} - ${artists}`
    }

    if (trackId) {
      songLink = `https://open.spotify.com/track/${trackId}`;
    }
  }

  updateReadme(songLink, songTitle, offline);
}

function reformatForWebsite(value) {
  return String(value)
    .replace(/;/g, ",")
    .replace(/-/g, "--")
    .replace(/_/g, "__")
    .replace(/ /g, "_");
}

function spotifyListeningUrl(songTitle, songLink) {
  const path = `${encodeURIComponent(reformatForWebsite(songTitle))}-555555`;

  const params = new URLSearchParams({
    style: "for-the-badge",
    logo: "spotify",
    label: "Listening_to",
    color: "10b981",
    link: songLink,
  });

  return `https://img.shields.io/badge/${path}?${params.toString()}`;
}

function statusUrl(offline) {
  return offline
    ? "https://img.shields.io/badge/offline-ff000?style=for-the-badge&logo=facepunch&label=currently&color=ef4444"
    : "https://img.shields.io/badge/online-ff000?style=for-the-badge&logo=dependabot&label=currently&color=22c55e";
}

function updateReadme(songLink, songTitle, offline) {
  const readmePath = "README.md";
  const original = fs.readFileSync(readmePath, "utf8");
  let readme = original;

  readme = readme.replace(
    /(<a href=")[^"]*("\s+id="spotify-link">)/,
    `$1${songLink}$2`
  );

  readme = readme.replace(
    /(<img src=")[^"]*("\s+id="status-listening-img")/,
    `$1${spotifyListeningUrl(songTitle, songLink)}$2`
  );

  readme = readme.replace(
    /(<img src=")[^"]*("\s+id="status-online-img")/,
    `$1${statusUrl(offline)}$2`
  );

  if (readme !== original) {
    fs.writeFileSync(readmePath, readme);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
