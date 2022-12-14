import express from 'express';
import axios from 'axios';
import FormData from 'form-data';
import AdmZip from 'adm-zip';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

import upload from '../modules/file-upload.js';
import * as formatConvert from '../modules/format-converter.js';
import cache from '../global.cache.service';

const router = express.Router();
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

/*{
  METHOD: GET
  PARAMS: {}
  ROUTE: '/documents'
}*/
router.get('/', (req, res, next) => {
  if (!fs.existsSync('./document-store')){
    fs.mkdirSync('./document-store');

    console.log('Folder Created Successfully.');
  }

  let listOfDocuments = [];
  fs.readdirSync('./document-store').forEach(file => {
    if(file.includes('.json')) {
      listOfDocuments.push(file);
    }
  });

  res.send({
    status: true,
    data: listOfDocuments
  });
});

/*{
  METHOD: GET
  PARAMS: {}
  ROUTE: '/createNewDocument'
}*/
router.get('/createNewDocument', (req, res, next) => {
  if (!fs.existsSync('./document-store')){
    fs.mkdirSync('./document-store');

    console.log('Folder Created Successfully.');
  }

  let newDocumentName = `new-${uuidv4()}`;
  fs.writeFileSync(`./document-store/${newDocumentName}.html`, '');
  fs.writeFileSync(`./document-store/${newDocumentName}.json`, JSON.stringify({"ops": []}));

  res.send({
    status: true,
    id: `${newDocumentName}.json`
  });
});

/*{
  METHOD: POST
  PARAMS: { id: ''}
  ROUTE: '/documents/getById'
}*/
router.post('/getById', async (req, res, next) => {
  var fileContents = fs.readFileSync(`./document-store/${req.body.id}`,'utf8');
  // let delta = formatConvert.convertHtmlToDelta(fileContents);
  let delta = JSON.parse(fileContents);

  // update image src with server endpoint
  let listOfImageElements = delta.ops.map(item => item.insert).filter(item => typeof item === 'object' && item.image);
  listOfImageElements.forEach(item => item.image = `http://localhost:8081/${item.image}`);

  if(!cache[req.body.id]) {
    cache[req.body.id] = {
      serverSideDelta: {}
    };
  }

  cache[req.body.id].serverSideDelta = delta;

  res.send({
    status: true,
    data: JSON.stringify(delta)
  });
});

router.post('/deleteById', async (req, res, next) => {
  const fileToBeDeleted = `./document-store/${req.body.id}`;
  let fileFound = false;
  if (fs.existsSync(fileToBeDeleted)) {
    fileFound = true;
    fs.rmSync(fileToBeDeleted, {
      force: true
    });
  }

  res.send({
    status: fileFound,
    message: fileFound ? 'File deleted successfully !' : 'File not found'
  });
});

/*{
  METHOD: POST
  PARAMS: FILE
  ROUTE: '/documents/upload'
}*/
router.post('/upload', upload.single('file'), async (req, res, next) => {
  if (!fs.existsSync('./assets')){
    fs.mkdirSync('./assets');

    console.log('Folder Created Successfully.');
  }

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
    if (!fs.existsSync('./.temp')){
      fs.mkdirSync('./.temp');

      console.log('Folder Created Successfully.');
    }
    await response.data.pipe(fs.createWriteStream('./.temp/temp.zip'));

    await delay(2*1000);

    let newFileName;
    const zip = new AdmZip('./.temp/temp.zip');
    const zipEntries = zip.getEntries();
    zip.extractAllTo('./document-store', true);

    for (const zipEntry of zipEntries) {
      if (zipEntry.entryName.includes('.html')) {
        let fileName = zipEntry.entryName;
        let fileContents = zipEntry.getData().toString('utf8');
        let delta = formatConvert.convertHtmlToDelta(fileContents);
        let tempFileName = fileName.split('.');
        tempFileName.pop();
        newFileName = `${tempFileName.join('.')}.json`;
        fs.writeFileSync(`./document-store/${newFileName}`, JSON.stringify(delta));

      } else if(zipEntry.entryName.includes('.png')) {
        let oldPath = `./document-store/${zipEntry.entryName}`;
        let newPath = `./assets/${zipEntry.entryName}`;

        fs.rename(oldPath, newPath, (err) => {
          // if (err) throw err
          console.log('Successfully renamed - AKA moved!')
        });
      }
    }

    await delay(2*1000);

    res.send({
      message: 'File uploaded successfully',
      status: true,
      id: newFileName
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
