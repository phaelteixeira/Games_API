const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const connection = require('./database/database')
const Games = require('./database/games')
const Users = require('./database/users')
const cors = require('cors')
const jwt = require('jsonwebtoken')


const JWTSecret = '1q2w3e.4r5t6y.7u8i9o.'

app.use(cors())
app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())

connection.authenticate().then( () => {
    console.log('Connection Success.')
}).catch( err => {
    console.log('Connection Failed.')
})

function auth(req, res, next){
    const authToken = req.headers['authorization']

    if (authToken != undefined) {
        const bearer = authToken.split(' ')
        let token = bearer[1]

        jwt.verify(token,JWTSecret,(err, data) => {
            if (err) {
                res.status(401)
                res.json({err:'Token invalido.'})
            } else {
                res.token = token
                res.loggedUser = {id: data.id, email: data.email}
                next()
            }
        })
    } else {
        res.status(401)
        res.json({err: 'Token invalido.'})
    }
}

app.get('/games', auth,(req,res) => {

    Games.findAll().then( games => {

        let HATEOAS = [ 
            {
                href: 'http://localhost:8080/game/'+games.id,
                method: 'POST',
                rel: 'get_game_id'
            },
            {
                href: 'http://localhost:8080/game/',
                method: 'POST',
                rel: 'create_game'
            },
            {
                href: 'http://localhost:8080/game/'+games.id,
                method: 'PUT',
                rel: 'edit_game'
            },
            {
                href: 'http://localhost:8080/game/'+games.id,
                method: 'DELETE',
                rel: 'delete_game'
            }
        ]

        res.statusCode = 200
        res.json({game: games, _links: HATEOAS})
    }).catch( err => {
        res.sendStatus(400)
    })
})

app.get('/game/:id', (req,res) => {
    let id = req.params.id
    if(isNaN(id)){
        res.sendStatus(400)
    } else {
        Games.findOne({where:{id:id}}).then( game => {
            if (game != undefined) {
                res.statusCode = 200
                res.json(game)
            } else {
                res.sendStatus(400)    
            }
        }).catch( err => {
            res.sendStatus(404)
        })
    }
})

app.post('/game', (req,res) => {
    let title = req.body.title
    let year  = parseInt(req.body.year)
    let price = parseFloat(req.body.price)

    Games.create({
        title: title,
        year: year,
        price: price
    }).then( () => {
        res.statusCode = 200
        res.json(Games)
    }).catch( err => {
        res.sendStatus(400)
    })
})

app.put('/game/:id',(req,res) => {
    let id = req.params.id
    let title = req.body.title
    let year = parseInt(req.body.year)
    let price = parseFloat(req.body.price)

    if (isNaN(id) || isNaN(year) || isNaN(price) || title == undefined) {
        res.sendStatus(400)
    } else {
        Games.update({
            title: title,
            year: year,
            price: price
        },{where:{id: id}}).then( game => {
            res.statusCode = 200
            res.json(game)
        }).catch( err => {
            res.sendStatus(404)
        })
    }
})

app.delete('/game/:id',(req,res) => {
    if (isNaN(req.params.id)) {
        res.sendStatus(400)
    } else {
        let id = parseInt(req.params.id)
        Games.findOne({where:{id:id}}).then( game => {
            Games.destroy({where:{id: game.id}}).then(() => {
                res.sendStatus(200)
            })
        }).catch( err => {
            res.sendStatus(404)
        })
    }
})

app.post('/auth', (req,res) => {
    let {email, password} = req.body

    if (email != undefined) {
        if(password != undefined) {
            Users.findOne({where:{email:email}}).then( user => {
                if (password == user.password) {
                    jwt.sign({id:user.id,email:user.email},JWTSecret,{expiresIn:'1h'},(err,token) => {
                        if (err) {
                            res.status(400)
                            res.json({err:'Falha interna.'})
                        } else {
                            res.status(200)
                            res.json({token: token})
                        }
                    })
                } else {
                    res.status(400)
                    res.json({err:'Senha invalida.'})
                }
            }).catch( err => { 
                res.status(404)
                res.json({err:'Usuário não encontrado no banco de dados.'})
            })
        } else {
            res.status(400)
            res.json({err:'Senha inválida.'})
        }
    } else {
        res.status(400)
        res.json({err: 'E-mail inválido.'})
    }
})

app.get('/users', (req,res) => {

    let HATEOAS = [
        {
            href: 'http://localhost:8080/user',
            method: 'POST',
            rel: 'create_user'
        }
    ]

    Users.findAll().then( user => {
        res.statusCode = 200
        res.json({users: user, _links: HATEOAS})
    }).catch( err => {
        res.sendStatus(400)
        console.log(err)
    })
})

app.post('/user',(req,res) => {
    let {name,email, password} = req.body
    Users.create({
        name: name,
        email: email,
        password: password
    }).then( () => {
        res.statusCode = 200
        res.json(Users)
    }).catch( err => {
        res.sendStatus(400)
    })
})

app.listen(8080, () => {
    console.log('Server is running')
})