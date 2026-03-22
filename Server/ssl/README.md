# SSL Certificates

This directory expects self-signed keys for local HTTPS development. If you deploy using an NGINX reverse proxy for production, configure NGINX to handle the certificates and redirect the proxy to Node's internal port. 

## Generating Development Keys
Use `openssl` to generate new keys locally:

```bash
openssl req -nodes -new -x509 -keyout key.pem -out cert.pem -days 365
```

Alternatively, try `mkcert` for a trusted local CA and certificates.
