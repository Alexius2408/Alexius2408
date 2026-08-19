const fs = require("fs");

const sha = process.argv[2];

if (!sha) {
  throw new Error("Usage: node img_sha_url.js <commit-sha>");
}

const readmePath = "README.md";
let readme = fs.readFileSync(readmePath, "utf8");

readme = readme.replace(
  /(raw\.githubusercontent\.com\/Alexius2408\/Alexius2408\/)[^/]+(\/generated\/status-online\.svg)/,
  `$1${sha}$2`
);

readme = readme.replace(
  /(raw\.githubusercontent\.com\/Alexius2408\/Alexius2408\/)[^/]+(\/generated\/status-listening\.svg)/,
  `$1${sha}$2`
);

fs.writeFileSync(readmePath, readme);
