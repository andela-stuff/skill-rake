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

  const files = getFilesChangedFromPR(response);

  if (typeof skills === 'string') {
    // TODO: get a configuration (which has a list of skills)
    // and convert 'skills' to array
  }

  skills.forEach(s => {
    let skill;
    if (typeof s === 'string') {
      // TODO: get skill from database with given name
    } else {
      skill = s;
    }

    const { patterns } = skill;
    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];

      // get files to consider
      let filteredFiles = files;
      if (typeof pattern === 'object' && pattern.file) {
        const regex = new RegExp(pattern.file, 'm');
        filteredFiles = files.filter(f => regex.test(f.path));
      }

      if (filteredFiles.length > 0) {
        // get content to consider
        if ((typeof pattern === 'object' && pattern.content) || typeof pattern === 'string') {
          const regex = new RegExp(pattern.content || pattern, 'm');
          let breakOuterLoop = false;
          for (let j = 0; j < filteredFiles.length; j++) {
            const { content } = filteredFiles[j];
            if (regex.test(content)) {
              hits.push({
                name: skill.name,
                hits: [{
                  file: filteredFiles[j].path,
                  content: regex.exec(content)[0]
                }]
              });
              breakOuterLoop = true;
              break;
            }
          }
          if (breakOuterLoop) {
            break;
          }
        } else {
          hits.push({
            name: skill.name,
            hits: [{
              file: filteredFiles[0].path
            }]
          });
          break;
        }
      }
    }
  });
  // res.header('Content-Type', 'text/plain; charset=utf-8').status(200).send(added);
  res.status(200).send({ skills: hits });
});

let server = app.listen(process.env.PORT || 3000, () => {
  let port = server.address().port;
  console.log(`Server started on port ${port}`)
})

function getAddedContentFromPR(text) {
  const regex = /(?<=(^\+))[^\+\n](.+)?$/gm;
  let match, matches = [];
  while ((match = regex.exec(text)) !== null) {
    matches.push(match[0]);
  }
  return matches;
}

function getFilesChangedFromPR(text) {
  const files = [];
  const regex = /^diff --git /gm;
  const fileSections = text.split(regex).filter(fs => fs.trim().length !== 0);
  fileSections.forEach(fs => {
    files.push({
      path: getFilePathsChangedFromPR(fs)[0],
      content: getAddedContentFromPR(fs).join('\r\n')
    });
  });
  return files;
}

function getFilePathsChangedFromPR(text) {
  const regex = /(?<=(^\+\+\+\sb\/)).+$/gm;
  let match, matches = [];
  while ((match = regex.exec(text)) !== null) {
    matches.push(match[0]);
  }
  return matches;
}
