import { App, Plugin, TAbstractFile, TFile, EmbedCache, LinkCache, Notice, MarkdownView, getLinkpath, CachedMetadata } from 'obsidian';
import { PluginSettings, DEFAULT_SETTINGS, SettingTab } from './settings';
import { LinksHandler, LinkChangeInfo } from './links-handler';
import { path } from './path';
import { Md5 } from './md5/md5';




export default class ConsistentAttachmentsAndLinks extends Plugin {
	settings: PluginSettings;
	lh: LinksHandler;


	async onload() {
		await this.loadSettings();

		this.addSettingTab(new SettingTab(this.app, this));

		this.addCommand({
			id: 'rename-all-attachments',
			name: 'Rename all attachments',
			callback: () => this.renameAllAttachments()
		});

		this.addCommand({
			id: 'rename-only-active-attachments',
			name: 'Rename only active attachments',
			callback: () => this.renameOnlyActiveAttachments()
		});


		this.lh = new LinksHandler(this.app, "Unique attachments: ");
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


	async renameOnlyActiveAttachments() {
		let mdfile = this.app.workspace.getActiveFile();

		// check if the active file is the Markdown file
		if (!mdfile.path.endsWith(".md")) {
			return;
		}
			
		let renamedCount = await this.renameAttachmentsForActiveMD(mdfile);
		
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
					await this.lh.updateChangedPathInNote(note, filePath, validPath);
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
					await this.lh.updateChangedPathInNote(note, filePath, validPath);
				}
			}

			console.log("Unique attachments: file renamed [from, to]:\n   " + filePath + "\n   " + validPath);
		}

		return true;
	}

	// just rename the files and let Obsidian to update the links
	async renameAttachmentsForActiveMD(mdfile: TFile): Promise<number> {

		let rlinks = Object.keys(this.app.metadataCache.resolvedLinks[mdfile.path]);
		let renamedCount = 0;
		
		let actMetadataCache = this.app.metadataCache.getFileCache(mdfile);
		let currentView = this.app.workspace.activeLeaf.view as MarkdownView;

		for (let rlink of rlinks) {
			let file = this.app.vault.getAbstractFileByPath(rlink)
			let filePath = file.path;
			if (this.checkFilePathIsIgnored(filePath) || !this.checkFileTypeIsAllowed(filePath)) {
				continue;
			}

			let ext = path.extname(filePath);
			let baseName = path.basename(filePath, ext);
			let validBaseName = await this.generateValidBaseName(filePath);
			if (baseName == validBaseName) {
				continue;
			}

			if (this.settings.savePreviousName) {
				this.saveAttachmentNameInLink(actMetadataCache, mdfile, file, baseName, currentView);
			}
			currentView.save();

			if (!this.renameAttachment(file, validBaseName)) {
				continue;
			}
			renamedCount++;
		}

		return renamedCount;
	}
	
	saveAttachmentNameInLink(mdc: CachedMetadata, mdfile: TFile, file: TAbstractFile, baseName: string, currentView: MarkdownView) {
		let cmDoc = currentView.editor;
		if (!mdc.links) {
			return;
		}

		for (let eachLink of mdc.links) {
			if (eachLink.displayText != "" && eachLink.link != eachLink.displayText) {
				continue;
			}
			let afile = this.app.metadataCache.getFirstLinkpathDest(getLinkpath(eachLink.link), mdfile.path);
			if (afile != null && afile.path == file.path) {
				let newlink = this.app.fileManager.generateMarkdownLink(afile, file.parent.path, "", baseName);
				// remove symbol '!'
				newlink = newlink.substring(1);
				const linkstart = eachLink.position.start;
				const linkend = eachLink.position.end;
				cmDoc.replaceRange(newlink, 
						   {line: linkstart.line, ch: linkstart.col},
						   {line: linkend.line, ch: linkend.col});
			}
		}
	}

	async renameAttachment(file: TAbstractFile, validBaseName: string): Promise<boolean> {

		let validPath = this.lh.getFilePathWithRenamedBaseName(file.path, validBaseName);

		let targetFileAlreadyExists = await this.app.vault.adapter.exists(validPath)

		if (targetFileAlreadyExists) {
			//if file content is the same in both files, one of them will be deleted			
			let validAnotherFileBaseName = await this.generateValidBaseName(validPath);
			if (validAnotherFileBaseName != validBaseName) {
				console.warn("Unique attachments: cant rename file \n   " + file.path + "\n    to\n   " + validPath + "\n   Another file exists with the same (target) name but different content.")
				return false;
			}

			if (!this.settings.mergeTheSameAttachments) {
				console.warn("Unique attachments: cant rename file \n   " + file.path + "\n    to\n   " + validPath + "\n   Another file exists with the same (target) name and the same content. You can enable \"Delte duplicates\" setting for delete this file and merge attachments.")
				return false;
			}

			try {
				// Obsidian can not replace one file to another
				let oldfile = this.app.vault.getAbstractFileByPath(validPath)
				// so just silently delete the old file 
				await this.app.vault.delete(oldfile);
				// and give the same name to the new one
				await this.app.fileManager.renameFile(file, validPath);
			} catch (e) {
				console.error("Unique attachments: cant delete duplicate file " + file.path + ".\n" + e);
				return false;
			}

			console.log("Unique attachments: file content is the same in \n   " + file.path + "\n   and \n   " + validPath + "\n   Duplicates merged.")
		} else {
			try {
				await this.app.fileManager.renameFile(file, validPath);
			} catch (e) {
				console.error("Unique attachments: cant rename file \n   " + file.path + "\n   to \n   " + validPath + "   \n" + e);
				return false;
			}

			console.log("Unique attachments: file renamed [from, to]:\n   " + file.path + "\n   " + validPath);
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
		const buf = new Uint8Array(data);

		// var crypto = require('crypto');
		// let hash: string = crypto.createHash('md5').update(buf).digest("hex");

		let md5 = new Md5();
		md5.appendByteArray(buf);
		let hash = md5.end().toString();

		return hash;
	}


	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}


}
