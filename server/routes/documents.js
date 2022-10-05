import express from 'express';
import axios from "axios";
import FormData from "form-data";
import AdmZip from "adm-zip";
import fs from "fs";
import upload from '../modules/file-upload.js';
import * as formatConvert from '../modules/format-converter.js';

const router = express.Router();
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

/*{
  METHOD: GET
  PARAMS: {}
  ROUTE: '/documents'
}*/
router.get('/', (req, res, next) => {
  let listOfDocuments = [];
  fs.readdirSync('./document-store').forEach(file => {
    listOfDocuments.push(file);
  });

  res.send({
    status: true,
    data: listOfDocuments
  });
});

/*{
  METHOD: POST
  PARAMS: { id: ''}
  ROUTE: '/documents/getById'
}*/
router.post('/getById', async (req, res, next) => {
  var fileContents = fs.readFileSync(`./document-store/${req.body.id}`,'utf8');
  let delta = formatConvert.convertHtmlToDelta(fileContents);

  // update image src with server endpoint
  let listOfImageElements = delta.ops.map(item => item.insert).filter(item => typeof item === 'object' && item.image);
  listOfImageElements.forEach(item => item.image = `http://localhost:8081/${item.image}`);

  res.send({
    status: true,
    data: JSON.stringify(delta)
  });
});

/*{
  METHOD: POST
  PARAMS: FILE
  ROUTE: '/documents/upload'
}*/
router.post('/upload', upload.single('file'), async (req, res, next) => {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(req.file.path));
  formData.append('includeTrackChanges', 'true');

  axios({
    method: 'POST',
    url: `${process.env.TO_HTML_SERVER}/api/v1/convert/html`,
    data: formData,
    responseType: 'stream'
  })
  .then(async (response) => {
    await response.data.pipe(fs.createWriteStream('./.temp/temp.zip'));

    await delay(2*1000);

    let fileName;
    const zip = new AdmZip('./.temp/temp.zip');
    const zipEntries = zip.getEntries();
    zip.extractAllTo('./document-store', true);

    for (const zipEntry of zipEntries) {
      if (zipEntry.entryName.includes('.html')) {
        fileName = zipEntry.entryName;
        // let htmlContent = zipEntry.getData().toString('utf8');
      } else if(zipEntry.entryName.includes('.png')) {
        let oldPath = `./document-store/${zipEntry.entryName}`;
        let newPath = `./assets/${zipEntry.entryName}`;

        fs.rename(oldPath, newPath, (err) => {
          if (err) throw err
          console.log('Successfully renamed - AKA moved!')
        });
      }
    }

    await delay(2*1000);

    res.send({
      message: 'File uploaded successfully',
      status: true,
      id: fileName
    });
  })
  .catch((error) => {
    console.log(error);
    res.send({
      message: 'File upload failed',
      status: false,
      content: null,
      error: error
    });
  });
});

module.exports = router;
