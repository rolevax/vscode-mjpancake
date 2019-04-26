const vscode = require('vscode');
const path = require('path');

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

    // let disposable = vscode.commands.registerCommand('mjpancake.newGirl', openNewGirl);
    let disposable = vscode.commands.registerCommand('mjpancake.newGirl', () => {
        openGirlJsonEditor(vscode.Uri.file("~/code/lua/first.girl.json"));
    });

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
    openGirlJsonEditor(jsonUri)

    vscode.workspace.openTextDocument(luaUri).then(luaDoc => {
        vscode.window.showTextDocument(luaDoc, vscode.ViewColumn.Active, true).then(luaEditor => {
            vscode.commands.executeCommand("workbench.action.previousEditorInGroup"); // back to json tab
            luaEditor.edit(editBuilder => {
                editBuilder.insert(new vscode.Position(0, 0), sampleLuaCode);
            })
        })
    });
}

function openGirlJsonEditor(jsonUri) {
    const panel = vscode.window.createWebviewPanel(
        'mjpancakeGirlJsonEditor',
        path.basename(jsonUri.fsPath),
        vscode.ViewColumn.Active,
        {}
    );
    panel.webview.html = getGirlJsonEditorHtml();
}

function getGirlJsonEditorHtml() {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title></title>
</head>
<body>
  <a></a>
  <form>
    <table>
      <tr><td>Name</td><td><input type="text" /></td>
      <tr><td>Photo</td><td><input type="file"></td></tr>
    </table>
  </form>
  <button>Save</button>
  <button>Test with 3 doges</button>
  <button>Export to Pancake</button>
  <img src="data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==" alt="Red dot" />
</body>
</html>`;
}

module.exports = {
    activate,
    deactivate
}
