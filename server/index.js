import 'dotenv/config'
import { app } from './app.js'

const port = Number(process.env.PORT ?? process.env.API_PORT ?? 3001)

app.listen(port, () => {
  console.log(`TOEIC vocabulary API listening on http://localhost:${port}`)
})