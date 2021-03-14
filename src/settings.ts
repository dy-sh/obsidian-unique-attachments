import { App, normalizePath, PluginSettingTab, Setting, } from 'obsidian';
import ConsistentAttachmentsAndLinks from './main';

export interface PluginSettings {
    ignoreFolders: string[];
    includeFileTypes: string[];
}

export const DEFAULT_SETTINGS: PluginSettings = {
    ignoreFolders: [".git/", ".obsidian/"],
    includeFileTypes: ["png", "jpg", "gif"],
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
        .setName("Process file types")
        .setDesc("Search and rename attachments of the listed file types. Write file types separated by comma.")
        .addTextArea(cb => cb
            .setPlaceholder("Example: jpg,png,gif")
            .setValue(this.plugin.settings.includeFileTypes.join(","))
            .onChange((value) => {
                let extensions = value.trim().split(",");
                this.plugin.settings.includeFileTypes = extensions;
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


    }

    getNormalizedPath(path: string): string {
        return path.length == 0 ? path : normalizePath(path);
    }
}