"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs-extra");
var archiver = require("archiver");
var path = require("path");
// 项目根目录（build-zip.ts 所在目录）
var projectRoot = path.resolve(__dirname);
// 输出 zip 文件路径
var zipPath = path.join(projectRoot, "web-automation-mvp.zip");
var output = fs.createWriteStream(zipPath);
var archive = archiver("zip", { zlib: { level: 9 } });
archive.pipe(output);
// 要打包的文件列表
var filesToZip = ["server.ts", "package.json", "tsconfig.json", "README.md"];
// 添加文件
filesToZip.forEach(function (file) {
    var fullPath = path.join(projectRoot, file);
    if (fs.existsSync(fullPath)) {
        archive.file(fullPath, { name: file });
    }
    else {
        console.warn("File not found, skipping: ".concat(fullPath));
    }
});
// 添加 screenshots 文件夹（如果存在）
var screenshotsDir = path.join(projectRoot, "screenshots");
if (fs.existsSync(screenshotsDir)) {
    archive.directory(screenshotsDir, "screenshots");
}
archive.finalize();
output.on("close", function () {
    console.log("Zip created: ".concat(zipPath, " (").concat(archive.pointer(), " bytes)"));
});
