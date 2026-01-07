import express from 'express';

const app = express();

const port = process.env.PORT || 3000;

app.get('/', (request, response) => {
  response.status(200).send('Hello from acquisitions!');
});

export default app;
