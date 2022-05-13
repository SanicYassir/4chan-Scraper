const puppeteer = require("puppeteer");
//const download = require("image-downloader");
const imageDownloader = require("node-image-downloader");

const fs = require("fs");
const date = new Date().toLocaleDateString().split('/').join('');

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
    if (
      !fs.existsSync(
        `./images/threads/${thread}/${date}_page_${numPage === "" ? 1 : numPage}`
      )
    )
      fs.mkdirSync(
        `./images/threads/${thread}/${date}_page_${numPage === "" ? 1 : numPage}`
      );


    let options = {
      imgs: srcs.map((src) => {
        return { uri: src };
      }),
      dest: `./images/threads/${thread}/${date}_page_${numPage === "" ? 1 : numPage}`,
    };

    console.log("Images count : " + options.imgs.length);
    console.log(options);

    imageDownloader(options)
      .then((info) => {
        console.log("all done", info);
      })
      .catch((error, response, body) => {
        console.log("something goes bad!");
        console.log(error);
      });
  })();
};

const createDir = () => {
  if (!fs.existsSync(`./images`)) {
    fs.mkdirSync(`./images/`);
  }

  if (!fs.existsSync("./images/threads")) {
    fs.mkdirSync("./images/threads");
  }
};

createDir();
Scrape4chanImages(args.thread, args.page);
