import multer from 'multer';

export const upload = multer({ 
  limits: { fileSize: 10 * 1024 * 1024 }
});