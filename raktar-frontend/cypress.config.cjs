const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // Itt lehet majd cypress pluginokat beállítani
    },
    // Állítsd be a Vite dev szervered címét (alapértelmezés szerint 5173)
    baseUrl: "http://localhost:5173",
    // Opcionális: beállíthatod a tesztböngésző alapméretét
    viewportWidth: 1280,
    viewportHeight: 720,
  },
});