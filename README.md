# Modal Oracle

A web-based tool for music theory analysis, particularly focusing on modal chord relationships.

## Features

- Interactive piano interface
- Chord analysis with customizable grouping
- Musical mode identification
- Built with vanilla JavaScript and TailwindCSS

## Development

To run this project locally:

1. Clone the repository
2. Open index.html in your browser or use a local server

```bash
# If you have Python installed:
python -m http.server

# Or use the included serve.sh script:
./serve.sh
```

## Deployment

This project is automatically deployed to GitHub Pages when changes are pushed to the main branch, using GitHub Actions.

To view the live site, visit: https://[your-github-username].github.io/[repository-name]/

## Requirements

No build step is required. The project uses:

- TailwindCSS (via CDN)
- Tone.js (via CDN)
- Lit Elements (via CDN)
