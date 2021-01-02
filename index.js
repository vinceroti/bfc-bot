import IkonBot from "./src/IkonBot";
import { ask, setClose, askPass, askToggle, updateEnv } from "./src/UserInput";
import figlet from "figlet";
import date from "validate-date";
import "dotenv/config";

const draw = new Promise((resolve, reject) => {
  figlet("Ikon Bot", function (err, data) {
    if (err) {
      console.log("Something went wrong...");
      console.dir(err);
      reject();
      return;
    }
    console.log(data);
    resolve();
  });
});

async function setupEmail() {
  const user = await ask("EMAIL_USERNAME", "What is your Email?");
  const pass = await askPass(
    "EMAIL_PASSWORD",
    "What is your Email password? (enter to use .env)"
  );
  const emails = await ask(
    "EMAILS",
    "What emails are you emailing? This is a comma seperated list ('email@email.com,email2@email.com')"
  );
  return { user, pass, emails };
}

async function askEmail() {
  let email = await askToggle("Would you like to setup Email (gmail) alerts?");
  if (!email) return "no";
  email = "yes";
  updateEnv("USE_EMAIL", email);
  return email;
}
async function setupEnv(ikonDate) {
  const ikonUser = await ask("IKON_USERNAME", "What is your IKON user name?");
  const ikonPass = await askPass(
    "IKON_PASS",
    "What is your IKON password? (enter to use .env)"
  );

  const useEmail = await askEmail();

  if (useEmail === "no")
    return new IkonBot(ikonDate, ikonPass, ikonUser, useEmail);

  const email = await setupEmail();

  return new IkonBot(
    ikonDate,
    ikonPass,
    ikonUser,
    useEmail,
    email.user,
    email.pass,
    email.emails
  );
}

//init function
(async () => {
  try {
    await draw;
  } catch (e) {
    console.log(e);
  }
  setClose();
  const ikonDate = await ask(
    "IKON_DATE",
    "What date are you looking for? (YYYY-MM-DD)",
    (value) => {
      return date(value, "boolean");
    }
  );
  const useEnv = await askToggle("Would you like to run .env setup?");

  if (!useEnv) return new IkonBot();
  await setupEnv(ikonDate);
})();
