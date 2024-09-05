const vscode = require("vscode");

// Regular expression for color extraction
const hslHslaRegEx =
  /(?<variableName>[A-Z]\w*(\s+\w+)*)\s*(\(\s*\w+\s*\))*\s*:\s*hsla?\s*\(\s*(?<H>\d{1,3})\s*,\s*(?<S>\d{1,3})%\s*,\s*(?<L>\d{1,3})%\s*(,\s*(?<A>(\d+|\d*\.\d+)))?\s*\)/g;

// Function to rewrite color matches
function rewriteColor(matches) {
  // Initialize the result object to store output and check if it's empty
  const result = {
    isEmpty: false,
    cssOutput: "",
  };

  // If no matches are found, mark result as empty and return
  if (matches.length == 0) {
    result.isEmpty = true;
    return result;
  }

  // Array to store generated CSS variables
  let cssVariables = [];

  for (const match of matches) {
    // Split the color name into parts (e.g., "Background Color" → ["Background", "Color"])
    const nameParts = match.groups.variableName.match(/\w+/g);
    let colorValue;

    // Determine if the color is in HSL or HSLA format and create the value
    if (match.groups.A != undefined) {
      const { H, S, L, A } = match.groups;
      colorValue = `hsla(${H}, ${S}%, ${L}%, ${A})`;
    } else {
      const { H, S, L } = match.groups;
      colorValue = `hsl(${H}, ${S}%, ${L}%)`;
    }

    // Generate the CSS variable name and add it to the list
    if (nameParts.length == 1) {
      // Single word color name
      const variableName = nameParts[0].toLowerCase();
      const color = `--${variableName}: ${colorValue};`;
      cssVariables.push(color);
    } else {
      // Multi-word color name, convert to camelCase
      let variableName = "";
      const baseName =
        nameParts[0].charAt(0).toLowerCase() + nameParts[0].slice(1);
      variableName += baseName;
      for (const name of nameParts.slice(1)) {
        variableName += name.charAt(0).toUpperCase() + name.slice(1);
      }
      const color = `--${variableName}: ${colorValue};`;
      cssVariables.push(color);
    }
  }

  // Combine all CSS variables into a single string output
  result.cssOutput = cssVariables.join("\n");
  return result;
}

/**
 * @param {vscode.ExtensionContext} context
 */

function activate(context) {
  const disposable = vscode.commands.registerCommand(
    "frontend-mentor-color-variables-helper.extractColors",
    async function () {
      const editor = vscode.window.activeTextEditor;

      if (editor) {
        const selection = editor.selection;

        if (selection.isEmpty) {
          vscode.window.showInformationMessage(
            "Select text with CSS colors to extract."
          );
        } else {
          const selectedText = editor.document.getText(selection);
          const matches = [...selectedText.matchAll(hslHslaRegEx)];
          const result = rewriteColor(matches);

          if (result.isEmpty) {
            vscode.window.showInformationMessage(
              "No valid HSL/HSLA colors found."
            );
          } else {
            try {
              await vscode.env.clipboard.writeText(result.cssOutput);
              vscode.window.showInformationMessage(
                "Colors copied to clipboard."
              );
            } catch (err) {
              vscode.window.showErrorMessage(
                "Error copying colors to clipboard."
              );
              console.error(err);
            }
          }
        }
      } else {
        vscode.window.showErrorMessage(
          "No active editor. Open a file and select text."
        );
      }
    }
  );

  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
