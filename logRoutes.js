const listEndpoints = require('express-list-endpoints');

const logRoutes = (app) => {
    const routes = listEndpoints(app).map(endpoint => {
        const methods = Array.isArray(endpoint.methods)
            ? endpoint.methods.join(', ').toUpperCase()
            : Object.keys(endpoint.methods || {}).join(', ').toUpperCase();
        return {
            Method: methods || 'UNKNOWN', // Handle cases where methods may not exist
            Path: endpoint.path
        };
    });

    // Display routes in tabular format
    console.table(routes);
};

module.exports =  logRoutes;