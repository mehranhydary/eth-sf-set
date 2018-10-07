const SetContract = require('../models').SetContract;

module.exports = {
  create(req, res) {
    return SetContract
      .create({
        name: req.body.name,
    		symbol: req.body.symbol,
    		quantity: req.body.quantity,
    		set_address: req.body.set_address,
      })
      .then(setcontract => res.status(200).send(setcontract))
      .catch(error => res.status(400).send(error));
  },
  list(req, res) {
    return SetContract
      .findAll()
      .then(setcontract => res.status(200).send(setcontract))
      .catch(error => res.status(400).send(error));
  },
  retrieve(req, res) {
  return SetContract
    .findById(req.params.id)
    .then(setcontract => {
      if (!setcontract) {
        return res.status(404).send({
          message: 'Set Contract Not Found',
        });
      }
      return res.status(200).send(setcontract);
    })
    .catch(error => res.status(400).send(error));
  },
  update(req, res) {
  return SetContract
    .find({where: {name: req.body.name}})
    .then(setcontract => {
      if (!setcontract) {
        return res.status(404).send({
          message: 'Set Contract Not Found',
        });
      }
      return setcontract
        .update({
          name: req.body.name || setcontract.name,
          symbol: req.body.symbol || setcontract.symbol,
          quantity: req.body.quantity || setcontract.quantity,
          set_address: req.body.set_address || setcontract.set_address,
          issue_hash: req.body.issue_hash || setcontract.issue_hash,
          redeem_hash: req.body.redeem_hash || setcontract.redeem_hash,
          sold: req.body.sold || setcontract.sold,
          approved: req.body.approved || setcontract.approved
        })
        .then(() => res.status(200).send(setcontract))  // Send back the updated set contract.
        .catch((error) => res.status(400).send(error));
    })
    .catch((error) => res.status(400).send(error));
},

};