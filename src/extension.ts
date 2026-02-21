import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	console.log('Branch Painter is now active!');

	const setColor = vscode.commands.registerCommand('branchPainter.setColor', () => {
		vscode.window.showInformationMessage('Branch Painter: Set Color (not yet implemented)');
	});

	const resetColor = vscode.commands.registerCommand('branchPainter.resetColor', () => {
		vscode.window.showInformationMessage('Branch Painter: Reset Color (not yet implemented)');
	});

	const toggleAutoColor = vscode.commands.registerCommand('branchPainter.toggleAutoColor', () => {
		vscode.window.showInformationMessage('Branch Painter: Toggle Auto Color (not yet implemented)');
	});

	context.subscriptions.push(setColor, resetColor, toggleAutoColor);
}

export function deactivate() {}
