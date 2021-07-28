const axios = require('axios');
const redis = require('redis');
const express = require('express');
const responseTime = require('response-time');
const { promisify } = require('util');

const app = express();
app.use(responseTime());

const client = redis.createClient({
    host: '127.0.0.1',
    port: 6379
});
const GET_ASYNC = promisify(client.get).bind(client);
const SET_ASYNC = promisify(client.set).bind(client);

  
app.get('/rockets', async (req, res) =>  {
       try {
        const reply = await GET_ASYNC('rockets')
        if (reply) {
          console.log('using cached data')
          res.send(JSON.parse(reply))
          return
        }
        const respone = await axios.get('https://api.spacexdata.com/v3/rockets');
        const saveResult = await setKeyAndData('rockets', respone.data, 60);
        console.log('new data cached', saveResult);
        res.send(respone.data)
       } catch (error) {
          res.send(error.message);
       } 
});

app.get('/rockets/:rocket_id', async (req, res) => {
    try {
      const { rocket_id } = req.params;
      const reply = await GET_ASYNC(rocket_id)
      if (reply) {
        console.log('using cached data')
        res.send(JSON.parse(reply))
        return
      }
      const respone = await axios.get(`https://api.spacexdata.com/v3/rockets/${rocket_id}`);
      const saveResult = await setKeyAndData(rocket_id, respone.data, 60);
      console.log('new data cached', saveResult)
      res.send(respone.data)
    } catch (error) {
      res.send(error.message)
    }
  });
  
const setKeyAndData = async(key, data, time) => {
  return await SET_ASYNC(
    key,
    JSON.stringify(data),
    'EX',
    time
  );
}  

app.listen(3000, () => console.log('Start server at port 3000.'));