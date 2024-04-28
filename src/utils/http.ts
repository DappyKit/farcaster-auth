export interface ICallbackResult {
  success: boolean
  requestId: number
  userSignerAddress: string
}

export interface ICallbackSuccessRequest extends ICallbackResult {
  proof: string
}

export interface ICallbackFailRequest extends ICallbackResult {
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
