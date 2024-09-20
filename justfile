set dotenv-load

default:
    @just -l

deploy:
    npm run build
    # cd build && deployctl deploy --project=wisebot --prod --import-map=import_map.json mod.ts
    rsync -r --delete build/ root@39.108.244.135:/var/www/html/wisebot
