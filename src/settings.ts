import { App, normalizePath, PluginSettingTab, Setting, } from 'obsidian';
import ConsistentAttachmentsAndLinks from './main';

export interface PluginSettings {

}

export const DEFAULT_SETTINGS: PluginSettings = {

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

      

      
}