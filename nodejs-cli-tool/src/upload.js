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

async function uploadImageToAliyunOSS(imagePath) {
    const OSS = require('ali-oss');
    const client = new OSS({
        accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
        accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
        bucket: process.env.ALIYUN_BUCKET_NAME,
        region: process.env.ALIYUN_REGION,
    });

    const fileName = path.basename(imagePath);
    try {
    const result = await client.put(fileName, imagePath);
        console.log(`Uploaded ${fileName} to AliyunOSS successfully`);
        return { url: result.data.url };
    } catch (error) {
        console.error(`Error uploading ${fileName} to AliyunOSS:`, error);
        throw error;
    }
    return result.url;
}

async function uploadImageToQiniu(imagePath) {
    const qiniu = require('qiniu');
    const mac = new qiniu.auth.digest.Mac(process.env.QINIU_ACCESS_KEY, process.env.QINIU_SECRET_KEY);
    const config = new qiniu.conf.Config();
    const formUploader = new qiniu.form_up.FormUploader(config);
    const putExtra = new qiniu.form_up.PutExtra();
    const bucket = process.env.QINIU_BUCKET_NAME;

    const fileName = path.basename(imagePath);
    return new Promise((resolve, reject) => {
        formUploader.putFile(qiniu.getUploadToken(mac, { scope: bucket }), fileName, imagePath, putExtra, (respErr, respBody, respInfo) => {
            if (respErr) {
                console.error(`Error uploading image ${fileName}:`, respErr);
                reject(respErr);
            }
            if (respInfo.statusCode == 200) {
                resolve(`${process.env.QINIU_DOMAIN}/${fileName}`);
            } else {
                console.error(`Error uploading image ${fileName}:`, respBody);
                reject(respBody);
            }
        });
    });
}

async function uploadImageToAWSS3(imagePath) {
    const s3 = require('aws-sdk/lib/s3');
    const { AWSS3_BUCKET_NAME: bucket, AWSS3_REGION: region } = process.env;

    const fileName = path.basename(imagePath);

    // Initialize the S3 client
    const s3Client = new s3.S3({
        accessKeyId: process.env.AWSS3_ACCESS_KEY_ID,
        accessKeySecret: process.env.AWSS3_SECRET_KEY,
        region: region
    });

    // Upload the image to S3
    return new Promise((resolve, reject) => {
        s3Client.putObject({
            Bucket: bucket,
            Key: fileName,
            Source: fs.createReadStream(imagePath),
        }, (err, data) => {
            if (err) {
                console.error(`Error uploading ${fileName} to AWS S3:`, err);
                reject(err);
            } else {
                resolve(`${data.Location}`);
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