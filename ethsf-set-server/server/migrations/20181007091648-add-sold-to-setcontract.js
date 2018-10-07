'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('SetContracts', 'sold', {
      type: Sequelize.BOOLEAN,
      allowNull: true
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('SetContracts', 'sold');
  }
};