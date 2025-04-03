import * as esbuild from 'esbuild';
import fs from 'fs';
import { createHash } from 'crypto';
import {getWebsiteBundle} from "./esbuild-website.js";

const isDev = process.env.NODE_ENV === 'development'

esbuild.build({
    entryPoints: ['src/index.js'],
    outfile: 'dist/index.js',
    bundle: true,
    minify: true,
    write: true,
    format: 'cjs',
    platform: 'node',
    target: 'node18',
    sourcemap: isDev ? 'inline' : false,
    plugins: isDev ? [genMd5()] : [addWebsite(), genMd5()],
});

function addWebsite() {
    return {
        name: 'add-website',
        setup(build) {
            build.onEnd(async (_) => {
                const filePath = 'dist/index.js';
                const serverContent = fs.readFileSync(filePath, 'utf8');
                const websiteContent = await getWebsiteBundle();

                fs.writeFileSync(filePath, websiteContent + serverContent);
            });
        },
    };
}

function genMd5() {
    return {
        name: 'gen-output-file-md5',
        setup(build) {
            build.onEnd(async (_) => {
                const md5 = createHash('md5').update(fs.readFileSync('dist/index.js')).digest('hex');
                fs.writeFileSync('dist/index.js.md5', md5);
            });
        },
    };
}
