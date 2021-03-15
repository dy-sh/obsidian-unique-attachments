# Unique attachments

This plugin renames attachments, making their names unique. 
A hash function (MD5) is used to generate the filename, so the filename is indeed unique.

If two files have exactly the same content (up to each byte), then their names will also be the same. Thus, if you find two files with the same name, you can be sure that they are a copy of the same file.

The filenames looks something like this:
5be2a494d8c98092d803718d29fe14c0.png

This approach to naming attachments will add a bit of consistency to your notes. You might want to use this plugin in conjunction with [Consistent attachments and links](https://github.com/derwish-pro/obsidian-consistent-attachments-and-links) plugin.

The plugin can also delete files that have the same content if they are in the same folder (optional). This will make your vault a little cleaner.

 In the settings, you can set the type of attachments that will be processed. Or, you can ignore some folders that you would not like to process.