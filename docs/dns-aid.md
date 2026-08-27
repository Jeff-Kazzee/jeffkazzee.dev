# DNS for AI Discovery

DNS-AID lets an agent find this domain's machine interfaces before it fetches a
single page, by asking DNS instead of guessing a well-known path. It is the one
part of the agent surface that lives outside this repository, because it lives
in the zone file.

Everything else on the agent surface deploys with the site. Publish these records
once, by hand or with the script.

## Where the zone lives

`jeffkazzee.dev` uses Porkbun's nameservers:

```
curitiba.ns.porkbun.com
fortaleza.ns.porkbun.com
maceio.ns.porkbun.com
salvador.ns.porkbun.com
```

Porkbun supports `SVCB` and `HTTPS` record types through the dashboard and the
API, so this needs no nameserver migration.

## The records

Three service-mode SVCB records under the `_agents` namespace, per
[draft-mozleywilliams-dnsop-dnsaid](https://datatracker.ietf.org/doc/draft-mozleywilliams-dnsop-dnsaid/)
and [RFC 9460](https://www.rfc-editor.org/rfc/rfc9460):

```
_index._agents.jeffkazzee.dev.  600 IN SVCB 1 jeffkazzee.dev. alpn="h2" port=443
_mcp._agents.jeffkazzee.dev.    600 IN SVCB 1 jeffkazzee.dev. alpn="h2" port=443
_a2a._agents.jeffkazzee.dev.    600 IN SVCB 1 jeffkazzee.dev. alpn="a2a" port=443
```

`_index` is the top-level entrypoint that points an agent at the origin serving
the discovery documents. `_mcp` and `_a2a` name the two endpoints.

The A2A record carries `alpn="a2a"` because that is the shape the draft's own
example uses for an A2A entrypoint. The other two are ordinary HTTPS over h2.

### Publishing them

```bash
PORKBUN_API_KEY=... PORKBUN_SECRET_API_KEY=... node scripts/publish-dns-aid.mjs
```

That is a dry run. Add `--apply` to write. Re-running is safe: the script leaves
a correct record alone and edits a stale one rather than duplicating it.

Create the keys at <https://porkbun.com/account/api>, and switch on **API
access** for the domain in the domain's settings. Without that per-domain
toggle the API returns a permission error even with valid keys.

Do not paste the keys into a chat window or a terminal transcript. Set them in
the shell for the one command that needs them.

### If Porkbun rejects a record

The dashboard's SVCB field is stricter than the API in places. If Porkbun
refuses a record, drop the parameters one at a time, starting with `port`. A bare
`1 jeffkazzee.dev. alpn="h2"` still satisfies the entrypoint check.

## DNSSEC

The draft asks you to sign the discovery zone, so validating resolvers return
authenticated data rather than whatever a middlebox hands back.

Porkbun offers one-click DNSSEC for domains using their nameservers, under the
domain's DNSSEC settings. Turn it on after the records resolve, not before.
That keeps a signing problem and a record problem apart.

Check that it took:

```bash
curl -s -H 'Accept: application/dns-json' \
  'https://cloudflare-dns.com/dns-query?name=_index._agents.jeffkazzee.dev&type=SVCB&do=1'
```

`"AD": true` in the response means the answer validated. `"Status": 0` with
answers and `"AD": false` means the records are live but the zone is unsigned.

## What is not published, and why

The draft also describes a `TXT` index record at `_index._agents`. This site
skips it, because the draft does not pin down that record's content format well
enough to write one without inventing a syntax. A scanner that falls back to
`TXT` finds nothing, and the SVCB records answer the same question.

That is the general rule for this site's agent surface: publish what the
specification defines, and say so plainly where it does not.

## Verifying

```bash
for name in _index _mcp _a2a; do
  curl -s -H 'Accept: application/dns-json' \
    "https://cloudflare-dns.com/dns-query?name=${name}._agents.jeffkazzee.dev&type=SVCB&do=1"
  echo
done
```

A full check of the rest of the surface runs from the repository:

```bash
npm run build && npm run verify
```
