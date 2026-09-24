const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { marked } = require("marked");

const root = process.cwd();

const contentRoot = path.join(root, "content");
const outputRoot = path.join(root, "generated");

const collections = [
  {
    name: "articles",
    output: "articles",
    title: "Articles"
  },
  {
    name: "products",
    output: "products",
    title: "Products"
  },
  {
    name: "solutions",
    output: "solutions",
    title: "Solutions"
  },
  {
    name: "resources",
    output: "resources",
    title: "Resources"
  }
];

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs
    .readdirSync(dir)
    .filter(file => file.endsWith(".md"));
}

function renderPage({
  title,
  description,
  body,
  collection,
  slug
}) {
  const homePrefix = collection === "articles"
    ? "../"
    : "../";

  return `<!DOCTYPE html>
<html lang="en">

<head>

  <meta charset="UTF-8">

  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <meta
    name="description"
    content="${escapeHtml(description)}"
  >

  <title>${escapeHtml(title)} — OmniFlo</title>

  <style>

    :root {
      --ink: #17251f;
      --muted: #65736d;
      --teal: #159c8b;
      --green: #39c98a;
      --mint: #eaf7f1;
      --paper: #fbfaf6;
      --white: #ffffff;
      --line: #dfe7e1;
      --dark: #10231d;
      --shadow: 0 15px 40px rgba(23, 37, 31, 0.07);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html {
      scroll-behavior: smooth;
    }

    body {
      font-family:
        Inter,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        Roboto,
        Arial,
        sans-serif;

      background: var(--paper);
      color: var(--ink);
      line-height: 1.7;
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    .wrap {
      width: min(900px, 92%);
      margin: auto;
    }

    header {
      position: sticky;
      top: 0;
      z-index: 1000;

      background: rgba(251, 250, 246, 0.94);
      backdrop-filter: blur(12px);

      border-bottom: 1px solid var(--line);
    }

    .nav {
      min-height: 74px;

      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .brand-logo {
      width: 150px;
      height: auto;
      display: block;
    }

    .back {
      color: var(--teal);
      font-size: 0.9rem;
      font-weight: 750;
    }

    main {
      padding: 80px 0;
    }

    .eyebrow {
      margin-bottom: 16px;

      color: var(--teal);

      font-size: 0.74rem;
      font-weight: 850;

      letter-spacing: 2px;
      text-transform: uppercase;
    }

    h1 {
      max-width: 850px;

      font-size: clamp(2.5rem, 6vw, 4.8rem);
      line-height: 1.03;
      letter-spacing: -2.5px;

      margin-bottom: 24px;
    }

    .description {
      max-width: 720px;

      color: var(--muted);
      font-size: 1.12rem;

      margin-bottom: 45px;
    }

    .content {
      max-width: 780px;

      font-size: 1.04rem;
    }

    .content h2,
    .content h3 {
      margin-top: 42px;
      margin-bottom: 15px;

      line-height: 1.2;
    }

    .content p {
      margin-bottom: 20px;
    }

    .content ul,
    .content ol {
      margin: 20px 0 25px 25px;
    }

    .content li {
      margin-bottom: 9px;
    }

    .content a {
      color: var(--teal);
      font-weight: 700;
    }

    .content blockquote {
      margin: 30px 0;
      padding: 22px 25px;

      background: var(--mint);

      border-left: 4px solid var(--teal);
      border-radius: 10px;
    }

    .content img {
      max-width: 100%;
      height: auto;
      border-radius: 16px;
      margin: 25px 0;
    }

    footer {
      padding: 30px 0;

      background: #0d1d18;
      color: #9eafa8;

      font-size: 0.83rem;
    }

    .footer-row {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      align-items: center;
    }

    .footer-logo {
      width: 140px;
      height: auto;
    }

    footer strong {
      color: white;
    }

    @media (max-width: 600px) {

      .brand-logo {
        width: 125px;
      }

      main {
        padding: 60px 0;
      }

      h1 {
        letter-spacing: -1.5px;
      }

      .footer-row {
        flex-direction: column;
        align-items: flex-start;
      }

    }

  </style>

</head>

<body>

  <header>

    <div class="wrap nav">

      <a href="${homePrefix}index.html">

        <img
          src="${homePrefix}assets/brand/omniflo-logo.png"
          alt="OmniFlo — Ideas • Tools • Real Impact"
          class="brand-logo"
        >

      </a>

      <a
        class="back"
        href="${homePrefix}${collection}/index.html"
      >
        ← Back to ${escapeHtml(collection)}
      </a>

    </div>

  </header>

  <main>

    <div class="wrap">

      <div class="eyebrow">
        OMNIFLO ${escapeHtml(collection)}
      </div>

      <h1>
        ${escapeHtml(title)}
      </h1>

      ${
        description
          ? `<p class="description">${escapeHtml(description)}</p>`
          : ""
      }

      <article class="content">

        ${body}

      </article>

    </div>

  </main>

  <footer>

    <div class="wrap footer-row">

      <img
        src="${homePrefix}assets/brand/omniflo-logo.png"
        alt="OmniFlo"
        class="footer-logo"
      >

      <div>
        © ${new Date().getFullYear()}
        <strong>OmniFlo</strong>.
        Built one brick at a time.
      </div>

    </div>

  </footer>

</body>

</html>`;
}

function buildCollection(collection) {
  const sourceDir = path.join(contentRoot, collection.name);
  const destinationDir = path.join(
    outputRoot,
    collection.output
  );

  ensureDir(destinationDir);

  const files = getMarkdownFiles(sourceDir);

  files.forEach(file => {
    const sourcePath = path.join(sourceDir, file);
    const raw = fs.readFileSync(sourcePath, "utf8");

    const parsed = matter(raw);

    if (!parsed.data.title) {
      console.log(
        `Skipping ${file}: missing title`
      );

      return;
    }

    const slug =
      parsed.data.slug ||
      slugify(parsed.data.title);

    const htmlBody = marked.parse(
      parsed.content
    );

    const page = renderPage({
      title: parsed.data.title,
      description: parsed.data.description || "",
      body: htmlBody,
      collection: collection.name,
      slug
    });

    const itemDir = path.join(
      destinationDir,
      slug
    );

    ensureDir(itemDir);

    fs.writeFileSync(
      path.join(itemDir, "index.html"),
      page
    );

    console.log(
      `Built ${collection.name}/${slug}`
    );
  });
}

if (fs.existsSync(outputRoot)) {
  fs.rmSync(outputRoot, {
    recursive: true,
    force: true
  });
}

ensureDir(outputRoot);

collections.forEach(buildCollection);

console.log("OmniFlo content build complete.");
