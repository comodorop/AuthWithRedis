const express = require('express')
const app = express()
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

let redis_url = "redis://localhost";
let client = require('redis').createClient(redis_url);
let Redis = require('ioredis');
let redis = new Redis(redis_url);

let products = []

let dbMock = [
    {
        "uuid": "3bc59373-eff6-4f57-aa28-f1c6ba85b043",
        "user": "processtempo",
        "pass": "123456",
        "access": [{
            "create": false
        }],
        "hash": "1a53593f-65c1-4a00-8950-e80fb7ebee44"
    }
]

app.post('/login', (req, resp) => {
    let { user, pass } = req.body
    let data = dbMock.filter(obj => {
        if (obj.user === user && obj.pass === pass) {
            return obj
        }
    })
    if (data.length > 0) {
        client.exists(data[0].hash, (err, reply) => {
            if (reply === 0) {
                client.set(data[0].hash, JSON.stringify(data[0]))
                client.expire(data[0].hash, 120)
            }
            resp.status("200").send({ msg: `Welcome ${data[0].user}` })
        })
    }
    else {
        resp.status(401).send({ msg: "Usuario no encontrado" })
    }
})

app.post('/products', (req, resp) => {
    let { hash } = req.headers
    let { body } = req
    client.exists(hash, (err, reply) => {
        if (reply) {
            client.get(hash, (err, reply) => {
                let data = JSON.parse(reply)
                let ok = data.access.filter(obj => {
                    if (obj.create === true) {
                        return true
                    }
                    else {
                        return false
                    }
                })
                if (ok === true) {
                    products.push(body)
                    return resp.status(201).send({ msg: "Product add", data: products })
                }
                return resp.status(401).send({ msg: "No estas autorizado a guardar productos" })
            })
        } else {
            return resp.status(401).send({ msg: "Login again" })
        }
    })
})

app.listen(3001, () => {
    console.log("Server its running in 3001")
})