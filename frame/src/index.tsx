import { serveStatic } from '@hono/node-server/serve-static'
import { Button, FrameContext, Frog, TextInput } from 'frog'
import { devtools } from 'frog/dev'
import { createSystem } from 'frog/ui'
import 'dotenv/config'
import { answerAuthRequest, getAuthData, IListResponse, createApp, rejectAuthRequest } from './api.ts'
import { v4 as uuidv4 } from 'uuid'
import { validateEthAddress, validateUrl } from './utils.ts'

const BORDER = '1em solid rgb(205,129,255)'
const AUTH_DOCS = 'https://github.com/DappyKit/farcaster-auth'
const TITLE = 'DappyKit Auth'

function extractAnswer(c: FrameContext<{ State: State }>) {
  const [requestId, answer] = (c.buttonValue || '').split('|').map(Number)

  if (!requestId || !answer) {
    throw new Error('Invalid request data. Request ID and answer are required.')
  }

  return { requestId, answer }
}

function renderError(c: FrameContext<{ State: State }>, e: Error) {
  return c.res({
    title: TITLE,
    image: (
      <Box grow alignVertical="center" backgroundColor="white" padding="32" border={BORDER}>
        <VStack gap="4">
          <Heading color="fcPurple" align="center" size="48">
            Error
          </Heading>

          <Text align="center" size="18">
            {(e as Error).message}
          </Text>
        </VStack>
      </Box>
    ),
    intents: [
      <Button value="start" action="/">
        🏠 Home
      </Button>,
    ],
  })
}

export const { Box, Heading, Text, VStack, vars } = createSystem({
  colors: {
    white: 'white',
    black: 'black',
    fcPurple: 'rgb(138, 99, 210)',
  },
  fonts: {
    default: [
      {
        name: 'Inter',
        source: 'google',
        weight: 400,
      },
      {
        name: 'Inter',
        source: 'google',
        weight: 600,
      },
    ],
  },
})

interface State {
  registerAppSession: string
  authAnswer: number
}

interface RegisterAppData {
  ethAddress: string
  ethAddressBytes: string
  frameUrl: string
  frameUrlBytes: string
  callbackUrl: string
  callbackUrlBytes: string
}

const sessions = new Map<string, RegisterAppData>()

function updateSession(id: string, data: Partial<RegisterAppData>) {
  let session = sessions.get(id)

  if (!session) {
    session = {
      ethAddress: '',
      ethAddressBytes: '',
      frameUrl: '',
      frameUrlBytes: '',
      callbackUrl: '',
      callbackUrlBytes: '',
    }
  }

  sessions.set(id, { ...session, ...data })
}

export const app = new Frog<{ State: State }>({
  initialState: {
    registerAppSession: '',
    authAnswer: 0,
  },
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
  basePath: '/',
  ui: { vars },
})

app.use('/*', serveStatic({ root: './public' }))

app.frame('/', async c => {
  return c.res({
    title: TITLE,
    image: (
      <Box grow alignVertical="center" backgroundColor="white" padding="32" border={BORDER}>
        <VStack gap="4">
          <Heading color="fcPurple" align="center" size="64">
            DappyKit Auth
          </Heading>

          <Text align="center" size="18">
            Check your auth requests.
          </Text>
        </VStack>
      </Box>
    ),
    intents: [
      <Button value="start" action="/requests">
        🐙 Check Requests
      </Button>,
    ],
  })
})

app.frame('/requests', async c => {
  let requestData: IListResponse | undefined
  let isSuccessResponse = false
  try {
    const {
      trustedData: { messageBytes },
    } = await c.req.json()
    requestData = await getAuthData(messageBytes)
    isSuccessResponse = requestData && requestData.status === 'ok'
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('/requests method', (e as Error).message)
  }

  let intents = []

  if (requestData && isSuccessResponse) {
    const getAnswerId = (answer: number) => {
      return `${requestData.requestId.toString()}|${answer.toString()}`
    }

    for (const option of requestData.options) {
      intents.push(
        <Button value={getAnswerId(option)} action="/allow-request">
          {option.toString()}
        </Button>,
      )
    }

    intents.push(
      <Button value={getAnswerId(999)} action="/reject-request">
        ❌ Reject
      </Button>,
    )
  } else {
    intents = [
      <Button value="start" action="/register-app">
        ✍️ Register App
      </Button>,
      <Button.Link href={AUTH_DOCS}>📄 Docs</Button.Link>,
      <Button value="start" action="/requests">
        🔄️ Refresh
      </Button>,
    ]
  }

  return c.res({
    title: TITLE,
    image: (
      <Box grow alignVertical="center" backgroundColor="white" padding="32" border={BORDER}>
        <VStack gap="4">
          <Heading color="fcPurple" align="center" size="48">
            {isSuccessResponse && <span>Choose the correct number</span>}
            {!isSuccessResponse && <span>No requests</span>}
          </Heading>

          <Text align="center" size="18">
            {isSuccessResponse && (
              <span>By answering the challenge, you will allow the app to access your isolated data.</span>
            )}
            {!isSuccessResponse && <span>Requests will appear after using third-party applications.</span>}
          </Text>
        </VStack>
      </Box>
    ),
    intents,
  })
})

