export interface ICallbackResult {
  /**
   * Indicates whether the request was successful.
   */
  success: boolean
  /**
   * The ID of the request.
   */
  requestId: number
  /**
   * User main address in the form of hex without 0x prefix.
   */
  userMainAddress: string
  /**
   * User delegated address which created by 3rd party application for the user in the form of hex without 0x prefix.
   */
  userDelegatedAddress: string
  /**
   * Application address in the form of hex without 0x prefix.
   */
  applicationAddress: string
  /**
   * Authentication service proof in the form of hex without 0x prefix.
   */
  proof: string
}

export interface ICallbackSuccessRequest extends ICallbackResult {}

export interface ICallbackFailRequest extends Omit<ICallbackResult, 'success'> {
  success: false
  errorMessage: string
}

/**
 * Interface for defining the structure of the callback response.
 */
export interface ICallbackResponse {
  success: boolean
  errorMessage?: string
}

/**
 * Makes an HTTP POST request to the specified URL with the provided data and
 * evaluates the response to determine success or failure.
 *
 * @param {string} url - The URL to which the POST request should be sent.
 * @param {unknown} data - The data to be sent with the POST request. This data is
 *                         converted into a JSON string for the request body.
 * @returns {Promise<ICallbackResponse>} A promise that resolves to an object indicating
 *                                       whether the request was successful and, in case of
 *                                       failure, includes an error message.
 *
 * @example
 * async function performCallback() {
 *   const url = 'https://api.example.com/callback';
 *   const data = { userId: 12345, status: 'completed' };
 *   const response = await callbackFrameUrl(url, data);
 *   console.log(response);
 * }
 *
 * performCallback();
 */
export async function callbackFrameUrl(url: string, data: ICallbackResult): Promise<ICallbackResponse> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const json = await response.json()

    if (json.result !== true) {
      return {
        success: false,
        errorMessage: 'Failed due to incorrect response from the server.',
      }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      errorMessage: (error as Error).message || 'Unknown error occurred',
    }
  }
}

/**
 * Makes an HTTP POST request to the specified URL with the provided data.
 * @param url The URL to which the POST request should be sent.
 * @param data The data to be sent with the POST request. This data is converted into a JSON string for the request body.
 */
export async function postJsonData(url: string, data: unknown): Promise<Response> {
  return fetch(url, {
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })
}
