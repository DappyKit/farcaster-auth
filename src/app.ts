import express, { Application } from 'express'
import cors from 'cors'
import v1Api from './controllers/v1'
import { errorHandler } from './middleware/errorHandler'
import path from 'path'

const app: Application = express()

// Middlewares
app.use(express.json())
app.use(cors())

// Routes
app.use('/v1', v1Api)
app.use('/static', express.static(path.join('static')))

// Error handler should be the last middleware
app.use(errorHandler)

export default app
