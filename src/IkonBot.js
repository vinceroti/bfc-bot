import puppeteer from "puppeteer";
import fs from "fs/promises";
import chalk from "chalk";
import notifier from "node-notifier";
import date from "validate-date";
import { sendEmail, setEmail } from "./Email";

class IkonBot {
  constructor(
    date = process.env["IKON_DATE"],
    pass = process.env["IKON_PASS"],
    userName = process.env["IKON_USERNAME"],
    email = process.env["USE_EMAIL"].toLowerCase(),
    emailUser = process.env["EMAIL_USERNAME"],
    emailPass = process.env["EMAIL_PASSWORD"],
    emails = process.env["EMAILS"]
  ) {
    this.browser = "";
    this.page = "";
    this.client = "";
    this.baseUrl = "https://account.ikonpass.com";
    this.date = date;
    this.loginUrl = `${this.baseUrl}/en/login`;
    this.userName = userName;
    this.pass = pass;
    this.email = email === "yes" ? true : false;
    this.emailUser = emailUser;
    this.emailPass = emailPass;
    this.emails = emails;
    this.success = false;
    this.successTries = 0;
    this.init();
  }
  async init() {
    this.browser = await puppeteer.launch();
    this.page = await this.browser.newPage();
    this.client = await this.page.target().createCDPSession();
    this.validateDate();
    this.page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36"
    );
    setEmail(this.emailUser, this.emailPass, this.emails);
    await this.setCookies();
    await this.login();
    await this.getDays();
  }
  async login() {
    try {
      await this.page.goto(this.loginUrl, {
        waitUntil: "networkidle0",
      });
      if (this.page.url().includes("myaccount")) {
        this.successMsg("✔ Session Loaded :: Logged in");
        return;
      }
      await this.page.type("#email", this.userName);
      await this.page.type("#sign-in-password", this.pass);
      await Promise.all([
        this.page.click(".submit.amp-button.primary"),
        this.page.waitForNavigation({ waitUntil: "networkidle0" }),
      ]);
      this.successMsg("✔ Session Created :: Logged In");
      await this.saveCookies();
    } catch (error) {
      this.failureMsg(
        `✖ Failed to login :: Check .env file to make sure you have the correct email and pass. Otherwise, SEEK DEV HELP 😨 - ${error}`
      );
      process.exit();
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
      this.infoMsg(`✖ No Cookies found or failed to load`);
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
      const dates = innerText.data[0].unavailable_dates;

      if (dates.includes(this.date)) {
        this.failureMsg(`✖ ${timestamp} :: DAY IS UNAVAILABLE`);
        this.resetSuccess();
      } else {
        this.successNotify(timestamp);
      }

      setTimeout(() => {
        this.getDays();
      }, 20000);
    } catch (error) {
      console.error(error);
    }
  }
  successNotify(timestamp) {
    const message = `🚀🚨 ✔ ${timestamp} :: DAY IS AVAILABLE - SNAG IT UP 🚨🚀`;
    this.bgSuccessMsg(message);
    if (this.successTries >= 15) this.resetSuccess();

    if (!this.success) {
      notifier.notify({
        message,
        sound: true,
      });
      if (this.email) sendEmail(this.loginUrl, this.date);
      this.success = true;
    }
    this.successTries++;
  }
  validateDate() {
    if (!date(this.date, "boolean")) {
      this.failureMsg(`✖ INVALID DATE :: Check .env for correct format`);
      process.exit();
    }
  }
  resetSuccess() {
    this.success = false;
    this.successTries = 0;
  }
  infoMsg(msg) {
    console.log(chalk.yellow(msg));
  }
  failureMsg(msg) {
    console.log(chalk.red(msg));
  }
  successMsg(msg) {
    console.log(chalk.green(msg));
  }
  bgSuccessMsg(msg) {
    console.log(chalk.bgGreen.white.bold(msg));
  }
}

export default IkonBot;
