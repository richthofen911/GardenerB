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
      const currentTimeStamp = Date()
      const addUserQuery = `INSERT INTO users values (
        ${Date.now()}, '${req.body.username}', '${req.body.password}', '${req.body.email}',
        TIMESTAMP '${currentTimeStamp}', TIMESTAMP '${currentTimeStamp}');`
      await client.query(addUserQuery)
      client.release();
      res.json({
        status_code:200,
        status_msg: 'success'
      })
    } catch(err) {
      res.json({
        status_code:501,
        status_msg: 'error'
      })
    }
  })
  .post('/login', async(req, res) => {
    try {
      const name = req.body.name
      const passwd = req.body.passwd
      const queryStr = `SELECT * FROM users WHERE id='${req.body.id}' AND passwd='${req.body.passwd}'`
    } catch(err) {
      res.json({
        status_code:501,
        status_msg:'error'
      })
    }
  })
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
