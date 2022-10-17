import Delta from 'quill-delta';

import cache from '../../global.cache.service';

const writeDocument = async (payload) => {
  const documentId = payload.id;
  const incomingDelta = payload.delta;

  const finalDelta = {
    ops: new Delta(cache[documentId].ops).compose(new Delta(incomingDelta.ops)).ops
  };

  cache[documentId] = finalDelta;
};

export default writeDocument;
