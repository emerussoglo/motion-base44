import {renderMotionProject} from "./node-renderer";
import spec from "../../../motion/example-project.json";
renderMotionProject(spec).then(output => console.log(`MP4 created: ${output.outputPath}`)).catch(error => {console.error(error); process.exitCode = 1;});
