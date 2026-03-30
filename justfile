# Build commands for codecore.ch

# Set up dist/ directory with symlinks and vendor files
setup:
    cd site && npx gulp setup

# Compile SCSS to CSS (run after any SCSS changes)
css:
    cd site && npx sass src/scss/theme/theme-three.scss:dist/assets/css/theme-three.css src/scss/theme/main.scss:dist/assets/css/main.css --style=compressed --quiet-deps

# Assemble HTML from src/ partials into dist/
html:
    cd site && npx gulp assemble

# Copy PHP files from src/ to dist/
php:
    cp site/src/*.php site/dist/

# Full build: setup + compile CSS + assemble HTML + copy PHP
build: setup css html php

# Build and start local PHP dev server with Mailpit for email testing
# Requires: brew install mailpit
# Emails appear at http://localhost:8025
preview-php: build
    mailpit & php -d sendmail_path='mailpit sendmail' -S localhost:8080 -t site/dist

# Deploy to production
deploy:
    rsync -rtv --delete site/dist/ aliwunuz@sl82.web.hostpoint.ch:/home/aliwunuz/www/codecore.ch
