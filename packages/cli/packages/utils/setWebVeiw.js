const fs = require('fs-extra');
const path = require('path');
const cwd = process.cwd();
const chalk = require('chalk');


function writeWebViewConfig(routes) {
    let code = `module.exports = ${JSON.stringify(routes)};`;
    fs.writeFileSync(
        path.join(cwd, 'dist', 'webviewConfig.js'),
        code
    );
}

//获取 H5 路由配置
function getWebViewRoutes(routes) {
    let ret = {},
        pkg = null,
        host = '';
    try {
        pkg = require(path.join(cwd, 'package.json'));
    } catch (err) {

    }
    if (pkg.nanachi && pkg.nanachi.H5_HOST ) {
        host = pkg.nanachi.H5_HOST;
    }

    if (!host) {
        console.log(chalk.red('Error: H5请在package.json中nanachi字段里配置H5_HOST字段'));
        process.exit(1);
    }

    routes.forEach((el) => {
        let route = path.relative(path.join(cwd, 'source'), el.id).replace(/\.js$/, '');
        ret[route] = host + '/' + route;

    });
    return ret;
}

//配置 H5_COMPILE_CONFIG.json, H5编译读该文件路由配置进行按需编译。
function writeH5CompileConfig(routes) {
    let H5_COMPILE_JSON_FILE = path.join(cwd, 'source', 'H5_COMPILE_CONFIG.json');
    fs.ensureFileSync(H5_COMPILE_JSON_FILE);
    fs.writeFileSync(
        H5_COMPILE_JSON_FILE,
        JSON.stringify({
            webviewPages: routes.map((el) => {
                return el.id;
            })
        })
    );
}

function deleteWebViewConifg() {
    let list = [
        'H5_COMPILE_CONFIG.json',
        'webviewConfig.js'
    ];
    list = list.map((file) => {
        return path.join(cwd, 'source', file);
    });

    list.forEach((fileId) => {
        try {
            fs.removeSync(fileId);
        } catch (err) {}
    });

}

exports = module.exports = function(routes){

    if (!routes.length) return;
    //每次build先删除配置文件
    deleteWebViewConifg();

    //注入h5编译route配置
    writeH5CompileConfig(routes);

    //注入运行时 webview 各route配置
    writeWebViewConfig(getWebViewRoutes(routes));
    
};