const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { marked } = require("marked");

const root = process.cwd();

const contentRoot = path.join(
  root,
  "content"
);

const manifestPath = path.join(
  root,
  ".omniflo-cms-manifest.json"
);

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

const CMS_START =
  "<!-- OMNIFLO CMS START -->";

const CMS_END =
  "<!-- OMNIFLO CMS END -->";


function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function ensureDir(dir) {
  fs.mkdirSync(dir, {
    recursive: true
  });
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


function safeUrl(value = "") {
  const url = String(value).trim();

  if (
    url.startsWith("/") ||
    url.startsWith("./") ||
    url.startsWith("../")
  ) {
    return url;
  }

  try {
    const parsed = new URL(url);

    if (
      parsed.protocol === "https:" ||
      parsed.protocol === "http:" ||
      parsed.protocol === "mailto:"
    ) {
      return url;
    }
  } catch (error) {
    return "";
  }

  return "";
}


function imageUrl(value = "") {
  const image = String(value).trim();

  if (!image) {
    return "";
  }

  if (
    image.startsWith("/") ||
    image.startsWith("https://") ||
    image.startsWith("http://")
  ) {
    return image;
  }

  return "/" + image.replace(/^\/+/, "");
}


function loadManifest() {
  if (!fs.existsSync(manifestPath)) {
    return [];
  }

  try {
    const data = JSON.parse(
      fs.readFileSync(
        manifestPath,
        "utf8"
      )
    );

    return Array.isArray(data)
      ? data
      : [];
  } catch (error) {
    return [];
  }
}


function saveManifest(paths) {
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      paths,
      null,
      2
    )
  );
}


function removeEmptyDirectories(dir) {
  if (!fs.existsSync(dir)) {
    return;
  }

  const entries = fs.readdirSync(
    dir,
    { withFileTypes: true }
  );

  for (const entry of entries) {
    const fullPath =
      path.join(
        dir,
        entry.name
      );

    if (entry.isDirectory()) {
      removeEmptyDirectories(
        fullPath
      );

      const remaining =
        fs.readdirSync(
          fullPath
        );

      if (remaining.length === 0) {
        fs.rmdirSync(
          fullPath
        );
      }
    }
  }
}


function cleanPreviousPages() {
  const previous =
    loadManifest();

  previous.forEach(relativePath => {
    const fullPath =
      path.join(
        root,
        relativePath
      );

    if (
      fs.existsSync(fullPath) &&
      fs.statSync(fullPath).isFile()
    ) {
      fs.unlinkSync(fullPath);
    }
  });

  collections.forEach(
    collection => {
      removeEmptyDirectories(
        path.join(
          root,
          collection.output
        )
      );
    }
  );
}


