const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

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
        openGirlJsonEditor(vscode.Uri.file("/tmp/first.girl.json"));
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
        {
            enableScripts: true
        }
    );
    panel.webview.html = getGirlJsonEditorHtml();

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
      
            vscode.window.showInformationMessage("Girl file saved");
        }); 
    });
}

function getGirlJsonEditorHtml() {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title></title>
    <style>
        img {
            min-width: 300px;
            min-height: 500px;
            max-width: 300px;
            max-height: 500px;
        }
    </style>
</head>
<body>
    <a id="fuck"></a>
    <form id="form">
        <table>
            <tr>
                <td>Name</td>
                <td><input type="text" name="name" /></td>
            </tr>
            <tr>
                <td>Photo</td>
                <td><input type="file" name="photo" accept="image/png, image/jpeg"></td>
            </tr>
            <tr>
                <td></td>
                <td><img id="preview"></img></td>
            </tr>
            <tr>
                <td><button id="buttonSave">Save</button></td>
            </tr>
            <tr>
                <td><button>3 Doge Match</button></td>
            </tr>
            <tr>
                <td><button>Export to Pancake</button></td>
            </tr>
        </table>
    </form>

    <script>
        const form = document.getElementById("form");
        const fuck = document.getElementById("fuck");
        const preview = document.getElementById("preview");
        const buttonSave = document.getElementById("buttonSave");
        const vscode = acquireVsCodeApi();

        window.addEventListener('message', event => {
            const message = event.data; // The JSON data our extension sent
            form.name.value = message.name;
            preview.base64 = message.photoBase64;
            preview.src = "data:image/png;base64," + preview.base64;
        });

        form.photo.addEventListener('change', event => {
            if (form.photo.files.length > 0) {
                let image = form.photo.files[0];
                preview.src = window.URL.createObjectURL(image);
            }
        });

        preview.onload = () => {
            let canvas = document.createElement("canvas");
            canvas.width = preview.width;
            canvas.height = preview.height;
            let ctx = canvas.getContext("2d");
            ctx.drawImage(preview, 0, 0, preview.width, preview.height);
            let dataURL = canvas.toDataURL();
            preview.base64 = dataURL.split(",")[1];
            canvas = null;
        };

        buttonSave.onclick = () => {
            let girlJson = {
                name: form.name.value,
                photoBase64: preview.base64
            };
            if (!girlJson.name) {
                girlJson.name = "";
            }
            if (!girlJson.photoBase64) {
                girlJson.photoBase64 = "";
            }
            vscode.postMessage(girlJson);
        };
    </script>
</body>
</html>`;
}

module.exports = {
    activate,
    deactivate
}
