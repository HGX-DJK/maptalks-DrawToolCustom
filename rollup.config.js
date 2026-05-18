import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/maptalks-drawtool-selfintersect.cjs.js',
      format: 'cjs',
      exports: 'named',
      sourcemap: true
    },
    {
      file: 'dist/maptalks-drawtool-selfintersect.esm.js',
      format: 'esm',
      exports: 'named',
      sourcemap: true
    },
    {
      file: 'dist/maptalks-drawtool-selfintersect.umd.js',
      format: 'umd',
      name: 'DrawToolCustom',
      globals: {
        'maptalks': 'maptalks'
      },
      exports: 'named',
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
