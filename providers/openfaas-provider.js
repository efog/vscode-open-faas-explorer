const Promise = require("bluebird");
const fs = require("fs");
const http = require("http");
const jsYml = require("js-yaml");
const path = require("path");
const os = require("os");
const vscode = require('vscode');

/**
 * OpenFaaS data provider
 */
class OpenFaaSProvider {

    constructor(openFaasGatewayUrl) {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }

    /**
     * Returns openfaas authentication token
     *
     * @param {number} index index of gateway to fetch token for
     * @returns {string} openfaas authentication token
     * @memberof OpenFaaSProvider
     */
    getAuthenticationToken(index = 0) {
        return this.getGateways()[index].token;
    }

    /**
     * Gets the array of configured gateways
     *
     * @returns {Array} array of gateways
     * @memberof OpenFaaSProvider
     */
    getGateways() {
        const home = os.homedir();
        if (fs.existsSync(`${path.join(home, ".openfaas", "config.yml")}`)) {
            const config = jsYml.safeLoad(fs.readFileSync(`${home}/.openfaas/config.yml`, "utf8"));
            return config.auths;
        }
        throw new Error("openfaas config not found");
    }

    getTreeItem(element) {
        return element;
    }

    getChildren(element) {
        if (!element) {
            const item = new vscode.TreeItem("OpenFaaS Gateways", vscode.TreeItemCollapsibleState.Expanded);
            item.contextValue = "root";
            return [
                item
            ];
        }
        if (element.contextValue === "root") {
            const gateways = this.getGateways();
            return gateways.map((gateway) => {
                const item = new vscode.TreeItem(gateway.gateway, vscode.TreeItemCollapsibleState.Collapsed);
                item.contextValue = `${gateway.gateway}`;
                return item;
            });
        }
        return [];
    }

    /**
    * Lists all openfaas functions
    * 
    * @param {string} openFaasGatewayUrl url of gateway
    * @returns {Promise} execution promise
    */
    list(openFaasGatewayUrl) {
        const promise = new Promise((resolve, reject) => {
            const token = this.getAuthenticationToken();
            const req = new http.ClientRequest(`${openFaasGatewayUrl}/system/functions`, (res) => {
                let data = "";
                res.on("data", (chunk) => {
                    data += chunk;
                });
                res.on("end", () => {
                    if (res.statusCode !== 200) {
                        return reject(new Error(`Enable to fetch functions: ${res.statusCode} - ${data} `));
                    }
                    return resolve(JSON.parse(data));
                });
            });
            req.setHeader("authorization", `Basic ${token}`);
            req.end();
        });
        return promise;
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }
}
module.exports = OpenFaaSProvider;