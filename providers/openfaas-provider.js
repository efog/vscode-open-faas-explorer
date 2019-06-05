const Promise = require("bluebird");
const fs = require("fs");
const http = require("http");
const isURL = require('isurl');
const jsYml = require("js-yaml");
const path = require("path");
const os = require("os");
const URL = require("whatwg-url");
const vscode = require('vscode');

/**
 * OpenFaaS data provider
 */
class OpenFaaSProvider {

    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }

    /**
     * Returns openfaas authentication token
     *
     * @param {string} gatewayUrl gateway url to fetch token for
     * @returns {object} openfaas authentication token object
     * @memberof OpenFaaSProvider
     */
    getAuthenticationToken(gatewayUrl) {
        let token = null;
        const gateways = this.getGateways();
        for (let index = 0; index < gateways.length; index++) {
            const element = gateways[index];
            if (element.gateway === gatewayUrl) {
                token = {
                    "token": element.token,
                    "auth": element.auth
                };
                break;
            }
        }
        return token;
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

    /**
     * Gets function for display in openfaas-detailsview
     *
     * @param {*} func function to present in details view
     * @memberof OpenFaaSProvider
     * @returns {void}
     */
    getFunction(func) {
        console.log(`some trigger ${JSON.stringify(func)}`);
    }

    /**
     * Returns a tree item element
     * @param {*} element tree item element
     * @returns {*} tree item element
     */
    getTreeItem(element) {
        return element;
    }

    async getChildren(element) {
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
        if (element.contextValue.indexOf("http") === 0) {
            const funcs = await this.list(element.contextValue);
            return funcs.map((func) => {
                const item = new vscode.TreeItem(func.name, vscode.TreeItemCollapsibleState.Collapsed);
                item.contextValue = `${JSON.stringify(func)}`;
                // item.command = {
                //     "title": "",
                //     "command": "openfaas-explorer.showFunction",
                //     "tooltip": "display function details",
                //     "arguments": [func]
                // };
                return item;
            });
        }
        else if (element.contextValue) {
            const func = JSON.parse(element.contextValue);
            return Object.keys(func).map((key) => {
                const item = new vscode.TreeItem(`${key}: ${func[key]}`, vscode.TreeItemCollapsibleState.None);
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
            const token = this.getAuthenticationToken(openFaasGatewayUrl);
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
            if (token) {
                req.setHeader("authorization", `${token.auth.charAt(0).toUpperCase() + token.auth.slice(1) || "basic"} ${token.token || ""}`);
            }
            req.end();
        });
        return promise;
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }
}
module.exports = OpenFaaSProvider;