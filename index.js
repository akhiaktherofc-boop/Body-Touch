// This is the startup wrapper for Node.js hosting environments (e.g., Hostinger, cPanel, Plesk, Render, AWS)
// It directs to the compiled production server code in server-dist/server.cjs

// Ensure environment is set to production
process.env.NODE_ENV = "production";

// Load the compiled server
require("./server-dist/server.cjs");
