import express, { Express, Request, Response } from 'express'
import axios, { AxiosResponse } from 'axios'

const app: Express = express()

const message = (data: string) => `\nThis is ${process.env.ID} the next says: ${data}`

app.get('/', (req: Request, res: Response) => res.send(`hello from ${process.env.ID}\n`))

app.get('/next', (req: Request, res: Response) => {
  const urlToSend = process.env.NEXT_SVC || 'localhost:3000'

  axios.get(urlToSend)
    .then((resnext: AxiosResponse) =>
      res.status(200).send(message(resnext.data)))
    .catch((err: Error) => res.status(500).send(err.message))
})

app.get('/chain', (req: Request, res: Response) => {
  const count = (parseInt(`${req.query['count']}`) || 0) + 1
  const urlToSend = `${(process.env.CHAIN_SVC || 'localhost:3000/chain')}?count=${count}`
  const jumps = process.env.JUMPS || 6
  
  if (count < jumps) {
    axios.get(urlToSend)
      .then((resnext: AxiosResponse) =>
        res.status(200).send(message(resnext.data)))
      .catch((err: Error) => res.status(500).send(err.message))
  }
  else
    res.status(200).send('\nending chain')
})

app.listen(3000, () => console.log('App listening on port 3000'))