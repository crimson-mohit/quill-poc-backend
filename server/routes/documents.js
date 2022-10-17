import express from 'express';
import axios from 'axios';

import * as formatConvert from '../modules/format-converter.js';
import cache from '../global.cache.service';
import DocumentModel from "../models/documentModel";

const router = express.Router();

/*{
  METHOD: POST
  PARAMS: { id: ''}
  ROUTE: '/documents/getDocumentByIdRequest'
}*/
router.post('/getDocumentByIdRequest', async (req, res, next) => {
  const documentId = req.body.id;
  const token = req.body.token;
  const userId = req.body.userId;

  try{
    const data = await DocumentModel.findById(documentId);
    res.json({
      data: data._doc,
      status: true
    });
  } catch(error) {
    axios({
      method: 'GET',
      url: `${process.env.TRINKA_ENDPOINT}/trinka/api/v1/user/${userId}/file/${documentId}`,
      headers: {
        Authorization: token
      }
    }).then(async (response) => {
      let delta = formatConvert.convertHtmlToDelta(response.data.data.content);
      let newDocument = new DocumentModel({
        _id: documentId,
        documentId,
        delta,
        data: response.data.data
      });
      newDocument.save();

      res.json({
        data: newDocument,
        status: true
      });
    }).catch(error => {
      console.log(error);
      res.status(500).json({status: false, message: error.message})
    });
  }
});

router.post('/openEditorSession', async (req, res, next) => {
  const documentId = req.body.id;

  try{
    const data = await DocumentModel.findById(documentId);
    cache[documentId] = JSON.parse(data._doc.delta);

    res.json({
      message: 'Session started successfully !!!',
      status: true
    });
  } catch(error) {
    console.log(error);
    res.status(500).json({status: false, message: error.message})
  }
});

router.post('/closeEditorSession', async (req, res, next) => {
  const documentId = req.body.id;
  const token = req.body.token;
  const userId = req.body.userId;
  const cachedDelta = cache[documentId];
  const options = { new: true };
  let existingDocument = null;

  try {
    existingDocument = await DocumentModel.findById(documentId);
  } catch(error) {
    res.status(500).json({status: false, message: error.message})
  }

  let requestBody = JSON.parse(existingDocument._doc.data);
  requestBody.content = formatConvert.convertDeltaToHtml(cachedDelta);

  axios({
    method: 'PUT',
    url: `${process.env.TRINKA_ENDPOINT}/trinka/api/v1/user/${userId}/file/${documentId}`,
    headers: {
      Authorization: token
    },
    data: requestBody
  }).then(async (response) => {
    try{
      DocumentModel.findByIdAndUpdate(documentId, {
        delta: cachedDelta,
        data: response.data.data
      }, options, (err, doc) => {});

      res.json({
        message: 'Session closed successfully !!!',
        status: true
      });
    } catch(error) {
      res.status(500).json({status: false, message: error.message})
    }
  }).catch(error => {
    console.log(error);
    res.status(500).json({status: false, message: error.message})
  });;

});

module.exports = router;
