// Module under test
const fileController = require('../controllers/fileController');

// Mock dependencies used inside the controller as needed
jest.mock('../middleware/secureFileHandler', () => ({
  validateDownloadToken: jest.fn(() => true),
  hasFileAccess: jest.fn(() => true),
  retrieveFile: jest.fn(async () => ({
    filePath: '/tmp/tmp_test_file.txt',
    originalName: 'test.txt',
    mimeType: 'text/plain',
    size: 4
  })),
  generateSecureDownloadUrl: jest.fn(() => ({ url: '/api/files/download/1?token=abc', expiresAt: new Date().toISOString() }))
}));

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  promises: {
    ...jest.requireActual('fs').promises,
    unlink: jest.fn(async () => {})
  },
  existsSync: jest.fn(() => true),
  createReadStream: jest.fn(() => ({
    pipe: jest.fn(),
    on: jest.fn()
  }))
}));

describe('fileController', () => {
  const createRes = () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    res.setHeader = jest.fn();
    res.end = jest.fn();
    res.headersSent = false;
    res.on = jest.fn();
    return res;
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('uploadFiles returns 400 when no processed files', async () => {
    const req = { processedFiles: [] };
    const res = createRes();

    await fileController.uploadFiles(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  test('uploadFiles succeeds and listFiles returns uploaded file', async () => {
    const userId = 'user-1';
    const now = new Date().toISOString();
    const uploaded = [{
      id: 'file-1',
      originalName: 'doc.txt',
      fileSize: 10,
      mimeType: 'text/plain',
      uploadDate: now,
      uploadedBy: userId,
      status: 'encrypted',
      scanResult: { isClean: true, assessment: 'clean' }
    }];
    const rejected = [];

    const reqUpload = { processedFiles: uploaded, rejectedFiles: rejected };
    const resUpload = createRes();
    await fileController.uploadFiles(reqUpload, resUpload);
    expect(resUpload.status).toHaveBeenCalledWith(200);
    expect(resUpload.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));

    const reqList = { query: {}, user: { id: userId } };
    const resList = createRes();
    await fileController.listFiles(reqList, resList);
    expect(resList.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        files: expect.arrayContaining([
          expect.objectContaining({ id: 'file-1', originalName: 'doc.txt' })
        ])
      })
    }));
  });

  test('downloadFile returns 400 when token missing', async () => {
    const req = { params: { fileId: 'missing' }, query: {}, user: { id: 'user-1' } };
    const res = createRes();

    await fileController.downloadFile(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  test('scanFile returns 400 when no file provided', async () => {
    const req = {};
    const res = createRes();

    await fileController.scanFile(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });
});


