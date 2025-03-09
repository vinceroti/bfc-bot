import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import chalk from "chalk";
import notifier from "node-notifier";
import { exec } from "child_process";

const $BESTBUY_ADD_TO_CART = ".add-to-cart-button";
const $BEST_BUY = "bestbuy";
const $NEWEGG = "newegg";

// Enable stealth mode to avoid bot detection
puppeteer.use(StealthPlugin());

class Scraper {
  constructor() {
    this.urls = [
      {
        url:
          "https://www.newegg.com/powercolor-reaper-rx9070xt-16g-a-amd-radeon-rx-9070-xt-16gb-gddr6/p/N82E16814131871",
        provider: $NEWEGG,
      },
      {
        url:
          "https://www.newegg.com/gigabyte-gv-r9070xtgaming-16gd-amd-radeon-rx-9070-xt-16gb-gddr6/p/N82E16814932783",
        provider: $NEWEGG,
      },
      {
        url:
          "https://www.newegg.com/xfx-swift-rx-97tswf3w9-amd-radeon-rx-9070-xt-16gb-gddr6/p/N82E16814150907",
        provider: $NEWEGG,
      },
      {
        url:
          "https://www.bestbuy.com/site/xfx-swift-amd-radeon-rx-9070xt-16gb-gddr6-pci-express-5-0-gaming-graphics-card-black/6620455.p?skuId=6620455",
        provider: $BEST_BUY,
      },
      {
        url:
          "https://www.bestbuy.com/site/gigabyte-radeon-rx-9070-xt-gaming-16g-gddr6-pci-express-5-0-graphics-card-black/6622482.p?skuId=6622482",
        provider: $BEST_BUY,
      },
    ];
    this.success = false;
    this.successTries = 0;
    this.intervalTime = 20000; // Check every 15 seconds
    this.externalBrowserOpen = {};
    this.init();
  }

  async init() {
    await this.createBrowser();
    console.log(chalk.blue("🚀 Scraper Started 🚀"));
    this.startChecking();
  }

  async createBrowser() {
    this.browser = await puppeteer.launch({
      headless: false, // Run in non-headless mode
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    this.page = await this.browser.newPage();
    await this.page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    );

    // Block unnecessary resources (ads, fonts, stylesheets)
    await this.page.setRequestInterception(true);
    this.page.on("request", (req) => {
      if (
        ["image", "stylesheet", "font", "media"].includes(req.resourceType())
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });
  }

  startChecking() {
    this.checkItems(); // Run immediately
    this.interval = setInterval(() => this.checkItems(), this.intervalTime);
  }

  async checkItems() {
    console.log(
      chalk.gray(`🔄 Checking stock at ${new Date().toLocaleTimeString()}...`)
    );

    for (const urlObj of this.urls) {
      try {
        await this.page.goto(urlObj.url, { waitUntil: "domcontentloaded" });

        let evaluateString = await this.evaluatePageContent(urlObj);

        if (this.isBotDetection(evaluateString, urlObj)) {
          await this.page.waitForNavigation();
          break;
        }

        this.processStockStatus(evaluateString, urlObj);
      } catch (error) {
        console.log(
          chalk.red(`✖ ${urlObj.provider}: ERROR - ${error.message}`)
        );
        if (this.page.isClosed()) {
          console.log(chalk.yellow("🔄 Re-creating browser..."));
          await this.createBrowser();
        }
      }
    }
  }

  async evaluatePageContent(urlObj) {
    if (urlObj.provider === $BEST_BUY) {
      const addToCartButton = await this.page.$($BESTBUY_ADD_TO_CART);
      return addToCartButton
        ? await this.page.evaluate(
            (button) => button.innerText,
            addToCartButton
          )
        : "";
    } else if (urlObj.provider === $NEWEGG) {
      return await this.page.evaluate(() => document.body.innerText);
    }
    return "";
  }

  isBotDetection(evaluateString, urlObj) {
    if (evaluateString.toLowerCase().includes("are you a human?")) {
      console.log(chalk.red(`✖ ${urlObj.provider}: DETECTED AS BOT`));
      console.log(chalk.yellow("User intervention required!"));
      notifier.notify({ message: "🚨 DETECTED AS BOT 🚨", sound: true });
      return true;
    }
    return false;
  }

  processStockStatus(evaluateString, urlObj) {
    if (evaluateString.toLowerCase().includes("add to cart")) {
      this.successNotify(urlObj);
    } else {
      console.log(chalk.red(`✖ ${urlObj.provider}: ITEM NOT AVAILABLE`));
    }
  }

  successNotify(urlObj) {
    const message = `🚀🚨 ${urlObj.provider.toUpperCase()}: ITEM AVAILABLE! 🚨🚀`;
    console.log(chalk.bgGreen.white.bold(message));

    if (!this.externalBrowserOpen[urlObj.provider]) {
      this.openExternalBrowser(urlObj.url);
    }

    if (!this.success || this.successTries < 3) {
      notifier.notify({ message, sound: true });
      this.success = true;
      this.externalBrowserOpen[urlObj.provider] = true;
    }

    if (++this.successTries >= 15) this.resetSuccess();
  }

  openExternalBrowser(url) {
    exec(
      process.platform === "darwin"
        ? `open "${url}"` // macOS
        : process.platform === "win32"
        ? `start "" "${url}"` // Windows
        : `xdg-open "${url}"`, // Linux
      (error) => {
        if (error) {
          console.error(chalk.red("❌ Failed to open browser:"), error);
        }
      }
    );
  }

  resetSuccess() {
    this.success = false;
    this.successTries = 0;
    this.externalBrowserOpen = {};
  }

  stopScraper() {
    clearInterval(this.interval);
    this.browser.close();
    console.log(chalk.blue("🛑 Scraper Stopped 🛑"));
  }
}

export default Scraper;
