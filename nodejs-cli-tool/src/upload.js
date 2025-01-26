const fs = require('fs');
const path = require('path');
const COS = require('cos-nodejs-sdk-v5');
const dotenv = require('dotenv');
const { readMarkdownFile, writeMarkdownFile } = require('./utils/fileHandler');

dotenv.config();

const { TENCENT_CLOUD_APP_ID: SecretId, TENCENT_CLOUD_SECRET_KEY: SecretKey, TENCENT_CLOUD_BUCKET_NAME: Bucket, TENCENT_CLOUD_REGION: Region } = process.env;

const cos = new COS({
    SecretId,
    SecretKey,
});

async function uploadImageToTencentCloud(imagePath) {
    const fileContent = fs.readFileSync(imagePath);
    const fileName = path.basename(imagePath);

    return new Promise((resolve, reject) => {
        cos.putObject({
            Bucket,
            Region,
            Key: fileName,
            Body: fileContent,
        }, (err, data) => {
            if (err) {
                console.error(`Error uploading image ${fileName}:`, err);
                reject(err);
            } else {
                cos.getObjectUrl({
                    Bucket,
                    Region,
                    Key: fileName,
                    Sign: true // This will generate the signed URL
                }, (err, data) => {
                    if (err) {
                        console.error(`Error getting signed URL for ${fileName}:`, err);
                        reject(err);
                    } else {
                        resolve(data.Url);
                    }
                });
            }
        });
    });
}

async function uploadImages(markdownContent, markdownFilePath) {
    const imagePaths = markdownContent.match(/!\[.*?\]\((.*?)\)/g).map(img => img.match(/\((.*?)\)/)[1]);
    const absoluteImagePaths = imagePaths.map(imagePath => path.resolve(path.dirname(markdownFilePath), imagePath));
    const uploadPromises = absoluteImagePaths.map(uploadImageToTencentCloud);
    const uploadedUrls = await Promise.all(uploadPromises);

    let updatedMarkdown = markdownContent;
    imagePaths.forEach((path, index) => {
        updatedMarkdown = updatedMarkdown.replace(path, uploadedUrls[index]);
    });

    return updatedMarkdown;
}

const markdownFilePath = process.argv[2];
if (!markdownFilePath) {
    console.error('Please provide a markdown file path.');
    process.exit(1);
}

const main = async () => {
    try {
        const markdownContent = await readMarkdownFile(markdownFilePath);
        const updatedContent = await uploadImages(markdownContent, markdownFilePath);
        const outputFilePath = path.join(path.dirname(markdownFilePath), 'updated_' + path.basename(markdownFilePath));
        await writeMarkdownFile(outputFilePath, updatedContent);
        console.log(`Updated markdown file created at: ${outputFilePath}`);
    } catch (error) {
        console.error('Error processing the markdown file:', error);
    }
};

main();

module.exports = { uploadImages };