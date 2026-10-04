"""Run against local dev after applying migrations. Never target a hosted database."""
import urllib.request,urllib.error,json,subprocess,os,hashlib,uuid
base='http://127.0.0.1:5173'
ip='qa-'+uuid.uuid4().hex
node=os.environ.get('NODE_BIN','node')
def sql(query):
 p=subprocess.run([node,'--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','dist/server/wrangler.json','--persist-to','.wrangler/state','--command',query],capture_output=True,text=True)
 assert p.returncode==0,p.stderr
 return p.stdout
def req(path,body=None,cookie=None,origin=base):
 h={'Origin':origin,'cf-connecting-ip':ip};h.update({'Content-Type':'application/json'} if body is not None else {});h.update({'Cookie':cookie} if cookie else {})
 try:r=urllib.request.urlopen(urllib.request.Request(base+path,data=json.dumps(body).encode() if body is not None else None,headers=h))
 except urllib.error.HTTPError as e:r=e
 return r.status,r.read().decode(),r.headers
assert json.loads(req('/api/access')[1])['granted']==False
assert req('/api/access',{'email':'invalid'})[0]==400
s,b,h=req('/api/access',{'email':' FLOW@example.test ','consent':False,'source':'hero','attribution':{'utm_source':'qa'}})
assert s==200 and json.loads(b)['granted']==True
cookie=h['Set-Cookie'].split(';')[0];token=cookie.split('=')[1]
assert 'flow@example.test' not in cookie
assert json.loads(req('/api/access',cookie=cookie)[1])['granted']==True
assert req('/tools/china-import-profit-calculator/calculate',cookie=cookie)[0]==200
assert req('/api/access',{'email':'flow@example.test','consent':False,'source':'final'})[0]==200
out=sql("SELECT count(*) AS n,consent,attribution FROM leads WHERE email='flow@example.test'")
assert '"n": 1' in out and '"consent": 0' in out and 'qa' in out
assert req('/api/access',{'email':'x@example.test'},origin='https://untrusted.example')[0]==403
assert req('/api/access',{'email':'bot@example.test','website':'bot'})[0]==400
# Capture failure must never issue an access cookie; restore the local test schema immediately.
sql('ALTER TABLE leads RENAME TO leads_qa_backup')
try:
 s,b,h=req('/api/access',{'email':'failure@example.test'})
 assert s==500 and 'Set-Cookie' not in h and json.loads(b)['error']=="We couldn’t save your email. Please try again."
finally:sql('ALTER TABLE leads_qa_backup RENAME TO leads')
# Expiry blocks access; entering the email again restores it.
sql("UPDATE access SET expires_at=1 WHERE token_hash='"+hashlib.sha256(token.encode()).hexdigest()+"'")
assert json.loads(req('/api/access',cookie=cookie)[1])['granted']==False
s,b,h=req('/api/access',{'email':'flow@example.test','consent':False})
assert s==200 and 'Set-Cookie' in h
assert json.loads(req('/api/access',cookie=h['Set-Cookie'].split(';')[0])[1])['granted']==True
# A dedicated local request key reaches the rate limit.
ip='limit-'+uuid.uuid4().hex
for i in range(20):assert req('/api/access',{'email':'rate@example.test'})[0]==200
assert req('/api/access',{'email':'rate@example.test'})[0]==429
print('PASS: new access, validation, durable capture, consent, duplicates, attribution, opaque tokens, protected route, CSRF, bot protection, capture failure, expiry recovery, rate limiting')
