import fs from 'fs';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

const GAZETTE_SRC = path.resolve(__dirname, 'docs/source/gazette/pdf');

/**
 * Serve the gazette PDFs at /gazette/*.pdf without a second copy in the repo.
 *
 * The originals live under docs/source/gazette/pdf/ because that is where every rule's
 * citation resolves to, and they are checksummed there. Copying them into public/ would
 * duplicate 5.8 MB and let the two drift, so instead: in dev they are streamed from the
 * source directory, and at build they are emitted into dist/ from those same bytes.
 */
function gazettePdfs(): Plugin {
  const read = (url: string): Buffer | null => {
    const name = path.basename(decodeURIComponent(url.split('?')[0]));
    if (!/^(chapter|appendix)-\d{2}\.pdf$/.test(name)) return null;
    const file = path.join(GAZETTE_SRC, name);
    return fs.existsSync(file) ? fs.readFileSync(file) : null;
  };

  return {
    name: 'gazette-pdfs',
    configureServer(server) {
      server.middlewares.use('/gazette', (req, res, next) => {
        const body = req.url ? read(req.url) : null;
        if (!body) return next();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.end(body);
      });
    },
    generateBundle() {
      if (!fs.existsSync(GAZETTE_SRC)) {
        this.warn(`gazette PDFs not found at ${GAZETTE_SRC} — the reader will 404`);
        return;
      }
      for (const name of fs.readdirSync(GAZETTE_SRC).filter((f) => f.endsWith('.pdf'))) {
        this.emitFile({
          type: 'asset',
          fileName: `gazette/${name}`,
          source: fs.readFileSync(path.join(GAZETTE_SRC, name)),
        });
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), gazettePdfs()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