function renderPage({
  title,
  description,
  body,
  collection,
  image
}) {
  const homePrefix = "../../";

  const safeTitle =
    escapeHtml(title);

  const safeDescription =
    escapeHtml(description);

  const safeImage =
    imageUrl(image);

  return `<!DOCTYPE html>
<html lang="en">

<head>

  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <meta
    name="description"
    content="${safeDescription}"
  >

  <meta
    name="robots"
    content="index, follow"
  >

  <meta
    property="og:title"
    content="${safeTitle} — OmniFlo"
  >

  <meta
    property="og:description"
    content="${safeDescription}"
  >

  ${
    safeImage
      ? `<meta
    property="og:image"
    content="${escapeHtml(safeImage)}"
  >`
      : ""
  }

  <title>
    ${safeTitle} — OmniFlo
  </title>

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

      background:
        rgba(251, 250, 246, 0.94);

      backdrop-filter: blur(12px);

      border-bottom:
        1px solid var(--line);
    }

    .nav {
      min-height: 74px;

      display: flex;
      align-items: center;
      justify-content: space-between;

      gap: 20px;
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

      font-size:
        clamp(2.5rem, 6vw, 4.8rem);

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
      margin:
        20px 0 25px 25px;
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

      border-left:
        4px solid var(--teal);

      border-radius: 10px;
    }

    .content img {
      max-width: 100%;
      height: auto;

      border-radius: 16px;

      margin: 25px 0;
    }

    .content pre {
      overflow-x: auto;

      padding: 20px;

      background: #10231d;
      color: #ffffff;

      border-radius: 14px;

      margin: 25px 0;
    }

    .content code {
      font-family:
        "SFMono-Regular",
        Consolas,
        "Liberation Mono",
        monospace;
    }

    .content table {
      width: 100%;
      border-collapse: collapse;
      margin: 25px 0;
    }

    .content th,
    .content td {
      padding: 12px;
      border:
        1px solid var(--line);

      text-align: left;
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

      .nav {
        min-height: 66px;
      }

      .back {
        font-size: 0.78rem;
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
        ${safeTitle}
      </h1>

      ${
        safeDescription
          ? `<p class="description">
        ${safeDescription}
      </p>`
          : ""
      }

      ${
        safeImage
          ? `<img
        src="${escapeHtml(safeImage)}"
        alt="${safeTitle}"
        style="
          width:100%;
          max-height:520px;
          object-fit:cover;
          border-radius:18px;
          margin-bottom:40px;
        "
      >`
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


/*
=========================================================
STANDARD CMS CARD
Used by Products, Solutions and Resources
=========================================================
*/

function cardMarkup({
  collection,
  title,
  description,
  slug,
  image,
  price,
  link
}) {
  const safeTitle =
    escapeHtml(title);

  const safeDescription =
    escapeHtml(description);

  const safeImage =
    imageUrl(image);

  const publicPath =
    `/${collection}/${slug}/`;

  const safeExternalLink =
    safeUrl(link);

  return `
    <article class="omniflo-cms-card">

      ${
        safeImage
          ? `<img
              src="${escapeHtml(safeImage)}"
              alt="${safeTitle}"
              class="omniflo-cms-image"
            >`
          : ""
      }

      <div class="omniflo-cms-card-body">

        <div class="omniflo-cms-type">
          ${escapeHtml(collection)}
        </div>

        <h3>
          ${safeTitle}
        </h3>

        ${
          safeDescription
            ? `<p>${safeDescription}</p>`
            : ""
        }

        ${
          price
            ? `<div class="omniflo-cms-price">
                ${escapeHtml(price)}
              </div>`
            : ""
        }

        <div class="omniflo-cms-actions">

          <a
            href="${publicPath}"
            class="omniflo-cms-button"
          >
            View ${collection.slice(0, -1)} →
          </a>

          ${
            collection === "resources" &&
            safeExternalLink
              ? `<a
                  href="${escapeHtml(safeExternalLink)}"
                  target="_blank"
                  rel="noopener"
                  class="omniflo-cms-external"
                >
                  Open resource ↗
                </a>`
              : ""
          }

        </div>

      </div>

    </article>
  `;
}


/*
=========================================================
ARTICLE LIBRARY CARD
Matches the existing Knowledge Room design
=========================================================
*/

function articleCardMarkup({
  title,
  description,
  slug,
  image
}) {
  const safeTitle =
    escapeHtml(title);

  const safeDescription =
    escapeHtml(description);

  const safeImage =
    imageUrl(image);

  const publicPath =
    `/${"articles"}/${slug}/`;

  return `
    <a
      class="article-card omniflo-cms-article-card"
      href="${publicPath}"
    >

      ${
        safeImage
          ? `<img
              src="${escapeHtml(safeImage)}"
              alt="${safeTitle}"
              class="omniflo-cms-article-image"
            >`
          : ""
      }

      <div class="category">
        OMNIFLO ARTICLE
      </div>

      <h3>
        ${safeTitle}
      </h3>

      ${
        safeDescription
          ? `<p>${safeDescription}</p>`
          : ""
      }

      <div class="article-link">
        Read article →
      </div>

    </a>
  `;
}


/*
=========================================================
ROOM STYLES
Used by Products, Solutions and Resources
=========================================================
*/

function roomStyles() {
  return `
<style>

.omniflo-cms-room {
  width: min(1100px, 92%);
  margin: 70px auto;
  padding: 42px 0;
}

.omniflo-cms-room-heading {
  margin-bottom: 28px;
}

.omniflo-cms-room-eyebrow {
  color: #159c8b;
  font-size: .74rem;
  font-weight: 850;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 10px;
}

.omniflo-cms-room-heading h2 {
  margin: 0 0 10px;
}

.omniflo-cms-room-heading p {
  max-width: 680px;
  opacity: .78;
}

.omniflo-cms-grid {
  display: grid;
  grid-template-columns:
    repeat(auto-fit, minmax(250px, 1fr));
  gap: 22px;
}

.omniflo-cms-card {
  overflow: hidden;
  background: #ffffff;
  border: 1px solid rgba(20, 50, 40, .10);
  border-radius: 18px;
  box-shadow:
    0 12px 35px rgba(20, 40, 30, .07);
  transition:
    transform .2s ease,
    box-shadow .2s ease;
}

.omniflo-cms-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 18px 45px rgba(20, 40, 30, .11);
}

.omniflo-cms-image {
  display: block;
  width: 100%;
  height: 190px;
  object-fit: cover;
}

.omniflo-cms-card-body {
  padding: 24px;
}

