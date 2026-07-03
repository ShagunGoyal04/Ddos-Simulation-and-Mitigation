# DDoS simulation & mitigation — results report

**Author:**
**Date:**

## 1. Objective

Briefly describe the goal of this exercise (e.g. demonstrate impact of
application-layer flood traffic and evaluate common mitigation techniques).

## 2. Setup

- Server: `server/server.js`
- Traffic generator: `attacker/simulate.js`
- Mode used:
- Duration:

## 3. Baseline results (no mitigations)

| Metric | Value |
|---|---|
| Total requests sent | |
| Successful (200) | |
| Failed/timed out | |
| Legit-traffic experience | (e.g. slow, timeouts, normal) |

Notes / observations:

## 4. Protected results (mitigations enabled)

| Metric | Value |
|---|---|
| Total requests sent | |
| Successful (200) | |
| Blocked (429/403/503) | |
| Block rate | |
| Legit-traffic experience | |

Notes / observations:

## 5. Per-mitigation breakdown

| Mitigation | Effect observed |
|---|---|
| Rate limiting | |
| WAF-style filter | |
| Connection cap | |

## 6. Conclusions

Summarize what worked, what didn't, and what you'd recommend for a real
production deployment (e.g. CDN/WAF provider, autoscaling, upstream
scrubbing).

## 7. Limitations of this exercise

Note that this is an application-layer simulation on localhost and does not
cover network/protocol-layer attacks, real-world scale, or edge mitigation.
