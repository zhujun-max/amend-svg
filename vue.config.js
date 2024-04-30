const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  
  productionSourceMap:false,
  publicPath: "./",
  outputDir: "dist",
  transpileDependencies: true
})
