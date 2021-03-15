import { App, Plugin, TAbstractFile, TFile, EmbedCache, LinkCache, Notice } from 'obsidian';
import { PluginSettings, DEFAULT_SETTINGS, SettingTab } from './settings';
import { Utils } from './utils';
import { LinksHandler, LinkChangeInfo } from './links-handler';
import { FilesHandler } from './files-handler';

const path = require('path');
var crypto = require('crypto');


export default class ConsistentAttachmentsAndLinks extends Plugin {
	settings: PluginSettings;
	lh: LinksHandler;
	fh: FilesHandler;


	async onload() {
		await this.loadSettings();

		this.addSettingTab(new SettingTab(this.app, this));

		this.addCommand({
			id: 'rename-all-attachments',
			name: 'Rename all attachments',
			callback: () => this.renameAllAttachments()
		});


		this.lh = new LinksHandler(this.app, "Unique attachments: ");
		this.fh = new FilesHandler(this.app, this.lh, "Unique attachments: ");
	}


	async renameAllAttachments() {
		let files = this.app.vault.getFiles();
		let renamedCount = 0;

		for (let file of files) {
			let renamed = await this.renameAttachmentIfNeeded(file);
			if (renamed)
				renamedCount++;
		}

		if (renamedCount == 0)
			new Notice("No files found that need to be renamed");
		else if (renamedCount == 1)
			new Notice("Renamed 1 file.");
		else
			new Notice("Renamed " + renamedCount + " files.");
	}


	async renameAttachmentIfNeeded(file: TAbstractFile): Promise<boolean> {
		let filePath = file.path;
		if (this.checkFilePathIsIgnored(filePath) || !this.checkFileTypeIsAllowed(filePath)) {
			return false;
		}

		let ext = path.extname(filePath);
		let baseName = path.basename(filePath, ext);
		let validBaseName = await this.generateValidBaseName(filePath);
		if (baseName == validBaseName) {
			return false;
		}

		let notes = await this.lh.getNotesThatHaveLinkToFile(filePath);

		if (!notes || notes.length == 0) {
			if (this.settings.renameOnlyLinkedAttachments) {
				return false;
			}
		}

		let validPath = this.lh.getFilePathWithRenamedBaseName(filePath, validBaseName);

		let targetFileAlreadyExists = await this.app.vault.adapter.exists(validPath)

		if (targetFileAlreadyExists) {
			//if file content is the same in both files, one of them will be deleted			
			let validAnotherFileBaseName = await this.generateValidBaseName(validPath);
			if (validAnotherFileBaseName != validBaseName) {
				console.warn("Unique attachments: cant rename file \n   " + filePath + "\n    to\n   " + validPath + "\n   Another file exists with the same (target) name but different content.")
				return false;
			}

			if (!this.settings.mergeTheSameAttachments) {
				console.warn("Unique attachments: cant rename file \n   " + filePath + "\n    to\n   " + validPath + "\n   Another file exists with the same (target) name and the same content. You can enable \"Delte duplicates\" setting for delete this file and merge attachments.")
				return false;
			}

			try {
				await this.app.vault.delete(file);
			} catch (e) {
				console.error("Unique attachments: cant delete duplicate file " + filePath + ".\n" + e);
				return false;
			}

			if (notes) {
				for (let note of notes) {
					await this.lh.updateChangedLinkInNote(note, filePath, validPath);
				}
			}

			console.log("Unique attachments: file content is the same in \n   " + filePath + "\n   and \n   " + validPath + "\n   Duplicates merged.")
		} else {
			try {
				await this.app.vault.rename(file, validPath);
			} catch (e) {
				console.error("Unique attachments: cant rename file \n   " + filePath + "\n   to \n   " + validPath + "   \n" + e);
				return false;
			}

			if (notes) {
				for (let note of notes) {
					await this.lh.updateChangedLinkInNote(note, filePath, validPath);
				}
			}

			console.log("Unique attachments: file renamed [from, to]:\n   " + filePath + "\n   " + validPath);
		}

		return true;
	}


	checkFilePathIsIgnored(filePath: string): boolean {
		for (let folder of this.settings.ignoreFolders) {
			if (filePath.startsWith(folder))
				return true;
		}
		return false;
	}


	checkFileTypeIsAllowed(filePath: string): boolean {
		for (let ext of this.settings.renameFileTypes) {
			if (filePath.endsWith("." + ext))
				return true;
		}
		return false;
	}


	async generateValidBaseName(filePath: string) {
		let file = this.lh.getFileByPath(filePath);
		let data = await this.app.vault.readBinary(file);
		const buf = Buffer.from(data);
		let md5: string = crypto.createHash('md5').update(buf).digest("hex");

		return md5;
	}


	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}


}




