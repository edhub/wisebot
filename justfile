set dotenv-load

default:
    @just -l

deploy:
    bun run build
    rsync -r --delete build/ root@ali135:/var/www/html/wisebot
