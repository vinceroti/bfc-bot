import IkonBot from "./src/IkonBot";
import figlet from "figlet";

figlet("Ikon Bot", function (err, data) {
  if (err) {
    console.log("Something went wrong...");
    console.dir(err);
    return;
  }
  console.log(data);
});
new IkonBot();