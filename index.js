const express = require('express')
const multer = require('multer')
const path = require('path')
const PORT = process.env.PORT || 5000
const { Pool } = require('pg')
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
})

express()
  .use(express.static(path.join(__dirname, 'public')))
  .use(multer().array()) // to parse form-data
  .use(express.urlencoded({ extended: false })) // to parse form-url-encoded
  .use(express.json()) // to parse application/json
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .post('/signup', async(req, res) => {
    try {
      //res.json({requestBody: req.body, requestHeader: req.headers})
      const id = req.body.id
      const name = req.body.name
      const passwd = req.body.passwd
    
      const client = await pool.connect()
      const queryStr = `INSERT INTO users values ('${id}', '${name}', '${passwd}')`
      await client.query(queryStr)
      client.release();
      res.json({
        status_code:200,
        status_msg: 'success'
      })
    } catch(err) {
      console.error(err)
      res.json({
        status_code:501,
        status_msg: 'error'
      })
    }
  })
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
