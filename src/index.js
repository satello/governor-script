const Web3 = require('web3')
const rc_question = require('@realitio/realitio-lib/formatters/question.js');
const rc_template = require('@realitio/realitio-lib/formatters/template.js');
const _realitioProxy = require('../assets/realitio-proxy.json')
const _realitioContract = require('../assets/realitio.json')

// FILL THESE IN FOR THE NETWORK
const web3URI = ''
const realitioProxyContractAddress = ''
const realitioContractAddress = ''
// Can add this for speed
const fromBlock = 0

const getRulingOptions = async () => {
  const web3 = new Web3(web3URI)

  const proxyContractInstance = new web3.eth.Contract(
    _realitioProxy.abi,
    realitioProxyContractAddress
  )

  const realitioContractInstance = new web3.eth.Contract(
    _realitioContract.abi,
    realitioContractAddress
  )

  const realitioID = await proxyContractInstance.methods.disputeIDToQuestionID(scriptParameters.disputeID).call()
  const question = await realitioContractInstance.methods.questions(realitioID).call()

  const questionEventLog = await realitioContractInstance.getPastEvents(
    'LogNewQuestion',
    {
      filter: {
        question_id: realitioID
      },
      fromBlock: fromBlock,
      toBlock: 'latest'
    }
  )

  const templateID = questionEventLog[0].returnValues.template_id

  const templateEventLog = await realitioContractInstance.getPastEvents(
    'LogNewTemplate',
    {
      filter: {
        template_id: templateID
      },
      fromBlock: fromBlock,
      toBlock: 'latest'
    }
  )

  const answers = await realitioContractInstance.getPastEvents(
    'LogNewAnswer',
    {
      filter: {
        question_id: realitioID
      },
      fromBlock: fromBlock,
      toBlock: 'latest'
    }
  )

  const templateText = templateEventLog[0].returnValues.question_text;
  const questionData = rc_question.populatedJSONForTemplate(templateText, questionEventLog[0].returnValues.question)

  switch (questionData.type) {
    case 'bool':
      resolver({
        category: questionData.category,
        rulingOptions: {
          type: 'single',
          titles: questionData.outcomes
        }
      })
    case 'uint':
      resolver({
        rulingOptions: {
          type: 'int'
        }
      })
    case 'single-select':
      resolver({
        rulingOptions: {
          type: 'single',
          titles: questionData.outcomes
        }
      })
    case 'multiple-select':
      resolver({
        rulingOptions: {
          type: 'multiple',
          titles: questionData.outcomes
        }
      })
    case 'datetime':
      resolver({
        rulingOptions: {
          type: 'datetime'
        }
      })
    default:
      resolver({})
  }
}

getRulingOptions()