app.frame('/allow-request', async c => {
  const {
    trustedData: { messageBytes },
  } = await c.req.json()

  const { requestId, answer } = extractAnswer(c)
  const response = await answerAuthRequest(requestId, answer, messageBytes)
  const isCorrect = response.status === 'ok'

  return c.res({
    title: TITLE,
    image: (
      <Box grow alignVertical="center" backgroundColor="white" padding="32" border={BORDER}>
        <VStack gap="4">
          <Heading color="fcPurple" align="center" size="48">
            {isCorrect ? '🎉 Success' : '❌ Incorrect'}
          </Heading>

          <Text align="center" size="18">
            {isCorrect ? 'You can return to the app and use it.' : 'You need to create a new request in the app.'}
          </Text>
        </VStack>
      </Box>
    ),
    intents: [
      <Button value="start" action="/">
        🏠 Home
      </Button>,
    ],
  })
})

app.frame('/reject-request', async c => {
  const {
    trustedData: { messageBytes },
  } = await c.req.json()

  const { requestId } = extractAnswer(c)
  await rejectAuthRequest(requestId, messageBytes)

  return c.res({
    title: TITLE,
    image: (
      <Box grow alignVertical="center" backgroundColor="white" padding="32" border={BORDER}>
        <VStack gap="4">
          <Heading color="fcPurple" align="center" size="48">
            ❌ The request has been rejected.
          </Heading>
        </VStack>
      </Box>
    ),
    intents: [
      <Button value="start" action="/">
        🏠 Home
      </Button>,
    ],
  })
})

app.frame('/register-app', async c => {
  try {
    const {
      trustedData: { messageBytes },
    } = await c.req.json()

    const SCREEN_START = 'start'
    const SCREEN_SAVE_ETH = 'save-eth'
    const SCREEN_SAVE_FRAME = 'save-frame'
    const SCREEN_SAVE_CALLBACK = 'save-callback'
    const previousScreen = c.previousButtonValues?.[0] || 'start'
    const isFinal = previousScreen === 'save-frame'
    let nextScreen = SCREEN_SAVE_ETH

    let intents = [
      <Button value="start" action="/">
        ❌ Cancel
      </Button>,
    ]

    const { inputText, deriveState } = c

    let currentSession = uuidv4()
    deriveState(previousState => {
      if (previousScreen === SCREEN_START) {
        previousState.registerAppSession = currentSession
      } else {
        currentSession = previousState.registerAppSession
      }
    })

    if (previousScreen === SCREEN_START) {
      intents.unshift(<TextInput placeholder="Enter ETH address" />)
    } else if (previousScreen === SCREEN_SAVE_ETH) {
      nextScreen = SCREEN_SAVE_FRAME
      intents.unshift(<TextInput placeholder="Enter Frame URL" />)
      updateSession(currentSession, { ethAddress: inputText || '', ethAddressBytes: messageBytes })
    } else if (previousScreen === SCREEN_SAVE_FRAME) {
      nextScreen = SCREEN_SAVE_CALLBACK
      intents.unshift(<TextInput placeholder="Enter Webhook URL" />)
      updateSession(currentSession, { frameUrl: inputText || '', frameUrlBytes: messageBytes })
    } else if (previousScreen === SCREEN_SAVE_CALLBACK) {
      updateSession(currentSession, { callbackUrl: inputText || '', callbackUrlBytes: messageBytes })
    }

    if (previousScreen === SCREEN_SAVE_CALLBACK) {
      const sessionData = sessions.get(currentSession)

      if (!sessionData) {
        throw new Error('Invalid session data')
      }

      validateEthAddress(sessionData.ethAddress)
      validateUrl(sessionData.frameUrl)
      validateUrl(sessionData.callbackUrl)

      const { ethAddressBytes, frameUrlBytes, callbackUrlBytes } = sessionData
      const createResponse = await createApp(ethAddressBytes, frameUrlBytes, callbackUrlBytes)

      if (createResponse.status !== 'ok') {
        throw new Error(`Failed to create an app: ${JSON.stringify(createResponse)}`)
      }
      sessions.delete(currentSession)

      intents = [
        <Button value={nextScreen} action="/">
          ✅ Done
        </Button>,
      ]
    } else {
      intents.unshift(
        <Button value={nextScreen} action="/register-app">
          {isFinal ? '✅' : '➡️'} Save
        </Button>,
      )
    }

    return c.res({
      title: TITLE,
      image: (
        <Box grow alignVertical="center" backgroundColor="white" padding="32" border={BORDER}>
          <VStack gap="4">
            <Heading color="fcPurple" align="center" size="48">
              Register your app
            </Heading>

            <Text align="center" size="18">
              Before adding your application, read the documentation.
            </Text>

            <Text align="center" size="18">
              {previousScreen === SCREEN_START && 'Enter your Ethereum address'}
              {previousScreen === SCREEN_SAVE_ETH && 'Enter your Frame URL'}
              {previousScreen === SCREEN_SAVE_FRAME && 'Enter your Webhook URL'}
              {previousScreen === SCREEN_SAVE_CALLBACK && 'Your application registered successfully!'}
            </Text>
          </VStack>
        </Box>
      ),
      intents,
    })
  } catch (e) {
    return renderError(c, e as Error)
  }
})

if (process.env.ENV === 'development') {
  devtools(app, { serveStatic })
}
