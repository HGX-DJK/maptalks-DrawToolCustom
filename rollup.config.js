import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/giser-maptalks-drawtool.cjs.js',
      format: 'cjs',
      exports: 'named',
      sourcemap: true
    },
    {
      file: 'dist/giser-maptalks-drawtool.esm.js',
      format: 'esm',
      sourcemap: true
    },
    {
      file: 'dist/giser-maptalks-drawtool.umd.js',
      format: 'umd',
      name: 'giserMaptalksDrawTool',
      globals: {
        'maptalks': 'maptalks'
      },
      sourcemap: true
    }
  ],
  plugins: [
    resolve({
      resolveOnly: ['maptalks']
    }),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: 'dist'
    })
  ],
  external: ['maptalks']
};