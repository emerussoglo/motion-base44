import {readFile} from "node:fs/promises";
import {renderMotionProject} from "./node-renderer";
const source = process.argv[2];
if (!source) throw new Error("Usage: npm run renderer -- path/to/project.json");
readFile(source, "utf8").then(JSON.parse).then(renderMotionProject).then(result => console.log(result.outputPath));
 