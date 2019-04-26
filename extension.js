const vscode = require('vscode');

const sampleLuaCode = `function ondraw()
  if who ~= self or rinshan then
    return
  end

  print("好像能用了，耶！")
end`

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	console.log('extension "mjpancake" is now active');

	let disposable = vscode.commands.registerCommand('mjpancake.newGirl', function () {
		vscode.window.showSaveDialog({
			defaultUri: vscode.Uri.file("untitled"),
			saveLabel: "Create Girl",
			filters: {
				"Pancake Mahjong Girl File": [ "girl.json" ]
			}
		}).then(uri => {
			let jsonPath = uri.fsPath;
			let luaPath = jsonPath.substr(0, jsonPath.length - 4) + "lua";
			// TODO if already exists, go to 'open girl' hook
			vscode.workspace.openTextDocument(vscode.Uri.parse("untitled:" + jsonPath)).then(jsonDoc => {
				vscode.workspace.openTextDocument(vscode.Uri.parse("untitled:" + luaPath)).then(luaDoc => {
					vscode.window.showTextDocument(jsonDoc, vscode.ViewColumn.Active, false).then(jsonEditor => {
						jsonEditor.edit(editBuilder => {
							editBuilder.insert(new vscode.Position(0, 0), '{"name":"New Girl"}');
						});
						vscode.window.showTextDocument(luaDoc, vscode.ViewColumn.Active, true).then(luaEditor => {
							vscode.commands.executeCommand("workbench.action.previousEditorInGroup");
							luaEditor.edit(editBuilder => {
								editBuilder.insert(new vscode.Position(0, 0), sampleLuaCode);
							})
						})
					})
				})
			});
		})
	});

	context.subscriptions.push(disposable);
}
exports.activate = activate;

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
