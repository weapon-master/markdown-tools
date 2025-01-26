// This file contains utility functions for reading and writing markdown files.

const fs = require('fs').promises;

async function readMarkdownFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return data;
    } catch (error) {
        throw new Error(`Error reading markdown file: ${error.message}`);
    }
}

async function writeMarkdownFile(filePath, content) {
    try {
        await fs.writeFile(filePath, content, 'utf-8');
    } catch (error) {
        throw new Error(`Error writing markdown file: ${error.message}`);
    }
}

module.exports = {
    readMarkdownFile,
    writeMarkdownFile
};