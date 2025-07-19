import { file } from '@kittycad/lib';

/**
 * Configuration for the Zoo API
 */
const ZOO_API_TOKEN = 'api-46f4315c-8a79-4500-8aec-be488e18063e';

/**
 * Convert a STEP file to GLTF format using Zoo API
 * @param fileBuffer - The STEP file as a Buffer or Uint8Array
 * @param fileName - Original filename for reference
 * @returns Promise containing the converted GLTF file data
 */
export async function convertStepToGltf(
  fileBuffer: Buffer | Uint8Array,
  fileName: string
): Promise<{
  success: boolean;
  data?: Buffer;
  fileName?: string;
  error?: string;
}> {
  try {
    console.log(`Starting conversion of ${fileName} from STEP to GLTF`);

    // Convert buffer to base64 string for the API
    const base64Data = Buffer.from(fileBuffer).toString('base64');

    // Set the API token as environment variable (needed for the client)
    process.env.KITTYCAD_TOKEN = ZOO_API_TOKEN;

    // Make the API call to Zoo for file conversion
    const response = await file.create_file_conversion({
      output_format: 'gltf',
      src_format: 'step',
      body: base64Data
    });

    // Check if response is an error
    if ('error_code' in response) {
      return {
        success: false,
        error: `API Error: ${response.error_code}`
      };
    }

    // Check if conversion was successful and has outputs
    if (!response.outputs || Object.keys(response.outputs).length === 0) {
      return {
        success: false,
        error: 'No output files generated from conversion'
      };
    }

    // Process the first output (there should typically be one GLTF file)
    const outputKey = Object.keys(response.outputs)[0];
    const outputData = response.outputs[outputKey];

    if (!outputData) {
      return {
        success: false,
        error: 'No output data received from conversion'
      };
    }

    // Convert base64 output back to buffer
    const convertedBuffer = Buffer.from(outputData, 'base64');

    // Generate output filename
    const baseFileName = fileName.replace(/\.(step|stp)$/i, '');
    const outputFileName = `${baseFileName}.gltf`;

    console.log(`Successfully converted ${fileName} to ${outputFileName}`);

    return {
      success: true,
      data: convertedBuffer,
      fileName: outputFileName
    };
  } catch (error) {
    console.error('Error converting STEP to GLTF:', error);

    let errorMessage = 'Unknown error occurred during conversion';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Convert a File object from browser to GLTF format
 * @param file - The STEP file from a file input or dropzone
 * @returns Promise containing the converted GLTF file data
 */
export async function convertStepFileToGltf(file: File): Promise<{
  success: boolean;
  data?: Buffer;
  fileName?: string;
  error?: string;
}> {
  try {
    // Validate file type
    const isValidStepFile =
      file.name.toLowerCase().endsWith('.step') ||
      file.name.toLowerCase().endsWith('.stp') ||
      file.type === 'application/step' ||
      file.type === 'application/octet-stream';

    if (!isValidStepFile) {
      return {
        success: false,
        error: 'Invalid file type. Please provide a STEP (.step or .stp) file.'
      };
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Use the main conversion function
    return await convertStepToGltf(fileBuffer, file.name);
  } catch (error) {
    console.error('Error processing file for conversion:', error);

    let errorMessage = 'Error processing file for conversion';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Helper function to create a downloadable blob from the converted GLTF data
 * @param gltfBuffer - The GLTF file buffer
 * @param fileName - The desired filename
 * @returns Blob that can be used for download
 */
export async function createGltfBlob(
  gltfBuffer: Buffer,
  fileName: string
): Promise<Blob> {
  return new Blob([gltfBuffer], {
    type: 'model/gltf+json'
  });
}

/**
 * Download the converted GLTF file in the browser
 * @param gltfBuffer - The GLTF file buffer
 * @param fileName - The desired filename
 */
export async function downloadGltfFile(
  gltfBuffer: Buffer,
  fileName: string
): Promise<void> {
  if (typeof window === 'undefined') {
    console.warn('downloadGltfFile can only be called in browser environment');
    return;
  }

  const blob = await createGltfBlob(gltfBuffer, fileName);
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  URL.revokeObjectURL(url);
}
