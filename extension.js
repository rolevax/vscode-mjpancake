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

	let disposable = vscode.commands.registerCommand('mjpancake.newGirl', openNewGirl);

	context.subscriptions.push(disposable);
}
exports.activate = activate;

function deactivate() {}

function openNewGirl() {
	vscode.window.showSaveDialog({
		defaultUri: vscode.Uri.file("untitled"),
		saveLabel: "Create Girl",
		filters: {
			"Pancake Mahjong Girl File": [ "girl.json" ]
		}
	}).then(openNewGirlFrom);
}

function openNewGirlFrom(jsonUri) {
	let luaUri = vscode.Uri.file(jsonUri.fsPath.substr(0, jsonUri.fsPath.length - 4) + "lua")
	let edits = new vscode.WorkspaceEdit();
	edits.createFile(jsonUri, { ignoreIfExists: true });
	edits.createFile(luaUri, { ignoreIfExists: true });
	vscode.workspace.applyEdit(edits).then(ok => {
		if (!ok) {
			vscode.window.showErrorMessage("Failed to create new girl files");
			return;
		}

		openNewGirlFiles(jsonUri, luaUri);
	});
}

function openNewGirlFiles(jsonUri, luaUri) {
	vscode.workspace.openTextDocument(jsonUri).then(jsonDoc => {
		vscode.workspace.openTextDocument(luaUri).then(luaDoc => {
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
}

module.exports = {
	activate,
	deactivate
}
