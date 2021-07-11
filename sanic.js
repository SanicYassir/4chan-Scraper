const puppeteer = require("puppeteer");
const download = require("image-downloader");
const fs = require("fs");

let args = {
  thread: process.argv[2],
  page: !process.argv[3] ? "" : process.argv[3],
};

if (!args.thread) {
  console.log("node index.js [thread] [page]");
  process.exit(1);
}

const Scrape4chanImages = (t, p) => {
  const thread = t;
  const numPage = p;

  const url = `https://boards.4channel.org/${thread}/${
    numPage == 1 ? "" : numPage
  }`;
  console.log({ url });
  let srcs;

  (async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, {
      waitUntil: "networkidle2",
    });
    srcs = await page.evaluate(() => {
      data = Array.from(
        document.querySelectorAll(
          "[href$='.jpg'].fileThumb , [href$='.png'].fileThumb , [href$='.jpeg'].fileThumb"
        )
      ).map((a) => a.href);

      return data;
    });

    await browser.close();

    if (!fs.existsSync(`./images/threads/${thread}`)) {
      fs.mkdirSync(`./images/threads/${thread}`);
    }
    if (!fs.existsSync(`./images/threads/${thread}/${numPage}`))
      fs.mkdirSync(`./images/threads/${thread}/${numPage}`);

    let options = {
      url: "",
      dest: `./images/threads/${thread}/${numPage}`,
    };
    srcs.forEach((url) => {
      options.url = url;
      download
        .image(options)
        .then(({ filename }) => {
          console.log("Saved to", filename);
        })
        .catch((err) => {
          console.error(err);
        });
    });
  })();
};

Scrape4chanImages(args.thread, args.page);
