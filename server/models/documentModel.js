import mongoose from 'mongoose';

const dataSchema = new mongoose.Schema({
    _id: {
        required: true,
        type: String
    },
    documentId: {
        required: true,
        type: String
    },
    delta: {
        required: true,
        type: String,
        get: function(data) {
          try {
            return JSON.parse(data);
          } catch(error) {
            return data;
          }
        },
        set: function(data) {
          return JSON.stringify(data);
        }
    },
    data: {
      required: true,
      type: String,
      get: function(data) {
        try {
          return JSON.parse(data);
        } catch(error) {
          return data;
        }
      },
      set: function(data) {
        return JSON.stringify(data);
      }
    }
}, { _id: false });

export default mongoose.model('Data', dataSchema)
