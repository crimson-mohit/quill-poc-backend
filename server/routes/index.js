import express from 'express';
const router = express.Router();

/*{
  METHOD: GET
  PARAMS: {}
  ROUTE: '/'
}*/
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Express' });
});

export default router;
