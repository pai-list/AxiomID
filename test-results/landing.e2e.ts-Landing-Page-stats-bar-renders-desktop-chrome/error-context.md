# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: landing.e2e.ts >> Landing Page >> stats bar renders
- Location: e2e/landing.e2e.ts:33:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/", waiting until "load"

```

```
Tearing down "context" exceeded the test timeout of 30000ms.
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to content" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - main [ref=e3]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - link "AXIOMID" [ref=e7] [cursor=pointer]:
          - /url: /
          - generic [ref=e8]:
            - img [ref=e11]
            - generic [ref=e15]: AXIOMID
        - generic [ref=e17]:
          - img [ref=e18]:
            - generic [ref=e20]: π
          - generic [ref=e21]: PI NETWORK
      - navigation "Main navigation" [ref=e22]:
        - button "Toggle language" [ref=e23] [cursor=pointer]:
          - img [ref=e24]
          - generic [ref=e27]: العربية
        - button "Switch to light mode" [ref=e28] [cursor=pointer]:
          - img [ref=e29]
    - generic [ref=e36]:
      - generic [ref=e37]:
        - generic [ref=e40]: Live on Pi Network Testnet
        - generic [ref=e41]:
          - heading "Create your AI Identity" [level=1] [ref=e42]:
            - generic [ref=e43]: Create your
            - generic [ref=e44]: AI Identity
          - paragraph [ref=e45]: Establish a cryptographically verified identity for your autonomous agents. One click to deploy a sovereign W3C DID, Passport, and live endpoint.
        - generic [ref=e46]:
          - link "Create My AI Agent" [ref=e47] [cursor=pointer]:
            - /url: /claim
            - generic [ref=e48]:
              - text: Create My AI Agent
              - img [ref=e49]
          - link "Explore the Protocol" [ref=e51] [cursor=pointer]:
            - /url: /docs
            - img [ref=e52]
            - text: Explore the Protocol
        - generic [ref=e54]:
          - generic [ref=e57]: W3C DID
          - generic [ref=e61]: Zero Permissions
      - generic "Claim flow demo" [ref=e64]:
        - generic [ref=e65]:
          - generic [ref=e66]:
            - img [ref=e68]
            - paragraph [ref=e71]: Connect Wallet
            - img [ref=e73]
          - generic [ref=e75]:
            - img [ref=e77]
            - paragraph [ref=e79]: Generating Sovereign Passport...
          - generic [ref=e80]:
            - generic [ref=e81]:
              - generic [ref=e82]:
                - generic [ref=e84]: A
                - generic [ref=e85]:
                  - paragraph [ref=e86]: Pioneer.Axiom
                  - paragraph [ref=e87]: did:axiom:0x1234...a77x
              - generic [ref=e88]: KYA ✓
            - generic [ref=e89]:
              - generic [ref=e90]:
                - generic [ref=e91]: XP
                - text: 1,250
              - generic [ref=e92]:
                - generic [ref=e93]: TIER
                - text: SOVEREIGN
          - generic [ref=e95]:
            - generic [ref=e96]:
              - img [ref=e97]
              - generic [ref=e99]: Trust Score
            - generic [ref=e100]: 94/100
    - generic [ref=e104]:
      - generic [ref=e105]:
        - generic [ref=e106]:
          - img [ref=e107]
          - generic [ref=e112]: Pioneers Joined
        - generic [ref=e113]:
          - img [ref=e114]
          - paragraph [ref=e117]: Be the first to join
      - generic [ref=e118]:
        - generic [ref=e119]:
          - img [ref=e120]
          - generic [ref=e123]: Agents Deployed
        - generic [ref=e124]:
          - img [ref=e125]
          - paragraph [ref=e128]: Create your agent
      - generic [ref=e129]:
        - generic [ref=e130]:
          - img [ref=e131]
          - generic [ref=e133]: 100% On-chain
        - paragraph [ref=e134]: 100%
    - generic [ref=e136]:
      - generic [ref=e137]:
        - button "Protocol Roadmap" [ref=e138]:
          - img [ref=e139]
          - text: Protocol Roadmap
        - button "Identity Core" [ref=e142]:
          - img [ref=e143]
          - text: Identity Core
        - button "Identity Capsule" [ref=e151]:
          - img [ref=e152]
          - text: Identity Capsule
      - generic [ref=e156]:
        - generic [ref=e157]:
          - heading "Evolution of the Protocol" [level=3] [ref=e158]
          - paragraph [ref=e159]: From MVP to a Global Autonomous Identity Network.
        - generic [ref=e160]:
          - generic [ref=e162]:
            - generic [ref=e163]: Q3
            - heading "Identity-First AI" [level=4] [ref=e164]
            - list [ref=e165]:
              - listitem [ref=e166]:
                - generic [ref=e167]: ✓
                - text: Single-click Agent Creation
              - listitem [ref=e168]:
                - generic [ref=e169]: ✓
                - text: Sovereign Subdomains
              - listitem [ref=e170]:
                - generic [ref=e171]: ✓
                - text: DDD Orchestration Engine
          - generic [ref=e172]:
            - generic [ref=e173]: Q4
            - heading "Portable Trust" [level=4] [ref=e174]
            - list [ref=e175]:
              - listitem [ref=e176]:
                - generic [ref=e177]: ✓
                - text: Identity Capsule Export
              - listitem [ref=e178]:
                - generic [ref=e179]: ✓
                - text: Federated Trust Graphs
              - listitem [ref=e180]:
                - generic [ref=e181]: ✓
                - text: Cross-chain DID Anchoring
          - generic [ref=e182]:
            - generic [ref=e183]: Q1
            - heading "Autonomous Network" [level=4] [ref=e184]
            - list [ref=e185]:
              - listitem [ref=e186]:
                - generic [ref=e187]: ✓
                - text: Cloudflare Workflows Gen
              - listitem [ref=e188]:
                - generic [ref=e189]: ✓
                - text: Multi-Agent Delegation
              - listitem [ref=e190]:
                - generic [ref=e191]: ✓
                - text: Staking & Slashing Core
    - generic [ref=e192]:
      - generic [ref=e193]:
        - text: How It Works
        - heading "Three Steps to Agent Identity" [level=2] [ref=e194]
      - generic [ref=e195]:
        - generic [ref=e197]:
          - generic [ref=e198]: "01"
          - img [ref=e200]
          - heading "Connect" [level=3] [ref=e210]
          - paragraph [ref=e211]: Link your Pi wallet or any Stellar address. Your identity starts here.
          - generic [ref=e214]: W3C DID Standard
        - generic [ref=e215]:
          - generic [ref=e216]: "02"
          - img [ref=e218]
          - heading "Verify" [level=3] [ref=e221]
          - paragraph [ref=e222]: Complete KYA + KYC. Build trust through social actions and on-chain activity.
          - generic [ref=e225]: ZKP Privacy Ready
        - generic [ref=e226]:
          - generic [ref=e227]: "03"
          - img [ref=e229]
          - heading "Deploy" [level=3] [ref=e232]
          - paragraph [ref=e233]: Your Agent Passport is ready. Use it across the Pi ecosystem with Pi token payments only.
          - generic [ref=e236]: Pi Network Compatible
    - generic [ref=e237]:
      - generic [ref=e238]:
        - text: Identity Tier
        - heading "Level Up Your Identity" [level=2] [ref=e239]
      - list [ref=e240]:
        - listitem [ref=e241] [cursor=pointer]:
          - button "Visitor tier — 0 XP — Connect your wallet to begin" [ref=e242]:
            - generic [ref=e244]: V
            - heading "Visitor" [level=3] [ref=e245]
            - generic [ref=e246]: 0 XP
            - paragraph [ref=e247]: Connect your wallet to begin
            - img [ref=e249]
        - listitem [ref=e251] [cursor=pointer]:
          - button "Citizen tier — 100 XP — Social verification + actions" [ref=e252]:
            - generic [ref=e254]: C
            - heading "Citizen" [level=3] [ref=e255]
            - generic [ref=e256]: 100 XP
            - paragraph [ref=e257]: Social verification + actions
            - img [ref=e259]
        - listitem [ref=e261] [cursor=pointer]:
          - button "Validator tier — 500 XP — KYC verified identity" [ref=e262]:
            - generic [ref=e264]: V
            - heading "Validator" [level=3] [ref=e265]
            - generic [ref=e266]: 500 XP
            - paragraph [ref=e267]: KYC verified identity
            - img [ref=e269]
        - listitem [ref=e271] [cursor=pointer]:
          - button "Sovereign tier — 1000 XP — Full protocol control" [ref=e272]:
            - generic [ref=e274]: S
            - heading "Sovereign" [level=3] [ref=e275]
            - generic [ref=e276]: 1000 XP
            - paragraph [ref=e277]: Full protocol control
            - img [ref=e279]
    - generic [ref=e281]:
      - generic [ref=e282]:
        - generic [ref=e283]: © 2026 AxiomID. All rights reserved.
        - generic [ref=e284]: L0 Authority • Axiom Protocol
      - navigation "Footer navigation" [ref=e285]:
        - link "Privacy Policy" [ref=e286] [cursor=pointer]:
          - /url: /privacy
          - text: Privacy Policy
        - link "Terms of Service" [ref=e287] [cursor=pointer]:
          - /url: /terms
          - text: Terms of Service
        - generic [ref=e290]: v0.1.2
  - region "Notifications alt+T"
```