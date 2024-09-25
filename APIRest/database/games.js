const Sequelize = require('sequelize')
const connection = require('./database')

const games = connection.define('games',{
    title : {
        type: Sequelize.STRING,
        allowNull: false
    },
    year : {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    price : {
        type: Sequelize.FLOAT,
        allowNull: false
    }
})

games.sync({force: false}).then(() => {})

module.exports = games