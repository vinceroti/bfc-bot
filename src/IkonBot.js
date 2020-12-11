import puppeteer from "puppeteer";
import fs from "fs/promises";
import chalk from "chalk";
import notifier from "node-notifier";

class IkonBot {
  constructor() {
    this.browser = "";
    this.page = "";
    this.client = "";
    this.baseUrl = "https://account.ikonpass.com";
    this.date = "2020-12-13";
    this.userName = "";
    this.pass = "";
    this.init();
  }
  async init() {
    this.browser = await puppeteer.launch();
    this.page = await this.browser.newPage();
    this.client = await this.page.target().createCDPSession();
    await this.setCookies();
    await this.login();
    await this.getDays();
  }
  async login() {
    try {
      await this.page.goto(`${this.baseUrl}/en/login`, {
        waitUntil: "networkidle0",
      });
      if (this.page.url().includes("myaccount")) {
        console.log(chalk.green("✔ Session Loaded :: Logged in"));
        return;
      }
      await this.page.type("#email", this.userName);
      await this.page.type("#sign-in-password", this.pass);
      await Promise.all([
        this.page.click(".submit.amp-button.primary"),
        this.page.waitForNavigation({ waitUntil: "networkidle0" }),
      ]);

      console.log(chalk.green("Session Created :: Logged In"));
      await this.saveCookies();
    } catch (error) {
      console.error(error);
    }
  }
  async saveCookies() {
    const cookies = await this.page.cookies();
    await fs.writeFile("./cookies.json", JSON.stringify(cookies, null, 2));
  }
  async setCookies() {
    try {
      await this.client.send("Network.clearBrowserCookies");
      const cookiesString = await fs.readFile("./cookies.json");
      const cookies = JSON.parse(cookiesString);
      await this.page.setCookie(...cookies);
    } catch (error) {
      console.error(error);
    }
  }
  async getDays() {
    try {
      await this.page.goto(
        `${this.baseUrl}/api/v2/reservation-availability/10`,
        {
          waitUntil: "networkidle0",
        }
      );
      const innerText = await this.page.evaluate(() => {
        return JSON.parse(document.querySelector("body").innerText);
      });
      const timestamp = new Date().toLocaleTimeString();

      if (innerText.data[0].unavailable_dates.includes(this.date)) {
        console.log(chalk.red(`✖ ${timestamp} :: DAY IS UNAVAILABLE`));
      } else {
        const message = `🚀🚨 ✔ ${timestamp} :: DAY IS AVAILABLE - SNAG IT UP 🚨🚀`;
        notifier.notify({
          message: message,
          sound: true,
        });
        console.log(chalk.bgGreen.white.bold(message));
      }
      setTimeout(() => {
        this.getDays();
      }, 30000);
    } catch (error) {
      console.error(error);
    }
  }
}

export default IkonBot;
