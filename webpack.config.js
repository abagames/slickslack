module.exports = function (env) {
  var config = {
    resolve: {
      extensions: ['.ts', '.js'],
      modules: ['node_modules', 'web_modules']
    },
    devServer: {
      contentBase: 'docs'
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /(node_modules|web_modules)/,
          loader: 'awesome-typescript-loader'
        }
      ]
    }
  };
  config.entry = './src/index.ts';
  config.output = {
    path: __dirname + '/docs',
    filename: 'bundle.js'
  };
  if (env == null || env.build == null) {
    config.devtool = 'source-map';
  }
  return config;
}
