'use strict';
module.exports = (sequelize, DataTypes) => {
  const SetContract = sequelize.define('SetContract', {
    name: DataTypes.STRING,
    symbol: DataTypes.STRING,
    quantity: DataTypes.INTEGER,
    set_address: DataTypes.STRING,
    issue_hash: DataTypes.STRING,
    redeem_hash: DataTypes.STRING,
  }, {});
  SetContract.associate = function(models) {
    // associations can be defined here
  };
  return SetContract;
};