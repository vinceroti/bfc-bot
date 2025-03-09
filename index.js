import Scraper from "./src/Scraper";
import { setClose } from "./src/UserInput";
import figlet from "figlet";
import "dotenv/config";

const draw = new Promise((resolve, reject) => {
  figlet("GPU Scraper", function (err, data) {
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

//init function
(async () => {
  try {
    await draw;
  } catch (e) {
    console.log(e);
  }
  setClose();

  new Scraper();
})();
