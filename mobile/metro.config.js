const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer')
};
config.resolver = {
  ...config.resolver,
  assetExts: config.resolver.assetExts.filter((extension) => extension !== 'svg'),
  sourceExts: [...config.resolver.sourceExts, 'svg'],
  resolveRequest: (context, moduleName, platform) => {
    if (moduleName === 'react-native-screens') {
      return context.resolveRequest(context, 'react-native-screens/lib/commonjs/index.js', platform);
    }
    return context.resolveRequest(context, moduleName, platform);
  }
};

module.exports = config;
