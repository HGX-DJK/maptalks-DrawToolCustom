import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/maptalks-drawtool-customizable.cjs.js',
      format: 'cjs',
      exports: 'named',
      sourcemap: true
    },
    {
      file: 'dist/maptalks-drawtool-customizable.esm.js',
      format: 'esm',
      sourcemap: true
    },
    {
      file: 'dist/maptalks-drawtool-customizable.umd.js',
      format: 'umd',
      name: 'DrawToolCustomizable',
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