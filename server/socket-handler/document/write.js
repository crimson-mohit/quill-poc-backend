// import { QuillDeltaToHtmlConverter } from 'quill-delta-to-html';
import Delta from 'quill-delta';
import cache from '../../global.cache.service';
import fs from 'fs';

const writeDocument = (payload) => {
  console.log('incoming request ===> ', payload);
  const documentId = payload.id;
  let cfg = {};

  cache[documentId].serverSideDelta = {
    ops: new Delta(cache[documentId].serverSideDelta.ops).compose(new Delta(payload.delta.ops)).ops
  };


  fs.writeFileSync(`./document-store/${payload.id}`, JSON.stringify(cache[documentId].serverSideDelta));

  // let converter = new QuillDeltaToHtmlConverter(cache[documentId].serverSideDelta.ops, cfg);
  // let html = converter.convert();
};

export default writeDocument;
