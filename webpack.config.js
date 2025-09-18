const path = require("path");

module.exports = {
    entry: "./src/index.js", // 入口文件
    output: {
        filename: "unionSdk.js", // 输出文件名
        path: path.resolve(__dirname, "dist"), // 输出目录
        libraryTarget: 'umd',
        libraryExport: 'default'
    },
    optimization:{
        // minimize:false, // 不进行代码压缩
    },
    mode: "production", // 启用压缩等优化
    // performance: {
    //     hints: false,
    // },
};
