import app from './app'
import { loadConfig } from './config'

loadConfig()

// Start server
const PORT = process.env.PORT || 5000

async function start(): Promise<void> {
  // eslint-disable-next-line no-console
  app.listen(PORT, () => console.log(`Server started on port ${PORT}`))
}

start().then()
