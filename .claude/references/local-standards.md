# Local Salesforce standards — sfdx_template_enterprise

Read **last**, after the `salesforce-developer` skill's references. These **win** on conflict.

## API version

`sourceApiVersion` is **67.0** here. This is the highest in the fleet — do not carry 67.0 into
another repo, and do not assume another repo's version applies here.

## This is a client-facing template

Code generated here is copied into client engagements via "Use this template". Anything
GForce-internal — internal URLs, org IDs, staff names, internal process references — must not
appear in generated metadata or comments.

## NebulaLogger

`using-nebula-logger` is a local skill in this repo. Invoke it for any `Logger.*` usage rather
than inferring the API.
