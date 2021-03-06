const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackConfig = require('../../webpack.dev.js');
const path = require('path');

const spawn = require('child_process').spawn;
const multer = require('multer');
const upload = multer({ dest: '../../uploads/' });

const fs = require('fs');

// Setup an Express server
const app = express();
app.use(express.static('public'));

if (process.env.NODE_ENV === 'development') {
  // Setup Webpack for development
  const compiler = webpack(webpackConfig);
  app.use(webpackDevMiddleware(compiler));
} else {
  // Static serve the dist/ folder in production
  app.use(express.static('dist'));
}

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded());

// Parse JSON bodies (as sent by API clients)
app.use(express.json());

const _w = 612, _h = 792

let pdfData = {
  name: '',
  type: '',
  startX: 0,
  startY: 0,
  endX: 0,
  endY: 0,
  pageNum: 0,
  width: 0,
  height: 0
};
// api
// download pdf, store in ui/uploads
app.post('/api/download', upload.single('pdf'), (req, res, next) => {
  let file = req.file;
  if (!file) {
    const err = new Error('Please upload a file');
    err.httpStatusCode = 400;
    return next(err);
  }
  fs.readFile(file.path, (err, data) => {
    fs.writeFile(`../uploads/${file.originalname}`, data, (err) => {
      if (err) console.log(err)
    })
  })
  res.send({success: true})
  pdfData.name = file.originalname.substr(0, file.originalname.length - 4)
})
// for get user input 
// get pdfData
app.post('/api/parsetype/diagram', (req, res) => {
  pdfData = Object.assign(pdfData, req.body)
  console.log(pdfData)

  pdfData.startY = pdfData.height - pdfData.startY
  pdfData.endY = pdfData.height - pdfData.endY
  ratio = _w / pdfData.width
  pdfData.startX *= ratio
  pdfData.startY *= ratio
  pdfData.endX *= ratio
  pdfData.endY *= ratio

  // run python
  const pythonProcess = spawn('python3', ['../parser/test.py'])
  pythonProcess.stdout.on('data', data => console.log(data.toString()))
  // run a lot of python
  const pyImgCapture = spawn('python3', ['../parser/capture_pic.py', 
    pdfData.name, pdfData.pageNum, pdfData.startX, pdfData.startY, pdfData.endX, pdfData.endY])
  pyImgCapture.stdout.on('data', data => {
    res.sendFile(path.resolve(`../pictures/${pdfData.name}.png`))
  })
  pyImgCapture.stderr.on('data', data => {
    console.log(data.toString())
  })
})

app.post('/api/parsetype/table', (req, res) => {
  pdfData = Object.assign(pdfData, req.body)
  console.log(pdfData)

  pdfData.startY = pdfData.height - pdfData.startY
  pdfData.endY = pdfData.height - pdfData.endY
  ratioW = _w / pdfData.width
  pdfData.startX *= ratio
  pdfData.startY *= ratio
  pdfData.endX *= ratio
  pdfData.endY *= ratio

  // run python
  const pythonProcess = spawn('python3', ['../parser/test.py'])
  pythonProcess.stdout.on('data', data => console.log(data.toString()))
  // run a lot of python
  const pyImgCapture = spawn('python3', ['../parser/capture_pic.py', 
    pdfData.name, pdfData.pageNum, pdfData.startX, pdfData.startY, pdfData.endX, pdfData.endY])
  pyImgCapture.stdout.on('data', data => {
    res.sendFile(path.resolve(`../pictures/${pdfData.name}.png`))
  })
  pyImgCapture.stderr.on('data', data => {
    console.log(data.toString())
  })
})

// Listen on port
const port = process.env.PORT || 3000;
const server = app.listen(port);
console.log(`Server listening on port ${port}`);

// // python process
// const pythonProcess = spawn('python3', ['../parser/test.py'])
// pythonProcess.stdout.on('data', data => {
//   console.log(data.toString())
// })
