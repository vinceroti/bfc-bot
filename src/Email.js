import nodemailer from "nodemailer";
import chalk from "chalk";
import "dotenv/config";

const username = process.env["EMAIL_USERNAME"];
const password = process.env["EMAIL_PASSWORD"];
const emails = process.env["EMAILS"] ? process.env["EMAILS"].split(",") : [];

const transportOptions = {};

if (username && password) {
  transportOptions.auth = {};
  transportOptions.auth.user = username;
  transportOptions.auth.pass = password;
}

transportOptions.service = "gmail";

export const transporter = nodemailer.createTransport({
  ...transportOptions,
});

export function sendEmail(url, date) {
  emails.forEach((e) => {
    if (username && password) {
      console.log(chalk.yellow("↗ sending email"));

      const mailOptions = {
        from: username,
        subject: "Ikon Bot - Your Day is AVAILABLE!",
        text: `${date} has an opening, go snag it. Also tell Vince he is awesome. - ${url}`,
        to: e,
      };

      transporter.sendMail(mailOptions, (error) => {
        if (error) {
          console.log(chalk.red("✖ couldn't send email ::", error));
        } else {
          console.log(chalk.green("✔ email sent"));
        }
      });
    }
  });
}
