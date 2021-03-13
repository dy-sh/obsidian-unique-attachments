import { App, Plugin, TAbstractFile, TFile, EmbedCache, LinkCache } from 'obsidian';
import { PluginSettings, DEFAULT_SETTINGS, SettingTab } from './settings';
import { Utils } from './utils';
import { LinksHandler } from './links-handler';
import { FilesHandler } from './files-handler';

const path = require('path');





export default class ConsistentAttachmentsAndLinks extends Plugin {
	settings: PluginSettings;
	lh: LinksHandler;
	fh: FilesHandler;


	async onload() {
		await this.loadSettings();

		this.addSettingTab(new SettingTab(this.app, this));

		this.lh = new LinksHandler(this.app, "Unique attachments: ");
		this.fh = new FilesHandler(this.app, this.lh, "Unique attachments: ");
	}

	


	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}


}




