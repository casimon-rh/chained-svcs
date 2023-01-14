import express, { Express, Request, Response } from 'express'
import axios, { AxiosResponse } from 'axios'
import CircuitBreaker from 'opossum'

const app: Express = express()
const jumps = process.env.JUMPS || 6
const getRandomInt = (max: number) =>
  Math.floor(Math.random() * max)

const breakerOptions = {
  timeout: 300, // If name service takes longer than .3 seconds, trigger a failure
  errorThresholdPercentage: 50, // When 20% of requests fail, trip the breaker
  resetTimeout: 10000 // After 10 seconds, try again.
}

const chain = (endpoint: string): Promise<string> =>
  new Promise((resolve, reject) =>
    axios.get(endpoint)
      .then((response: AxiosResponse) => {
        resolve(message(response.data))
      }).catch((err: any) => {
        reject(message(err.response.data))
      })
  )

const breaker = new CircuitBreaker(chain, breakerOptions)
const curtime = () => `${new Date().getMinutes()}:${new Date().getSeconds()}`

const m = `hello from ${process.env.ID}\n`
const message = (data: string) =>
  `\nThis is ${process.env.ID} @${curtime()} -> Next ${data}`
const errmsg = () =>
  `\n${process.env.ID} @${curtime()} -> unavailable`

app.get('/', (req: Request, res: Response) => res.send(m))

app.get('/chain', (req: Request, res: Response) => {
  if (process.env.INJECT_ERR === '1')
    console.log(`hello from ${process.env.ID}`)
  const count = (parseInt(`${req.query['count']}`) || 0) + 1
  const endpoint = `${process.env.CHAIN_SVC}?count=${count}`
  const ran = getRandomInt(3)
  if (ran > 1 && process.env.INJECT_ERR === '1') {
    return res.status(502).send(message(errmsg()))
  } else {
    if (count < jumps) {
      breaker.fire(endpoint)
        .then((response: string) => {
          res.status(200).send(response)
        })
        .catch((response: string) => {
          res.status(200).send(response)
        })
    }
    else
      res.status(200).send('\nLast')
  }
})

app.listen(3000, () => console.log('App listening on port 3000'))

breaker.on("fallback", () => console.log('fallback'))
breaker.on("success", () => console.log("success"))
breaker.on("failure", () => console.log("failed"))
breaker.on("timeout", () => console.log("timed out"))
breaker.on("reject", () => console.log("rejected"))
breaker.on("open", () => console.log("opened"))
breaker.on("halfOpen", () => console.log("halfOpened"))
breaker.on("close", () => console.log("closed"))