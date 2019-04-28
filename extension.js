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
        <td><img id="preview"></img></td>
      </tr>
      <tr>
        <td><input type="submit" value="Save" /></td>
      </tr>
      <tr>
        <td><input type="submit" value="3 doge match" /></td>
      </tr>
      <tr>
        <td><input type="submit" value="Export to Pancake" /></td>
      </tr>
    </table>
  </form>

  <script>
    const form = document.getElementById("form");
    const fuck = document.getElementById("fuck");
    const preview = document.getElementById("preview");

    window.addEventListener('message', event => {
      const message = event.data; // The JSON data our extension sent
      form.name.value = message.name;
    });

    form.photo.addEventListener('change', event => {
      if (form.photo.files.length > 0) {
        let image = form.photo.files[0];
        fuck.innerHTML = 'File name: ' + image.name;
        preview.src = window.URL.createObjectURL(image);
      }
    });
  </script>
</body>
</html>`;
}

module.exports = {
    activate,
    deactivate
}
