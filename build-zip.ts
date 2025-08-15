import * as fs from "fs-extra";
import archiver = require("archiver");
import * as path from "path";

// 项目根目录（build-zip.ts 所在目录）
const projectRoot = path.resolve(__dirname);

// 输出 zip 文件路径
const zipPath = path.join(projectRoot, "web-automation-mvp.zip");
const output = fs.createWriteStream(zipPath);
const archive = archiver("zip", { zlib: { level: 9 } });

archive.pipe(output);

// 要打包的文件列表
const filesToZip = ["server.ts", "package.json", "tsconfig.json", "README.md"];

// 添加文件
filesToZip.forEach(file => {
  const fullPath = path.join(projectRoot, file);
  if (fs.existsSync(fullPath)) {
    archive.file(fullPath, { name: file });
  } else {
    console.warn(`File not found, skipping: ${fullPath}`);
  }
});

// 添加 screenshots 文件夹（如果存在）
const screenshotsDir = path.join(projectRoot, "screenshots");
if (fs.existsSync(screenshotsDir)) {
  archive.directory(screenshotsDir, "screenshots");
}

archive.finalize();

output.on("close", () => {
  console.log(`Zip created: ${zipPath} (${archive.pointer()} bytes)`);
});
