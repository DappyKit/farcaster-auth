const baseUrl = process.env.API_URL

if (!baseUrl) {
  throw new Error('API_URL is not defined')
}

export interface IListResponse {
  status: string
  requestId: number
  options: number[]
  message?: string
}

export interface IAnswerResponse {
  status: string
  message?: string
}

function getUrl(url: string): string {
  return new URL(url, baseUrl).toString()
}

export async function rejectAuthRequest(requestId: number, messageBytesProof: string): Promise<void> {
  const url = getUrl(`v1/authorization/reject`)
  const req = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requestId, messageBytesProof }),
  })

  return req.json()
}

export async function answerAuthRequest(
  requestId: number,
  answer: number,
  messageBytesProof: string,
): Promise<IAnswerResponse> {
  const url = getUrl(`v1/authorization/answer`)
  const req = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requestId, messageBytesProof, answer }),
  })

  return req.json()
}

/**
 * Get the auth data.
 * @param messageBytesProof Message bytes proof
 */
export async function getAuthData(messageBytesProof: string): Promise<IListResponse> {
  const url = getUrl(`v1/authorization/list?rand=${Math.random()}`)
  const req = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messageBytesProof }),
  })

  return req.json()
}

export async function createApp(
  frameSignerAddressBytes: string,
  frameUrlBytes: string,
  frameCallbackUrlBytes: string,
): Promise<IAnswerResponse> {
  const url = getUrl(`v1/app/create`)
  const req = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ frameSignerAddressBytes, frameUrlBytes, frameCallbackUrlBytes }),
  })

  const response = (await req.json()) as IAnswerResponse

  if (response.status !== 'ok') {
    if (response.message) {
      throw new Error(response.message)
    } else {
      throw new Error('Unknown backend error')
    }
  }

  return response
}
