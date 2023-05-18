import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import dotenv from "dotenv"
import helmet from 'helmet'
import { testCreateTable, testTable, testDropTable } from './db.js'
import { swaggerSpec, swaggerUIOptions } from './swagger-config/swagger.js'
import { createDatabase } from './models/schema.js'
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 8004

app.set("title", "Microsocial Content API");
app.use(bodyParser.json({ limit: "50mb", extended: true}))
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true}))
app.use(cors())
app.use(cookieParser())
app.use(helmet())
app.use('/docs', 
    swaggerUi.serve, 
    swaggerUi.setup(swaggerSpec, swaggerUIOptions)
)

// Default route
app.get('/', (req, res) => {
    res.send("Hello")
})

// Get service routes from routes
fs.readdir('./routes', (err, files) => {
    files.forEach(async (file) => {
        if (file.match(/[.]js$/)) {
            const endpoint = path.basename(file, '.js')
            const {default: route} = await import(`./routes/${file}`)
            if(route)
                app.use(`/notification/${endpoint}`, route)
        }
    })
})

// Test db to see if INSERT, CREATE, AND GET work
testCreateTable()
testTable()
testDropTable()

// initialize Database
createDatabase()

// have port listen for client 
app.listen(PORT, () => {
    console.log(`server started on ${PORT}`)
})

export default app