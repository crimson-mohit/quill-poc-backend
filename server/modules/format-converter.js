import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const require = createRequire(import.meta.url);

const quillFilePath = require.resolve('quill');
const quillMinFilePath = quillFilePath.replace('quill.js', 'quill.min.js');

const quillLibrary = fs.readFileSync(quillMinFilePath);
const mutationObserverPolyfill = fs.readFileSync(path.join(__dirname, 'polyfill.js'));

const JSDOM_TEMPLATE = `
  <div id="editor">hello</div>
  <script>${mutationObserverPolyfill}</script>
  <script>${quillLibrary}</script>
  <script>
    document.getSelection = () => {
      return {
        getRangeAt: () => { }
      };
    };
    document.execCommand =  (command, showUI, value) => {
      try {
          return document.execCommand(command, showUI, value);
      } catch(e) {}
      return false;
    };
  </script>
`;

const JSDOM_OPTIONS = { runScripts: 'dangerously', resources: 'usable' };
const DOM = new JSDOM(JSDOM_TEMPLATE, JSDOM_OPTIONS);

const cache = {};

const convertTextToDelta = (text) => {
  if (!cache.quill) {
    cache.quill = new DOM.window.Quill('#editor');
  }

  cache.quill.setText(text);

  let delta = cache.quill.getContents();
  return delta;
};

const convertHtmlToDelta = (html) => {
  if (!cache.quill) {
    cache.quill = new DOM.window.Quill('#editor');
  }

  let delta = cache.quill.clipboard.convert(html);

  return delta;
};

const convertDeltaToHtml = (delta) => {
  if (!cache.quill) {
    cache.quill = new DOM.window.Quill('#editor');
  }

  cache.quill.setContents(delta);

  let html = cache.quill.root.innerHTML;
  return html;
};

export {
  convertTextToDelta,
  convertHtmlToDelta,
  convertDeltaToHtml
}
