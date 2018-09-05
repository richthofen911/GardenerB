const express = require('express')
const multer = require('multer')
const path = require('path')
const crypto = require('crypto')
const PORT = process.env.PORT || 5000
const { Pool } = require('pg')
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
})

express()
  .use(express.static(path.join(__dirname, 'public')))
  .use(multer().array())  // to parse form-data
  .use(express.urlencoded({ extended: false })) // to parse form-url-encoded
  .use(express.json())  // to parse application/json
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .post('/signup', async(req, res) => {
    try {
      //res.json({requestBody: req.body, requestHeader: req.headers})
      const client = await pool.connect()
      const currentTimeStamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
      const QUERY_ADD_USER = `INSERT INTO users values (
        ${Date.now()}, '${req.body.username}', '${req.body.password}', '${req.body.email}',
        TIMESTAMP '${currentTimeStamp}', TIMESTAMP '${currentTimeStamp}'
      );`
      await client.query(QUERY_ADD_USER)
      client.release();

      res.json({
        status_code:200,
        status_msg: 'success'
      })
    } catch(err) {
      client.release()
      res.json({
        status_code:501,
        status_msg: err
      })
    }
  })
  .post('/login', async(req, res) => {
    try {
      const client = await pool.connect()
      const QUERY_CHECK_USER = `SELECT * FROM users WHERE email='${req.body.email}' AND password='${req.body.password}'`
      const result = await client.query(QUERY_CHECK_USER)
      if (result.rowCount == 1) {
        const userId = result.rows[0].user_id
        const currentTimeStamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
        
        const QUERY_UPDATE_LAST_LOGIN = 
          `UPDATE users SET last_login = TIMESTAMP '${currentTimeStamp}' WHERE user_id = '${userId}';`
        await client.query(QUERY_UPDATE_LAST_LOGIN)

        const newToken = crypto.createHash('md5').update(currentTimeStamp + userId).digest("hex")

        const QUERY_CREATE_TOKEN = 
          `INSERT INTO session values (
            '${newToken}', '${userId}', TIMESTAMP '${currentTimeStamp}'
          );`
        
        //res.send(QUERY_CREATE_TOKEN)
        
        await client.query(QUERY_CREATE_TOKEN)  

        client.release();

        res.json({
          status_code:200,
          status_msg: 'success',
          user_id: userId,
          token: newToken
        })
        
      } else {
        client.release()
        res.json({
          status_code:201,
          status_msg:'user not found'
        })
      }
    } catch(err) {
      client.release()
      res.json({
        status_code:501,
        status_msg:'error'
      })
    }
  })
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
