import fs from 'fs';
import path from 'path';

/**
 * Converts a local PDF file to base64 encoding
 * Usage: ts-node scripts/convert-pdf-to-base64.ts ./path/to/file.pdf
 */

// Get the file path from command line arguments
const filePath = process.argv[2];

if (!filePath) {
  console.error('Please provide a file path as an argument.');
  process.exit(1);
}

// Read the file
try {
  const absolutePath = path.resolve(process.cwd(), filePath);
  console.log(`Reading file: ${absolutePath}`);

  const fileData = fs.readFileSync(absolutePath);
  const base64Data = fileData.toString('base64');

  // Create output filename based on input filename
  const parsedPath = path.parse(absolutePath);
  const outputPath = path.join(parsedPath.dir, `${parsedPath.name}.base64.txt`);

  // Write the base64 data to a file
  fs.writeFileSync(outputPath, base64Data);

  console.log(`Base64 data written to: ${outputPath}`);
  console.log(`Base64 data length: ${base64Data.length} characters`);

  // Also create a JSON file for easy API testing
  const jsonData = {
    pdfBase64: base64Data
  };

  const jsonOutputPath = path.join(parsedPath.dir, `${parsedPath.name}.json`);
  fs.writeFileSync(jsonOutputPath, JSON.stringify(jsonData, null, 2));

  console.log(`JSON file created at: ${jsonOutputPath}`);
  console.log(
    'You can use this JSON file for testing the /api/process-pdf endpoint'
  );
} catch (error) {
  console.error('Error converting file to base64:', error);
  process.exit(1);
}
