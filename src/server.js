import 'babel-polyfill' // eslint-disable-line
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';

import request from 'request-promise-native';

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

app.post('/v1/query', async (req, res) => {
  const {source, skills} = req.body;
  const hits = [];
  let response = await request({
    url: `${source}.diff`,
    method: 'GET'
  });
  let changes = getAddedContentFromPR(response);
  if (typeof skills === 'string') {
    // TODO: get a configuration (which has a list of skills)
  } else {
    skills.forEach(s => {
      let skill;
      if (typeof s === 'string') {
        // TODO: get skill from database with given name
      } else {
        skill = s;
      }

      const regexes = skill.regexes;
      for (let i = 0; i < regexes.length; i++) {
        const regex = new RegExp(regexes[i], 'm'); // no g flag here; 1 match is enough
        if (regex.test(changes)) {
          hits.push({
            name: skill.name,
            hits: [{ text: regex.exec(changes)[0] }]
          });
          break;
        }
      }
    });
  }
  // res.header('Content-Type', 'text/plain; charset=utf-8').status(200).send(added);
  res.status(200).send({ skills: hits });
});

let server = app.listen(process.env.PORT || 3000, () => {
  let port = server.address().port;
  console.log(`Server started on port ${port}`)
})

function getAddedContentFromPR(text) {
  const regex = /^[\+](?!\+).+$/gm;
  let match, matches = [];
  while ((match = regex.exec(text)) !== null) {
    matches.push(match[0]);
  }
  return matches.join('\r\n');
}
