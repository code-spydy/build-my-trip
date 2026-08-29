// Reads PORT from env and starts the HTTP server.
import 'dotenv/config'
import app from './app.js'
import { port } from './config/env.js'

app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
