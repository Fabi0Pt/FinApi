/** Importando express */
const { response } = require('express')
const express = require('express')

/**Gerador de ID UUID V4 */
const { v4: uuidv4 } = require('uuid')

/** Chamando a função express */
const app = express()

/** Integrar Insomnia */
app.use(express.json())

/**Banco de dados ficticio ( toda vez que der reload zera a memoria/informações*/
const customers = []

/**Middleware */
function verifyIfExistsAccountCPF(request, response, next) {
  /**Solicitação extrato */
  const { cpf } = request.headers

  /**Verificando se o CPF é existente */
  const customer = customers.find(customer => customer.cpf === cpf)

  /** CPF não encontrado */
  if (!customer) {
    return response.status(400).json({ error: 'Customer not found' })
  }

  request.customer = customer

  return next()
}

/** Balanço Financeiro  */
function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === 'credit') {
      return acc + operation.amount
    } else {
      return acc - operation.amount
    }
  }, 0)

  return balance
}

/**Criação de conta */
app.post('/account', (request, response) => {
  /** dados necessários para criar a conta */
  const { cpf, name } = request.body

  /**Verificando se há CPF identico */
  const customersAlredyExists = customers.some(
    customers => customers.cpf === cpf
  )
  if (customersAlredyExists) {
    return response.status(400).json({ error: 'Customer already exists!' })
  }

  const id = uuidv4()

  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: []
  })

  return response.status(201).send()
})

/**Solicitação extrato sem middleware */
app.get('/statement', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request
  return response.json(customer.statement)
})

/** Fazer deposito */
app.post('/deposit', verifyIfExistsAccountCPF, (request, response) => {
  const { description, amount } = request.body

  const { customer } = request

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: 'credit'
  }

  customer.statement.push(statementOperation)
  return response.status(201).send()
})

/** Fazer Saque */

app.post('/withdraw', verifyIfExistsAccountCPF, (request, response) => {
  const { amount } = request.body
  const { customer } = request

  const balance = getBalance(customer.statement)

  if (balance < amount) {
    return response.status(400).json({ error: 'Insufficient funds!' })
  }

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: 'debit'
  }
  customer.statement.push(statementOperation)

  return response.status(201).send()
})

/** Extrato por date */
app.get('/statement/date', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request
  const { date } = request.query

  const dateFormat = new Date(date + ' 00:00')

  const statement = customer.statement.filter(
    statement =>
      statement.created_at.toDateString() ===
      new Date(dateFormat).toDateString()
  )
  return response.json(statement)
})
app.listen(3333)
