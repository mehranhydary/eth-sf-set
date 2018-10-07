const setcontractsController = require('../controllers').setcontracts;

module.exports = (app) => {
  app.get('/api', (req, res) => res.status(200)
  .send({
    message: 'Welcome to the Set Contracts API!',
  }));

  app.post('/api/setcontracts', setcontractsController.create);
  app.get('/api/setcontracts', setcontractsController.list);
  app.get('/api/setcontracts/:id', setcontractsController.retrieve);
  app.put('/api/setcontracts/', setcontractsController.update)
  
};