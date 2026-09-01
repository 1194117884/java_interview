import { createApp } from './app.mjs'

const port = Number(process.env.PORT || 8788)
const app = createApp()

app.listen(port, () => {
    console.log(`Java interview API listening on http://127.0.0.1:${port}`)
})
