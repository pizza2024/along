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
        const sharedSrc = path.resolve(__dirname, '../../packages/shared/src');
        const weappSrc = path.resolve(__dirname, '../src');
        const weappNm = path.resolve(__dirname, '../node_modules');
        chain.resolve.alias
          .set('@/components', path.resolve(weappSrc, 'components'))
          .set('@/pages', path.resolve(weappSrc, 'pages'))
          .set('@/db/database', path.resolve(weappSrc, 'db/database'))
          .set('@/hooks', path.resolve(weappSrc, 'hooks'))
          .set('@', path.resolve(weappSrc))
          .set('@moodly/shared', sharedSrc)
          .set('react', path.resolve(weappNm, 'react'))
          .set('react/jsx-runtime', path.resolve(weappNm, 'react/jsx-runtime.js'))
          .set('react-dom', path.resolve(weappNm, 'react-dom'));
        chain.resolve.modules.clear().add(weappNm).add('node_modules');
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
