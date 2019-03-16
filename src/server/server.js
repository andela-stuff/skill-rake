import 'babel-polyfill' // eslint-disable-line
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const app = new express();
app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.get('/', async (req, res) => {
  res.status(200).send("Hello World!<br /><br />Welcome to Skill Rake.");
});

let server = app.listen(process.env.PORT || 3000, () => {
  let port = server.address().port;
  console.log(`Server started on port ${port}`)
})
