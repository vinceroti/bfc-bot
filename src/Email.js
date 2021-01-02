import nodemailer from "nodemailer";
import chalk from "chalk";
import "dotenv/config";

let transporter;
let username = process.env["EMAIL_USERNAME"];
let password = process.env["EMAIL_PASSWORD"];
let emails = process.env["EMAILS"] ? process.env["EMAILS"].split(",") : [];
setTransport();

function setTransport() {
  const transportOptions = {};

  if (username && password) {
    transportOptions.auth = {};
    transportOptions.auth.user = username;
    transportOptions.auth.pass = password;
  }

  transportOptions.service = "gmail";

  transporter = nodemailer.createTransport({
    ...transportOptions,
  });
}

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

export function setEmail(newUser, newPass, newEmails) {
  username = newUser;
  password = newPass;
  emails = newEmails ? newEmails.split(",") : [];
  setTransport();
}
