// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const OpenFaaSProvider = require("./providers/openfaas-provider");

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context extension execution context
 * @returns {void}
 */
function activate(context) {
    const provider = new OpenFaaSProvider();
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "open-faas" is now active!');
    context.subscriptions.push(vscode.commands.registerCommand('openfaas.listFunctions', () => {
        return provider.list();
    }));
    vscode.window.registerTreeDataProvider('openfaas-explorer', provider);
    vscode.commands.registerCommand('openfaas-explorer.refreshEntry', () => { 
        return provider.getGateways(); 
    });
}
exports.activate = activate;

/**
 * This method is called when your extension is deactivated
 * @returns {void}
 */
function deactivate() { }

module.exports = {
    activate,
    deactivate
};
