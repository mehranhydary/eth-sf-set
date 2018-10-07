'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('SetContracts', 'approved', {
      type: Sequelize.BOOLEAN,
      allowNull: true
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('SetContracts', 'approved');
  }
};