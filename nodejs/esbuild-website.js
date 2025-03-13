import * as esbuild from "esbuild";
import fs from "fs";
import less from "less";

export const getWebsiteBundle = async () => {
  const clientResult = await esbuild.build({
    entryPoints: ['src/website/App.jsx'],
    bundle: true,
    minify: true,
    write: false,
    format: 'cjs',
    target: ['chrome58', 'firefox57', 'safari11'],
    loader: {
      '.jsx': 'jsx',
      '.png': 'dataurl',
      '.jpg': 'dataurl',
      '.jpeg': 'dataurl',
      '.gif': 'dataurl',
      '.svg': 'dataurl',
      '.webp': 'dataurl',
    },
    plugins: [{
      name: 'less-to-js',
      setup(build) {
        build.onLoad({ filter: /\.less$/ }, async (args) => {
          const source = await fs.promises.readFile(args.path, 'utf8');
          const { css } = await less.render(source, {
            filename: args.path
          });
          const contents = `
                        if (typeof window !== 'undefined') {
                            const style = document.createElement('style');
                            style.textContent = ${JSON.stringify(css)};
                            document.head.appendChild(style);
                        }
                    `;
          return { contents, loader: 'js' };
        });
      }
    }]
  });

  const clientBundle = clientResult.outputFiles[0].text;
  return `
globalThis.websiteBundle = function() {
  const exports = {};
  const module = { exports };
  ${clientBundle}
  return \`
    (function() {
      const exports = {};
      const module = { exports };
      \${${JSON.stringify(clientBundle)}}
      module.exports.renderClient();
    })();
  \`;
}();
\n\n`;
}