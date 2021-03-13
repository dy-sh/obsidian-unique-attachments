import { App, Plugin, TAbstractFile, TFile, EmbedCache, LinkCache } from 'obsidian';
import { PluginSettings, DEFAULT_SETTINGS, SettingTab } from './settings';
import { Utils } from './utils';
import { LinksHandler } from './links-handler';
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
		var files = this.app.vault.getFiles();

		for (let file of files) {
			if (this.checkFilePathIsIgnored(file.path) || !this.checkFileTypeIsAllowed(file.path)) {
				continue;
			}

			let ext = path.extname(file.path);
			let baseName = path.basename(file.path, ext);
			let validBaseName = await this.generateValidBaseName(file.path);

			if (baseName == validBaseName) {
				console.log(baseName)
				console.log(validBaseName);
				continue
			}

			let validPath = this.lh.getFilePathWithRenamedBaseName(file.path, validBaseName);
			console.warn(file.path)
			console.warn(validPath);

			// this.app.vault.rename(file,"")


			// let backlinks = this.lh.getNotesThatHaveLinkToFile(file.path);
		}
	}

	checkFilePathIsIgnored(filePath: string): boolean {
		return (filePath.startsWith(".git") || filePath.startsWith(".obsidian"))
	}

	checkFileTypeIsAllowed(filePath: string): boolean {
		return (filePath.endsWith(".jpg") || filePath.endsWith(".png"))
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




