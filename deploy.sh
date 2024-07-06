#/bin/bash

npm run build
cd build
deployctl deploy --project=wisebot --prod --import-map=import_map.json mod.ts
