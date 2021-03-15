import { App, normalizePath, PluginSettingTab, Setting, } from 'obsidian';
import ConsistentAttachmentsAndLinks from './main';

export interface PluginSettings {
    ignoreFolders: string[];
    renameFileTypes: string[];
    renameOnlyLinkedAttachments: boolean,
    mergeTheSameAttachments: boolean,
}

export const DEFAULT_SETTINGS: PluginSettings = {
    ignoreFolders: [".git/", ".obsidian/"],
    renameFileTypes: ["png", "jpg", "gif"],
    renameOnlyLinkedAttachments: true,
    mergeTheSameAttachments: true,
}

export class SettingTab extends PluginSettingTab {
    plugin: ConsistentAttachmentsAndLinks;

    constructor(app: App, plugin: ConsistentAttachmentsAndLinks) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        let { containerEl } = this;

        containerEl.empty();

        containerEl.createEl('h2', { text: 'Unique attachments - Settings' });

        new Setting(containerEl)
            .setName("File types to rename")
            .setDesc("Search and rename attachments of the listed file types. Write types separated by comma.")
            .addTextArea(cb => cb
                .setPlaceholder("Example: jpg,png,gif")
                .setValue(this.plugin.settings.renameFileTypes.join(","))
                .onChange((value) => {
                    let extensions = value.trim().split(",");
                    this.plugin.settings.renameFileTypes = extensions;
                    this.plugin.saveSettings();
                }));



        new Setting(containerEl)
            .setName("Ignore folders")
            .setDesc("Do not search or rename attachments in these folders. Write each folder on a new line.")
            .addTextArea(cb => cb
                .setPlaceholder("Example:\n.git/\n.obsidian/")
                .setValue(this.plugin.settings.ignoreFolders.join("\n"))
                .onChange((value) => {
                    let paths = value.trim().split("\n").map(value => this.getNormalizedPath(value) + "/");
                    this.plugin.settings.ignoreFolders = paths;
                    this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Rename only linked attachments')
            .setDesc('Rename only attachments that are used in notes. If disabled, all found files will be renamed.')
            .addToggle(cb => cb.onChange(value => {
                this.plugin.settings.renameOnlyLinkedAttachments = value;
                this.plugin.saveSettings();
            }
            ).setValue(this.plugin.settings.renameOnlyLinkedAttachments));

        new Setting(containerEl)
            .setName('Delete duplicates')
            .setDesc('If several files are in the same folder and have identical contents then delete duplicates, keep only one file.')
            .addToggle(cb => cb.onChange(value => {
                this.plugin.settings.mergeTheSameAttachments = value;
                this.plugin.saveSettings();
            }
            ).setValue(this.plugin.settings.mergeTheSameAttachments));
    }

    getNormalizedPath(path: string): string {
        return path.length == 0 ? path : normalizePath(path);
    }
}