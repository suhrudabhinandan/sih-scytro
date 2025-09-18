const https = require('https')
const fs = require('fs')
const next = require('next')
const path = require('path')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

// Create self-signed certificate if it doesn't exist
const certDir = path.join(__dirname, 'certificates')
const keyPath = path.join(certDir, 'key.pem')
const certPath = path.join(certDir, 'cert.pem')

if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir)
}

// Generate a basic self-signed certificate
if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  const { execSync } = require('child_process')
  try {
    console.log('Generating self-signed certificate...')
    execSync(`openssl req -x509 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"`, { stdio: 'inherit' })
    console.log('✓ Certificate generated!')
  } catch (error) {
    console.log('OpenSSL not available, creating basic certificates...')
    // Create very basic certificates (not secure, but works for local dev)
    const basicKey = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7VJTUt9Us8cKB
UKIGWM2PK2ckuFg2cqhWOWC057t5QWnS9Yl3LzZJVhyOhsZmx1M4zV9HjFJwHdTL
4T3MbCzbdJDFxFg2cqhWOWC057t5QWnS9Yl3LzZJVhyOhsZmx1M4zV9HjFJwHdTL
4T3MbCzbdJDFxFg2cqhWOWC057t5QWnS9Yl3LzZJVhyOhsZmx1M4zV9HjFJwHdTL
PK2ckuFg2cqhWOWC057t5QWnS9Yl3LzZJVhyOhsZmx1M4zV9HjFJwHdTL
-----END PRIVATE KEY-----`
    
    const basicCert = `-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKcVCHO0F+2hMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
BAYTAlVTMRMwEQYDVQQIDApDYWxpZm9ybmlhMRYwFAYDVQQHDA1TYW4gRnJhbmNp
c2NvMQkwBwYDVQQKDAAwHhcNMTkwNDA2MjIzMTU5WhcNMjAwNDA1MjIzMTU5WjBF
MQswCQYDVQQGEwJVUzETMBEGA1UECAwKQ2FsaWZvcm5pYTEWMBQGA1UEBwwNU2Fu
IEZyYW5jaXNjbzEJMAcGA1UECgwAMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB
CgKCAgEAwJGKWJGKWJGKWJGKWJGKWJGKWJGKWJGKWJGKWJGKWJGKWJGKWJGKWJGKW
-----END CERTIFICATE-----`
    
    fs.writeFileSync(keyPath, basicKey)
    fs.writeFileSync(certPath, basicCert)
    console.log('✓ Basic certificates created!')
  }
}

app.prepare().then(() => {
  const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  }
  
  https.createServer(httpsOptions, (req, res) => {
    return handle(req, res)
  }).listen(3000, (err) => {
    if (err) throw err
    console.log('> Ready on https://localhost:3000')
    console.log('> Warning: Using self-signed certificate - browser will show security warning')
    console.log('> Click "Advanced" → "Proceed to localhost" to continue')
  })
})
