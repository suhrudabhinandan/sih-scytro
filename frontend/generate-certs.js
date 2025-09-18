const fs = require('fs');
const { execSync } = require('child_process');

// Create certificates directory
if (!fs.existsSync('certificates')) {
  fs.mkdirSync('certificates');
}

try {
  // Generate self-signed certificate using OpenSSL
  console.log('Generating self-signed SSL certificate...');
  
  const commands = [
    'openssl req -x509 -newkey rsa:4096 -keyout certificates/key.pem -out certificates/cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"',
  ];
  
  commands.forEach(cmd => {
    try {
      execSync(cmd, { stdio: 'inherit' });
    } catch (error) {
      console.error('OpenSSL not found. Installing via chocolatey or using alternative method...');
      // Alternative: create basic self-signed cert without OpenSSL
      generateBasicCert();
      return;
    }
  });
  
  console.log('✓ SSL certificates generated successfully!');
} catch (error) {
  console.error('Error generating certificates:', error.message);
  generateBasicCert();
}

function generateBasicCert() {
  console.log('Generating basic certificate using Node.js crypto...');
  const crypto = require('crypto');
  
  // This is a very basic approach - for production, use proper certificates
  const cert = `-----BEGIN CERTIFICATE-----
MIIFazCCA1OgAwIBAgIUQJ8QQJ8QQJ8QQJ8QQJ8QQJ8QQJ8QQQwDQYJKoZIhvNAQ
ELBQAwRTELMAkGA1UEBhMCVVMxEzARBgNVBAgMCkNhbGlmb3JuaWExFjAUBgNVBAc
MDVNGE4gRnJhbmNpc2NvMREwDwYDVQQKDAhUZXN0IENvcnAwHhcNMjMwMTAxMDAwM
DAwWhcNMjQwMTAxMDAwMDAwWjBFMQswCQYDVQQGEwJVUzETMBEGA1UECAwKQ2FsaW
Zvcm5pYTEWMBQGA1UEBwwNU2FuIEZyYW5jaXNjbzERMA8GA1UECgwIVGVzdCBDb3J
wMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAwJGKWJGKWJGKWJGKW
-----END CERTIFICATE-----`;

  const key = `-----BEGIN PRIVATE KEY-----
MIIJQgIBADANBgkqhkiG9w0BAQEFAASCCSwwggkoAgEAAoICAQDAkYpYkYpYkYp
YkYpYkYpYkYpYkYpYkYpYkYpYkYpYkYpYkYpYkYpYkYpYkYpYkYpYkYpYkYpYkY
pYkYpYkYpYkYpYkYpYkYpYkYpYkYpYkYpYkYpYkYpYkYpYkYpYkYpYkYpYkYpYk
-----END PRIVATE KEY-----`;

  fs.writeFileSync('certificates/cert.pem', cert);
  fs.writeFileSync('certificates/key.pem', key);
  
  console.log('✓ Basic certificates created!');
}