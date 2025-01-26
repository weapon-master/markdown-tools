// src/index.js

const fs = require('fs');
const path = require('path');
const { readMarkdownFile, writeMarkdownFile } = require('./utils/fileHandler');
const { uploadImages } = require('./upload');

const markdownFilePath = process.argv[2];
if (!markdownFilePath) {
    console.error('Please provide a markdown file path.');
    process.exit(1);
}

const main = async () => {
    try {
        const markdownContent = await readMarkdownFile(markdownFilePath);
        const updatedContent = await uploadImages(markdownContent);
        const outputFilePath = path.join(path.dirname(markdownFilePath), 'updated_' + path.basename(markdownFilePath));
        await writeMarkdownFile(outputFilePath, updatedContent);
        console.log(`Updated markdown file created at: ${outputFilePath}`);
    } catch (error) {
        console.error('Error processing the markdown file:', error);
    }
};

main();