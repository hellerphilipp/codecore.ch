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

# Full build: setup + compile CSS + assemble HTML
build: setup css html
