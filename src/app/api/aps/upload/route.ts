import { NextRequest, NextResponse } from 'next/server';
import {
  getAPSToken,
  uploadFileToAPS,
  generateBucketKey,
  generateObjectKey,
  translateModel
} from '@/lib/aps';

/**
 * POST /api/aps/upload
 * Uploads a file to APS and initiates translation
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const supportedFormats = [
      '.dwg',
      '.dwf',
      '.dwfx',
      '.dxf',
      '.ifc',
      '.ige',
      '.iges',
      '.igs',
      '.ipt',
      '.iam',
      '.idw',
      '.ipn',
      '.dwgx',
      '.dwgz',
      '.stp',
      '.step',
      '.stl',
      '.obj',
      '.3ds',
      '.max',
      '.rvt',
      '.rfa',
      '.rte',
      '.rft',
      '.f3d',
      '.catpart',
      '.catproduct',
      '.cgr',
      '.3dxml',
      '.dlv3',
      '.exp',
      '.prt',
      '.neu',
      '.3dm',
      '.nwd',
      '.nwc',
      '.nwf',
      '.x_t',
      '.x_b',
      '.jt',
      '.smb',
      '.smt',
      '.sat',
      '.model',
      '.session',
      '.dlv',
      '.exp',
      '.catpart',
      '.catproduct',
      '.cgr',
      '.3dxml'
    ];

    const fileExtension = `.${  file.name.split('.').pop()?.toLowerCase()}`;
    if (!supportedFormats.includes(fileExtension)) {
      return NextResponse.json(
        { error: `Unsupported file format: ${fileExtension}` },
        { status: 400 }
      );
    }

    // Get APS token
    const token = await getAPSToken();

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Generate bucket and object keys
    const bucketKey = generateBucketKey();
    const objectKey = generateObjectKey(file.name);

    console.log(`Uploading file: ${file.name} (${fileBuffer.length} bytes)`);
    console.log(`Bucket: ${bucketKey}, Object: ${objectKey}`);

    // Upload file to APS
    const objectId = await uploadFileToAPS(
      bucketKey,
      objectKey,
      fileBuffer,
      token
    );

    console.log(`File uploaded successfully. Object ID: ${objectId}`);

    // Initiate translation
    const translationUrn = await translateModel(objectId, token);

    console.log(`Translation initiated. URN: ${translationUrn}`);

    return NextResponse.json({
      success: true,
      objectId,
      bucketKey,
      objectKey,
      translationUrn,
      fileName: file.name,
      fileSize: fileBuffer.length
    });
  } catch (error) {
    console.error('File upload failed:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      { error: `Upload failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * GET /api/aps/upload
 * Returns supported file formats
 */
export async function GET() {
  const supportedFormats = [
    'AutoCAD (.dwg, .dwf, .dwfx, .dxf)',
    'IFC (.ifc)',
    'IGES (.ige, .iges, .igs)',
    'Inventor (.ipt, .iam, .idw, .ipn)',
    'STEP (.stp, .step)',
    'STL (.stl)',
    'OBJ (.obj)',
    '3ds Max (.3ds, .max)',
    'Revit (.rvt, .rfa, .rte, .rft)',
    'Fusion 360 (.f3d)',
    'CATIA (.catpart, .catproduct, .cgr, .3dxml)',
    'Rhino (.3dm)',
    'Navisworks (.nwd, .nwc, .nwf)',
    'Parasolid (.x_t, .x_b)',
    'JT (.jt)',
    'And many more...'
  ];

  return NextResponse.json({
    supportedFormats,
    maxFileSize: '100MB',
    note: 'Files are automatically translated to SVF2 format for viewing'
  });
}
