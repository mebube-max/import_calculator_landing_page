#!/bin/zsh
cd -- "${0:A:h}"
if command -v node >/dev/null 2>&1; then
  zolan_node="$(command -v node)"
else
  zolan_node='/Users/e.o./.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node'
fi
if [[ ! -x "$zolan_node" ]]; then
  print 'Install Node.js 22 or newer, then run this launcher again.'
  read 'reply?Press Return to close.'
  exit 1
fi
print 'Zolan calculator: http://127.0.0.1:5174/'
print 'Keep this Terminal window open while using the calculator.'
"$zolan_node" serve.mjs
read 'reply?Press Return to close.'
