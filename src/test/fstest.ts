import fs from "fs";
const path = "files/hello";
console.log("Making directory", path);
// fs.mkdirSync(path, { recursive: true });
fs.writeFileSync("files/hello/hello.txt", "hello");
// console.log(jsYAML.load("{"));
