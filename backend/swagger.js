const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: { title: 'Hansei API', description: 'API Documentation' },
  host: 'localhost:3000'
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./app.js'];

swaggerAutogen(outputFile, endpointsFiles, doc);