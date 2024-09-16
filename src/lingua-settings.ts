import * as fs from 'fs';
import { assign } from 'lodash';
import * as path from 'path';
import { Uri, window, workspace } from 'vscode';
import { Notification } from './user-notifications';

var textEncoding = require('text-encoding');
var TextEncoder = textEncoding.TextEncoder;

export class LinguaSettings {
    public translationFiles: { lang: string; files: string[] }[] = [];

    // public async addTranslationSet(language: string | undefined, fileUri: Uri) {
    //     if (!language || !fileUri) {
    //         return;
    //     }
    //     const relativePath = workspace.asRelativePath(fileUri.path);
    //     const entry = this.translationFiles.find((file) => file.lang === language);
    //     if (entry) {
    //         entry.uri = relativePath;
    //     } else {
    //         this.translationFiles.push({ lang: language, uri: relativePath });
    //     }
    //     await writeSettings(this);
    // }

    public async removeTranslationSet(language: string) {
        const filteredFiles = this.translationFiles.filter((f) => f.lang !== language);
        this.translationFiles = filteredFiles;
        await writeSettings(this);
    }
}

export async function readSettings(): Promise<LinguaSettings> {
    if (window.activeTextEditor) {
        try {
            const currentlyOpenTabfilePath = window.activeTextEditor.document.fileName;
            const linguaSettingsUrl = Uri.file(getClosestSettingsFilePath(currentlyOpenTabfilePath));
            const doc = await workspace.openTextDocument(linguaSettingsUrl);
            const settings = assign(new LinguaSettings(), JSON.parse(doc.getText()));
            return Promise.resolve(settings);
        } catch (e) {
            console.debug('Could not load .lingua settings file');
        }
    }

    console.debug('[Lingua] [Settings] Loading default settings...');
    return Promise.resolve(new LinguaSettings());
}

async function writeSettings(settings: LinguaSettings) {
    if (workspace.workspaceFolders) {
        try {
            const uri = Uri.file(`${workspace.rootPath}/.lingua`);
            await workspace.fs.writeFile(uri, new TextEncoder('utf-8').encode(JSON.stringify(settings, null, 2)));
            Notification.showLinguaSettingCreated();
        } catch (e: any) {
            window.showErrorMessage(e);
        }
    }
}

export function getClosestSettingsFilePath(filePath: string) {
    const activeFileDirectory = path.dirname(filePath);

    const files = fs.readdirSync(activeFileDirectory);

    if(files.some(file => file.endsWith('.lingua'))) {
        return path.join(activeFileDirectory, '.lingua');
    } else if(activeFileDirectory === workspace.rootPath) {
        return `${workspace.rootPath}/.lingua`;
    } else {
        const parentDir = path.join(path.dirname(filePath), '..');
        return getClosestSettingsFilePath(parentDir);
    }
  }
