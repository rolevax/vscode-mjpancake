const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const child_process = require('child_process');

const sampleLuaCode = `function ondraw()
  if who ~= self or rinshan then
    return
  end

  print("我想裱你妹，还想裱鸭子，还想裱意大利人")
end`;

let girlJsonEditorHtml = "";

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('extension "mjpancake" is now active');

    const filePath = vscode.Uri.file(path.join(context.extensionPath, 'girl-json-editor.html'));
    girlJsonEditorHtml = fs.readFileSync(filePath.fsPath, 'utf8');

    let subNewGirlCommand = vscode.commands.registerCommand('mjpancake.newGirl', openNewGirl);
    let subGirlDocOpen = vscode.window.onDidChangeActiveTextEditor(handleActiveEditorChange);

    context.subscriptions.push(subNewGirlCommand);
    context.subscriptions.push(subGirlDocOpen);
}
exports.activate = activate;

function deactivate() {}

function openNewGirl() {
    vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(vscode.workspace.rootPath ? vscode.workspace.rootPath : "untitled"),
        saveLabel: "创建人物",
        filters: {
            "松饼人物文件": [ "girl.json" ]
        }
    }).then(openNewGirlFrom);
}

function handleActiveEditorChange(editor) {
    if (!editor) {
        return;
    }

    let filename = editor.document.fileName;
    if (filename.endsWith(".girl.json")) {
        vscode.commands.executeCommand("workbench.action.closeActiveEditor").then(() => {
            openGirlJsonEditor(vscode.Uri.file(filename));
        });
    }
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
            if (!luaDoc.getText())
            {
                luaEditor.edit(editBuilder => {
                    editBuilder.insert(new vscode.Position(0, 0), sampleLuaCode);
                })
            }
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

    panel.webview.onDidReceiveMessage(message => {
        if (message.fetch) {
            vscode.workspace.openTextDocument(jsonUri).then(jsonDoc => {
                let jsonText = jsonDoc.getText();
                if (jsonText)
                {
                    let girl = JSON.parse(jsonText);
                    panel.webview.postMessage({ girlJson: girl });
                }
            });
        }

        if (message.save) {
            fs.writeFile(jsonUri.fsPath, JSON.stringify(message.save), error => {
                if (error) {
                    vscode.window.showErrorMessage(error);
                    return;
                }
        
                panel.webview.postMessage({ saveSuccess: true });
            }); 
        }

        if (message.test) {
            let app = vscode.workspace.getConfiguration("mjpancake").get("appPath");
            if (!app) {
                vscode.window.showErrorMessage("未配置松饼主程序路径");
                return;
            }

            child_process.exec(app + ' ' + jsonUri.fsPath, (err) => {
                if (err) {
                    vscode.window.showErrorMessage(err);
                }
            });
        }

        if (message.export) {
            vscode.window.showErrorMessage("暂无此功能");
        }
    });

    panel.webview.html = girlJsonEditorHtml;
}

module.exports = {
    activate,
    deactivate
}
