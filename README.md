# DDoS simulation & mitigation demo

A small, self-contained project for demonstrating how a DDoS-style traffic
flood affects a web server, and how common mitigation techniques reduce the
impact. Built for training / internship demo purposes.

**Scope note:** the traffic generator in `attacker/simulate.js` only targets
`localhost` — it refuses to run against any other host. This project is meant
to show the mechanics of attack vs. defense against a server you control, not
to be pointed at third-party infrastructure.

## What's included

- `server/server.js` — the "target" web app (Express). Simulates a small
  amount of CPU work per request so load is visible.
- `server/mitigations.js` — three mitigation layers you can toggle on:
  1. **Rate limiting** — caps requests per IP per second (HTTP 429)
  2. **WAF-style filter** — blocks requests with suspicious headers/paths (HTTP 403)
  3. **Connection cap** — limits concurrent in-flight requests (HTTP 503)
- `attacker/simulate.js` — generates two traffic streams against the target:
  - "legit" traffic (looks like a normal client)
  - "attack" traffic (high-volume flood with a flagged User-Agent)
- `docs/report-template.md` — a template for writing up results.

## Setup

```bash
git clone <your-repo-url>
cd ddos-sim-mitigation
npm install
```

Requires Node.js 18+.

## Usage

### 1. Baseline — no mitigations

Terminal 1:
```bash
npm start
```

Terminal 2:
```bash
npm run simulate:mixed
```

Watch terminal 1's logs and hit `http://localhost:3000/stats` in a browser
during/after the run. Without mitigations, the attack traffic should
dominate and legit requests will slow down or start failing.

### 2. Protected — mitigations enabled

Terminal 1:
```bash
npm run start:protected
```

Terminal 2:
```bash
npm run simulate:mixed
```

Compare `/stats` output to the baseline run — you should see a much higher
`blockRate` and better-preserved throughput for legit-looking traffic.

### 3. Other traffic modes

```bash
npm run simulate:legit    # only normal traffic, useful as a control
npm run simulate:attack   # only flood traffic
```

You can also pass flags directly:
```bash
node attacker/simulate.js --mode mixed --duration 30
```

## Process for write-up (suggested)

1. Run the baseline (no mitigations) and record `/stats` output.
2. Run the protected version and record `/stats` output.
3. Toggle each mitigation individually (comment out lines in `server.js`'s
   `if (MITIGATIONS_ON) {...}` block) and note which one contributes most.
4. Fill in `docs/report-template.md` with your findings and screenshots/logs.
5. Note limitations (see below) and how a production setup would differ.

## Limitations / what this doesn't cover

This is a simplified teaching model, not production security tooling:

- Real DDoS mitigation usually happens at the network edge (CDN, scrubbing
  centers, upstream ISP/cloud provider) before traffic ever reaches your
  application — this demo mitigates at the application layer only.
- The "WAF" here is a toy string-matching filter, not a real WAF engine.
- Real attacks include volumetric (bandwidth-saturating), protocol
  (e.g. SYN floods), and application-layer attacks — this demo only models
  application-layer HTTP flood traffic.
- For real infrastructure, look at: a CDN/WAF provider (Cloudflare, AWS
  Shield/WAF, Akamai), rate limiting at the load balancer, autoscaling, and
  an incident response runbook.

## License

MIT — for educational use.

Intern Id - CITS2932
