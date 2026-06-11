import path from 'node:path';
import type { IProjectConfig } from '@tarojs/taro/types/compile';

export default (merge: any, _ctx: any, _env: any): IProjectConfig => {
  return {
    projectName: 'moodly-weapp',
    date: '2026-6-11',
    designWidth: 750,
    deviceRatio: { 640: 2.34 / 2, 750: 1, 828: 1.81 / 2, 375: 2 / 1 },
    sourceRoot: 'src',
    outputRoot: 'dist',
    plugins: ['@tarojs/plugin-framework-react'],
    defineConstants: {},
    copy: { patterns: [], options: {} },
    framework: 'react',
    compiler: 'webpack5',
    cache: { enable: false },
    sass: { resource: [] },
    mini: {
      webpackChain(chain: any) {
        const sharedSrc = path.resolve(__dirname, '../../src');
        const taroSrc = path.resolve(__dirname, '../src');
        chain.resolve.alias
          .set('@/components', path.resolve(taroSrc, 'components'))
          .set('@/pages', path.resolve(taroSrc, 'pages'))
          .set('@/db/database', path.resolve(taroSrc, 'db/database'))
          .set('@', sharedSrc);
        chain.module
          .rule('weapp-ttss')
          .test(/\.ttss$/)
          .use('postcss')
          .loader('postcss-loader')
          .options({ plugins: [require('autoprefixer')] });
      },
      postcss: {
        pxtransform: { enable: true, config: {} },
        cssModules: { enable: false },
      },
    },
    h5: {},
    rn: {},
  } as IProjectConfig;
};
