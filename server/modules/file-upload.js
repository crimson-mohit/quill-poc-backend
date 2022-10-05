import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const MIME_TYPE_MAP = {
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt'
};

const maxSize = 1000 * 1000 * 1000;

const fileUpload = multer({
  limits: { fileSize: maxSize },
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (!fs.existsSync('./uploads')){
        fs.mkdirSync('./uploads');

        console.log('Folder Created Successfully.');
      }
      cb(null, './uploads');
    },
    filename: (req, file, cb) => {
      const ext = MIME_TYPE_MAP[file.mimetype];
      let originalname = file.originalname.split('.');
      originalname.pop();
      cb(null, `${originalname.join('.')}-${uuidv4()}.${ext}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    const isValid = !!MIME_TYPE_MAP[file.mimetype];
    let error = isValid ? null : new Error('Invalid mime type!');
    cb(error, isValid);
  }
});

export default fileUpload;
