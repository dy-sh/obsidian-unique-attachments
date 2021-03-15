# Unique attachments

> For now, the plugin is only compatible with standard markdown links. Wikilinks are not supported.

This plugin renames attachments, making their names unique. 
A hash function (MD5) is used to generate the filename, so the filename is indeed unique.

If two files have exactly the same content (up to each byte), then their names will also be the same. This way, if you find two files with the same name, you can be sure that they are copies of the same file.

After processing, the filenames look something like this: 5be2a494d8c98092d803718d29fe14c0.png

This approach to naming attachments will add a bit of consistency to your notes. You might want to use this plugin in conjunction with [Consistent attachments and links](https://github.com/derwish-pro/obsidian-consistent-attachments-and-links) plugin.

After renaming the files, the plugin updates the links in all notes that used these files.

This plugin can also delete duplicates (files that have the same content) if they are in the same folder. This will make your vault a little cleaner.

## How to configure

Assign a hotkey to "Unique attachments: Rename all attachments" command in the Obsidian Hotkeys settings.

In the plugin settings, you can set the type of attachments that will be processed. Or you can ignore some folders that you don't want to process.

## How to use

Call the hotkey when you want to search and rename attachments. You will see a notification about how many files have been renamed. In the console, you can see more detailed information about what happened.


It is recommended to make a backup of your files before using this plugin.