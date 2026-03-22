# YourTodo Secure Backend System

YourTodo is not just another API; it is a hardened, headless microservice designed for zero-trust environments. While most "Todo" apps focus on UI, this project focuses on the Fortress—implementing SSL termination, double-csrf protection, and strict rate-limiting to prove that "Simple" doesn't have to mean "Vulnerable."

## Security Architecture Highlights

### 1. Robust CSRF Mitigation (Double Submit Cookie)
- Migrated from vulnerable, stateful, in-memory architectures to a highly-scalable stateless **Double Submit Cookie** pattern (`csrf-csrf`).
- Uses `httpOnly`, `secure`, and `SameSite=None` attributes correctly to prevent Token Exfiltration.

### 2. Rate Limiting & Auth Controls
- Segregated rate limiters (`express-rate-limit`) for distinct application zones:
  - **Authentication Endpoints:** Strict throttling to block Brute-Force and Credential Stuffing.
  - **Private API Endpoints:** Standardized limiting to mitigate DDoS vectors.

### 3. Header Security & Content Integrity
- Handled comprehensively by **Helmet.js**, deploying strict `Content-Security-Policy` (CSP) directives:
  - Disallows `object-src`, `frame-src`, and forces local-origin isolation.
- `Cross-Origin-Opener-Policy` and `Cross-Origin-Resource-Policy` specifically patched for secure embedding.

### 4. Zero-Trust Debugging & DevOps
- No debugging routes, all the debugging routes were developpement only and were delete shortly after.
- Docker/nginx implementation

## DevOps & Deployment Infrastructure

This backend uses reverse-proxy pattern out of the box using **Docker** and **Nginx**.

- **Node.js (Backend):** Isolated on internal port via Docker.
- **Nginx (Reverse Proxy):** Handles **SSL Termination**, automatically upgrades HTTP to HTTPS, and forwards pristine traffic natively to Node. This splits the cryptographic workload away from the single-threaded Node event loop, establishing standard scalability patterns.

See the included `docker-compose.yml` and `nginx.conf` for exact proxy topology setup.


## Prerequisites & Environment Setup

Before you can fire up the project, ensure your development environment is prepared.

### Install Node.js (v22+ recommended):
#### On Arch Linux
sudo pacman -S nodejs npm

### Install Dependencies:
npm install   # For development (installs devDeps like nodemon)
npm ci        # For a clean, locked-version install

### Database
This project uses MongoDB as its primary data store. In this architecture, the database is fully containerized and isolated.

    Automated Setup: When running via docker-compose, a MongoDB instance is automatically provisioned.

    Data Persistence: A Docker volume (mongodb_data) is mapped to ensure your tasks and user profiles survive container restarts or removals.

    Security: The database is not exposed to the host machine. It communicates with the Node.js backend exclusively through an internal Docker network, making it invisible to external network scans.

### Docker & Infrastructure
#### To run the full "Reverse Proxy + API" stack, you must have Docker and Docker Compose installed.
#### install Docker (arch linux):
sudo pacman -S docker docker-compose
sudo systemctl enable --now docker
sudo usermod -aG docker $USER  # Logout and back in after this!

### 3. Cryptographic Assets (SSL)
you can check README.md in the Server/ssl folder for informations about the caertificats


## How to Interact with the API
Since this is a Headless API, you should use Postman, Insomnia, or cURL to interact with the endpoints.
  ### Initialize the Session:
    GET https://localhost/csrf-token -> Capture the token from the response JSON.
  ## Authenticate: 
      POST https://localhost/authentication/log-in
      Headers: x-csrf-token: <your-captured-token>
      Body: { "email": "...", "password": "..." }
  ## Access Protected Resources:
      Capture the JWT from the login response.
      Include it in all future requests: Authorization: Bearer <your-jwt-token>.


## One-Command Launch
Once your .env is populated and your SSL certs are generated:
docker-compose up --build -d

ENJOY!