.omniflo-cms-type {
  color: #159c8b;
  font-size: .68rem;
  font-weight: 850;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-bottom: 10px;
}

.omniflo-cms-card h3 {
  margin: 0 0 10px;
  font-size: 1.25rem;
  line-height: 1.25;
}

.omniflo-cms-card p {
  color: #65736d;
  line-height: 1.6;
  margin: 0 0 15px;
}

.omniflo-cms-price {
  font-weight: 850;
  color: #17251f;
  margin-bottom: 15px;
}

.omniflo-cms-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.omniflo-cms-button {
  display: inline-block;
  padding: 10px 15px;
  border-radius: 9px;
  background: #159c8b;
  color: #ffffff !important;
  font-weight: 750;
  text-decoration: none !important;
}

.omniflo-cms-external {
  color: #159c8b !important;
  font-weight: 750;
  text-decoration: none !important;
}

.omniflo-cms-empty {
  padding: 25px;
  border: 1px dashed rgba(20, 50, 40, .20);
  border-radius: 15px;
  color: #65736d;
}


/*
=========================================================
ARTICLE CARD ENHANCEMENTS
=========================================================
*/

.omniflo-cms-article-card {
  position: relative;
}

.omniflo-cms-article-image {
  display: block;
  width: calc(100% + 56px);
  height: 170px;
  object-fit: cover;
  margin: -28px -28px 25px;
  border-radius: 20px 20px 0 0;
}


@media (max-width: 600px) {

  .omniflo-cms-room {
    width: min(92%, 1100px);
    margin: 45px auto;
  }

  .omniflo-cms-grid {
    grid-template-columns: 1fr;
  }

  .omniflo-cms-article-image {
    width: calc(100% + 50px);
    margin: -25px -25px 25px;
  }

}

</style>
`;
}


/*
=========================================================
BUILD COLLECTION
=========================================================
*/

function buildCollection(collection) {

  const sourceDir =
    path.join(
      contentRoot,
      collection.name
    );

  const destinationDir =
    path.join(
      root,
      collection.output
    );

  ensureDir(destinationDir);

  const files =
    getMarkdownFiles(
      sourceDir
    );

  const entries = [];


  files.forEach(file => {

    const sourcePath =
      path.join(
        sourceDir,
        file
      );

    const raw =
      fs.readFileSync(
        sourcePath,
        "utf8"
      );

    const parsed =
      matter(raw);


    if (!parsed.data.title) {

      console.log(
        `Skipping ${file}: missing title`
      );

      return;
    }


    const slug =
      parsed.data.slug ||
      slugify(
        parsed.data.title
      );


    if (!slug) {

      console.log(
        `Skipping ${file}: could not create slug`
      );

      return;
    }


    const htmlBody =
      marked.parse(
        parsed.content
      );


    const page =
      renderPage({
        title:
          parsed.data.title,

        description:
          parsed.data.description ||
          "",

        body:
          htmlBody,

        collection:
          collection.name,

        image:
          parsed.data.image ||
          ""
      });


    const itemDir =
      path.join(
        destinationDir,
        slug
      );


    ensureDir(itemDir);


    const outputFile =
      path.join(
        itemDir,
        "index.html"
      );


    fs.writeFileSync(
      outputFile,
      page
    );


    entries.push({

      title:
        parsed.data.title,

      description:
        parsed.data.description ||
        "",

      slug,

      image:
        parsed.data.image ||
        "",

      price:
        parsed.data.price ||
        "",

      link:
        parsed.data.link ||
        ""

    });


    console.log(
      `Built ${collection.name}/${slug}`
    );

  });


  updateRoomIndex(
    collection,
    entries
  );


  return entries;
}


/*
=========================================================
UPDATE ROOM INDEX
=========================================================
*/

function updateRoomIndex(
  collection,
  entries
) {

  const indexPath =
    path.join(
      root,
      collection.output,
      "index.html"
    );


  if (!fs.existsSync(indexPath)) {

    console.log(
      `No room index found for ${collection.name}`
    );

    return;
  }


  let html =
    fs.readFileSync(
      indexPath,
      "utf8"
    );


  /*
  =======================================================
  ARTICLES
  Insert CMS articles directly into the existing
  Knowledge Room library grid.
  =======================================================
  */

  if (
    collection.name === "articles"
  ) {

    const cmsArticleStart =
      "<!-- OMNIFLO CMS ARTICLES START -->";

    const cmsArticleEnd =
      "<!-- OMNIFLO CMS ARTICLES END -->";


    const existingStart =
      html.indexOf(
        cmsArticleStart
      );

    const existingEnd =
      html.indexOf(
        cmsArticleEnd
      );


    /*
    Remove a previous generated article block
    if one exists.
    */

    if (
      existingStart !== -1 &&
      existingEnd !== -1 &&
      existingEnd > existingStart
    ) {

      const endPosition =
        existingEnd +
        cmsArticleEnd.length;

      html =
        html.slice(
          0,
          existingStart
        ) +
        html.slice(
          endPosition
        );

    }


    if (entries.length) {

      const articleCards =
        entries
          .map(entry =>
            articleCardMarkup({
              title:
                entry.title,

              description:
                entry.description,

              slug:
                entry.slug,

              image:
                entry.image
            })
          )
          .join("\n");


      const articleBlock = `

