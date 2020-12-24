import readline from "readline";
import { prompt, Password, Toggle } from "enquirer";
import fs from "fs";
import { parse, stringify } from "envfile";

async function updateEnv(key, entry) {
  const env = await fs.readFileSync("./.env");
  let parsedFile = parse(env);
  parsedFile[key] = entry;
  fs.writeFileSync("./.env", stringify(parsedFile));
}

async function ask(key, message, validate = false) {
  const response = await prompt({
    type: "input",
    name: key,
    initial: process.env[key] ? process.env[key] : "",
    message,
    validate,
  });
  updateEnv(key, response[key]);
  return response[key];
}

async function askPass(key, message) {
  const prompt = new Password({
    name: "password",
    message,
  });

  const pass = await prompt.run();
  if (pass.length) {
    updateEnv(key, pass);
    return pass;
  }
  return process.env[key];
}

async function askToggle(message) {
  const prompt = new Toggle({
    message,
    disabled: "No",
    enabled: "Yes",
  });

  return await prompt.run();
}

function setClose() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.on("close", function () {
    console.log("Thanks for using Ikon Bot! 👍");
    process.exit(0);
  });
}

export { ask, askPass, setClose, askToggle, updateEnv };
