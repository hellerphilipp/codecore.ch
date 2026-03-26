# Build commands for code-agenten.ch

# Compile SCSS to CSS (run after any SCSS changes)
css:
    cd site && npx sass assets/scss/theme/theme-three.scss:assets/css/theme-three.css assets/scss/theme/main.scss:assets/css/main.css --style=compressed

# Assemble HTML from src/ partials into site root
html:
    cd site && npx gulp assemble
