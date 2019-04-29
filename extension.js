const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

const sampleLuaCode = `function ondraw()
  if who ~= self or rinshan then
    return
  end

  print("好像能用了，耶！")
end`;

let girlJsonEditorHtml = "";

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('extension "mjpancake" is now active');

    const filePath = vscode.Uri.file(path.join(context.extensionPath, 'girl-json-editor.html'));
    girlJsonEditorHtml = fs.readFileSync(filePath.fsPath, 'utf8');

    let disposable = vscode.commands.registerCommand('mjpancake.newGirl', openNewGirl);

    context.subscriptions.push(disposable);
}
exports.activate = activate;

function deactivate() {}

function openNewGirl() {
    vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file("untitled"),
        saveLabel: "创建人物",
        filters: {
            "松饼人物文件": [ "girl.json" ]
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
        {
            enableScripts: true
        }
    );
    panel.webview.html = girlJsonEditorHtml;

    vscode.workspace.openTextDocument(jsonUri).then(jsonDoc => {
        let jsonText = jsonDoc.getText();
        let obj = JSON.parse(jsonText);
        panel.webview.postMessage(obj);
    });

    panel.webview.onDidReceiveMessage(message => {
        fs.writeFile(jsonUri.fsPath, JSON.stringify(message), error => {
            if (error) {
                vscode.window.showErrorMessage(error);
                return;
            }
      
            vscode.window.showInformationMessage("保存成功");
        }); 
    });
}

module.exports = {
    activate,
    deactivate
}