${cmsArticleStart}

${articleCards}

${cmsArticleEnd}

`;


      const libraryGridMarker =
        '<div class="library-grid">';


      const markerPosition =
        html.indexOf(
          libraryGridMarker
        );


      if (
        markerPosition !== -1
      ) {

        const insertPosition =
          markerPosition +
          libraryGridMarker.length;


        html =
          html.slice(
            0,
            insertPosition
          ) +
          articleBlock +
          html.slice(
            insertPosition
          );


        /*
        Add the small amount of CMS styling
        needed for article images.
        */

        const styleBlock = `
<style>

.omniflo-cms-article-card {
  position: relative;
}

.omniflo-cms-article-image {
  display: block;
  width: calc(100% + 56px);
  height: 170px;
  object-fit: cover;
  margin: -28px -28px 25px;
  border-radius: 20px 20px 0 0;
}

@media (max-width: 560px) {

  .omniflo-cms-article-image {
    width: calc(100% + 50px);
    margin: -25px -25px 25px;
  }

}

</style>
`;


        const headClose =
          html.indexOf(
            "</head>"
          );


        if (
          headClose !== -1
        ) {

          html =
            html.slice(
              0,
              headClose
            ) +
            styleBlock +
            html.slice(
              headClose
            );

        }

      } else {

        console.log(
          "Articles library grid not found. CMS articles were not inserted."
        );

      }

    }


    fs.writeFileSync(
      indexPath,
      html
    );


    console.log(
      "Updated articles/index.html"
    );


    return;
  }


  /*
  =======================================================
  PRODUCTS / SOLUTIONS / RESOURCES
  Keep existing CMS room behaviour.
  =======================================================
  */


  const existingStart =
    html.indexOf(
      CMS_START
    );

  const existingEnd =
    html.indexOf(
      CMS_END
    );


  if (
    existingStart !== -1 &&
    existingEnd !== -1 &&
    existingEnd > existingStart
  ) {

    const endPosition =
      existingEnd +
      CMS_END.length;


    html =
      html.slice(
        0,
        existingStart
      ) +
      html.slice(
        endPosition
      );

  }


  let section = `

${CMS_START}

${roomStyles()}

<section class="omniflo-cms-room">

  <div class="omniflo-cms-room-heading">

    <div class="omniflo-cms-room-eyebrow">

      OMNIFLO
      ${escapeHtml(collection.title)}

    </div>

    <h2>
      Latest from OmniFlo
    </h2>

    <p>
      Published through the OmniFlo private publishing system.
    </p>

  </div>


  ${
    entries.length

      ? `<div class="omniflo-cms-grid">

          ${entries
            .map(entry =>
              cardMarkup({

                collection:
                  collection.name,

                title:
                  entry.title,

                description:
                  entry.description,

                slug:
                  entry.slug,

                image:
                  entry.image,

                price:
                  entry.price,

                link:
                  entry.link

              })
            )
            .join("")}

        </div>`

      : `<div class="omniflo-cms-empty">

          No published
          ${escapeHtml(collection.name)}
          yet.

        </div>`
  }


</section>

${CMS_END}

`;


  const mainClose =
    html.lastIndexOf(
      "</main>"
    );


  if (
    mainClose !== -1
  ) {

    html =
      html.slice(
        0,
        mainClose
      ) +
      section +
      html.slice(
        mainClose
      );

  } else {

    html += section;

  }


  fs.writeFileSync(
    indexPath,
    html
  );


  console.log(
    `Updated ${collection.output}/index.html`
  );
}


/*
=========================================================
START BUILD
=========================================================
*/

console.log(
  "Starting OmniFlo content build..."
);


cleanPreviousPages();


const newManifest = [];


collections.forEach(
  collection => {

    const entries =
      buildCollection(
        collection
      );


    entries.forEach(
      entry => {

        newManifest.push(

          path.join(

            collection.output,

            entry.slug,

            "index.html"

          )

        );

      }
    );

  }
);


saveManifest(
  newManifest
);


console.log(
  "OmniFlo content build complete."
);
