# Node.js CLI Tool for Uploading Images from Markdown to Tencent Cloud Object Storage

This project is a command-line interface (CLI) tool that allows users to upload images referenced in a markdown file to Tencent Cloud Object Storage. The tool replaces the original image paths in the markdown file with the URLs of the uploaded images and generates a new markdown file with the updated paths.

## Prerequisites

- Node.js installed on your machine.
- A Tencent Cloud account with access to Object Storage.
- Your Tencent Cloud Object Storage credentials (secret key, bucket name, etc.).

## Installation

1. Clone the repository:

   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:

   ```
   cd nodejs-cli-tool
   ```

3. Install the dependencies:

   ```
   npm install
   ```

4. Create a `.env` file in the root directory and add your Tencent Cloud credentials:

   ```
   TENCENT_CLOUD_SECRET_KEY=your_secret_key
   TENCENT_CLOUD_BUCKET_NAME=your_bucket_name
   TENCENT_CLOUD_REGION=your_region
   ```

## Usage

To use the CLI tool, run the following command:

```
node src/index.js <path-to-markdown-file> <output-markdown-file>
```

- `<path-to-markdown-file>`: The path to the markdown file containing images.
- `<output-markdown-file>`: The path where the new markdown file with updated image URLs will be saved.

## Example

```
node src/index.js input.md output.md
```

This command will read `input.md`, upload all referenced images to Tencent Cloud Object Storage, and create `output.md` with the updated image URLs.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.