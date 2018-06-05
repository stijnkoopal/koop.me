/* eslint-disable no-console */
const express = require('express');
const next = require('next');
const proxyMiddleware = require('http-proxy-middleware')

const devProxy = {
  '/.netlify/functions': {
    target: 'http://localhost:9000',
    pathRewrite: { '^/.netlify/functions/': '/' },
    changeOrigin: true,
  },
}

const port = parseInt(process.env.PORT, 10) || 3000
const env = process.env.NODE_ENV
const dev = env !== 'production'
const app = next({
  dir: '.', // base directory where everything is, could move to src later
  dev,
})

const handle = app.getRequestHandler()

app
  .prepare()
  .then(() => {
    const server = express()

    // Set up the proxy.
    if (dev && devProxy) {
      Object.keys(devProxy).forEach((context) => {
        server.use(proxyMiddleware(context, devProxy[context]))
      })
    }

    // Default catch-all handler to allow Next.js to handle all other routes
    server.all('*', (req, res) => {
      if (req.path === '/static/workbox/sw.js') res.setHeader('Service-Worker-Allowed', '/')
      handle(req, res)
    })

    server.listen(port, (err) => {
      if (err) {
        throw err
      }
      console.log(`> Ready on port ${port} [${env}]`)
    })
  })
  .catch((err) => {
    console.log('An error occurred, unable to start the server')
    console.log(err)
  })
